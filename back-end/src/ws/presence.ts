import websocketPlugin from '@fastify/websocket'
import { FastifyInstance } from 'fastify'
import type WebSocket from 'ws'
import { PrismaClient } from '@prisma/client'

// 保存所有在线用户的WebSocket连接
export const onlineUsers = new Map<number, WebSocket>()

// 添加连接时间记录，帮助调试连接问题
const connectionTimes = new Map<number, number>()

// 添加消息计数器，帮助调试消息传递问题
const messageCounter = {
  sent: 0,
  received: 0,
  gameInvitations: 0,
  gameResponses: 0
}

const prisma = new PrismaClient()

// 定期打印当前连接状态的函数
function printConnectionStatus() {
  console.log(`===== WebSocket 连接状态报告 =====`)
  console.log(`当前在线用户数: ${onlineUsers.size}`)
  
  onlineUsers.forEach((socket, userId) => {
    const connectionTime = connectionTimes.get(userId)
    const connectedFor = connectionTime ? Math.floor((Date.now() - connectionTime) / 1000) : 'unknown'
    console.log(`用户 ID: ${userId}, 连接状态: ${socket.readyState}, 已连接: ${connectedFor}秒`)
  })
  
  console.log(`消息统计 - 已接收: ${messageCounter.received}, 已发送: ${messageCounter.sent}`)
  console.log(`游戏邀请: ${messageCounter.gameInvitations}, 邀请回应: ${messageCounter.gameResponses}`)
  console.log(`==================================`)
}

export async function setupPresenceSocket(fastify: FastifyInstance) {
  await fastify.register(websocketPlugin)
  
  // 设置定期状态报告
  setInterval(printConnectionStatus, 60000) // 每分钟打印一次

  fastify.get('/ws/presence', { websocket: true }, (socket: WebSocket, req) => {
    console.log('🔌 新的WebSocket连接已接收')

    let userId: number | null = null

    socket.on('message', async (rawMessage: WebSocket.RawData) => {
      try {
        messageCounter.received++
        const message = JSON.parse(rawMessage.toString())
        if (message.type === 'ping') return

        console.log(`📨 接收到WebSocket消息类型: ${message.type}, 来自: ${message.userId || userId || 'unknown'}`)

        // 处理频道消息
        if (message.type === 'channel_message') {
          if (!userId) {
            console.log('⚠️ 频道消息被忽略：发送者未认证')
            return
          }
          
          // 验证消息格式
          if (!message.channelId || !message.content) {
            console.log(`⚠️ 频道消息格式无效: ${JSON.stringify(message)}`)
            return
          }
          
          const { channelId, content, localMessageId } = message
          console.log(`📝 用户 ${userId} 发送频道消息到频道 ${channelId}${localMessageId ? `，临时ID: ${localMessageId}` : ''}`)
          
          try {
            // 验证用户是否在频道中且未被禁言
            const membership = await prisma.channelMember.findUnique({
              where: {
                userId_channelId: {
                  userId,
                  channelId
                }
              }
            })
            
            if (!membership) {
              console.log(`⚠️ 用户 ${userId} 不在频道 ${channelId} 中，消息被拒绝`)
              return
            }
            
            // 检查是否被禁言
            if (membership.isMuted) {
              if (membership.muteEndTime && membership.muteEndTime < new Date()) {
                // 解除禁言
                await prisma.channelMember.update({
                  where: {
                    userId_channelId: {
                      userId,
                      channelId
                    }
                  },
                  data: {
                    isMuted: false,
                    muteEndTime: null
                  }
                })
              } else {
                console.log(`⚠️ 用户 ${userId} 在频道 ${channelId} 中被禁言，消息被拒绝`)
                return
              }
            }
            
            // 保存消息到数据库
            const newMessage = await prisma.channelMessage.create({
              data: {
                content,
                userId,
                channelId
              },
              include: {
                user: {
                  select: { 
                    id: true, 
                    displayName: true,
                    avatarUrl: true 
                  }
                }
              }
            })
            
            console.log(`✅ 用户 ${userId} 的消息已保存到数据库(ID: ${newMessage.id})，正在广播给频道成员`)
            
            // 广播消息给所有在此频道的在线用户
            const channelMembers = await prisma.channelMember.findMany({
              where: { channelId },
              select: { userId: true }
            })
            
            const memberIds = channelMembers.map(m => m.userId)
            
            // 向频道所有在线成员广播消息
            for (const memberId of memberIds) {
              const memberSocket = onlineUsers.get(memberId)
              if (memberSocket && memberSocket.readyState === 1) {
                try {
                  const messageData = JSON.stringify({
                    type: 'channel_message',
                    channelId,
                    message: {
                      id: newMessage.id,
                      content: newMessage.content,
                      createdAt: newMessage.createdAt,
                      user: {
                        id: newMessage.user.id,
                        displayName: newMessage.user.displayName,
                        avatarUrl: newMessage.user.avatarUrl
                      }
                    },
                    localMessageId // 返回客户端提供的临时ID，便于客户端做消息关联
                  })
                  memberSocket.send(messageData)
                  messageCounter.sent++
                  
                  if (memberId === userId) {
                    console.log(`✓ 频道消息已回传给发送者 ${userId} 用于确认`)
                  } else {
                    console.log(`✓ 频道消息已发送给用户 ${memberId}`)
                  }
                } catch (err) {
                  console.error(`发送频道消息给用户 ${memberId} 时出错:`, err)
                }
              }
            }
          } catch (err) {
            console.error('处理频道消息时出错:', err)
          }
        }
        
        // 其他频道相关消息处理...
        // channel_user_joined, channel_user_left, channel_user_kicked, channel_user_muted 等
        
        // 处理聊天消息
        if (message.type === 'chat') {
          if (!userId) {
            console.log('⚠️ 消息被忽略：发送者未认证')
            return
          }

          const isBlocked = await prisma.blockedUser.findFirst({
            where: {
              blockerId: message.to,
              blockedId: userId,
            },
          })

          if (isBlocked) {
            console.log(`❌ 消息已屏蔽: 用户 ${userId} 被用户 ${message.to} 屏蔽`)
            return
          }

          const messageId = message.messageId || `ws-${userId}-${message.to}-${Date.now()}`
          
          const receiverSocket = onlineUsers.get(message.to)
          if (receiverSocket && receiverSocket.readyState === 1) {
            const chatData = JSON.stringify({
              type: 'chat',
              from: userId,
              message: message.message,
              messageId: messageId
            })
            receiverSocket.send(chatData)
            messageCounter.sent++
            console.log(`💬 聊天消息已发送给用户 ${message.to}`)
          } else {
            console.log(`⚠️ 无法发送消息：接收者 ${message.to} 不在线或连接未就绪`)
          }
          
          const senderSocket = onlineUsers.get(userId)
          if (senderSocket && senderSocket.readyState === 1) {
            const confirmData = JSON.stringify({
              type: 'message_sent',
              to: message.to,
              messageId: messageId,
              message: message.message
            })
            senderSocket.send(confirmData)
            messageCounter.sent++
            console.log(`✓ 发送确认已发送给用户 ${userId}`)
          }
        }
        
        // 处理游戏邀请
        if (message.type === 'game_invitation') {
          if (!userId) {
            console.log('⚠️ 游戏邀请被忽略：发送者未认证')
            return
          }

          messageCounter.gameInvitations++
          console.log(`🎮 处理游戏邀请: 用户 ${userId} 邀请用户 ${message.to} 对战`)

          const isBlocked = await prisma.blockedUser.findFirst({
            where: {
              blockerId: message.to,
              blockedId: userId,
            },
          })

          if (isBlocked) {
            console.log(`❌ 游戏邀请已屏蔽: 用户 ${userId} 被用户 ${message.to} 屏蔽`)
            return
          }

          // 1. 获取接收者的WebSocket连接
          const receiverSocket = onlineUsers.get(message.to)
          console.log(`接收者 ${message.to} 的WebSocket连接状态:`, 
            receiverSocket ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][receiverSocket.readyState] : '不在线')
          
          // 2. 检查连接是否有效
          if (receiverSocket && receiverSocket.readyState === 1) {
            const inviteData = {
              type: 'game_invitation',
              from: userId,
              fromName: message.fromName,
              invitationId: message.invitationId
            }
            
            try {
              // 3. 发送邀请消息给接收者
              const inviteJSON = JSON.stringify(inviteData)
              console.log(`发送游戏邀请给接收者 ${message.to}:`, inviteJSON)
              receiverSocket.send(inviteJSON)
              messageCounter.sent++
              console.log(`✓ 游戏邀请已成功发送给用户 ${message.to}`)
            } catch (err) {
              console.error(`❌ 发送游戏邀请给用户 ${message.to} 时出错:`, err)
            }
          } else {
            console.log(`⚠️ 接收者 ${message.to} 不在线或WebSocket未连接`)
          }
          
          // 4. 确认邀请已处理，发送回执给发送者
          const senderSocket = onlineUsers.get(userId)
          if (senderSocket && senderSocket.readyState === 1) {
            try {
              const confirmData = JSON.stringify({
                type: 'game_invitation_sent',
                to: message.to,
                invitationId: message.invitationId
              })
              senderSocket.send(confirmData)
              messageCounter.sent++
              console.log(`✓ 邀请确认已发送给用户 ${userId}`)
            } catch (err) {
              console.error(`❌ 发送确认回执给用户 ${userId} 时出错:`, err)
            }
          }
        }
        
        // 处理游戏邀请回应
        if (message.type === 'game_invitation_response') {
          if (!userId) {
            console.log('⚠️ 游戏邀请回应被忽略：发送者未认证')
            return
          }

          messageCounter.gameResponses++
          console.log(`🎮 处理游戏邀请回应: 用户 ${userId} 对邀请 ${message.invitationId} 的回应是 ${message.response}`)

          const receiverSocket = onlineUsers.get(message.to)
          if (receiverSocket && receiverSocket.readyState === 1) {
            try {
              const responseData = JSON.stringify({
                type: 'game_invitation_response',
                from: userId,
                invitationId: message.invitationId,
                response: message.response
              })
              receiverSocket.send(responseData)
              messageCounter.sent++
              console.log(`✓ 游戏邀请回应已发送给用户 ${message.to}`)
            } catch (err) {
              console.error(`❌ 发送游戏邀请回应给用户 ${message.to} 时出错:`, err)
            }
          } else {
            console.log(`⚠️ 无法发送游戏邀请回应：接收者 ${message.to} 不在线或连接未就绪`)
          }
        }

        // 处理用户上线
        if (message.type === 'online' && typeof message.userId === 'number') {
          userId = message.userId
          
          // 确保userId非空
          if (userId === null) {
            console.error('收到online消息但userId为null，这不应该发生')
            return
          }
          
          // 检查是否已有现有连接
          const existingSocket = onlineUsers.get(userId)
          if (existingSocket && existingSocket !== socket && existingSocket.readyState === 1) {
            console.log(`⚠️ 用户 ${userId} 已有现有连接，关闭旧连接`)
            try {
              existingSocket.close()
            } catch (err) {
              console.error(`关闭用户 ${userId} 的旧连接时出错:`, err)
            }
          }
          
          // 保存新连接
          onlineUsers.set(userId, socket)
          connectionTimes.set(userId, Date.now())
          console.log(`🟢 用户 ${userId} 已上线。当前在线: ${onlineUsers.size} 人`)
          printConnectionStatus() // 立即打印连接状态

          // 通知其他用户该用户在线
          for (const [id, otherSocket] of onlineUsers.entries()) {
            if (id !== userId && otherSocket.readyState === 1) {
              try {
                const presenceData = JSON.stringify({
                  type: 'presence',
                  userId,
                  status: 'online',
                })
                otherSocket.send(presenceData)
                messageCounter.sent++
              } catch (err) {
                console.error(`通知用户 ${id} 关于用户 ${userId} 上线状态时出错:`, err)
              }
            }
          }
        }

      } catch (err) {
        console.error('❌ 处理消息时出错:', err)
      }
    })

    socket.on('close', () => {
      console.log('🔴 WebSocket连接已关闭')

      if (typeof userId === 'number') {
        // 检查是否是同一个socket
        const currentSocket = onlineUsers.get(userId)
        if (currentSocket === socket) {
          onlineUsers.delete(userId)
          connectionTimes.delete(userId)
          console.log(`🔕 用户 ${userId} 已离线。剩余在线: ${onlineUsers.size} 人`)

          // 通知其他用户该用户已离线
          for (const [id, otherSocket] of onlineUsers.entries()) {
            if (otherSocket.readyState === 1) {
              try {
                const offlineData = JSON.stringify({
                  type: 'presence',
                  userId,
                  status: 'offline',
                })
                otherSocket.send(offlineData)
                messageCounter.sent++
              } catch (err) {
                console.error(`通知用户 ${id} 关于用户 ${userId} 离线状态时出错:`, err)
              }
            }
          }
        } else {
          console.log(`⚠️ 关闭的连接不是用户 ${userId} 的当前活动连接，忽略`)
        }
      }
    })

    // 添加错误处理，防止未捕获的错误导致服务崩溃
    socket.on('error', (err) => {
      console.error('❌ WebSocket连接错误:', err)
    })

    // 监听频道消息
    socket.on('channel:message', async (data) => {
      // 验证用户是否在频道中且未被禁言
      const { channelId, content } = data;
      
      if (!userId) {
        console.log('⚠️ 频道消息被忽略：发送者未认证')
        return
      }
      
      try {
        const member = await prisma.channelMember.findUnique({
          where: {
            userId_channelId: { userId, channelId }
          }
        });
        
        if (!member) {
          return socket.emit('error', { message: '您不是该频道成员' });
        }
        
        // 检查是否被禁言
        if (member.isMuted) {
          const now = new Date();
          if (!member.muteEndTime || member.muteEndTime > now) {
            return socket.emit('error', { 
              message: '您已被禁言', 
              muteEndTime: member.muteEndTime 
            });
          } else {
            // 解除禁言
            await prisma.channelMember.update({
              where: { id: member.id },
              data: { isMuted: false, muteEndTime: null }
            });
          }
        }
        
        // 保存消息
        const message = await prisma.channelMessage.create({
          data: {
            content,
            userId,
            channelId
          },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        });
        
        // 广播消息给频道所有成员
        const channelMembers = await prisma.channelMember.findMany({
          where: { channelId }
        });
        
        channelMembers.forEach(member => {
          const userSocket = onlineUsers.get(member.userId);
          if (userSocket) {
            userSocket.emit('channel:message', message);
          }
        });
      } catch (error) {
        console.error('发送频道消息失败:', error);
        socket.emit('error', { message: '发送消息失败' });
      }
    });
  })
}
