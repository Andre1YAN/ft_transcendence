declare global {
  interface Window {
    user?: {
      id: number
      [key: string]: any
    }
    friends?: Array<{
      id: number
      name: string
      online: boolean
    }>
    socket?: WebSocket
    globalSocket?: GlobalSocket

    // 👇 加上这一段解决 TS2339
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, options: any) => void
          prompt: () => void
        }
      }
    }
  }
}
