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

    // ✅ 新增：Block 某人
	fastify.post('/users/block', {
		preHandler: [fastify.authenticate]
	  }, async (request: FastifyRequest<{ Body: { blockedId: number } }>, reply: FastifyReply) => {
		const { id } = request.user as { id: number }
		const { blockedId } = request.body
	
		if (id === blockedId) {
		  return reply.status(400).send({ message: 'You cannot block yourself.' })
		}
	
		try {
		  await prisma.blockedUser.create({
			data: {
			  blockerId: id,
			  blockedId,
			},
		  })
		  reply.send({ message: 'User blocked.' })
		} catch (err: any) {
		  if (err.code === 'P2002') { // 唯一键冲突
			reply.status(409).send({ message: 'Already blocked.' })
		  } else {
			console.error(err)
			reply.status(500).send({ message: 'Failed to block user.' })
		  }
		}
	  })

	// ✅ 新增：Unblock 某人
	fastify.delete('/users/block/:blockedId', {
	preHandler: [fastify.authenticate]
	}, async (request: FastifyRequest<{ Params: { blockedId: string } }>, reply: FastifyReply) => {
	const { id } = request.user as { id: number }
	const blockedId = Number(request.params.blockedId)

	await prisma.blockedUser.deleteMany({
		where: {
		blockerId: id,
		blockedId: blockedId,
		},
	})

	reply.send({ message: 'User unblocked.' })
	})
}