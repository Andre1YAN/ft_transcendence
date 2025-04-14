import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'
const JWT_SECRET = process.env.JWT_SECRET || 'YourJWTSecret'
const client = new OAuth2Client(CLIENT_ID)

async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: CLIENT_ID,
  })
  return ticket.getPayload()
}

export async function googleAuthRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/auth/google',
    async (
      req: FastifyRequest<{ Body: { idToken: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { idToken } = req.body
        const payload = await verifyGoogleToken(idToken)

        if (!payload) {
          return reply.status(401).send({ message: 'Google token verification failed' })
        }

        const email = payload.email!
        const displayName = payload.name || email.split('@')[0]
        const avatarUrl = payload.picture || undefined

        // 1. 查找是否已有用户
        let user = await prisma.user.findUnique({ where: { email } })

        // 2. 没有就创建
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              displayName: await generateUniqueDisplayName(displayName),
              password: '', // Google 用户不需要密码
              avatarUrl,
            }
          })
        }

        const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: '1h' })

        reply.send({ token, user })
      } catch (error) {
        fastify.log.error('Google Auth Error:', error)
        reply.status(500).send({ message: 'Internal server error' })
      }
    }
  )
}

// 防止 displayName 重名（因为你设成 unique）
async function generateUniqueDisplayName(baseName: string): Promise<string> {
  let name = baseName
  let counter = 1

  while (await prisma.user.findUnique({ where: { displayName: name } })) {
    name = `${baseName}${counter}`
    counter++
  }

  return name
}
