// src/auth/auth.ts
import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function authRoutes(fastify: FastifyInstance) {

	fastify.post('/auth/login', async (request, reply) => {
		const { email, password } = request.body as {
		  email: string
		  password: string
		}
	  
		const user = await prisma.user.findUnique({ where: { email } })
		if (!user) {
		  return reply.status(401).send({ message: 'Invalid email or password.' })
		}
	  
		const isPasswordValid = await bcrypt.compare(password, user.password)
		if (!isPasswordValid) {
		  return reply.status(401).send({ message: 'Invalid email or password.' })
		}
	  
		reply.send({
		  id: user.id,
		  email: user.email,
		  displayName: user.displayName,
		  avatarUrl: user.avatarUrl,
		})
	  })


  fastify.post('/auth/register', async (request, reply) => {
	const { email, password, displayName, avatarBase64 } = request.body as {
		email: string
		password: string
		displayName: string
		avatarBase64?: string
	  }
	  
    // 检查重复邮箱
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return reply.status(400).send({ message: 'Email already registered.' })
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10)

	const user = await prisma.user.create({
		data: {
		  email,
		  displayName,
		  password: hashedPassword,
		  avatarUrl: avatarBase64 || undefined, // 如果上传了就用，否则走默认值
		}
	  })

    reply.send({ id: user.id, email: user.email, displayName: user.displayName })
  })

  fastify.post('/auth/update-profile', async (request, reply) => {
	const { id, displayName, avatarBase64 } = request.body as {
	  id: number
	  displayName: string
	  avatarBase64?: string
	}
  
	if (!id || !displayName) {
	  return reply.status(400).send({ message: 'Missing required fields.' })
	}
  
	try {
	  const user = await prisma.user.update({
		where: { id },
		data: {
		  displayName,
		  avatarUrl: avatarBase64 || undefined,
		},
	  })
  
	  return reply.send({
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		avatarUrl: user.avatarUrl,
	  })
	} catch (err) {
	  return reply.status(500).send({ message: 'Failed to update profile.' })
	}
  })
}