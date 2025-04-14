// src/auth/twofaRoutes.ts

import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { signToken } from './jwt'

const prisma = new PrismaClient()

export async function twofaRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/2fa/verify', async (req, reply) => {
    const { userId, code } = req.body as { userId: number; code: string }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.twoFACode || !user.twoFAExpires) {
      return reply.status(400).send({ message: '2FA not initialized.' })
    }

    const isExpired = new Date() > user.twoFAExpires
    if (isExpired || user.twoFACode !== code) {
      return reply.status(401).send({ message: 'Invalid or expired code.' })
    }

    // 清除验证码
    await prisma.user.update({
      where: { id: userId },
      data: { twoFACode: null, twoFAExpires: null },
    })

    // 登录成功后签发 JWT，标记 is2FA: true
    const token = signToken({ id: user.id, email: user.email, is2FA: true })

    reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    })
  })
}
