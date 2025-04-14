import { MatchHistoryDto } from '../types/match.dto'

export function toMatchHistoryDto(match: any): MatchHistoryDto {
  return {
    id: match.id,
    playedAt: match.playedAt,
    matchType: match.matchType,
    score1: match.score1,
    score2: match.score2,
    user1: {
      id: match.user1.id,
      displayName: match.user1.displayName,
      avatarUrl: match.user1.avatarUrl,
    },
    user2: {
      id: match.user2.id,
      displayName: match.user2.displayName,
      avatarUrl: match.user2.avatarUrl,
    },
  }
}
