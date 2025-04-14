import { Type } from '@sinclair/typebox'

export const CreateFriendSchema = Type.Object({
  displayName: Type.String(),
})

export const FriendIdSchema = Type.Object({
  friendId: Type.Number(),
})

export interface FriendsListDto {
  id: number
  name: string
  avatarUrl?: string
  online: boolean
}

export type CreateFriendDto = typeof CreateFriendSchema.static
export type FriendIdDto = typeof FriendIdSchema.static