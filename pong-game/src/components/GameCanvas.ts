// src/components/GameCanvas.ts
import { t } from '../State/i18n'

export type GameMode = 'local' | 'tournament'

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
  private server: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right'

  private keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
  }

  constructor(
    canvasId: string,
    private onGameEnd?: (winner: 'left' | 'right') => void
  ) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) throw new Error(`Canvas element with id "${canvasId}" not found`)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not found')
    this.canvas = canvas
    this.ctx = ctx

    this.handleKeyboard()
  }

  public start(resetScore: boolean = false) {
	if (resetScore) {
	  this.leftScore = 0
	  this.rightScore = 0
	}
  
	this.leftY = this.canvas.height / 2 - this.paddleHeight / 2
	this.rightY = this.canvas.height / 2 - this.paddleHeight / 2
	this.server = Math.random() < 0.5 ? 'left' : 'right'
	this.resetBall()
	this.clearWinner()
	this.updateScoreDOM()
	this.isRunning = true
  
	if (this.animationId) cancelAnimationFrame(this.animationId)
	this.gameLoop()
  }
  

  public resetScore() {
	this.leftScore = 0
	this.rightScore = 0
	this.updateScoreDOM()
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
    const speed = 5
    const angle = (Math.random() * 0.6 - 0.3)
    const direction = this.server === 'left' ? 1 : -1
    this.ballSpeedX = Math.cos(angle) * speed * direction
    this.ballSpeedY = Math.sin(angle) * speed
  }

  private update() {
    this.ballX += this.ballSpeedX
    this.ballY += this.ballSpeedY

    if (this.ballY <= 0 || this.ballY + this.ballSize >= this.canvas.height) {
      this.ballSpeedY = -this.ballSpeedY
    }

    if (
      this.ballX <= this.paddleWidth &&
      this.ballY + this.ballSize >= this.leftY &&
      this.ballY <= this.leftY + this.paddleHeight
    ) {
      this.ballSpeedX = -this.ballSpeedX
    }

    if (
      this.ballX + this.ballSize >= this.canvas.width - this.paddleWidth &&
      this.ballY + this.ballSize >= this.rightY &&
      this.ballY <= this.rightY + this.paddleHeight
    ) {
      this.ballSpeedX = -this.ballSpeedX
    }

	if (this.ballX < 0) {
		this.rightScore++
		this.updateScoreDOM()
		if (this.rightScore >= this.maxScore) {
		  this.isRunning = false
		  this.showWinner('Right')
		  this.onGameEnd?.('right')
		  return // ✅ 加上这个！
		}
		this.updateServer()
		this.resetBall()
	  }
	  
	  if (this.ballX > this.canvas.width) {
		this.leftScore++
		this.updateScoreDOM()
		if (this.leftScore >= this.maxScore) {
		  this.isRunning = false
		  this.showWinner('Left')
		  this.onGameEnd?.('left')
		  return // ✅ 加上这个！
		}
		this.updateServer()
		this.resetBall()
	  }	  

    if (this.keys.w && this.leftY > 0) this.leftY -= this.paddleSpeed
    if (this.keys.s && this.leftY + this.paddleHeight < this.canvas.height) this.leftY += this.paddleSpeed
    if (this.keys.ArrowUp && this.rightY > 0) this.rightY -= this.paddleSpeed
    if (this.keys.ArrowDown && this.rightY + this.paddleHeight < this.canvas.height) this.rightY += this.paddleSpeed
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(this.ballX, this.ballY, this.ballSize, this.ballSize)
    this.ctx.fillRect(0, this.leftY, this.paddleWidth, this.paddleHeight)
    this.ctx.fillRect(this.canvas.width - this.paddleWidth, this.rightY, this.paddleWidth, this.paddleHeight)
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

  private updateServer() {
    const totalPoints = this.leftScore + this.rightScore
    if (this.leftScore >= 10 && this.rightScore >= 10) {
      this.server = this.server === 'left' ? 'right' : 'left'
    } else if (totalPoints % 2 === 0) {
      this.server = this.server === 'left' ? 'right' : 'left'
    }
  }

  private showWinner(winner: string) {
    const text = document.getElementById('winner')
    if (text) 
		text.textContent = winner === 'left' ? t('local.leftWin') : t('local.rightWin')
  }

  private clearWinner() {
    const text = document.getElementById('winner')
    if (text) text.textContent = ''
  }
}