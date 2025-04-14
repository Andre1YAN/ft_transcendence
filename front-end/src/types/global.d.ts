// global.d.ts 或你的类型声明文件

export {}

declare global {
  interface Window {
    friends?: Array<{
      id: number
      name: string
      online: boolean
      // 你还可以加 avatarUrl 等字段
    }>
    socket?: WebSocket
  }
}
