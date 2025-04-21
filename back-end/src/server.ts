import cors from '@fastify/cors'
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
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
import channelRoutes from './route/channelRoutes'
import { setupChannelJobs } from './jobs/channelJobs'

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'cert.pem'))
}

const fastify = Fastify({
  logger: true,
  bodyLimit: 5 * 1024 * 1024,
  https: httpsOptions,
})

async function buildServer() {
  await registerJwt(fastify)
  await fastify.register(prismaPlugin)
  await initGuestUser(fastify.prisma)
  await fastify.register(requestLogger)

  await fastify.register(cors, {
    origin: ['https://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  })

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public'),
    prefix: '/',
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
  await fastify.register(channelRoutes, { prefix: '/api/channels' })
  
  // 初始化频道相关定时任务
  setupChannelJobs()

  fastify.setNotFoundHandler((req, reply) => {
    reply.sendFile('index.html')
  })

  return fastify
}

buildServer().then((fastify) => {
  fastify.printRoutes()  // 打印出已注册的所有路由
  fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    fastify.log.info(`🚀 Server running at ${address}`)
  })
})

