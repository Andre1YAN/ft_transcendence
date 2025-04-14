// src/server.ts

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import { authRoutes } from './auth/auth'
import { matchRoutes } from './auth/matchRoutes'
import { tournamentRoutes } from './auth/tournamentRoutes'
import { friendRoutes } from './auth/friendRoutes'
import { googleAuthRoutes } from './auth/googleAuthRoutes'  // 导入 Google 路由模块
import { setupPresenceSocket } from './ws/presence'
import 'dotenv/config'

const prisma = new PrismaClient()
const fastify = Fastify({
  logger: true,
  bodyLimit: 5 * 1024 * 1024,
})

async function buildServer() {
  await fastify.register(cors, {
    origin: ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })

  await fastify.register(authRoutes)
  await fastify.register(matchRoutes)
  await fastify.register(tournamentRoutes)
  await fastify.register(friendRoutes)
  await fastify.register(googleAuthRoutes) // 关键：注册 Google 认证路由
  await setupPresenceSocket(fastify)

  return fastify
}

buildServer().then((fastify) => {
	fastify.printRoutes()  // 打印出已注册的所有路由
	fastify.listen({ port: 3000 }, (err, address) => {
	  if (err) {
		console.error(err)
		process.exit(1)
	  }
	  fastify.log.info(`🚀 Server running at ${address}`)
	})
  })
  
