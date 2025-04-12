import './style.css'
import { initRouter } from './router'

if (!location.hash) {
  location.hash = '#/'
}

initRouter()

import { GameCanvas } from './components/GameCanvas'

let canvasInstance: GameCanvas | null = null

// 页面切换时（进入 MainPage）初始化 GameCanvas
window.addEventListener('hashchange', () => {
  requestAnimationFrame(() => {
    const canvas = document.getElementById('gameCanvas')
    const startBtn = document.getElementById('startBtn')

    if (canvas && startBtn && !canvasInstance) {
      canvasInstance = new GameCanvas('gameCanvas')
      startBtn.addEventListener('click', () => {
        canvasInstance?.start()
      })
    }
  })
})
