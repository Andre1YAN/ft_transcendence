import { GameCanvas } from '../components/GameCanvas'
import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'

export function render() {
  let game: GameCanvas | null = null
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const playerAlias = user?.displayName || 'You'
  const guestAlias = 'AI Bot'

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] px-6 pt-6 font-sans">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>
      ${renderNavbar()}

      <div class="text-center text-xl md:text-2xl text-blue-200 font-press tracking-widest mb-4">
        🤖 AI 赛
      </div>

      <div class="flex flex-col items-center text-2xl font-bold text-blue-200 font-press tracking-widest mb-4">
        <div class="flex justify-center items-center gap-4">
          <img src="${user?.avatarUrl || 'https://i.pravatar.cc/40?u=guest'}" class="w-10 h-10 rounded-full" alt="player" />
          <span id="leftScore">0</span>
          <span class="mx-2">:</span>
          <span id="rightScore">0</span>
          <img src="https://i.pravatar.cc/40?u=ai" class="w-10 h-10 rounded-full" alt="ai" />
        </div>
        <div id="winner" class="mt-2 text-yellow-500 text-base font-press"></div>
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

  game = new GameCanvas(
    'gameCanvas',
    async ({ winnerAlias, leftScore, rightScore }) => {
      winnerEl.textContent = `${winnerAlias} ${t('main.wins')}`

      try {
        const res = await fetch('http://localhost:3000/users/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            user1Id: user?.id ?? 1,
            user2Id: 999,
            score1: leftScore,
            score2: rightScore
          })
        })

        if (!res.ok) {
          const error = await res.json()
          console.error('❌ Failed to save match:', error)
        } else {
          console.log('✅ Match saved!')
        }
      } catch (err) {
        console.error('❌ Failed to save match:', err)
      }
    },
    scale,
    {
      leftAlias: playerAlias,
      rightAlias: guestAlias
    },
    true // 👈 启用 AI 模式
  )

  startBtn.addEventListener('click', () => {
    winnerEl.textContent = ''
    game!.resetScore()
    game!.start()
  })

  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}
