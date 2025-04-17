import cors from '@fastify/cors'
import 'dotenv/config'
import Fastify from 'fastify'
import prismaPlugin from './plugins/prisma'
import requestLogger from './plugins/requestLogger'
import { authRoutes } from './route/authRoutes'
import { friendRoutes } from './route/friendRoutes'
import { googleAuthRoutes } from './route/googleAuthRoutes'
import { matchRoutes } from './route/matchRoutes'
import { tournamentRoutes } from './route/tournamentRoutes'
import { twofaRoutes } from './route/twofaRoutes'
import { userRoutes } from './route/userRoutes'
import { initGuestUser } from './utils/initGuestUser'
import { registerJwt } from './utils/jwt'
import { setupPresenceSocket } from './ws/presence'
import { messageRoutes } from './route/messageRoutes'

const fastify = Fastify({
  logger: true,
  bodyLimit: 5 * 1024 * 1024,
})

async function buildServer() {
  await registerJwt(fastify)
  await fastify.register(prismaPlugin)
  await initGuestUser(fastify.prisma)
  await fastify.register(requestLogger)

  await fastify.register(cors, {
    origin: ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  })

  await fastify.register(authRoutes)
  await fastify.register(userRoutes)
  await fastify.register(matchRoutes)
  await fastify.register(tournamentRoutes)
  await fastify.register(friendRoutes)
  await fastify.register(googleAuthRoutes)
  await setupPresenceSocket(fastify)
  await fastify.register(twofaRoutes)
  await fastify.register(messageRoutes)

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

