// src/pages/TournamentPage.ts
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
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] px-6 pt-6 font-sans">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      ${renderNavbar()}

      <div class="text-center text-xl md:text-2xl text-blue-200 font-press tracking-widest mb-4">
        🏆 ${t('main.tournamentMode')}
      </div>

      <div class="text-center text-2xl font-bold text-blue-200 font-press tracking-widest mb-4">
        <span id="leftScore">0</span> : <span id="rightScore">0</span>
        <div id="winner" class="mt-2 text-yellow-600 text-sm font-press"></div>
      </div>

      <div class="flex justify-center gap-6">
        <div id="tournamentPanel" class="w-64 h-[500px] overflow-y-auto bg-white/5 border border-blue-500/30 backdrop-blur-md rounded-2xl shadow-2xl p-5">
          <h2 class="text-xl font-bold mb-4 text-center text-blue-300 tracking-widest">${t('main.tournamentRank')}</h2>
          <ul id="rankList" class="space-y-3 text-sm font-mono"></ul>
        </div>

        <canvas id="gameCanvas" width="800" height="500" class="bg-black shadow-2xl rounded-lg"></canvas>
      </div>

      <div class="text-center mt-6">
        <button id="startBtn" class="glow-pulse px-8 py-3 text-sm text-blue-200 font-press tracking-widest border border-blue-400 rounded-full bg-black/30 backdrop-blur-sm transition duration-300">
          ✨ ${t('main.start')}
        </button>
      </div>
    </div>
  `

  bindNavbarEvents()

  tournamentGame = new GameCanvas('gameCanvas', (winnerSide) => {
    const winner = winnerSide === 'left' ? players[0] : players[1]
    tournamentScores[winner] = (tournamentScores[winner] || 0) + 1
    updateRankPanel()
  })

  const startBtn = document.getElementById('startBtn') as HTMLButtonElement
  startBtn.addEventListener('click', () => {
    document.getElementById('leftScore')!.textContent = '0'
    document.getElementById('rightScore')!.textContent = '0'
    document.getElementById('winner')!.textContent = ''
    tournamentGame!.start(true) // ✅ 只有点击才清空比分
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
