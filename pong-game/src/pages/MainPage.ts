import { GameCanvas, GameMode } from '../components/GameCanvas'

export function render() {
	document.body.innerHTML = `
	<div class="min-h-screen bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 px-6 pt-6 font-sans">
	  <!-- 顶部导航 -->
	  <div class="flex justify-between items-center mb-10">
		<div class="text-2xl font-bold tracking-wider font-mono text-black">42 PONG</div>
  
		<div class="flex space-x-4 text-black font-medium text-sm">
		  <!-- Game Mode Dropdown -->
		  <div class="relative">
			<button id="modeDropdownBtn" class="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-100 transition">
			  Game Mode ⌄
			</button>
			<div id="modeDropdownMenu" class="hidden absolute mt-2 w-40 bg-white rounded-md shadow-xl z-50">
			  <button class="w-full text-left px-4 py-2 hover:bg-gray-100" data-mode="local">Double Local</button>
			  <button class="w-full text-left px-4 py-2 hover:bg-gray-100" data-mode="remote">Double Remote</button>
			  <button class="w-full text-left px-4 py-2 hover:bg-gray-100" data-mode="tournament">Tournament</button>
			</div>
		  </div>
		  <button data-tab="rank" class="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-100 transition">Rank</button>
		  <button data-tab="history" class="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-100 transition">History</button>
		</div>
	  </div>
  
	  <!-- 模式标题 -->
	<div id="modeTitle" class="text-lg text-gray-600 font-semibold mb-2 text-center">🎮 Mode: Double Local</div>

	  <!-- Score -->
	  <div class="text-center text-2xl font-bold text-black font-press tracking-widest mb-4">
		<span id="leftScore">0</span> : <span id="rightScore">0</span>
		<div id="winner" class="mt-2 text-yellow-600 text-lg font-semibold"></div>
	  </div>
  
	  <!-- Canvas -->
	  <div class="flex justify-center">
		<canvas id="gameCanvas" width="800" height="500" class="bg-black shadow-2xl rounded-lg"></canvas>
	  </div>
  
	  <!-- 控制按钮 -->
	  <div class="text-center mt-6">
		<button id="startBtn" class="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md hover:opacity-90 transition">
		  Start Game
		</button>
	  </div>
	</div>
  `
  
  
	// ✅ 绑定逻辑（建议后续模块化提取）
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
		  console.log('Chosen Mode：', mode)
	  
		  currentMode = mode
	  
		  // ✅ 更新标题文本
		  const modeTitle = document.getElementById('modeTitle')!
		  if (mode === 'local') modeTitle.textContent = '🎮 Mode: Double Local'
		  if (mode === 'remote') modeTitle.textContent = '🌐 Mode: Remote Match'
		  if (mode === 'tournament') modeTitle.textContent = '🏆 Mode: Tournament'
	  
		  dropdownMenu.classList.add('hidden')
		  dropdownBtn.innerText = `Mode: ${(e.target as HTMLElement).innerText} ⌄`
		})
	  })
	  

	let game: GameCanvas
	let currentMode: GameMode = 'local' // 默认本地双人
	const startBtn = document.getElementById('startBtn') as HTMLButtonElement

	startBtn.addEventListener('click', () => {
		if (!game) {
		  game = new GameCanvas('gameCanvas') // ✅ 改这里
		}
		game.start()
	  })
	
	  document.querySelector('[data-tab="rank"]')?.addEventListener('click', () => {
		location.hash = '#/rank'
	  })
	  document.querySelector('[data-tab="history"]')?.addEventListener('click', () => {
		location.hash = '#/history'
	  })
	  
  }
  