// src/auth/googleAuthRoutes.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'

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

        const user = {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        }

        const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: '1h' })

        reply.send({ token, user })
      } catch (error) {
        fastify.log.error(error)
        reply.status(500).send({ message: 'Internal server error' })
      }
    }
  )
}
