// src/types/friendRoutes.ts

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { CreateFriendSchema, CreateFriendDto, FriendsListDto, FriendIdSchema, FriendIdDto } from '../types/friend.dto'
import { toFriendsListDto } from "../utils/friendsMapper"
import { onlineUsers } from '../ws/presence'
import { UserIdDto, UserIdSchema } from '../types/user.dto'

export async function friendRoutes(fastify: FastifyInstance) { 
  // Get friends
  fastify.get('/users/:userId/friends', {
	schema: { params: UserIdSchema },
	preHandler: [fastify.authenticate]
  }, async (
	request: FastifyRequest<{ Params: UserIdDto }>,
	reply: FastifyReply
  ) => {
	const userId = request.params.userId
	const currentUserId = (request.user as { id: number }).id
  
	try {
	  const friends = await fastify.prisma.friend.findMany({
		where: { userId },
		include: {
		  friend: {
			select: {
			  id: true,
			  displayName: true,
			  avatarUrl: true,
			},
		  },
		},
	  })
  
	  const blockedUsers = await fastify.prisma.blockedUser.findMany({
		where: { blockerId: currentUserId },
		select: { blockedId: true },
	  })
	  const blockedIds = new Set(blockedUsers.map(b => b.blockedId))
  
	  const friendsList: FriendsListDto[] = friends.map(friend => {
		const isOnline = onlineUsers.has(friend.friend.id)
		const isBlocked = blockedIds.has(friend.friend.id)
  
		return {
		  id: friend.friend.id,
		  name: friend.friend.displayName,
		  avatarUrl: friend.friend.avatarUrl || undefined,
		  online: isOnline,
		  blocked: isBlocked,
		}
	  })
  
	  reply.send(friendsList)
	} catch (err: any) {
	  console.error('Error fetching friends:', err.stack || err)
	  reply.status(500).send({ message: 'Failed to fetch friends', error: String(err) })
	}
  })  

  // Add friend
  fastify.post('/users/friends', { schema: {body: CreateFriendSchema}, preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Body: CreateFriendDto }>, reply: FastifyReply) => {
    const { id } = request.user as { id: number }
    const { displayName } = request.body 

    try {
      const friend = await fastify.prisma.user.findUnique({
        where: { displayName: displayName },
      })

      // 不允许加guest user为好友
      if (!friend || friend.id === 999) {
        return reply.status(404).send({ message: 'Friend not found' })
      }

      if (friend.id === id) {
        return reply.status(400).send({ message: 'Cannot add yourself as a friend' })
      }

      const existing = await fastify.prisma.friend.findFirst({
        where: {
          userId: id,
          friendId: friend.id,
        },
      })

      if (existing) {
        return reply.status(400).send({ message: 'Already friends with this user' })
      }

      await fastify.prisma.friend.create({
        data: {
          userId: id,
          friendId: friend.id,
        },
      })

      reply.send({ message: 'Friend added successfully' })
    } catch (err) {
      console.error('Error adding friend:', err)
      reply.status(500).send({ message: 'Failed to add friend', error: String(err) })
    }
  })

  // Delete friend
  fastify.delete('/users/friends/:friendId', {schema: {params: FriendIdSchema}, preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: FriendIdDto }>, reply: FastifyReply) => {
    const { id } = request.user as { id: number }
    const friendId = Number(request.params.friendId)

    if (isNaN(friendId) || friendId <= 0) {
      return reply.status(400).send({ message: 'Invalid user or friend ID format' })
    }

    try {
      const relationship = await fastify.prisma.friend.findFirst({
        where: {
          userId: id,
          friendId,
        },
      })

      if (!relationship) {
        return reply.status(404).send({ message: 'Friend relationship not found' })
      }

      await fastify.prisma.friend.deleteMany({
        where: {
          userId: id,
          friendId,
        },
      })

      reply.send({ message: 'Friend removed successfully' })
    } catch (err) {
      console.error('Error deleting friend:', err)
      reply.status(500).send({ message: 'Failed to delete friend', error: String(err) })
    }
  })
}
