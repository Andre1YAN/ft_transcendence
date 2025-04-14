// src/types/index.ts

export interface MatchResult {
	id: number
	score1: number
	score2: number
	playedAt: string
	user1: {
	  displayName: string
	  avatarUrl: string
	}
	user2: {
	  displayName: string
	  avatarUrl: string
	}
  }
  