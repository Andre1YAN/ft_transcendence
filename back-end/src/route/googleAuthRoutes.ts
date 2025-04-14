import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { OAuth2Client } from 'google-auth-library'
import { signToken } from '../utils/jwt'
import { IdTokenDto, IdTokenSchema } from '../types/googleauth.dto'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
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
    {schema: {body: IdTokenSchema}},
    async (
      request: FastifyRequest<{ Body: IdTokenDto }>,
      reply: FastifyReply
    ) => {
      try {
        const { idToken } = request.body
        const payload = await verifyGoogleToken(idToken)

        if (!payload) {
          return reply.status(401).send({ message: 'Google token verification failed' })
        }

        const email = payload.email!
        const displayName = payload.name || email.split('@')[0]
        const avatarUrl = payload.picture || undefined

        // 1. 查找是否已有用户
        let user = await fastify.prisma.user.findUnique({ where: { email } })

        // 2. 没有就创建
        if (!user) {
          user = await fastify.prisma.user.create({
            data: {
              email,
              displayName: await generateUniqueDisplayName(displayName, fastify),
              password: '', // Google 用户不需要密码
              avatarUrl,
            }
          })
        }

        const token = signToken({ id: user.id, email: user.email })

        reply.send({ token, user })
      }
      catch (error) {
        console.log(error)
        fastify.log.error('Fail to Google Auth Error:', error)
        reply.status(500).send({ message: 'Internal server error' })
      }
    }
  )
}

// 防止 displayName 重名
async function generateUniqueDisplayName(baseName: string, fastify: FastifyInstance): Promise<string> {
  let name = baseName
  let counter = 1

  while (await fastify.prisma.user.findUnique({ where: { displayName: name } })) {
    name = `${baseName}${counter}`
    counter++

    if (counter > 10) {
      throw new Error('Failed to generate unique username')
    }
  }

  return name
}
