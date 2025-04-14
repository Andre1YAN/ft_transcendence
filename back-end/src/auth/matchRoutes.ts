// src/auth/matchRoutes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { MatchType } from '@prisma/client'

const prisma = new PrismaClient()

// 👇 新增：创建默认 AI 用户（id: 999）如果不存在
const ensureGuestUserExists = async () => {
  const guest = await prisma.user.findUnique({ where: { id: 999 } })
  if (!guest) {
    await prisma.user.create({
      data: {
        id: 999,
        email: 'guest@fake.com',
        displayName: 'Guest',
        password: 'placeholder', // 不用于登录
        avatarUrl: 'https://i.pravatar.cc/40?u=ai'
      }
    })
  }
}

export async function matchRoutes(fastify: FastifyInstance) {

  // 📜 获取比赛历史（包含自己打的所有场次）
  fastify.get('/match/user/history/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    const userId = Number(request.params.userId)
    if (isNaN(userId)) {
      return reply.status(400).send({ message: 'Invalid userId' })
    }

    try {
      const matches = await prisma.match.findMany({
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

      reply.send(matches)
    } catch (err) {
      reply.status(500).send({ message: 'Failed to fetch match history', error: err })
    }
  })

  // 📝 上报一场比赛（local 模式）
  //    带上 matchType="NORMAL" 或 "TOURNAMENT" 来区分
  fastify.post('/match/report', async (request: FastifyRequest<{
	Body: {
	  user1Id: number
	  user2Id: number
	  score1: number
	  score2: number
	  matchType?: string
	}
  }>, reply: FastifyReply) => {
	const { user1Id, user2Id, score1, score2, matchType } = request.body
  
	const allowedTypes: MatchType[] = ['NORMAL', 'TOURNAMENT']
	const realType: MatchType = allowedTypes.includes(matchType as MatchType)
	  ? (matchType as MatchType)
	  : 'NORMAL'
  
	if (![user1Id, user2Id, score1, score2].every(n => typeof n === 'number')) {
	  return reply.status(400).send({ message: 'Invalid input data' })
	}
  
	try {
	  await ensureGuestUserExists()
	  const match = await prisma.match.create({
		data: {
		  user1Id,
		  user2Id,
		  score1,
		  score2,
		  matchType: realType
		}
	  })
  
	  reply.send({ message: 'Match recorded', match })
	} catch (err) {
	  reply.status(500).send({ message: 'Failed to record match', error: err })
	}
  })
}