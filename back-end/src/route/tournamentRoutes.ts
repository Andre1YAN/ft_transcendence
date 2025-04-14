import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { CreateTourmantDto, CreateTourmantSchema, CreateTournamentMatchDto, CreateTournamentMatchSchema, TournamentIdDto, TournamentIdSchema } from '../types/tournnament.dto'

export async function tournamentRoutes(fastify: FastifyInstance) {
	fastify.post('/tournaments', {schema: {body: CreateTourmantSchema}}, async (request: FastifyRequest<{ Body: CreateTourmantDto }>, reply: FastifyReply) => {
		const { aliases } = request.body

		try {
			// Step 1: 创建 tournament
			const tournament = await fastify.prisma.tournament.create({
				data: {},
			})

			// Step 2: 使用create依次插入players，避免 createMany 的限制
			await Promise.all(
				aliases.map(alias =>
					fastify.prisma.tournamentPlayer.create({
						data: {
							alias,
							tournamentId: tournament.id
						}
					})
				)
			)

			// Step 3: 查询完整数据返回
			const fullTournament = await fastify.prisma.tournament.findUnique({
				where: { id: tournament.id },
				include: { players: true }
			})

			reply.send(fullTournament)
		} catch (err) {
			console.error('[tournament/create error]', err)
			reply.status(500).send({ message: '创建 tournament 失败', error: err })
		}
	})

	fastify.post('/tournaments/:tournamentId/matches', {schema: {body: CreateTournamentMatchSchema, params: TournamentIdSchema}},async (
		request: FastifyRequest<{
			Params: TournamentIdDto,
			Body: CreateTournamentMatchDto
		}>,
		reply: FastifyReply
	) => {
		const tournamentId = request.params.tournamentId
		const { player1Alias, player2Alias, winnerAlias, score1, score2 } = request.body

		try {
			// 1. 更新胜者得分
			await fastify.prisma.tournamentPlayer.updateMany({
				where: { tournamentId, alias: winnerAlias },
				data: { score: { increment: 1 } }
			})

			// 2. 插入 match 记录
			await fastify.prisma.tournamentMatch.create({
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


	fastify.get('/tournaments/:tournamentId/players', {schema: {params: TournamentIdSchema}},async (
		request: FastifyRequest<{ Params: TournamentIdDto }>,
		reply: FastifyReply
	) => {
		const tournamentId = request.params.tournamentId

		try {
			const players = await fastify.prisma.tournamentPlayer.findMany({
				where: { tournamentId },
				orderBy: { score: 'desc' }
			})

			reply.send(players)
		} catch (err) {
			reply.status(500).send({ message: 'Failed to fetch players', error: err })
		}
	})


	fastify.get('/tournaments/:tournamentId/matches', {schema: {params: TournamentIdSchema}}, async (request: FastifyRequest<{ Params: TournamentIdDto }>, reply: FastifyReply) => {
		const tournamentId = Number(request.params.tournamentId)
		try {
			const matches = await fastify.prisma.tournamentMatch.findMany({
				where: { tournamentId },
			})
			reply.send(matches)
		} catch (err) {
			console.error('Error fetching matches', err)
			reply.status(500).send({ message: 'Failed to fetch matches' })
		}
	})

}