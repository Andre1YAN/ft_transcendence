// src/route/messageRoutes.ts

import { FastifyInstance } from 'fastify'

export async function messageRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma

  // 发送消息
  fastify.post('/messages', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      const { receiverId, content } = request.body as {
        receiverId: number
        content: string
      }

      if (!content || typeof content !== 'string' || content.trim() === '') {
        return reply.code(400).send({ message: 'Message content is required' })
      }

      const senderId = request.user.id

      // 验证是否为好友
      const isFriend = await prisma.friend.findFirst({
        where: {
          userId: senderId,
          friendId: receiverId,
        },
      })

      if (!isFriend) {
        return reply.code(403).send({ message: 'Only friends can send messages' })
      }

      const message = await prisma.privateMessage.create({
        data: {
          senderId,
          receiverId,
          content,
        },
      })

      return reply.send({ message })
    },
  })

  // 获取聊天记录
  fastify.get('/messages/:friendId', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      const senderId = request.user.id
      const friendId = Number(request.params.friendId)

      const messages = await prisma.privateMessage.findMany({
        where: {
          OR: [
            { senderId, receiverId: friendId },
            { senderId: friendId, receiverId: senderId },
          ],
        },
        orderBy: { sentAt: 'asc' },
      })

      return reply.send(messages)
    },
  })
}
