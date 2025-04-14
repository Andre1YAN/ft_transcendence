import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { VerifyTwoFADto, VerifyTwoFASchema } from '../types/twofa.dto';
import { signToken } from '../utils/jwt';

export async function twofaRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/2fa/verify', {schema: {body: VerifyTwoFASchema}}, async (request: FastifyRequest<{Body: VerifyTwoFADto}> , reply: FastifyReply) => {
    const { userId, code } = request.body

    const user = await fastify.prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.twoFACode || !user.twoFAExpires) {
      return reply.status(400).send({ message: '2FA not initialized.' })
    }

    const isExpired = new Date() > user.twoFAExpires
    if (isExpired || user.twoFACode !== code) {
      return reply.status(401).send({ message: 'Invalid or expired code.' })
    }

    // 清除验证码
    await fastify.prisma.user.update({
      where: { id: userId },
      data: { twoFACode: null, twoFAExpires: null },
    })

    const token = signToken({ id: user.id, email: user.email })

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
