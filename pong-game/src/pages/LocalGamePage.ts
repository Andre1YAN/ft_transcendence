import { GameCanvas } from '../components/GameCanvas'
import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'

export function render() {
  let game: GameCanvas | null = null

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] px-6 pt-6 font-sans">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>
      ${renderNavbar()}

      <div class="text-center text-xl md:text-2xl text-blue-200 font-press tracking-widest mb-4">
        🎮 ${t('local.title')}
      </div>

      <div class="text-center text-2xl font-bold text-blue-200 font-press tracking-widest mb-4">
        <span id="leftScore">0</span> : <span id="rightScore">0</span>
        <div id="winner" class="mt-2 text-yellow-600 text-sm font-press"></div>
      </div>

      <div class="flex justify-center">
        <canvas
          id="gameCanvas"
          class="w-full max-w-[800px] aspect-[16/10] bg-black shadow-2xl rounded-lg"
        ></canvas>
      </div>

      <div class="text-center mt-6">
        <button id="startBtn" class="glow-pulse px-8 py-3 text-sm text-blue-200 font-press tracking-widest border border-blue-400 rounded-full bg-black/30 backdrop-blur-sm transition">
          ✨ ${t('main.start')}
        </button>
      </div>
    </div>
  `

  bindNavbarEvents()

  const startBtn = document.getElementById('startBtn') as HTMLButtonElement
  const winnerEl = document.getElementById('winner')!

  const isMobile = window.innerWidth < 768
  const scale = isMobile ? 1.15 : 1

  game = new GameCanvas('gameCanvas', (winner) => {
    winnerEl.textContent = winner === 'left' ? t('local.leftWin') : t('local.rightWin')
  }, scale)

  startBtn.addEventListener('click', () => {
    winnerEl.textContent = ''
    game!.start(true)
  })

  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}
