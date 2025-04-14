import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import { authRoutes } from './auth/auth'
import { matchRoutes } from './auth/matchRoutes' // ✅ 1. 导入 matchRoutes
import { tournamentRoutes } from './auth/tournamentRoutes'
import { friendRoutes } from './auth/friendRoutes'
import { setupPresenceSocket } from './ws/presence'

const prisma = new PrismaClient()

const fastify = Fastify({
  logger: true,
  bodyLimit: 5 * 1024 * 1024, // ✅ 设置最大请求体为 5MB
})

async function buildServer() {
  // ✅ 注册 CORS 插件
  await fastify.register(cors, {
    origin: ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // ✅ 加上 DELETE
  })

  // ✅ 注册你的路由模块
  await fastify.register(authRoutes)
  await fastify.register(matchRoutes)
  await fastify.register(tournamentRoutes)
  await fastify.register(friendRoutes)
  await setupPresenceSocket(fastify)

  return fastify
}

buildServer().then((fastify) => {
  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
	fastify.log.info(`🚀 Server running at ${address}`) // ✅ 对的
  })
})