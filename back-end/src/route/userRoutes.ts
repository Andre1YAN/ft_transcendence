import { PrismaClient } from '@prisma/client'
import { FastifyRequest, FastifyReply ,FastifyInstance } from 'fastify'
import { UpdateUserProfileDto, UpdateUserProfileSchema } from '../types/user.dto'

const prisma = new PrismaClient()

export async function userRoutes(fastify: FastifyInstance) {
  fastify.post('/users/profile', { schema: {body: UpdateUserProfileSchema}, preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{Body: UpdateUserProfileDto} >, reply: FastifyReply) => {
    const { id } = request.user as { id: number }
    const { displayName, avatarBase64 } = request.body

    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          displayName,
          avatarUrl: avatarBase64
        },
      })

      return reply.send({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      })
    } catch (err) {
      console.log(err)
      return reply.status(500).send({ message: 'Failed to update profile.' })
    }
  })
}