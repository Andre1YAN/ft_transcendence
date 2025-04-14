// src/auth/friendRoutes.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { onlineUsers } from '../ws/presence'

const prisma = new PrismaClient()

export async function friendRoutes(fastify: FastifyInstance) {
  // Log middleware for debugging
  fastify.addHook('onRequest', (request, reply, done) => {
    console.log(`[${request.method}] ${request.url}`, request.body || {})
    done()
  })

  // Get friends list
  fastify.get('/friends/:userId', async (req: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    const userId = Number(req.params.userId)

    if (isNaN(userId) || userId <= 0) {
      return reply.status(400).send({ message: 'Invalid userId format' })
    }

    try {
      console.log(`Fetching friends for user ${userId}, onlineUsers map has ${onlineUsers.size} entries`)

      const friends = await prisma.friend.findMany({
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

      console.log(`Found ${friends.length} friends for user ${userId}:`, 
        friends.map(f => ({ id: f.friend.id, name: f.friend.displayName }))
      )

      const friendsList = friends.map(f => {
        const isOnline = onlineUsers.has(f.friend.id)
        console.log(`Friend ${f.friend.id} (${f.friend.displayName}) online status: ${isOnline}`)

        return {
          id: f.friend.id,
          name: f.friend.displayName,
          avatarUrl: f.friend.avatarUrl || `https://i.pravatar.cc/50?u=${f.friend.displayName}`,
          online: isOnline,
        }
      })

      console.log(`Returning ${friendsList.length} friends with online status`)
      reply.send(friendsList)
    } catch (err) {
      console.error('Error fetching friends:', err)
      reply.status(500).send({ message: 'Failed to fetch friends', error: String(err) })
    }
  })

  // Add friend
  fastify.post('/friends', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any
    console.log('Add friend request body:', body)

    if (!body) {
      return reply.status(400).send({ message: 'Request body is required' })
    }

    const userId = Number(body.userId)
    const friendDisplayName = body.friendDisplayName

    if (isNaN(userId) || userId <= 0) {
      return reply.status(400).send({ message: 'Invalid userId format' })
    }

    if (!friendDisplayName || typeof friendDisplayName !== 'string') {
      return reply.status(400).send({ message: 'Friend display name is required and must be a string' })
    }

    try {
      const friend = await prisma.user.findUnique({
        where: { displayName: friendDisplayName },
      })

      if (!friend) {
        return reply.status(404).send({ message: 'Friend not found' })
      }

      if (friend.id === userId) {
        return reply.status(400).send({ message: 'Cannot add yourself as a friend' })
      }

      const existing = await prisma.friend.findFirst({
        where: {
          userId,
          friendId: friend.id,
        },
      })

      if (existing) {
        return reply.status(400).send({ message: 'Already friends with this user' })
      }

      await prisma.friend.create({
        data: {
          userId,
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
  fastify.delete('/friends', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as any

    if (!body) {
      return reply.status(400).send({ message: 'Request body is required' })
    }

    const userId = Number(body.userId)
    const friendId = Number(body.friendId)

    if (isNaN(userId) || userId <= 0 || isNaN(friendId) || friendId <= 0) {
      return reply.status(400).send({ message: 'Invalid user or friend ID format' })
    }

    try {
      const relationship = await prisma.friend.findFirst({
        where: {
          userId,
          friendId,
        },
      })

      if (!relationship) {
        return reply.status(404).send({ message: 'Friend relationship not found' })
      }

      await prisma.friend.deleteMany({
        where: {
          userId,
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
