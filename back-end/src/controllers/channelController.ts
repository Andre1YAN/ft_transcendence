import { FastifyRequest, FastifyReply } from 'fastify';
import * as bcrypt from 'bcrypt';
import { onlineUsers } from '../ws/presence';

// Create channel
export const createChannel = async (req: FastifyRequest, res: FastifyReply) => {
  const { name, description, isPrivate, password } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;

  try {
    // Check if channel name already exists
    const existingChannel = await prisma.channel.findUnique({
      where: { name }
    });

    if (existingChannel) {
      return res.status(400).send({ message: 'Channel name already exists' });
    }

    // Hash password (if provided)
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Create channel
    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        isPrivate: isPrivate || false,
        password: hashedPassword,
        members: {
          create: {
            userId,
            displayName: user.displayName,
            isAdmin: true
          }
        }
      }
    });

    return res.status(201).send({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      isPrivate: channel.isPrivate,
      createdAt: channel.createdAt
    });
  } catch (error: any) {
    console.error('Error creating channel:', error);
    return res.status(500).send({ 
      message: 'Failed to create channel', 
      error: error.message 
    });
  }
};

// Search channels
export const searchChannels = async (req: FastifyRequest, res: FastifyReply) => {
  const query = (req.query as any).query;
  const prisma = (req.server as any).prisma;
  
  try {
    const channels = await prisma.channel.findMany({
      where: {
        name: { contains: query as string },
      },
      select: {
        id: true,
        name: true,
        description: true,
        isPrivate: true,
        createdAt: true,
        _count: {
          select: { members: true }
        }
      }
    });
    
    return res.send(channels);
  } catch (error) {
    return res.status(500).send({ message: 'Failed to search channels', error });
  }
};

// Join channel
export const joinChannel = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, password } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // Check if channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    });
    
    if (!channel) {
      return res.status(404).send({ message: 'Channel not found' });
    }
    
    // Check if user already joined
    const existingMember = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId }
      }
    });
    
    if (existingMember) {
      return res.status(400).send({ message: 'You have already joined this channel' });
    }
    
    // Verify password if channel has one
    if (channel.password) {
      if (!password) {
        return res.status(403).send({ message: 'Password required to join this channel' });
      }
      
      const passwordMatch = await bcrypt.compare(password, channel.password);
      if (!passwordMatch) {
        return res.status(403).send({ message: 'Incorrect password' });
      }
    }
    
    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
      }
    });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    
    // 检查该频道是否还有其他成员，如果是空频道，则第一个加入的用户成为管理员
    const memberCount = await prisma.channelMember.count({
      where: { channelId }
    });
    
    const isAdmin = memberCount === 0; // 如果没有成员，则新加入的用户成为管理员
    
    // Join channel
    const newMember = await prisma.channelMember.create({
      data: {
        userId,
        channelId,
        displayName: user.displayName,
        isAdmin // 如果是空频道的第一个成员，自动成为管理员
      }
    });
    
    // Get all channel members
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // Notify all online channel members
    console.log(`User ${userId} (${user.displayName}) has joined channel ${channelId}, notifying other members`);
    
    // Construct notification message
    const joinNotification = {
      type: 'channel_user_joined',
      channelId,
      member: {
        userId: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isAdmin: newMember.isAdmin,
        isMuted: newMember.isMuted,
        muteEndTime: newMember.muteEndTime,
        joinedAt: newMember.joinedAt
      }
    };
    
    // Broadcast notification
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(joinNotification));
          console.log(`Notified user ${member.userId} about new member joining`);
        } catch (err) {
          console.error(`Failed to notify user ${member.userId}:`, err);
        }
      }
    });
    
    // Also notify the joining user
    const joiningUserSocket = onlineUsers.get(userId);
    if (joiningUserSocket && joiningUserSocket.readyState === 1) {
      try {
        joiningUserSocket.send(JSON.stringify({
          ...joinNotification,
          isSelf: true
        }));
        console.log(`Also notified joining user ${userId} about their own join event`);
      } catch (err) {
        console.error(`Failed to notify joining user ${userId}:`, err);
      }
    }
    
    return res.status(201).send({ message: 'Successfully joined channel' });
  } catch (error: any) {
    console.error('Error joining channel:', error);
    return res.status(500).send({ 
      message: 'Failed to join channel', 
      error: error.message 
    });
  }
};

// Get user's channels
export const getUserChannels = async (req: FastifyRequest, res: FastifyReply) => {
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;

  try {
    const channelMembers = await prisma.channelMember.findMany({
      where: { userId },
      include: {
        channel: true
      }
    });
    
    const channels = channelMembers.map((member: any) => ({
      id: member.channel.id,
      name: member.channel.name,
      description: member.channel.description,
      isPrivate: member.channel.isPrivate,
      isAdmin: member.isAdmin,
      createdAt: member.channel.createdAt
    }));
    
    return res.send(channels);
  } catch (error) {
    return res.status(500).send({ message: 'Failed to get channel list', error });
  }
};

// Admin function: Kick user
export const kickUser = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // Check if requester is admin
    const requester = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId }
      },
      include: {
        user: {
          select: {
            displayName: true
          }
        }
      }
    });
    
    if (!requester || !requester.isAdmin) {
      return res.status(403).send({ message: 'Insufficient permissions. You are not a channel admin' });
    }
    
    // Cannot kick yourself
    if (userId === parseInt(targetUserId as string)) {
      return res.status(400).send({ message: 'You cannot kick yourself' });
    }
    
    // Check if target user exists
    const targetMember = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      }
    });
    
    if (!targetMember) {
      return res.status(404).send({ message: 'Target user is not in this channel' });
    }
    
    // Cannot kick other admins
    if (targetMember.isAdmin) {
      return res.status(403).send({ message: 'You cannot kick other admins' });
    }
    
    // Kick user
    await prisma.channelMember.delete({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      }
    });
    
    // Get kicked user info
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    // Get channel name
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { name: true }
    });
    
    // Get remaining channel members
    const remainingMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // Notify all online channel members that user was kicked
    const kickNotification = {
      type: 'channel_user_kicked',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser?.displayName || 'Unknown user',
      adminId: userId,
      adminName: requester.user?.displayName || 'Admin'
    };
    
    // Send notification to other channel members
    remainingMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(kickNotification));
          console.log(`Notified user ${member.userId} about user ${targetUserId} being kicked from channel`);
        } catch (err) {
          console.error(`Failed to notify user ${member.userId}:`, err);
        }
      }
    });
    
    // Send notification to kicked user
    const targetUserSocket = onlineUsers.get(parseInt(targetUserId as string));
    if (targetUserSocket && targetUserSocket.readyState === 1) {
      try {
        const kickedNotification = {
          type: 'you_were_kicked',
          channelId,
          channelName: channel?.name || 'Unknown channel',
          adminId: userId,
          adminName: requester.user?.displayName || 'Admin'
        };
        targetUserSocket.send(JSON.stringify(kickedNotification));
        console.log(`Notified kicked user ${targetUserId} about being kicked by admin ${userId} from channel ${channelId}`);
      } catch (err) {
        console.error(`Failed to notify kicked user ${targetUserId}:`, err);
      }
    }
    
    return res.send({ message: 'User successfully kicked' });
  } catch (error) {
    return res.status(500).send({ message: 'Failed to kick user', error });
  }
};

// Admin function: Mute user
export const muteUser = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId, duration } = req.body as any; // duration in minutes
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // Verify admin permissions
    const requester = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId }
      },
      include: {
        user: {
          select: {
            displayName: true
          }
        }
      }
    });
    
    if (!requester || !requester.isAdmin) {
      return res.status(403).send({ message: 'Insufficient permissions. You are not a channel admin' });
    }
    
    // Cannot mute yourself
    if (userId === parseInt(targetUserId as string)) {
      return res.status(400).send({ message: 'You cannot mute yourself' });
    }
    
    // Check target user
    const targetMember = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      }
    });
    
    if (!targetMember) {
      return res.status(404).send({ message: 'Target user is not in this channel' });
    }
    
    // Cannot mute other admins
    if (targetMember.isAdmin) {
      return res.status(403).send({ message: 'You cannot mute other admins' });
    }
    
    // Calculate mute end time
    const muteEndTime = new Date();
    muteEndTime.setMinutes(muteEndTime.getMinutes() + parseInt(duration as string));
    
    // Set mute status
    await prisma.channelMember.update({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      },
      data: {
        isMuted: true,
        muteEndTime
      }
    });
    
    // Get muted user info
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    // Get channel name
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { name: true }
    });
    
    // Get all channel members
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // Notify all online channel members about user being muted
    const muteNotification = {
      type: 'channel_user_muted',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser?.displayName || 'Unknown user',
      adminId: userId,
      adminName: requester.user?.displayName || 'Admin',
      duration: parseInt(duration as string),
      muteEndTime: muteEndTime.toISOString()
    };
    
    // Send notification to other channel members
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(muteNotification));
          console.log(`Notified user ${member.userId} about user ${targetUserId} being muted`);
        } catch (err) {
          console.error(`Failed to notify user ${member.userId}:`, err);
        }
      }
    });
    
    // Send special notification to muted user
    const targetUserSocket = onlineUsers.get(parseInt(targetUserId as string));
    if (targetUserSocket && targetUserSocket.readyState === 1) {
      try {
        const mutedNotification = {
          type: 'you_were_muted',
          channelId,
          channelName: channel?.name || 'Unknown channel',
          adminId: userId,
          adminName: requester.user?.displayName || 'Admin',
          duration: parseInt(duration as string),
          muteEndTime: muteEndTime.toISOString()
        };
        targetUserSocket.send(JSON.stringify(mutedNotification));
        console.log(`Notified muted user ${targetUserId} about being muted by admin ${userId} for ${duration} minutes`);
      } catch (err) {
        console.error(`Failed to notify muted user ${targetUserId}:`, err);
      }
    }
    
    return res.send({ 
      message: 'User successfully muted',
      muteEndTime
    });
  } catch (error) {
    return res.status(500).send({ message: 'Failed to mute user', error });
  }
};

// Unmute user
export const unmuteUser = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // Verify admin permissions
    const requester = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId }
      },
      include: {
        user: {
          select: {
            displayName: true
          }
        }
      }
    });
    
    if (!requester || !requester.isAdmin) {
      return res.status(403).send({ message: 'Insufficient permissions. You are not a channel admin' });
    }
    
    // Check target user
    const targetMember = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      }
    });
    
    if (!targetMember) {
      return res.status(404).send({ message: 'Target user is not in this channel' });
    }
    
    // Check if user is muted
    if (!targetMember.isMuted) {
      return res.status(400).send({ message: 'This user is not currently muted' });
    }
    
    // Update user mute status
    await prisma.channelMember.update({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      },
      data: {
        isMuted: false,
        muteEndTime: null
      }
    });
    
    // Get unmuted user info
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    // Get channel name
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { name: true }
    });
    
    // Get all channel members
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // Notify all online channel members that user was unmuted
    const unmuteNotification = {
      type: 'channel_user_unmuted',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser?.displayName || 'Unknown user',
      adminId: userId,
      adminName: requester.user?.displayName || 'Admin'
    };
    
    // Send notification to other channel members
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(unmuteNotification));
          console.log(`Notified user ${member.userId} about user ${targetUserId} being unmuted`);
        } catch (err) {
          console.error(`Failed to notify user ${member.userId}:`, err);
        }
      }
    });
    
    // Send special notification to unmuted user
    const targetUserSocket = onlineUsers.get(parseInt(targetUserId as string));
    if (targetUserSocket && targetUserSocket.readyState === 1) {
      try {
        const unmutedNotification = {
          type: 'you_were_unmuted',
          channelId,
          channelName: channel?.name || 'Unknown channel',
          adminId: userId,
          adminName: requester.user?.displayName || 'Admin'
        };
        targetUserSocket.send(JSON.stringify(unmutedNotification));
        console.log(`Notified user ${targetUserId} about being unmuted by admin ${userId}`);
      } catch (err) {
        console.error(`Failed to notify user ${targetUserId}:`, err);
      }
    }
    
    return res.send({ message: 'User successfully unmuted' });
  } catch (error) {
    return res.status(500).send({ message: 'Failed to unmute user', error });
  }
};

// Set channel password
export const setChannelPassword = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, password } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // Verify admin permissions
    const requester = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId }
      }
    });
    
    if (!requester || !requester.isAdmin) {
      return res.status(403).send({ message: 'Insufficient permissions. You are not a channel admin' });
    }
    
    // Hash password
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Update channel password
    await prisma.channel.update({
      where: { id: channelId },
      data: { 
        password: hashedPassword,
        isPrivate: !!hashedPassword 
      }
    });
    
    return res.send({ 
      message: password ? 'Channel password set successfully' : 'Channel password removed',
      isPrivate: !!hashedPassword
    });
  } catch (error) {
    return res.status(500).send({ message: 'Failed to set password', error });
  }
};

// Set admin
export const setAdmin = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // Verify if current user is admin
    const requester = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId }
      },
      include: {
        user: {
          select: {
            displayName: true
          }
        }
      }
    });
    
    if (!requester || !requester.isAdmin) {
      return res.status(403).send({ message: 'Insufficient permissions. You are not a channel admin' });
    }
    
    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    if (!targetUser) {
      return res.status(404).send({ message: 'Target user not found' });
    }
    
    // Update target user to admin
    await prisma.channelMember.update({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      },
      data: { isAdmin: true }
    });
    
    // Get channel members list
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // Notify channel members about new admin
    const adminChangeNotification = {
      type: 'channel_admin_changed',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser.displayName,
      isAdmin: true,
      changedBy: requester.user.displayName
    };
    
    // Send notification to all online members
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(adminChangeNotification));
          console.log(`Notified user ${member.userId} about user ${targetUserId} becoming admin`);
        } catch (err) {
          console.error(`Failed to notify user ${member.userId}:`, err);
        }
      }
    });
    
    return res.send({ message: 'User successfully set as admin' });
  } catch (error) {
    return res.status(500).send({ message: 'Failed to set admin', error });
  }
};

// Remove admin privileges
export const removeAdmin = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // Verify if current user is admin
    const requester = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId }
      },
      include: {
        user: {
          select: {
            displayName: true
          }
        }
      }
    });
    
    if (!requester || !requester.isAdmin) {
      return res.status(403).send({ message: 'Insufficient permissions. You are not a channel admin' });
    }
    
    // Cannot remove your own admin privileges
    if (userId === parseInt(targetUserId as string)) {
      return res.status(400).send({ message: 'You cannot remove your own admin privileges' });
    }
    
    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    if (!targetUser) {
      return res.status(404).send({ message: 'Target user not found' });
    }
    
    // Update target user's admin status
    await prisma.channelMember.update({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      },
      data: { isAdmin: false }
    });
    
    // Get channel members list
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // Notify channel members about admin change
    const adminChangeNotification = {
      type: 'channel_admin_changed',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser.displayName,
      isAdmin: false,
      changedBy: requester.user.displayName
    };
    
    // Send notification to all online members
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(adminChangeNotification));
          console.log(`Notified user ${member.userId} about user ${targetUserId} being removed from admin`);
        } catch (err) {
          console.error(`Failed to notify user ${member.userId}:`, err);
        }
      }
    });
    
    return res.send({ message: 'Admin privileges successfully removed' });
  } catch (error) {
    return res.status(500).send({ message: 'Failed to remove admin privileges', error });
  }
};

// Get channel messages
export const getChannelMessages = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId } = req.params as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // Verify if user is in channel
    const member = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId: channelId as string }
      }
    });
    
    if (!member) {
      return res.status(403).send({ message: 'You are not a member of this channel' });
    }
    
    // Get channel info
    const channel = await prisma.channel.findUnique({
      where: { id: channelId as string }
    });
    
    // Get channel members
    const members = await prisma.channelMember.findMany({
      where: { channelId: channelId as string },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });
    
    // Get recent messages
    const messages = await prisma.channelMessage.findMany({
      where: { channelId: channelId as string },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });
    
    return res.send({
      channelInfo: channel,
      members: members.map((m: any) => ({
        userId: m.userId,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        isAdmin: m.isAdmin,
        isMuted: m.isMuted,
        muteEndTime: m.muteEndTime
      })),
      messages
    });
  } catch (error: any) {
    console.error('Error getting channel messages:', error);
    return res.status(500).send({ 
      message: 'Failed to get channel messages', 
      error: error.message 
    });
  }
};

// Leave channel
export const leaveChannel = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId } = req.params as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // Check if user is in channel
    const member = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId: channelId as string }
      }
    });
    
    if (!member) {
      return res.status(404).send({ message: 'You are not in this channel' });
    }
    
    // Check if sole admin
    if (member.isAdmin) {
      const adminCount = await prisma.channelMember.count({
        where: {
          channelId: channelId as string,
          isAdmin: true
        }
      });
      
      if (adminCount === 1) {
        // Find oldest non-admin member in channel
        const oldestMember = await prisma.channelMember.findFirst({
          where: {
            channelId: channelId as string,
            isAdmin: false
          },
          orderBy: { joinedAt: 'asc' }
        });
        
        if (oldestMember) {
          // Set that member as new admin
          await prisma.channelMember.update({
            where: { id: oldestMember.id },
            data: { isAdmin: true }
          });
        }
      }
    }
    
    // Leave channel
    await prisma.channelMember.delete({
      where: {
        userId_channelId: { userId, channelId: channelId as string }
      }
    });
    
    // 检查频道是否还有其他成员，如果没有则删除频道
    const remainingMemberCount = await prisma.channelMember.count({
      where: { channelId: channelId as string }
    });
    
    if (remainingMemberCount === 0) {
      // 删除该频道的所有消息
      await prisma.channelMessage.deleteMany({
        where: { channelId: channelId as string }
      });
      
      // 删除频道
      await prisma.channel.delete({
        where: { id: channelId as string }
      });
      
      console.log(`Channel ${channelId} has been deleted because it has no more members`);
      return res.send({ message: 'Successfully left channel. Channel has been deleted because you were the last member.' });
    }
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    // Get remaining channel members
    const remainingMembers = await prisma.channelMember.findMany({
      where: { channelId: channelId as string },
      select: { userId: true }
    });
    
    // Notify all online channel members user has left
    const leaveNotification = {
      type: 'channel_user_left',
      channelId,
      userId,
      displayName: user?.displayName || 'Unknown user'
    };
    
    // Send notification to channel members
    remainingMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(leaveNotification));
          console.log(`Notified user ${member.userId} about user ${userId} leaving channel`);
        } catch (err) {
          console.error(`Failed to notify user ${member.userId}:`, err);
        }
      }
    });
    
    return res.send({ message: 'Successfully left channel' });
  } catch (error) {
    return res.status(500).send({ message: 'Failed to leave channel', error });
  }
};
