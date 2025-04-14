import 'fastify'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: any
        prisma: PrismaClient
    }
}