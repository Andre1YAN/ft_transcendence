import { MatchType } from '@prisma/client'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { CreateMatchDto, CreateMatchSchema, MatchHistoryDto } from '../types/match.dto'
import { toMatchHistoryDto } from '../utils/matchMapper'
import { UserIdDto, UserIdSchema } from '../types/user.dto'


export async function matchRoutes(fastify: FastifyInstance) {

  // 获取比赛历史（包含自己打的所有场次）
  fastify.get('/users/:userId/matches', { schema: { params: UserIdSchema }, preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: UserIdDto }>, reply: FastifyReply) => {
    const userId = Number(request.params.userId)
    if (isNaN(userId)) {
      return reply.status(400).send({ message: 'Invalid userId' })
    }

    try {
      const rawMatches = await fastify.prisma.match.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        orderBy: { playedAt: 'desc' },
        include: {
          user1: true,
          user2: true,
        }
      })

      const matches: MatchHistoryDto[] = rawMatches.map(toMatchHistoryDto)

      reply.send(matches)
    } catch (err) {
      reply.status(500).send({ message: 'Failed to fetch match history', error: err })
    }
  })

  // 上传比赛成绩
  fastify.post('/users/matches', { schema: { body: CreateMatchSchema }, preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{
    Body: CreateMatchDto
  }>, reply: FastifyReply) => {
    const { id } = request.user as { id: number }
    const { user1Id, user2Id, score1, score2, matchType } = request.body

    // 仅可上传已登陆用户自己对局信息
    if (id !== user1Id && id !== user2Id) {
      return reply.status(401).send({ message: 'Unauthorized access' })
    }

    if (![user1Id, user2Id, score1, score2].every(n => typeof n === 'number')) {
      return reply.status(400).send({ message: 'Invalid input data' })
    }

    try {
      const match = await fastify.prisma.match.create({
        data: {
          user1Id,
          user2Id,
          score1,
          score2,
          matchType: matchType
        }
      })

      reply.send(match)
    } catch (err) {
      reply.status(500).send({ message: 'Failed to record match', error: err })
    }
  })
}