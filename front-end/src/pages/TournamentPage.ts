import { GameCanvas } from '../components/GameCanvas'
import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'

let tournamentGame: GameCanvas | null = null
let matchQueue: [string, string][] = []
let currentMatchIndex = 0
let players: string[] = []

export function render() {
  if (tournamentGame) {
    tournamentGame.stop()
    tournamentGame = null
  }

  players = JSON.parse(sessionStorage.getItem('tournamentPlayers') || '["Player A", "Player B"]')
  const tournamentId = sessionStorage.getItem('tournamentId')
  matchQueue = []
  currentMatchIndex = 0

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] px-4 pt-6 font-sans">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      ${renderNavbar()}

      <main class="max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-white space-y-6 pb-10">

        <h1 class="text-xl sm:text-2xl md:text-3xl text-blue-200 font-press tracking-widest text-center">
          🏆 ${t('main.tournamentMode')}
        </h1>

        <div class="text-2xl sm:text-3xl font-bold text-blue-200 font-press tracking-widest text-center">
          <span id="leftPlayerName">?</span>
          <span id="leftScore">0</span> : <span id="rightScore">0</span>
          <span id="rightPlayerName">?</span>
          <div id="winner" class="mt-2 text-yellow-500 text-sm sm:text-base font-press"></div>
        </div>

        <div class="flex flex-col lg:flex-row gap-6 w-full items-center justify-center px-2">
          <div id="playerListPanel"
            class="w-full max-w-[220px] sm:max-w-[240px] md:max-w-[260px] h-[500px] overflow-y-auto bg-white/5 border border-blue-500/30 backdrop-blur-md rounded-2xl shadow-2xl p-5">
            <h2 class="text-xl font-bold mb-4 text-center text-blue-300 tracking-widest">
              ${t('main.tournamentPlayers')}
            </h2>
            <ul id="playerList" class="space-y-2 text-sm font-mono">
              ${players.map(name => `<li class="text-white/80">👤 ${name}</li>`).join('')}
            </ul>
          </div>

          <div class="w-full flex justify-center">
            <canvas id="gameCanvas"
              class="w-full max-w-[800px] aspect-[16/10] bg-black shadow-2xl rounded-lg"></canvas>
          </div>

          <div id="tournamentPanel"
            class="w-full max-w-[220px] sm:max-w-[240px] md:max-w-[260px] h-[500px] overflow-y-auto bg-white/5 border border-blue-500/30 backdrop-blur-md rounded-2xl shadow-2xl p-5">
            <h2 class="text-xl font-bold mb-4 text-center text-blue-300 tracking-widest">
              ${t('main.tournamentRank')}
            </h2>
            <ul id="rankList" class="space-y-3 text-sm font-mono"></ul>
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
  const scale = window.innerWidth < 768 ? 1.15 : 1

  async function initTournament(tournamentId: string) {
	try {
	  const res = await fetch(`https://localhost:3000/tournaments/${tournamentId}/matches`)
	  const playedMatches: { player1Alias: string, player2Alias: string }[] = await res.json()
  
	  const hasBeenPlayed = (a: string, b: string) =>
		playedMatches.some(
		  m =>
			(m.player1Alias === a && m.player2Alias === b) ||
			(m.player1Alias === b && m.player2Alias === a)
		)
  
	  matchQueue = generateMatchQueue(players).filter(([a, b]) => !hasBeenPlayed(a, b))
	  currentMatchIndex = 0
  
	  if (matchQueue.length === 0) {
		document.getElementById('winner')!.textContent = t('main.tournamentEnd') || '🏁 Tournament Finished!'
		return
	  }
  
	  const [leftAlias, rightAlias] = matchQueue[currentMatchIndex]
  
	  tournamentGame = new GameCanvas(
		'gameCanvas',
		async ({ winnerAlias, leftAlias, rightAlias, leftScore, rightScore }) => {
		  document.getElementById('winner')!.textContent = `${winnerAlias} ${t('main.wins')}`
  
		  try {
			await fetch(`https://localhost:3000/tournaments/${tournamentId}/matches`, {
			  method: 'POST',
			  headers: { 'Content-Type': 'application/json' },
			  body: JSON.stringify({
				player1Alias: leftAlias,
				player2Alias: rightAlias,
				winnerAlias,
				score1: leftScore,
				score2: rightScore
			  })
			})
  
			await fetchAndUpdateRank(tournamentId)
		  } catch (err) {
			console.error('Failed to record match:', err)
		  }
  
		  currentMatchIndex++
		  if (currentMatchIndex < matchQueue.length) {
			updateMatchDisplay()
		  } else {
			document.getElementById('winner')!.textContent = t('main.tournamentEnd') || '🏁 Tournament Finished!'
		  }
		},
		scale,
		{ leftAlias, rightAlias }
	  )
  
	  updateMatchDisplay()
	} catch (err) {
	  console.error('Failed to fetch match history:', err)
	}
  }  

  startBtn.addEventListener('click', () => {
    const winnerEl = document.getElementById('winner')!
    winnerEl.textContent = ''
    tournamentGame!.resetScore()
    tournamentGame!.start()
  })

  if (tournamentId) {
    fetchAndUpdateRank(tournamentId)
    initTournament(tournamentId)
  }

  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}

function generateMatchQueue(players: string[]): [string, string][] {
  const queue: [string, string][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      queue.push([players[i], players[j]])
    }
  }
  return queue
}

function updateMatchDisplay() {
	const [leftAlias, rightAlias] = matchQueue[currentMatchIndex] || ['?', '?']
	document.getElementById('leftPlayerName')!.textContent = leftAlias
	document.getElementById('rightPlayerName')!.textContent = rightAlias
  
	tournamentGame?.resetScore()
	if (tournamentGame) {
	  tournamentGame['players'] = { leftAlias, rightAlias } // 强制更新内部别名
	}
  }
  

async function fetchAndUpdateRank(tournamentId: string) {
  try {
    const res = await fetch(`https://localhost:3000/tournaments/${tournamentId}/players`)
    if (!res.ok) throw new Error('Fetch failed')

    const players: { alias: string, score: number }[] = await res.json()
    const rankList = document.getElementById('rankList')!
    rankList.innerHTML = players.map((p, index) => {
      const colors = ['text-yellow-400', 'text-gray-300', 'text-orange-300']
      const icons = ['🥇', '🥈', '🥉']
      const icon = icons[index] || '🎮'
      const color = colors[index] || 'text-white/80'
      return `
        <li class="flex justify-between items-center ${color}">
          <span class="flex items-center gap-1">
            ${icon} ${p.alias}
          </span>
          <span>${p.score} ${t('main.points')}</span>
        </li>
      `
    }).join('')
  } catch (err) {
    console.error('Failed to update ranking:', err)
  }
}
