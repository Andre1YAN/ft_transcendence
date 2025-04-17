// jobs/channelJobs.ts
import { PrismaClient } from '@prisma/client'
import { scheduleJob } from 'node-schedule'

const prisma = new PrismaClient()

// 每分钟检查一次并清理过期的禁言状态
export function setupChannelJobs() {
  scheduleJob('*/1 * * * *', async () => {
    try {
      // 查找过期的禁言
      const expiredMutes = await prisma.channelMember.findMany({
        where: {
          isMuted: true,
          muteEndTime: {
            lt: new Date()
          }
        }
      })
      
      // 批量更新
      if (expiredMutes.length > 0) {
        console.log(`清理 ${expiredMutes.length} 个过期禁言状态`)
        
        for (const mute of expiredMutes) {
          await prisma.channelMember.update({
            where: {
              userId_channelId: {
                userId: mute.userId,
                channelId: mute.channelId
              }
            },
            data: {
              isMuted: false,
              muteEndTime: null
            }
          })
        }
      }
    } catch (err) {
      console.error('清理过期禁言状态失败:', err)
    }
  })
}