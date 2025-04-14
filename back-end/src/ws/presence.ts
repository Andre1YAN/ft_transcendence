// src/ws/presence.ts

import { FastifyInstance } from 'fastify'
import websocketPlugin from '@fastify/websocket'
import type { SocketStream } from '@fastify/websocket'
import type WebSocket from 'ws'

// 用于追踪在线用户（key: userId, value: WebSocket 实例）
export const onlineUsers = new Map<number, WebSocket>()

export async function setupPresenceSocket(fastify: FastifyInstance) {
  console.log('✅ Setting up presence WebSocket server')

  await fastify.register(websocketPlugin)

  fastify.get('/ws/presence', { websocket: true } as any, (connection, req) => {
    console.log('🔌 New WebSocket connection received')

    let userId: number | null = null

    connection.socket.on('message', (rawMessage: WebSocket.RawData) => {
      try {
        const message = JSON.parse(rawMessage.toString())
        console.log('📨 WebSocket received message:', message)

        if (message.type === 'online' && typeof message.userId === 'number') {
          userId = message.userId
		  if (typeof userId === 'number') {
			onlineUsers.set(userId, connection.socket)
		  }		  
          console.log(`🟢 User ${userId} is now online. Total online: ${onlineUsers.size}`)

          // 广播 presence 消息给其他用户
          for (const [id, socket] of onlineUsers.entries()) {
            if (id !== userId && socket.readyState === 1) {
              socket.send(JSON.stringify({
                type: 'presence',
                userId,
                status: 'online'
              }))
            }
          }
        }
      } catch (err) {
        console.error('❌ Error processing message:', err)
      }
    })

    connection.socket.on('close', () => {
      console.log('🔴 WebSocket connection closed')

      if (typeof userId === 'number') {
        onlineUsers.delete(userId)
        console.log(`🔕 User ${userId} is now offline. Remaining online: ${onlineUsers.size}`)

        // 广播离线消息
        for (const [id, socket] of onlineUsers.entries()) {
          if (socket.readyState === 1) {
            socket.send(JSON.stringify({
              type: 'presence',
              userId,
              status: 'offline'
            }))
          }
        }
      }
    })
  })
}
