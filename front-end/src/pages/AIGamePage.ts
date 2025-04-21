import { GameCanvas } from '../components/GameCanvas'
import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'

export function render() {
  let game: GameCanvas | null = null
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const playerAlias = user?.displayName || 'You'
  const guestAlias = 'AI Bot'

  const aiUserId = 0;

  // 在页面加载时清理任何可能存在的游戏实例和UI
  GameCanvas.cleanup();

  // 确保比分显示为零
  GameCanvas.resetAllScores();

  // 向后端验证AI Bot用户ID
  async function verifyAIBotId() {
    try {
      const response = await fetch('https://localhost:3000/users/special?email=ai@fake.com', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          console.log('✅ 已验证AI Bot ID:', data.id);
          return data.id; // 返回从服务器获取的AI Bot ID
        }
      }
    } catch (err) {
      console.error('⚠️ 无法验证AI Bot ID，使用默认值:', err);
    }
    return aiUserId; // 失败时返回默认ID
  }

  [{
	"resource": "/Users/hanxu/Work/42/416/back-end/src/route/friendRoutes.ts",
	"owner": "typescript",
	"code": "7006",
	"severity": 8,
	"message": "Parameter 'b' implicitly has an 'any' type.",
	"source": "ts",
	"startLineNumber": 39,
	"startColumn": 48,
	"endLineNumber": 39,
	"endColumn": 49
}]

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] px-6 pt-6 font-sans">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>
      ${renderNavbar()}

      <div class="flex flex-col items-center">
        <div class="text-center text-xl md:text-3xl text-blue-200 font-press tracking-widest mb-4 glow-text">
          🤖 ${t('navbar.aiGame') || 'AI Challenge'}
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
                <span id="rightScore" class="text-3xl font-bold text-red-300 font-press">0</span>
              </div>
              
              <!-- AI信息 -->
              <div class="flex flex-col items-center">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=ai-bot&backgroundColor=ffadad" 
                     class="w-12 h-12 rounded-full border-2 border-red-400 shadow-glow" alt="ai" />
                <span class="text-red-200 text-sm mt-1 font-press">${guestAlias}</span>
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

  game = new GameCanvas(
    'gameCanvas',
    async ({ winnerAlias, leftScore, rightScore }) => {
      winnerEl.textContent = `${winnerAlias} ${t('main.wins')}`

      try {
        // 验证并获取AI Bot的正确ID
        const verifiedAIUserId = await verifyAIBotId();
        
        // 记录发送的数据，方便调试
        const matchData = {
          user1Id: user?.id,
          user2Id: verifiedAIUserId, // 使用验证后的AI Bot ID
          score1: leftScore,
          score2: rightScore,
          matchType: "NORMAL" // 明确指定matchType字段
        };
        console.log('发送的比赛数据:', matchData);
        
        const res = await fetch('https://localhost:3000/users/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
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
    },
    true // 👈 启用 AI 模式
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
      pauseBtn.innerHTML = isPaused 
        ? `▶️ ${t('main.resume')}` 
        : `⏸️ ${t('main.pause')}`;
    }
  });
  
  // 添加键盘提示
  const infoText = document.createElement('div');
  infoText.className = 'text-center text-gray-400 text-sm mt-2';
  infoText.textContent = `${t('main.pauseHint')}`;
  pauseBtn.parentNode?.appendChild(infoText);

  startBtn.addEventListener('click', () => {
    winnerEl.textContent = ''
    game!.resetScore()
    game!.start()
  })

  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}
