export type GameMode = 'local' | 'remote' | 'tournament'

export class GameCanvas {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private leftScore = 0
  private rightScore = 0
  private leftY = 0
  private rightY = 0
  private ballX = 0
  private ballY = 0
  private ballSpeedX = 5
  private ballSpeedY = 5
  private animationId: number | null = null
  private isRunning = false

  private paddleWidth = 10
  private paddleHeight = 100
  private ballSize = 10
  private paddleSpeed = 6
  private maxScore = 11

  private keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
  }

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) throw new Error(`Canvas element with id "${canvasId}" not found`)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not found')
    this.canvas = canvas
    this.ctx = ctx

    this.handleKeyboard()
  }

  public start() {
    this.leftScore = 0
    this.rightScore = 0
    this.leftY = this.canvas.height / 2 - this.paddleHeight / 2
    this.rightY = this.canvas.height / 2 - this.paddleHeight / 2
    this.resetBall()
    this.clearWinner()
    this.updateScoreDOM()
    this.isRunning = true

    if (this.animationId) cancelAnimationFrame(this.animationId)
    this.gameLoop()
  }

  public stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    this.isRunning = false
  }

  private handleKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key in this.keys) this.keys[e.key as keyof typeof this.keys] = true
    })

    document.addEventListener('keyup', (e) => {
      if (e.key in this.keys) this.keys[e.key as keyof typeof this.keys] = false
    })
  }

  private resetBall() {
    this.ballX = this.canvas.width / 2
    this.ballY = this.canvas.height / 2
    this.ballSpeedX = 5
    this.ballSpeedY = 5
  }

  private update() {
    this.ballX += this.ballSpeedX
    this.ballY += this.ballSpeedY

    // 顶部/底部反弹
    if (this.ballY <= 0 || this.ballY + this.ballSize >= this.canvas.height) {
      this.ballSpeedY = -this.ballSpeedY
    }

    // 左挡板碰撞
    if (
      this.ballX <= this.paddleWidth &&
      this.ballY + this.ballSize >= this.leftY &&
      this.ballY <= this.leftY + this.paddleHeight
    ) {
      this.ballSpeedX = -this.ballSpeedX
    }

    // 右挡板碰撞
    if (
      this.ballX + this.ballSize >= this.canvas.width - this.paddleWidth &&
      this.ballY + this.ballSize >= this.rightY &&
      this.ballY <= this.rightY + this.paddleHeight
    ) {
      this.ballSpeedX = -this.ballSpeedX
    }

    // 左边出界
    if (this.ballX < 0) {
      this.rightScore++
      this.updateScoreDOM()
      this.resetBall()
    }

    // 右边出界
    if (this.ballX > this.canvas.width) {
      this.leftScore++
      this.updateScoreDOM()
      this.resetBall()
    }

    // 达到胜利条件
    if (this.leftScore >= this.maxScore || this.rightScore >= this.maxScore) {
      this.isRunning = false
      const winner = this.leftScore >= this.maxScore ? 'Left' : 'Right'
      this.showWinner(winner)
      return
    }

    // 挡板移动
    if (this.keys.w && this.leftY > 0) this.leftY -= this.paddleSpeed
    if (this.keys.s && this.leftY + this.paddleHeight < this.canvas.height) this.leftY += this.paddleSpeed
    if (this.keys.ArrowUp && this.rightY > 0) this.rightY -= this.paddleSpeed
    if (this.keys.ArrowDown && this.rightY + this.paddleHeight < this.canvas.height) this.rightY += this.paddleSpeed
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // 球
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(this.ballX, this.ballY, this.ballSize, this.ballSize)

    // 左挡板
    this.ctx.fillRect(0, this.leftY, this.paddleWidth, this.paddleHeight)

    // 右挡板
    this.ctx.fillRect(
      this.canvas.width - this.paddleWidth,
      this.rightY,
      this.paddleWidth,
      this.paddleHeight
    )
  }

  private gameLoop = () => {
    if (!this.isRunning) return

    this.update()
    this.draw()

    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  private updateScoreDOM() {
    const left = document.getElementById('leftScore')
    const right = document.getElementById('rightScore')
    if (left) left.textContent = String(this.leftScore)
    if (right) right.textContent = String(this.rightScore)
  }

  private showWinner(winner: string) {
    const text = document.getElementById('winner')
    if (text) text.textContent = `${winner} Player Wins!`
  }

  private clearWinner() {
    const text = document.getElementById('winner')
    if (text) text.textContent = ''
  }
}
