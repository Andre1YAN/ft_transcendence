import 'fastify'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: any
        prisma: PrismaClient
    }

    interface FastifyRequest {
        user: {
            id: number
            [key: string]: any
        }
    }
}