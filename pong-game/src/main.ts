import './style.css'
import { initRouter } from './router/index'

// 如果没有 hash，则设置为 #/
if (!location.hash) {
  location.hash = '#/'
}

initRouter()

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')

const startBtn = document.getElementById('startBtn') as HTMLButtonElement
const leftScoreDisplay = document.getElementById('leftScore')!
const rightScoreDisplay = document.getElementById('rightScore')!
const winnerDisplay = document.getElementById('winner')!

// 游戏配置
const paddleWidth = 10, paddleHeight = 100, ballSize = 10
const paddleSpeed = 6
const maxScore = 11
let leftScore = 0, rightScore = 0

// 状态变量
let ballX: number, ballY: number
let ballSpeedX: number, ballSpeedY: number
let leftPaddleY: number, rightPaddleY: number
let animationId: number | null = null
let isGameRunning = false

// 控制变量
let leftPaddleUp = false, leftPaddleDown = false
let rightPaddleUp = false, rightPaddleDown = false

function resetGame() {
  // 分数归零
  leftScore = 0
  rightScore = 0
  updateScore()

  // 初始化球和挡板
  winnerDisplay.textContent = ''
  isGameRunning = true
  ballX = canvas.width / 2
  ballY = canvas.height / 2
  ballSpeedX = 5
  ballSpeedY = 5
  leftPaddleY = canvas.height / 2 - paddleHeight / 2
  rightPaddleY = canvas.height / 2 - paddleHeight / 2

  // 启动游戏
  if (animationId) cancelAnimationFrame(animationId)
  gameLoop()
}

function updateScore() {
  leftScoreDisplay.textContent = String(leftScore)
  rightScoreDisplay.textContent = String(rightScore)
}

function showWinner(winner: string) {
	isGameRunning = false
	if (animationId) cancelAnimationFrame(animationId)
	winnerDisplay.textContent = `${winner} Wins!`
}  

document.addEventListener('keydown', (e) => {
  if (e.key === 'w') leftPaddleUp = true
  if (e.key === 's') leftPaddleDown = true
  if (e.key === 'ArrowUp') rightPaddleUp = true
  if (e.key === 'ArrowDown') rightPaddleDown = true
})

document.addEventListener('keyup', (e) => {
  if (e.key === 'w') leftPaddleUp = false
  if (e.key === 's') leftPaddleDown = false
  if (e.key === 'ArrowUp') rightPaddleUp = false
  if (e.key === 'ArrowDown') rightPaddleDown = false
})

function draw() {
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 球
  ctx.fillStyle = '#fff'
  ctx.fillRect(ballX, ballY, ballSize, ballSize)

  // 左挡板
  ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight)

  // 右挡板
  ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight)
}

function update() {
  // 球位置
  ballX += ballSpeedX
  ballY += ballSpeedY

  // 上下反弹
  if (ballY <= 0 || ballY + ballSize >= canvas.height) ballSpeedY = -ballSpeedY

  // 左挡板碰撞
  if (
    ballX <= paddleWidth &&
    ballY + ballSize >= leftPaddleY &&
    ballY <= leftPaddleY + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX
  }

  // 右挡板碰撞
  if (
    ballX + ballSize >= canvas.width - paddleWidth &&
    ballY + ballSize >= rightPaddleY &&
    ballY <= rightPaddleY + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX
  }

  // 球出界
  if (ballX < 0) {
    rightScore++
    updateScore()
    if (rightScore >= maxScore) {
      showWinner('Right Player')
      return
    }  
    ballX = canvas.width / 2
    ballY = canvas.height / 2
    ballSpeedX = -5
    ballSpeedY = 5
  }
  if (ballX > canvas.width) {
    leftScore++
    updateScore()
    if (leftScore >= maxScore) {
      showWinner('Left Player')
      return
    }
    ballX = canvas.width / 2
    ballY = canvas.height / 2
    ballSpeedX = 5
    ballSpeedY = 5
  }

  // 挡板移动
  if (leftPaddleUp && leftPaddleY > 0) leftPaddleY -= paddleSpeed
  if (leftPaddleDown && leftPaddleY + paddleHeight < canvas.height) leftPaddleY += paddleSpeed
  if (rightPaddleUp && rightPaddleY > 0) rightPaddleY -= paddleSpeed
  if (rightPaddleDown && rightPaddleY + paddleHeight < canvas.height) rightPaddleY += paddleSpeed
}

function gameLoop() 
{
	if (!isGameRunning) return  // ✅ 游戏结束时停止 gameLoop
  
	draw()
	update()
	animationId = requestAnimationFrame(gameLoop)
}  

// 按钮绑定
startBtn.addEventListener('click', resetGame)

// tab 切换高亮逻辑
const tabs = document.querySelectorAll<HTMLButtonElement>('.tab-btn')

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active-tab'))
    tab.classList.add('active-tab')
  })
})

