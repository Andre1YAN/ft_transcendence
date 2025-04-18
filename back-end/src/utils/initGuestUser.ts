import { PrismaClient } from '@prisma/client'

export async function initGuestUser(prisma: PrismaClient) {
  // 创建Guest用户
  const guestEmail = 'guest@fake.com'
  const existingGuest = await prisma.user.findUnique({ where: { email: guestEmail } })

  if (!existingGuest) {
    await prisma.user.create({
      data: {
        email: guestEmail,
        displayName: 'Guest User',
        password: '', // guest user 不能登陆
        avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=guest&backgroundColor=b6e3f4'
      }
    })
    console.log('Guest user created')
  } else {
    // 更新Guest用户头像
    await prisma.user.update({
      where: { email: guestEmail },
      data: {
        avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=guest&backgroundColor=b6e3f4'
      }
    })
    console.log('Guest user already exists, avatar updated')
  }
  
  // 创建AI用户
  const aiEmail = 'ai@fake.com'
  const existingAI = await prisma.user.findUnique({ where: { email: aiEmail } })

  if (!existingAI) {
    await prisma.user.create({
      data: {
        email: aiEmail,
        displayName: 'AI Bot',
        password: '', // AI user 不能登陆
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-bot&backgroundColor=ffadad'
      }
    })
    console.log('AI user created')
  } else {
    // 更新AI用户头像
    await prisma.user.update({
      where: { email: aiEmail },
      data: {
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai-bot&backgroundColor=ffadad'
      }
    })
    console.log('AI user already exists, avatar updated')
  }
}
