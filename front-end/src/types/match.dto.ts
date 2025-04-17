// front-end/src/types/match.dto.ts
export interface MatchHistoryDto {
  id: number
  playedAt: string
  score1: number
  score2: number
  user1: {
    id: number
    displayName: string
    avatarUrl: string
  }
  user2: {
    id: number
    displayName: string
    avatarUrl: string
  }
}
