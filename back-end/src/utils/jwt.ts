import fastifyJwt from '@fastify/jwt'
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import jwt from 'jsonwebtoken'
import { SignOptions } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fake secret'

export function signToken(payload: object, expiresIn: SignOptions['expiresIn'] = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}


export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET)
}

export async function registerJwt(fastify: FastifyInstance) {
  fastify.register(fastifyJwt, { secret: JWT_SECRET })
  fastify.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch (err: any) {
      reply.status(401).send({ message: "Unauthorized" })
    }
  })
}