// src/types/channel.ts
export interface ChannelDTO {
	id: string;
	name: string;
	description?: string;
	isPrivate: boolean;
	isAdmin: boolean;
	createdAt: string;
}

export interface ChannelMemberDTO {
	userId: number;
	displayName: string;
	avatarUrl?: string;
	isAdmin: boolean;
	isMuted: boolean;
	muteEndTime?: string;
}

export interface ChannelMessageDTO {
	id: number;
	content: string;
	userId: number;
	channelId: string;
	createdAt: string;
	user: {
		id: number;
		displayName: string;
		avatarUrl?: string;
	};
}