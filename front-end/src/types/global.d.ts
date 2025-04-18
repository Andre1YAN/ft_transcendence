// global.d.ts 或你的类型声明文件

import { GlobalSocket } from '../ws/globalSocket'

export {}

declare global {
  interface Window {
    // Google Sign-In 对象（关键补充）
    google?: any // 你可以根据 Google API 提供更具体类型

    user?: {
      id: number
      [key: string]: any
    } | null
    friends?: Array<{
      id: number
      name: string
      online: boolean
      // 你还可以加 avatarUrl 等字段
    }>
    socket?: WebSocket
    globalSocket?: GlobalSocket | null
  }
}
