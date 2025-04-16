import websocketPlugin from '@fastify/websocket'
import { FastifyInstance } from 'fastify'
import type WebSocket from 'ws'
import { PrismaClient } from '@prisma/client'

export const onlineUsers = new Map<number, WebSocket>()
const prisma = new PrismaClient()

export async function setupPresenceSocket(fastify: FastifyInstance) {
  await fastify.register(websocketPlugin)

  fastify.get('/ws/presence', { websocket: true }, (socket: WebSocket, req) => {
    console.log('🔌 New WebSocket connection received')

    let userId: number | null = null

    socket.on('message', async (rawMessage: WebSocket.RawData) => {
      try {
        const message = JSON.parse(rawMessage.toString())
        if (message.type === 'ping') return

        console.log('📨 WebSocket received message:', message)

        if (message.type === 'chat') {
          if (!userId) return

          const isBlocked = await prisma.blockedUser.findFirst({
            where: {
              blockerId: message.to,
              blockedId: userId,
            },
          })

          if (isBlocked) {
            console.log(`❌ Message blocked: user ${userId} is blocked by user ${message.to}`)
            return
          }

          const messageId = message.messageId || `ws-${userId}-${message.to}-${Date.now()}`
          
          const receiverSocket = onlineUsers.get(message.to)
          if (receiverSocket && receiverSocket.readyState === 1) {
            receiverSocket.send(JSON.stringify({
              type: 'chat',
              from: userId,
              message: message.message,
              messageId: messageId
            }))
          }
          
          const senderSocket = onlineUsers.get(userId)
          if (senderSocket && senderSocket.readyState === 1) {
            senderSocket.send(JSON.stringify({
              type: 'message_sent',
              to: message.to,
              messageId: messageId,
              message: message.message
            }))
          }
        }

        if (message.type === 'online' && typeof message.userId === 'number') {
          userId = message.userId
          onlineUsers.set(userId, socket)
          console.log(`🟢 User ${userId} is now online. Total online: ${onlineUsers.size}`)

          for (const [id, otherSocket] of onlineUsers.entries()) {
            if (id !== userId && otherSocket.readyState === 1) {
              otherSocket.send(JSON.stringify({
                type: 'presence',
                userId,
                status: 'online',
              }))
            }
          }
        }

      } catch (err) {
        console.error('❌ Error processing message:', err)
      }
    })

    socket.on('close', () => {
      console.log('🔴 WebSocket connection closed')

      if (typeof userId === 'number') {
        onlineUsers.delete(userId)
        console.log(`🔕 User ${userId} is now offline. Remaining online: ${onlineUsers.size}`)

        for (const [id, otherSocket] of onlineUsers.entries()) {
          if (otherSocket.readyState === 1) {
            otherSocket.send(JSON.stringify({
              type: 'presence',
              userId,
              status: 'offline',
            }))
          }
        }
      }
    })
  })
}
