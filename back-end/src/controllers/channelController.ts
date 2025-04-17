import { FastifyRequest, FastifyReply } from 'fastify';
import * as bcrypt from 'bcrypt';
import { onlineUsers } from '../ws/presence';

// 创建频道
export const createChannel = async (req: FastifyRequest, res: FastifyReply) => {
  const { name, description, isPrivate, password } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;

  try {
    // 检查频道名是否已存在
    const existingChannel = await prisma.channel.findUnique({
      where: { name }
    });

    if (existingChannel) {
      return res.status(400).send({ message: '频道名已存在' });
    }

    // 对密码进行哈希处理（如果有）
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).send({ message: '用户不存在' });
    }

    // 创建频道
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
    console.error('创建频道错误:', error);
    return res.status(500).send({ 
      message: '创建频道失败', 
      error: error.message 
    });
  }
};

// 搜索频道
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
    return res.status(500).send({ message: '搜索频道失败', error });
  }
};

// 加入频道
export const joinChannel = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, password } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // 检查频道是否存在
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    });
    
    if (!channel) {
      return res.status(404).send({ message: '频道不存在' });
    }
    
    // 检查用户是否已加入
    const existingMember = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId }
      }
    });
    
    if (existingMember) {
      return res.status(400).send({ message: '您已经加入了该频道' });
    }
    
    // 如果频道有密码，验证密码
    if (channel.password) {
      if (!password) {
        return res.status(403).send({ message: '需要密码才能加入此频道' });
      }
      
      const passwordMatch = await bcrypt.compare(password, channel.password);
      if (!passwordMatch) {
        return res.status(403).send({ message: '密码错误' });
      }
    }
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
      }
    });

    if (!user) {
      return res.status(404).send({ message: '用户不存在' });
    }
    
    // 加入频道
    const newMember = await prisma.channelMember.create({
      data: {
        userId,
        channelId,
        displayName: user.displayName
      }
    });
    
    // 查找频道中的所有成员
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // 向频道中的所有在线成员发送通知
    console.log(`用户 ${userId} (${user.displayName}) 已加入频道 ${channelId}，正在通知其他成员`);
    
    // 构造通知消息
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
    
    // 广播通知消息
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(joinNotification));
          console.log(`已通知用户 ${member.userId} 关于新成员加入`);
        } catch (err) {
          console.error(`通知用户 ${member.userId} 失败:`, err);
        }
      }
    });
    
    return res.status(201).send({ message: '成功加入频道' });
  } catch (error: any) {
    console.error('加入频道错误:', error);
    return res.status(500).send({ 
      message: '加入频道失败', 
      error: error.message 
    });
  }
};

// 获取用户的频道列表
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
    return res.status(500).send({ message: '获取频道列表失败', error });
  }
};

// 管理员功能：踢出用户
export const kickUser = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // 检查请求者是否为管理员
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
      return res.status(403).send({ message: '权限不足，您不是频道管理员' });
    }
    
    // 不能踢出自己
    if (userId === parseInt(targetUserId as string)) {
      return res.status(400).send({ message: '您不能踢出自己' });
    }
    
    // 检查目标用户是否存在
    const targetMember = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      }
    });
    
    if (!targetMember) {
      return res.status(404).send({ message: '目标用户不在此频道' });
    }
    
    // 不能踢出其他管理员
    if (targetMember.isAdmin) {
      return res.status(403).send({ message: '您不能踢出其他管理员' });
    }
    
    // 踢出用户
    await prisma.channelMember.delete({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      }
    });
    
    // 获取被踢用户信息
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    // 获取频道名称
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { name: true }
    });
    
    // 获取频道中剩余的成员
    const remainingMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // 通知频道中的所有在线成员用户已被踢出
    const kickNotification = {
      type: 'channel_user_kicked',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser?.displayName || '未知用户',
      adminId: userId,
      adminName: requester.user?.displayName || '管理员'
    };
    
    // 向频道内其他成员发送通知
    remainingMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(kickNotification));
          console.log(`已通知用户 ${member.userId} 关于用户 ${targetUserId} 被踢出频道`);
        } catch (err) {
          console.error(`通知用户 ${member.userId} 失败:`, err);
        }
      }
    });
    
    // 向被踢出的用户发送通知
    const targetUserSocket = onlineUsers.get(parseInt(targetUserId as string));
    if (targetUserSocket && targetUserSocket.readyState === 1) {
      try {
        const kickedNotification = {
          type: 'you_were_kicked',
          channelId,
          channelName: channel?.name || '未知频道',
          adminId: userId,
          adminName: requester.user?.displayName || '管理员'
        };
        targetUserSocket.send(JSON.stringify(kickedNotification));
        console.log(`已通知被踢用户 ${targetUserId} 已被管理员 ${userId} 踢出频道 ${channelId}`);
      } catch (err) {
        console.error(`通知被踢用户 ${targetUserId} 失败:`, err);
      }
    }
    
    return res.send({ message: '已成功踢出用户' });
  } catch (error) {
    return res.status(500).send({ message: '踢出用户失败', error });
  }
};

// 管理员功能：禁言用户
export const muteUser = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId, duration } = req.body as any; // duration单位：分钟
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // 验证管理员权限
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
      return res.status(403).send({ message: '权限不足，您不是频道管理员' });
    }
    
    // 不能禁言自己
    if (userId === parseInt(targetUserId as string)) {
      return res.status(400).send({ message: '您不能禁言自己' });
    }
    
    // 检查目标用户
    const targetMember = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      }
    });
    
    if (!targetMember) {
      return res.status(404).send({ message: '目标用户不在此频道' });
    }
    
    // 不能禁言其他管理员
    if (targetMember.isAdmin) {
      return res.status(403).send({ message: '您不能禁言其他管理员' });
    }
    
    // 计算禁言结束时间
    const muteEndTime = new Date();
    muteEndTime.setMinutes(muteEndTime.getMinutes() + parseInt(duration as string));
    
    // 设置禁言
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
    
    // 获取被禁言用户信息
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    // 获取频道名称
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { name: true }
    });
    
    // 获取频道中的所有成员
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // 通知频道中的所有在线成员用户已被禁言
    const muteNotification = {
      type: 'channel_user_muted',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser?.displayName || '未知用户',
      adminId: userId,
      adminName: requester.user?.displayName || '管理员',
      duration: parseInt(duration as string),
      muteEndTime: muteEndTime.toISOString()
    };
    
    // 向频道内其他成员发送通知
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(muteNotification));
          console.log(`已通知用户 ${member.userId} 关于用户 ${targetUserId} 被禁言`);
        } catch (err) {
          console.error(`通知用户 ${member.userId} 失败:`, err);
        }
      }
    });
    
    // 向被禁言的用户发送专门通知
    const targetUserSocket = onlineUsers.get(parseInt(targetUserId as string));
    if (targetUserSocket && targetUserSocket.readyState === 1) {
      try {
        const mutedNotification = {
          type: 'you_were_muted',
          channelId,
          channelName: channel?.name || '未知频道',
          adminId: userId,
          adminName: requester.user?.displayName || '管理员',
          duration: parseInt(duration as string),
          muteEndTime: muteEndTime.toISOString()
        };
        targetUserSocket.send(JSON.stringify(mutedNotification));
        console.log(`已通知被禁言用户 ${targetUserId} 已被管理员 ${userId} 禁言，持续 ${duration} 分钟`);
      } catch (err) {
        console.error(`通知被禁言用户 ${targetUserId} 失败:`, err);
      }
    }
    
    return res.send({ 
      message: '已成功禁言用户',
      muteEndTime
    });
  } catch (error) {
    return res.status(500).send({ message: '禁言用户失败', error });
  }
};

// 解除用户禁言
export const unmuteUser = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // 验证管理员权限
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
      return res.status(403).send({ message: '权限不足，您不是频道管理员' });
    }
    
    // 检查目标用户
    const targetMember = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      }
    });
    
    if (!targetMember) {
      return res.status(404).send({ message: '目标用户不在此频道' });
    }
    
    // 检查用户是否被禁言
    if (!targetMember.isMuted) {
      return res.status(400).send({ message: '此用户当前未被禁言' });
    }
    
    // 更新用户禁言状态
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
    
    // 获取被解除禁言用户信息
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    // 获取频道名称
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      select: { name: true }
    });
    
    // 获取频道中的所有成员
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // 通知频道中的所有在线成员用户已被解除禁言
    const unmuteNotification = {
      type: 'channel_user_unmuted',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser?.displayName || '未知用户',
      adminId: userId,
      adminName: requester.user?.displayName || '管理员'
    };
    
    // 向频道内其他成员发送通知
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(unmuteNotification));
          console.log(`已通知用户 ${member.userId} 关于用户 ${targetUserId} 被解除禁言`);
        } catch (err) {
          console.error(`通知用户 ${member.userId} 失败:`, err);
        }
      }
    });
    
    // 向被解除禁言的用户发送专门通知
    const targetUserSocket = onlineUsers.get(parseInt(targetUserId as string));
    if (targetUserSocket && targetUserSocket.readyState === 1) {
      try {
        const unmutedNotification = {
          type: 'you_were_unmuted',
          channelId,
          channelName: channel?.name || '未知频道',
          adminId: userId,
          adminName: requester.user?.displayName || '管理员'
        };
        targetUserSocket.send(JSON.stringify(unmutedNotification));
        console.log(`已通知用户 ${targetUserId} 已被管理员 ${userId} 解除禁言`);
      } catch (err) {
        console.error(`通知用户 ${targetUserId} 失败:`, err);
      }
    }
    
    return res.send({ message: '已成功解除用户禁言' });
  } catch (error) {
    return res.status(500).send({ message: '解除禁言失败', error });
  }
};

// 设置频道密码
export const setChannelPassword = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, password } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // 验证管理员权限
    const requester = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId }
      }
    });
    
    if (!requester || !requester.isAdmin) {
      return res.status(403).send({ message: '权限不足，您不是频道管理员' });
    }
    
    // 加密密码
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // 更新频道密码
    await prisma.channel.update({
      where: { id: channelId },
      data: { 
        password: hashedPassword,
        isPrivate: !!hashedPassword 
      }
    });
    
    return res.send({ 
      message: password ? '已成功设置频道密码' : '已移除频道密码',
      isPrivate: !!hashedPassword
    });
  } catch (error) {
    return res.status(500).send({ message: '设置密码失败', error });
  }
};

// 设置管理员
export const setAdmin = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // 验证当前用户是否为管理员
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
      return res.status(403).send({ message: '权限不足，您不是频道管理员' });
    }
    
    // 获取目标用户信息
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    if (!targetUser) {
      return res.status(404).send({ message: '目标用户不存在' });
    }
    
    // 更新目标用户为管理员
    await prisma.channelMember.update({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      },
      data: { isAdmin: true }
    });
    
    // 获取频道成员列表
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // 通知频道成员有新管理员
    const adminChangeNotification = {
      type: 'channel_admin_changed',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser.displayName,
      isAdmin: true,
      changedBy: requester.user.displayName
    };
    
    // 向所有在线成员发送通知
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(adminChangeNotification));
          console.log(`已通知用户 ${member.userId} 关于用户 ${targetUserId} 成为管理员`);
        } catch (err) {
          console.error(`通知用户 ${member.userId} 失败:`, err);
        }
      }
    });
    
    return res.send({ message: '已成功设置用户为管理员' });
  } catch (error) {
    return res.status(500).send({ message: '设置管理员失败', error });
  }
};

// 移除管理员权限
export const removeAdmin = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId, targetUserId } = req.body as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // 验证当前用户是否为管理员
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
      return res.status(403).send({ message: '权限不足，您不是频道管理员' });
    }
    
    // 不能移除自己的管理员权限
    if (userId === parseInt(targetUserId as string)) {
      return res.status(400).send({ message: '您不能移除自己的管理员权限' });
    }
    
    // 获取目标用户信息
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(targetUserId as string) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    if (!targetUser) {
      return res.status(404).send({ message: '目标用户不存在' });
    }
    
    // 更新目标用户的管理员状态
    await prisma.channelMember.update({
      where: {
        userId_channelId: { 
          userId: parseInt(targetUserId as string), 
          channelId 
        }
      },
      data: { isAdmin: false }
    });
    
    // 获取频道成员列表
    const channelMembers = await prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true }
    });
    
    // 通知频道成员管理员变更
    const adminChangeNotification = {
      type: 'channel_admin_changed',
      channelId,
      userId: parseInt(targetUserId as string),
      displayName: targetUser.displayName,
      isAdmin: false,
      changedBy: requester.user.displayName
    };
    
    // 向所有在线成员发送通知
    channelMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(adminChangeNotification));
          console.log(`已通知用户 ${member.userId} 关于用户 ${targetUserId} 被移除管理员权限`);
        } catch (err) {
          console.error(`通知用户 ${member.userId} 失败:`, err);
        }
      }
    });
    
    return res.send({ message: '已成功移除管理员权限' });
  } catch (error) {
    return res.status(500).send({ message: '移除管理员权限失败', error });
  }
};

// 获取频道消息
export const getChannelMessages = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId } = req.params as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // 验证用户是否在频道中
    const member = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId: channelId as string }
      }
    });
    
    if (!member) {
      return res.status(403).send({ message: '您不是该频道成员' });
    }
    
    // 获取频道信息
    const channel = await prisma.channel.findUnique({
      where: { id: channelId as string }
    });
    
    // 获取频道成员
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
    
    // 获取最近的消息
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
    console.error('获取频道消息错误:', error);
    return res.status(500).send({ 
      message: '获取频道消息失败', 
      error: error.message 
    });
  }
};

// 退出频道
export const leaveChannel = async (req: FastifyRequest, res: FastifyReply) => {
  const { channelId } = req.params as any;
  const userId = (req.user as any).id;
  const prisma = (req.server as any).prisma;
  
  try {
    // 检查用户是否在频道中
    const member = await prisma.channelMember.findUnique({
      where: {
        userId_channelId: { userId, channelId: channelId as string }
      }
    });
    
    if (!member) {
      return res.status(404).send({ message: '您不在此频道中' });
    }
    
    // 检查是否为唯一管理员
    if (member.isAdmin) {
      const adminCount = await prisma.channelMember.count({
        where: {
          channelId: channelId as string,
          isAdmin: true
        }
      });
      
      if (adminCount === 1) {
        // 找出频道中加入时间最长的非管理员成员
        const oldestMember = await prisma.channelMember.findFirst({
          where: {
            channelId: channelId as string,
            isAdmin: false
          },
          orderBy: { joinedAt: 'asc' }
        });
        
        if (oldestMember) {
          // 将该成员设为新管理员
          await prisma.channelMember.update({
            where: { id: oldestMember.id },
            data: { isAdmin: true }
          });
        }
      }
    }
    
    // 退出频道
    await prisma.channelMember.delete({
      where: {
        userId_channelId: { userId, channelId: channelId as string }
      }
    });
    
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true
      }
    });
    
    // 获取频道中剩余的成员
    const remainingMembers = await prisma.channelMember.findMany({
      where: { channelId: channelId as string },
      select: { userId: true }
    });
    
    // 通知频道中的所有在线成员用户已离开
    const leaveNotification = {
      type: 'channel_user_left',
      channelId,
      userId,
      displayName: user?.displayName || '未知用户'
    };
    
    // 使用onlineUsers向频道内其他成员发送通知
    remainingMembers.forEach((member: { userId: number }) => {
      const memberSocket = onlineUsers.get(member.userId);
      if (memberSocket && memberSocket.readyState === 1) {
        try {
          memberSocket.send(JSON.stringify(leaveNotification));
          console.log(`已通知用户 ${member.userId} 关于用户 ${userId} 离开频道`);
        } catch (err) {
          console.error(`通知用户 ${member.userId} 失败:`, err);
        }
      }
    });
    
    return res.send({ message: '已成功退出频道' });
  } catch (error) {
    return res.status(500).send({ message: '退出频道失败', error });
  }
};

// 其他必要的功能...