import { PrismaClient } from '@prisma/client'

export async function initGuestUser(prisma: PrismaClient) {
  const guestEmail = 'guest@fake.com'

  const existing = await prisma.user.findUnique({ where: { email: guestEmail } })

  if (!existing) {
    await prisma.user.create({
      data: {
        email: guestEmail,
        displayName: 'Guest User',
        password: '', // guest user 不能登陆
      }
    })
    console.log('Guest user created')
  } else {
    console.log('Guest user already exists')
  }
}
