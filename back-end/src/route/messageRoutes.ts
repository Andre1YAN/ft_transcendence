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
      const { receiverId, content, metadata } = request.body as {
        receiverId: number
        content: string
        metadata?: any
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

      // 处理元数据
      const metadataString = metadata ? JSON.stringify(metadata) : null;

      const message = await prisma.privateMessage.create({
        data: {
          senderId,
          receiverId,
          content,
          metadata: metadataString,
        },
      })

      // 返回创建的消息，包含ID
      return reply.send({ 
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        metadata: metadata,
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

      // 解析元数据
      const processedMessages = messages.map(msg => {
        let metadata = null;
        try {
          if (msg.metadata) {
            metadata = JSON.parse(msg.metadata);
          }
        } catch (e) {
          console.error('Error parsing message metadata:', e);
        }
        
        return {
          ...msg,
          metadata
        };
      });

      return reply.send(processedMessages)
    },
  })

  // 更新游戏邀请状态 - 新添加的PATCH端点
  fastify.patch<{
    Params: {
      invitationId: string;
    },
    Body: {
      status: 'pending' | 'accepted' | 'rejected';
    }
  }>('/messages/invitation/:invitationId', {
    preValidation: [fastify.authenticate],
    handler: async (request, reply) => {
      const { invitationId } = request.params;
      const { status } = request.body;
      const userId = request.user.id;

      if (!invitationId || !status) {
        return reply.code(400).send({ message: 'invitationId and status are required' });
      }

      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return reply.code(400).send({ message: 'Status must be one of: pending, accepted, rejected' });
      }

      try {
        // 查找包含此邀请ID的消息
        const messages = await prisma.privateMessage.findMany({
          where: {
            OR: [
              { senderId: userId, metadata: { contains: invitationId } },
              { receiverId: userId, metadata: { contains: invitationId } }
            ]
          }
        });

        if (!messages || messages.length === 0) {
          return reply.code(404).send({ message: 'Invitation not found' });
        }

        // 找到包含邀请ID的消息并更新元数据
        const message = messages[0];
        let metadata;
        
        try {
          metadata = message.metadata ? JSON.parse(message.metadata) : {};
        } catch (e) {
          console.error('Error parsing message metadata:', e);
          metadata = {};
        }

        // 确保这是一个游戏邀请消息
        if (!metadata || metadata.type !== 'game_invitation' || metadata.invitationId !== invitationId) {
          return reply.code(400).send({ message: 'Invalid invitation message' });
        }

        // 更新状态
        metadata.status = status;

        // 保存更新后的元数据
        const updatedMessage = await prisma.privateMessage.update({
          where: { id: message.id },
          data: { metadata: JSON.stringify(metadata) }
        });

        // 返回更新后的消息
        return reply.send({
          id: updatedMessage.id,
          invitationId,
          status,
          message: 'Invitation status updated successfully'
        });
      } catch (error) {
        console.error('Error updating invitation status:', error);
        const err = error as Error
        return reply.code(500).send({ message: 'Failed to update invitation status', error: err.message });
      }
    }
  });
}
