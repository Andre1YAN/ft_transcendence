import { FastifyInstance } from 'fastify'
import websocketPlugin from '@fastify/websocket'
import type WebSocket from 'ws'

export const onlineUsers = new Map<number, WebSocket>()

export async function setupPresenceSocket(fastify: FastifyInstance) {
  await fastify.register(websocketPlugin)

  fastify.get('/ws/presence', { websocket: true }, (socket: WebSocket, req) => {
    console.log('🔌 New WebSocket connection received')
	
    let userId: number | null = null

    socket.on('message', (rawMessage: WebSocket.RawData) => {
      try {
        const message = JSON.parse(rawMessage.toString())
        
        // 处理心跳包：忽略 type 为 'ping' 的消息
        if (message.type === 'ping') {
          // 可选地记录日志：console.log('Received ping from client')
          return
        }

        console.log('📨 WebSocket received message:', message)

        if (message.type === 'online' && typeof message.userId === 'number') {
          userId = message.userId
          onlineUsers.set(userId, socket)
          console.log(`🟢 User ${userId} is now online. Total online: ${onlineUsers.size}`)

          // 广播该用户上线消息给其他在线用户
          for (const [id, otherSocket] of onlineUsers.entries()) {
            if (id !== userId && otherSocket.readyState === 1) {
              otherSocket.send(JSON.stringify({
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

    socket.on('close', () => {
      console.log('🔴 WebSocket connection closed')

      if (typeof userId === 'number') {
        onlineUsers.delete(userId)
        console.log(`🔕 User ${userId} is now offline. Remaining online: ${onlineUsers.size}`)

        // 广播该用户离线消息给其他在线用户
        for (const [id, otherSocket] of onlineUsers.entries()) {
          if (otherSocket.readyState === 1) {
            otherSocket.send(JSON.stringify({
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
