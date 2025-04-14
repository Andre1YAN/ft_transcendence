// src/auth/jwt.ts

import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret'

export function signToken(payload: object, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET)
}