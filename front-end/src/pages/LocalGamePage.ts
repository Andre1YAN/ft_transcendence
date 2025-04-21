import { GameCanvas } from '../components/GameCanvas'
import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'

// 在所有游戏页面的初始化代码开头处添加以下代码
// 通常位于DOMContentLoaded事件处理函数的开始

// 在页面加载时清理任何可能存在的游戏实例和UI
GameCanvas.cleanup();

// 确保比分显示为零
GameCanvas.resetAllScores();

export function render() {
  let game: GameCanvas | null = null
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const playerAlias = user?.displayName || 'You'

  // 初始化为默认Guest用户ID
  const defaultGuestId = 1;
  let guestAlias = 'Guest User'
  let guestUser = { id: defaultGuestId, displayName: 'Guest User', avatarUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=guest&backgroundColor=b6e3f4' }

  // 向后端验证Guest用户ID
  async function verifyGuestUserId() {
    try {
      // 取消前面添加的注释，修改邮箱地址
      const response = await fetch('https://localhost:3000/users/special?email=guest@fake.com', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          console.log('✅ Verified Guest User ID:', data.id);
          return {
            id: data.id,
            displayName: data.displayName || 'Guest User',
            avatarUrl: data.avatarUrl || 'https://api.dicebear.com/7.x/personas/svg?seed=guest&backgroundColor=b6e3f4'
          };
        }
      }
    } catch (err) {
      console.error('⚠️ Could not verify Guest User ID, using default:', err);
    }
    return guestUser; // 失败时返回默认用户信息
  }

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] px-6 pt-6 font-sans">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>
      ${renderNavbar()}

      <div class="flex flex-col items-center">
        <div class="text-center text-xl md:text-3xl text-blue-200 font-press tracking-widest mb-4 glow-text">
          🎮 ${t('local.title')}
        </div>
        
        <div class="w-full max-w-[800px] mx-auto bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-indigo-500/20 mb-6">
          <div class="flex flex-col items-center mb-2">
            <div class="flex justify-center items-center gap-6 mb-2">
              <!-- 玩家信息 -->
              <div class="flex flex-col items-center">
                <img src="${user?.avatarUrl || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'}" 
                     class="w-12 h-12 rounded-full border-2 border-blue-400 shadow-glow" alt="player" />
                <span class="text-blue-200 text-sm mt-1 font-press">${playerAlias}</span>
              </div>
              
              <!-- 比分信息 -->
              <div class="flex items-center gap-2 bg-[#1b1b2f] px-6 py-2 rounded-lg border border-indigo-400/20">
                <span id="leftScore" class="text-3xl font-bold text-blue-300 font-press">0</span>
                <span class="mx-2 text-2xl text-gray-400">:</span>
                <span id="rightScore" class="text-3xl font-bold text-green-300 font-press">0</span>
              </div>
              
              <!-- 对手信息 -->
              <div class="flex flex-col items-center">
                <img id="guestAvatar" src="https://api.dicebear.com/7.x/personas/svg?seed=guest&backgroundColor=b6e3f4" 
                     class="w-12 h-12 rounded-full border-2 border-green-400 shadow-glow" alt="guest" />
                <span id="guestName" class="text-green-200 text-sm mt-1 font-press">${guestAlias}</span>
              </div>
            </div>
            
            <div id="winner" class="mt-2 text-yellow-500 text-base font-press glow-text-sm"></div>
          </div>

          <div class="flex justify-center">
            <canvas
              id="gameCanvas"
              class="w-full aspect-[16/10] bg-black shadow-inner rounded-lg border border-indigo-500/20"
            ></canvas>
          </div>
        </div>

        <div class="text-center mt-4 flex justify-center items-center gap-4">
          <button id="startBtn" class="glow-pulse px-8 py-3 text-sm text-blue-200 font-press tracking-widest border border-blue-400 rounded-full bg-black/30 backdrop-blur-sm transition hover:bg-blue-900/30">
            ✨ ${t('main.start')}
          </button>
          <button id="pauseBtn" class="hidden px-8 py-3 text-sm text-yellow-200 font-press tracking-widest border border-yellow-400 rounded-full bg-black/30 backdrop-blur-sm transition hover:bg-yellow-900/30">
            ⏸️ ${t('main.pause')}
          </button>
        </div>
      </div>

    <!-- 对手信息弹窗 -->
    <div id="opponentModal" class="fixed inset-0 flex items-center justify-center z-50 bg-black/90 backdrop-blur-lg">
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
    
    <style>
      .shadow-glow {
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
      }
      .glow-text {
        text-shadow: 0 0 10px rgba(191, 219, 254, 0.6);
      }
      .glow-text-sm {
        text-shadow: 0 0 8px rgba(250, 204, 21, 0.7);
      }
    </style>
  `

  bindNavbarEvents()

  const startBtn = document.getElementById('startBtn') as HTMLButtonElement
  const winnerEl = document.getElementById('winner')!
  const isMobile = window.innerWidth < 768
  const scale = isMobile ? 1.15 : 1
  
  // 初始化对手信息弹窗
  setupOpponentModal()

  // 初始化游戏画布
  async function initializeGame() {
    // 在游戏初始化前获取并验证guest用户信息
    if (guestUser.id === defaultGuestId) {
      guestUser = await verifyGuestUserId();
      // 更新UI中的guest用户信息
      const guestAvatarImg = document.getElementById('guestAvatar') as HTMLImageElement;
      const guestNameElem = document.getElementById('guestName');
      
      if (guestAvatarImg && guestUser.avatarUrl) {
        guestAvatarImg.src = guestUser.avatarUrl;
      }
      
      if (guestNameElem && guestUser.displayName) {
        guestNameElem.textContent = guestUser.displayName;
        guestAlias = guestUser.displayName;
      }
    }

    // ✅ 初始化 GameCanvas，传入玩家别名
    game = new GameCanvas(
      'gameCanvas',
      async ({ winnerAlias, leftScore, rightScore }) => {
        winnerEl.textContent = `${winnerAlias} ${t('main.wins')}`

        try {
          // 使用验证后的guest用户ID
          const matchData = {
            user1Id: user?.id ?? 1,
            user2Id: guestUser.id,
            score1: leftScore,
            score2: rightScore,
            matchType: "NORMAL"
          };
          console.log('Match data to send:', matchData);
          
          const res = await fetch('https://localhost:3000/users/matches', {
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
    
    // 启用暂停按钮
    const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
    pauseBtn.classList.remove('hidden');
    // 确保按钮文本显示为暂停图标，因为游戏初始时未运行
    pauseBtn.innerHTML = `⏸️ ${t('main.pause')}`;
    
    // 绑定暂停按钮事件
    pauseBtn.addEventListener('click', () => {
      if (game) {
        const isPaused = game.togglePause();
        // 根据暂停状态更新按钮文本
        pauseBtn.innerHTML = isPaused 
          ? `▶️ ${t('main.resume')}` 
          : `⏸️ ${t('main.pause')}`;
      }
    });
    
    // 监听键盘事件提示
    const infoText = document.createElement('div');
    infoText.className = 'text-center text-gray-400 text-sm mt-2';
    infoText.textContent = `${t('main.pauseHint')}`;
    pauseBtn.parentNode?.appendChild(infoText);
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
        
        const response = await fetch(`https://localhost:3000/users/search?name=${encodeURIComponent(name)}`, {
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
          
          // 1.5秒后关闭弹窗
          setTimeout(() => {
            modal.classList.add('hidden')
            const guestAvatarImg = document.getElementById('guestAvatar') as HTMLImageElement;
            const guestNameElem = document.getElementById('guestName');
            
            if (guestAvatarImg) {
              guestAvatarImg.src = data.avatarUrl || 'https://api.dicebear.com/7.x/personas/svg?seed=guest&backgroundColor=b6e3f4';
              guestAvatarImg.classList.remove('border-green-400');
              guestAvatarImg.classList.add('border-purple-400');
            }
            
            if (guestNameElem) {
              guestNameElem.textContent = data.displayName;
              guestNameElem.classList.remove('text-green-200');
              guestNameElem.classList.add('text-purple-200');
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
    continueAsGuestButton.addEventListener('click', async () => {
      modal.classList.add('hidden')
      // 初始化游戏
      await initializeGame()
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
