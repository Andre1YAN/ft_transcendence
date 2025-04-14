import bcrypt from 'bcrypt'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { LoginUserDto, LoginUserSchema, RegisterUserDto, RegisterUserSchema } from '../types/user.dto'
import { signToken } from '../utils/jwt'
import { send2FACodeEmail } from '../utils/mailer'

export async function authRoutes(fastify: FastifyInstance) {

	fastify.post('/auth/login', { schema: { body: LoginUserSchema } }, async (request: FastifyRequest<{ Body: LoginUserDto }>, reply: FastifyReply) => {
		try {
			const { email, password } = request.body

			const user = await fastify.prisma.user.findUnique({ where: { email } })
			if (!user) return reply.status(401).send({ message: 'Invalid email or password.' })

			const isPasswordValid = await bcrypt.compare(password, user.password)
			if (!isPasswordValid) return reply.status(401).send({ message: 'Invalid email or password.' })

			if (user.is2FAEnabled) {
				const code = Math.floor(100000 + Math.random() * 900000).toString()

				await fastify.prisma.user.update({
					where: { id: user.id },
					data: {
						twoFACode: code,
						twoFAExpires: new Date(Date.now() + 5 * 60 * 1000),
					},
				})

				// 如果发邮件失败会直接抛错导致 500
				await send2FACodeEmail(user.email, code)

				return reply.send({
					step: '2fa_required',
					userId: user.id,
				})
			}

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
		} catch (err: any) {
			console.error('Login error:', err)
			reply.status(500).send({ message: 'Internal server error.' })
		}
	})

	fastify.post('/auth/register', { schema: { body: RegisterUserSchema } }, async (request: FastifyRequest<{ Body: RegisterUserDto }>, reply: FastifyReply) => {
		const { email, password, displayName, avatarBase64, is2FAEnabled } = request.body

		// 检查重复邮箱
		const existingUser = await fastify.prisma.user.findUnique({ where: { email } })
		if (existingUser) {
			return reply.status(400).send({ message: 'Email already registered.' })
		}

		// 密码加密
		const hashedPassword = await bcrypt.hash(password, 10)

		const user = await fastify.prisma.user.create({
			data: {
				email,
				displayName,
				password: hashedPassword,
				avatarUrl: avatarBase64 || undefined, // 如果上传了就用，否则走默认值
				is2FAEnabled: is2FAEnabled || false
			}
		})

		reply.send({ id: user.id, email: user.email, displayName: user.displayName })
	})

}