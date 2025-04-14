import { Type } from '@sinclair/typebox'

export const CreateMatchSchema = Type.Object({
  user1Id: Type.Number(),
  user2Id: Type.Number(),
  score1: Type.Number(),
  score2: Type.Number(),
  matchType: Type.Optional(Type.Union([
    Type.Literal('NORMAL'),
    Type.Literal('TOURNAMENT'),
  ], {
    default: 'NORMAL'
  }))
})

export type CreateMatchDto = typeof CreateMatchSchema.static

export interface MatchHistoryDto {
  id: number
  playedAt: Date
  matchType: string
  score1: number
  score2: number
  user1: {
    id: number
    displayName: string
    avatarUrl?: string
  }
  user2: {
    id: number
    displayName: string
    avatarUrl?: string
  }
}
