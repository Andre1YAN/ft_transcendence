import { FriendsListDto } from '../types/friend.dto'

export function toFriendsListDto(friend: any, isOnline: boolean): FriendsListDto {
  console.log(friend, isOnline)
  console.log(friend.avatarUrl || `https://i.pravatar.cc/50?u=${friend.displayName}`)
  console.log(friend.avatarUrl)
  return {
    id: friend.id,
    name: friend.displayName,
    avatarUrl: friend.avatarUrl || `https://i.pravatar.cc/50?u=${friend.displayName}`,
    online: isOnline
  }
}
