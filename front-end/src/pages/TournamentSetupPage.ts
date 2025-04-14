// src/pages/TournamentSetupPage.ts
import { t } from '../State/i18n'
import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'

let playerList = ['Player A', 'Player B']

export function render() {
  document.body.innerHTML = `
    <div class="relative min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press px-4 py-8">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      ${renderNavbar()}

      <div class="max-w-xl mx-auto w-full bg-white/5 p-6 sm:p-8 rounded-2xl shadow-lg border border-white/10 backdrop-blur-md">
        <h1 class="text-2xl sm:text-3xl font-bold text-center mb-6">${t('tournament.setupTitle')}</h1>

        <div id="playerList" class="space-y-4 mb-6">
          ${renderPlayerInputs()}
        </div>

        <div class="flex flex-col sm:flex-row justify-between gap-3 sm:gap-6 items-center">
          <button id="addPlayer"
            class="w-full sm:w-auto px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white text-sm sm:text-base">
            + ${t('tournament.addPlayer')}
          </button>
          <button id="startTournament"
            class="w-full sm:w-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm sm:text-base">
            ${t('tournament.start')}
          </button>
        </div>
      </div>
    </div>
  `

  bindNavbarEvents()
  bindEvents()
  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}

function renderPlayerInputs() {
  return playerList.map((name, index) => `
    <div class="flex items-center gap-2">
      <input 
        type="text" 
        value="${name}" 
        class="player-name-input w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-white placeholder:text-gray-400 text-sm sm:text-base" 
        placeholder="${t('tournament.player')} ${index + 1}" 
        ${index === playerList.length - 1 ? 'autofocus' : ''}
      />
      ${playerList.length > 2
        ? `<button class="remove-btn text-red-400 hover:text-red-600 text-xl" data-index="${index}">✖</button>`
        : ''}
    </div>
  `).join('')
}

function bindEvents() {
	document.getElementById('addPlayer')?.addEventListener('click', () => {
	  playerList.push(`${t('tournament.player')} ${playerList.length + 1}`)
	  rerenderInputs()
	})
  
	document.getElementById('startTournament')?.addEventListener('click', async () => {
	  const inputs = document.querySelectorAll<HTMLInputElement>('.player-name-input')
	  const names = Array.from(inputs)
		.map(input => input.value.trim())
		.filter(name => name.length > 0)
  
	  const hasDuplicate = names.length !== new Set(names).size
  
	  if (names.length < 2) {
		alert(t('tournament.needTwoPlayers'))
		return
	  }
  
	  if (hasDuplicate) {
		alert(t('tournament.duplicateWarning') || 'Players must have unique names.')
		return
	  }
  
	  try {
		const res = await fetch('http://localhost:3000/tournament/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ aliases: names })
		  })
  
		if (!res.ok) {
		  throw new Error('Server error')
		}
  
		const data = await res.json()
  
		// ⏺️ 保存 tournamentId 和 alias 信息
		sessionStorage.setItem('tournamentId', data.id)
		sessionStorage.setItem('tournamentPlayers', JSON.stringify(names))
  
		// ✅ 页面跳转
		location.hash = '#/tournament'
	  } catch (err) {
		console.error('创建比赛失败:', err)
		alert(t('tournament.createFailed') || '创建比赛失败，请重试')
	  }
	})
  }
  

  function rerenderInputs() {
	// 🔁 更新 playerList 中的值
	const inputs = document.querySelectorAll<HTMLInputElement>('.player-name-input')
	inputs.forEach((input, index) => {
	  playerList[index] = input.value.trim()
	})
  
	const container = document.getElementById('playerList')!
	container.innerHTML = renderPlayerInputs()
  
	document.querySelectorAll('.remove-btn').forEach(btn => {
	  btn.addEventListener('click', () => {
		const index = Number((btn as HTMLElement).getAttribute('data-index'))
		playerList.splice(index, 1)
		rerenderInputs()
	  })
	})
  }
  
