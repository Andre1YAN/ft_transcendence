// src/route/messageRoutes.ts

import { FastifyInstance } from 'fastify'

// 添加自定义用户类型扩展，解决请求中user.id不存在的问题
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: number;
      [key: string]: any;
    }
  }
}

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

      // 检查是否被对方屏蔽
      const isBlocked = await prisma.blockedUser.findFirst({
        where: {
          blockerId: receiverId,
          blockedId: senderId,
        },
      })

      if (isBlocked) {
        return reply.code(403).send({ message: 'You are blocked by this user' })
      }

      const message = await prisma.privateMessage.create({
        data: {
          senderId,
          receiverId,
          content,
        },
      })

      // 返回创建的消息，包含ID
      return reply.send({ 
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        sentAt: message.sentAt
      })
    },
  })

  // 获取聊天记录
  fastify.get<{
    Params: {
      friendId: string;
    }
  }>('/messages/:friendId', {
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
