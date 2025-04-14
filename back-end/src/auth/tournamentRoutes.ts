// src/routes/tournamentRoutes.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function tournamentRoutes(fastify: FastifyInstance) {
	fastify.post('/tournament/create', async (request: FastifyRequest, reply: FastifyReply) => {
		const { aliases } = request.body as { aliases: string[] }
	  
		if (!Array.isArray(aliases) || aliases.length < 2) {
		  return reply.status(400).send({ message: '至少需要 2 位玩家' })
		}
	  
		try {
		  // Step 1: 创建 tournament
		  const tournament = await prisma.tournament.create({
			data: {},
		  })
	  
		  // Step 2: 使用 create 一个一个插入，避免 createMany 的限制
		  await Promise.all(
			aliases.map(alias =>
			  prisma.tournamentPlayer.create({
				data: {
				  alias,
				  tournamentId: tournament.id
				}
			  })
			)
		  )
	  
		  // Step 3: 查询完整数据返回
		  const fullTournament = await prisma.tournament.findUnique({
			where: { id: tournament.id },
			include: { players: true }
		  })
	  
		  reply.send(fullTournament)
		} catch (err) {
		  console.error('[tournament/create error]', err)
		  reply.status(500).send({ message: '创建 tournament 失败', error: err })
		}
	  })

	  fastify.post('/tournament/:id/match', async (
		req: FastifyRequest<{
		  Params: { id: string },
		  Body: {
			player1Alias: string
			player2Alias: string
			winnerAlias: string
			score1: number
			score2: number
		  }
		}>,
		reply: FastifyReply
	  ) => {
		const tournamentId = Number(req.params.id)
		const { player1Alias, player2Alias, winnerAlias, score1, score2 } = req.body
	  
		try {
		  // ✅ 1. 更新胜者得分
		  await prisma.tournamentPlayer.updateMany({
			where: { tournamentId, alias: winnerAlias },
			data: { score: { increment: 1 } }
		  })
	  
		  // ✅ 2. 插入 match 记录
		  await prisma.tournamentMatch.create({
			data: {
			  tournamentId,
			  player1Alias,
			  player2Alias,
			  winnerAlias,
			  score1,
			  score2,
			}
		  })
	  
		  reply.send({ message: 'Match recorded and score updated.' })
		} catch (err) {
		  console.error('Error recording match', err)
		  reply.status(500).send({ message: 'Error recording match' })
		}
	  })
	  

	  fastify.get('/tournament/:id/players', async (
		req: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply
	  ) => {
		const tournamentId = Number(req.params.id)
	  
		try {
		  const players = await prisma.tournamentPlayer.findMany({
			where: { tournamentId },
			orderBy: { score: 'desc' }
		  })
	  
		  reply.send(players)
		} catch (err) {
		  reply.status(500).send({ message: 'Failed to fetch players', error: err })
		}
	  })
	  
	  // GET /tournament/:id/matches
	fastify.get('/tournament/:id/matches', async (req, reply) => {
		const tournamentId = Number(req.params.id)
		try {
		const matches = await prisma.tournamentMatch.findMany({
			where: { tournamentId },
		})
		reply.send(matches)
		} catch (err) {
		console.error('Error fetching matches', err)
		reply.status(500).send({ message: 'Failed to fetch matches' })
		}
	})
	  
	}