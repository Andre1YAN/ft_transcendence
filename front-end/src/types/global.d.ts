// global.d.ts 或你的类型声明文件

import { GlobalSocket } from '../ws/globalSocket'

export {}

declare global {
  interface Window {
    user?: {
      id: number
      [key: string]: any // 可选：容纳更多属性
    }
    friends?: Array<{
      id: number
      name: string
      online: boolean
      // 你还可以加 avatarUrl 等字段
    }>
    socket?: WebSocket
    globalSocket?: GlobalSocket
  }
}
