import { Type } from '@sinclair/typebox'

export const CreateTourmantSchema = Type.Object({
  aliases: Type.Array(Type.String(), { minItems: 2 }),
})

export const CreateTournamentMatchSchema = Type.Object({
  player1Alias: Type.String(),
  player2Alias: Type.String(),
  winnerAlias: Type.String(),
  score1: Type.Number(),
  score2: Type.Number()
})

export const TournamentIdSchema = Type.Object({
  tournamentId: Type.Number()
})

export type CreateTourmantDto = typeof CreateTourmantSchema.static
export type CreateTournamentMatchDto = typeof CreateTournamentMatchSchema.static
export type TournamentIdDto = typeof TournamentIdSchema.static