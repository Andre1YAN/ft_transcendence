import { GameCanvas, GameMode } from '../components/GameCanvas'
import { renderNavbar } from '../components/Navbar'
import { currentMode, setMode } from '../State/gameState'
import { initStars } from '../components/initStars'

export function render() {
  console.log('[MainPage] render called')

  const tournamentScores: Record<string, number> = {}
  let playerLeft = 'Player A'
  let playerRight = 'Player B'

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] px-6 pt-6 font-sans">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>
      
      ${renderNavbar()}
  
      <!-- 模式标题 -->
      <div id="modeTitle" class="text-center text-xl md:text-2xl text-blue-200 font-press tracking-widest mb-4">
        🎮 Mode: ${formatMode(currentMode)}
      </div>

      <!-- 比分显示 -->
      <div class="text-center text-2xl font-bold text-blue-200 font-press tracking-widest mb-4">
        <span id="leftScore">0</span> : <span id="rightScore">0</span>
        <div id="winner" class="mt-2 text-yellow-600 text-sm font-press"></div>
      </div>

      <!-- 游戏区域 -->
      <div class="flex justify-center gap-6">
        <!-- 左侧排行榜 -->
		<div id="tournamentPanel" class="hidden w-64 h-[500px] overflow-y-auto bg-white/5 border border-blue-500/30 backdrop-blur-md rounded-2xl shadow-2xl p-5">
		<h2 class="text-xl font-bold mb-4 text-center text-blue-300 tracking-widest">🏆 Tournament Rank</h2>
		<ul id="rankList" class="space-y-3 text-sm font-mono">
			<!-- JS 插入内容 -->
		</ul>
		</div>


        <!-- Canvas -->
        <canvas id="gameCanvas" width="800" height="500" class="bg-black shadow-2xl rounded-lg"></canvas>
      </div>

      <!-- 开始按钮 -->
      <div class="text-center mt-6">
        <button id="startBtn" class="glow-pulse px-8 py-3 text-sm text-blue-200 font-press tracking-widest border border-blue-400 rounded-full bg-black/30 backdrop-blur-sm transition duration-300">
          ✨ Start Game
        </button>
      </div>
    </div>
  `

  // Handle game mode dropdown
  const dropdownBtn = document.getElementById('modeDropdownBtn')!
  const dropdownMenu = document.getElementById('modeDropdownMenu')!

  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    dropdownMenu.classList.toggle('hidden')
  })

  document.addEventListener('click', (e) => {
    if (!dropdownBtn.contains(e.target as Node) && !dropdownMenu.contains(e.target as Node)) {
      dropdownMenu.classList.add('hidden')
    }
  })

  dropdownMenu.querySelectorAll('[data-mode]').forEach((item) => {
    item.addEventListener('click', (e) => {
      const mode = (e.target as HTMLElement).getAttribute('data-mode') as GameMode
      setMode(mode)

      const isTournament = mode === 'tournament'
      document.getElementById('tournamentPanel')?.classList.toggle('hidden', !isTournament)

      const modeTitle = document.getElementById('modeTitle')!
      modeTitle.textContent = `🎮 Mode: ${formatMode(mode)}`

      dropdownMenu.classList.add('hidden')
      dropdownBtn.innerText = `Mode: ${(e.target as HTMLElement).innerText} ⌄`
    })
  })

  // Game logic
  const startBtn = document.getElementById('startBtn') as HTMLButtonElement
  let game: GameCanvas

  startBtn.addEventListener('click', () => {
    if (!game) {
      game = new GameCanvas('gameCanvas', (winner) => {
        const winnerName = winner === 'left' ? playerLeft : playerRight
        tournamentScores[winnerName] = (tournamentScores[winnerName] || 0) + 1
        updateRankPanel()
      })
    }
    game.start()
  })

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
			${icon}
			${name}
		  </span>
		  <span>${score} pts</span>
		</li>
	  `
	}).join('')
  }
  

  // Avatar menu
  const avatarBtn = document.getElementById('avatarBtn')
  const avatarMenu = document.getElementById('avatarMenu')

  if (avatarBtn && avatarMenu) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      avatarMenu.classList.toggle('hidden')
    })

    document.addEventListener('click', (e) => {
      if (!avatarBtn.contains(e.target as Node) && !avatarMenu.contains(e.target as Node)) {
        avatarMenu.classList.add('hidden')
      }
    })

    avatarMenu.querySelectorAll('[data-tab]').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = (e.target as HTMLElement).getAttribute('data-tab')
        if (tab) location.hash = `#/${tab}`
      })
    })
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      initStars()
    }, 0)
  })
}

function formatMode(mode: GameMode): string {
  return mode === 'local' ? 'Double Local' : 'Tournament'
}
