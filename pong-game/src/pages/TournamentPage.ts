// TournamentPage.ts
import { GameCanvas } from '../components/GameCanvas'
import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'

let tournamentGame: GameCanvas | null = null
let tournamentScores: Record<string, number> = {}

export function render() {
  console.log('[TournamentPage] render called')

  const players = JSON.parse(sessionStorage.getItem('tournamentPlayers') || '["Player A", "Player B"]')

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] px-4 pt-6 font-sans">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      ${renderNavbar()}

      <main class="max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-white space-y-6 pb-10">

        <h1 class="text-xl sm:text-2xl md:text-3xl text-blue-200 font-press tracking-widest text-center">
          🏆 ${t('main.tournamentMode')}
        </h1>

        <div class="text-2xl sm:text-3xl font-bold text-blue-200 font-press tracking-widest text-center">
          <span id="leftScore">0</span> : <span id="rightScore">0</span>
          <div id="winner" class="mt-2 text-yellow-500 text-sm sm:text-base font-press"></div>
        </div>

        <div class="flex flex-col lg:flex-row gap-6 w-full items-center justify-center px-2">

          <div id="tournamentPanel"
            class="w-full max-w-sm h-[500px] overflow-y-auto bg-white/5 border border-blue-500/30 backdrop-blur-md rounded-2xl shadow-2xl p-5">
            <h2 class="text-xl font-bold mb-4 text-center text-blue-300 tracking-widest">
              ${t('main.tournamentRank')}
            </h2>
            <ul id="rankList" class="space-y-3 text-sm font-mono"></ul>
          </div>

          <div class="w-full flex justify-center">
            <canvas id="gameCanvas"
              class="w-full max-w-[800px] aspect-[16/10] bg-black shadow-2xl rounded-lg"></canvas>
          </div>

        </div>

        <div class="text-center">
          <button id="startBtn"
            class="glow-pulse px-8 py-3 text-sm sm:text-base text-blue-200 font-press tracking-widest border border-blue-400 rounded-full bg-black/30 backdrop-blur-sm hover:opacity-90 transition">
            ✨ ${t('main.start')}
          </button>
        </div>

      </main>
    </div>
  `

  bindNavbarEvents()

  const startBtn = document.getElementById('startBtn') as HTMLButtonElement
  const winnerEl = document.getElementById('winner')!

  // ✅ 根据设备宽度调整缩放
  const isMobile = window.innerWidth < 768
  const scale = isMobile ? 1.15 : 1

  // ✅ 初始化游戏时同步尺寸
  tournamentGame = new GameCanvas('gameCanvas', (winnerSide) => {
    const winner = winnerSide === 'left' ? players[0] : players[1]
    tournamentScores[winner] = (tournamentScores[winner] || 0) + 1
    updateRankPanel()
  }, scale)

  startBtn.addEventListener('click', () => {
    document.getElementById('leftScore')!.textContent = '0'
    document.getElementById('rightScore')!.textContent = '0'
    winnerEl.textContent = ''
    tournamentGame!.start(true)
  })

  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}

function updateRankPanel() {
  const rankList = document.getElementById('rankList')!
  const entries = Object.entries(tournamentScores).sort((a, b) => b[1] - a[1])

  rankList.innerHTML = entries.map(([name, score], index) => {
    const colors = ['text-yellow-400', 'text-gray-300', 'text-orange-300']
    const icons = ['🥇', '🥈', '🥉']
    const icon = icons[index] || '🎮'
    const color = colors[index] || 'text-white/80'

    return `
      <li class="flex justify-between items-center ${color}">
        <span class="flex items-center gap-1">
          ${icon} ${name}
        </span>
        <span>${score} ${t('main.points')}</span>
      </li>
    `
  }).join('')
}
