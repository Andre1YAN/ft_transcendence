import { GameCanvas } from '../components/GameCanvas'
import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'

export function render() {
  let game: GameCanvas | null = null
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const playerAlias = user?.displayName || 'You'

  // 初始化为默认Guest用户
  let guestAlias = 'Guest'
  let guestUser = { id: 1, displayName: 'Guest', avatarUrl: 'https://i.pravatar.cc/40?u=guest' }

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] px-6 pt-6 font-sans">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>
      ${renderNavbar()}

      <div class="text-center text-xl md:text-2xl text-blue-200 font-press tracking-widest mb-4">
        🎮 ${t('local.title')}
      </div>

	<div class="flex flex-col items-center text-2xl font-bold text-blue-200 font-press tracking-widest mb-4">
	<div class="flex justify-center items-center gap-4">
		<img src="${user?.avatarUrl || 'https://i.pravatar.cc/40?u=guest'}" class="w-10 h-10 rounded-full" alt="player" />
		<span id="leftScore">0</span>
		<span class="mx-2">:</span>
		<span id="rightScore">0</span>
		<img id="guestAvatar" src="https://i.pravatar.cc/40?u=guest" class="w-10 h-10 rounded-full" alt="guest" />
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

    <!-- 对手信息弹窗 -->
    <div id="opponentModal" class="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div class="bg-[#2a2a3d] rounded-xl p-6 w-80 shadow-2xl border border-indigo-500/30">
        <h3 class="text-xl text-white font-bold mb-4 text-center">${t('local.enterOpponent')}</h3>
        <p class="text-gray-300 text-sm mb-4 text-center">${t('local.opponentDescription')}</p>
        
        <input 
          type="text" 
          id="opponentName" 
          class="w-full px-4 py-2 rounded-md bg-[#1b1b2f] border border-indigo-500/50 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="${t('local.opponentPlaceholder')}"
          autofocus
        />
        
        <div id="searchResult" class="mb-4 text-center hidden">
          <!-- 搜索结果将显示在这里 -->
        </div>
        
        <div class="flex justify-between gap-3">
          <button id="searchOpponent" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
            ${t('local.search')}
          </button>
          <button id="continueAsGuest" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">
            ${t('local.useGuest')}
          </button>
        </div>
      </div>
    </div>
  `

  bindNavbarEvents()

  const startBtn = document.getElementById('startBtn') as HTMLButtonElement
  const winnerEl = document.getElementById('winner')!
  const isMobile = window.innerWidth < 768
  const scale = isMobile ? 1.15 : 1
  
  // 初始化对手信息弹窗
  setupOpponentModal()

  // 初始化游戏画布
  function initializeGame() {
    // ✅ 初始化 GameCanvas，传入玩家别名
    game = new GameCanvas(
      'gameCanvas',
      async ({ winnerAlias, leftScore, rightScore }) => {
        winnerEl.textContent = `${winnerAlias} ${t('main.wins')}`

        try {
          const matchData = {
            user1Id: user?.id ?? 1,
            user2Id: guestUser.id,
            score1: leftScore,
            score2: rightScore,
            matchType: "NORMAL"
          };
          console.log('发送的比赛数据:', matchData);
          
          const res = await fetch('http://localhost:3000/users/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}`},
            body: JSON.stringify(matchData)
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
      }  
    )
  }

  startBtn.addEventListener('click', () => {
    winnerEl.textContent = ''
    if (!game) {
      console.error('Game not initialized')
      return
    }
    game.resetScore()
    game.start()
  })

  // 设置对手信息弹窗
  function setupOpponentModal() {
    const modal = document.getElementById('opponentModal')!
    const searchButton = document.getElementById('searchOpponent')!
    const continueAsGuestButton = document.getElementById('continueAsGuest')!
    const opponentNameInput = document.getElementById('opponentName') as HTMLInputElement
    const searchResult = document.getElementById('searchResult')!
    
    // 搜索对手
    searchButton.addEventListener('click', async () => {
      const name = opponentNameInput.value.trim()
      if (!name) {
        searchResult.innerHTML = `<p class="text-red-400">${t('local.nameRequired')}</p>`
        searchResult.classList.remove('hidden')
        return
      }
      
      try {
        searchResult.innerHTML = `<p class="text-blue-400">${t('local.searching')}...</p>`
        searchResult.classList.remove('hidden')
        
        const response = await fetch(`http://localhost:3000/users/search?name=${encodeURIComponent(name)}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
        
        if (!response.ok) {
          throw new Error('Search failed')
        }
        
        const data = await response.json()
        
        if (data && data.id) {
          // 找到用户
          guestUser = data
          guestAlias = data.displayName
          
          // 更新UI
          searchResult.innerHTML = `
            <div class="flex items-center gap-2 justify-center">
              <img src="${data.avatarUrl}" class="w-8 h-8 rounded-full" />
              <span class="text-green-400">${t('local.userFound')}: ${data.displayName}</span>
            </div>
          `
          
          // 3秒后关闭弹窗
          setTimeout(() => {
            modal.classList.add('hidden')
            const guestAvatarImg = document.getElementById('guestAvatar') as HTMLImageElement;
            if (guestAvatarImg) {
              guestAvatarImg.src = data.avatarUrl;
            }
            
            // 初始化游戏
            initializeGame()
          }, 1500)
        } else {
          // 未找到用户
          searchResult.innerHTML = `<p class="text-yellow-400">${t('local.userNotFound')}</p>`
        }
      } catch (error) {
        console.error('Search error:', error)
        searchResult.innerHTML = `<p class="text-red-400">${t('local.searchError')}</p>`
      }
    })
    
    // 使用默认Guest
    continueAsGuestButton.addEventListener('click', () => {
      modal.classList.add('hidden')
      // 初始化游戏
      initializeGame()
    })
    
    // 按Enter键也触发搜索
    opponentNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchButton.click()
      }
    })
  }

  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}
