import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderChatBox } from '../components/ChatBox'

function setupPresenceSocket(userId: number) {
  try {
    const socket = new WebSocket('ws://localhost:3000/ws/presence')
	renderChatBox(userId, socket)

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'online', userId }))
      // 调用 fetchFriends 来刷新好友列表，确保函数定义在本模块中
      setTimeout(() => fetchFriends(userId), 500)
      setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)
    })

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'presence') {
          // 更新在线状态的逻辑，这里假定全局变量 friends 已经被定义
          const friend = window.friends && window.friends.find(f => f.id === data.userId)
          if (friend) {
            friend.online = data.status === 'online'
            updateFriendStatus(friend.id, friend.online)
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    })

    socket.addEventListener('close', () => {
      console.log('WebSocket closed')
      setTimeout(() => {
        if (document.getElementById('friendList')) {
          setupPresenceSocket(userId)
        }
      }, 3000)
    })

    socket.addEventListener('error', (err) => {
      console.error('WebSocket error:', err)
    })

    // 将 socket 挂载到全局，方便其他地方调用，比如登出时关闭
    window.socket = socket
  } catch (err) {
    console.error('Failed to setup WebSocket:', err)
  }
}

// 定义 fetchFriends，用于获取好友列表
async function fetchFriends(userId: number) {
  try {
    const res = await fetch(`http://localhost:3000/users/${userId}/friends`, {
      method: 'GET',
      headers: {'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }})
    const data = await res.json()
    console.log("Fetched friends:", data)
    // 将获取到的好友列表挂到全局变量 window.friends 中
    window.friends = data
  } catch (err) {
    console.error('Error fetching friends:', err)
  }
}

// 假设 updateFriendStatus 用于更新页面上单个好友的在线状态
function updateFriendStatus(friendId: number, isOnline: boolean) {
	const elements = document.querySelectorAll(`[data-friend-id="${friendId}"]`)
	elements.forEach(el => {
	  const status = el.querySelector('.friend-status')
	  if (status) {
		status.textContent = isOnline ? t('friends.online') : t('friends.offline')
		status.className = `text-sm friend-status ${isOnline ? 'text-green-400' : 'text-gray-400'}`
	  }
	})
  }

export function render() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const avatarUrl = user.avatarUrl || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'
  const displayName = user.displayName || 'Guest'

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#0f172a] to-[#0a0a1a] text-white font-press px-4 sm:px-6 pt-6">
      <!-- 背景动画 -->
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <!-- 顶部导航栏 -->
      ${renderNavbar()}

      <!-- 欢迎区域 -->
      <section class="max-w-4xl mx-auto mt-10 sm:mt-14 text-center px-4">
        <img src="${avatarUrl}" class="w-24 h-24 mx-auto rounded-full shadow-lg mb-2" />
        <h1 class="text-2xl font-bold">${t('main.welcome')}, ${displayName}!</h1>
        <p class="text-white/60 text-sm sm:text-base md:text-lg">
          ${t('main.description')}
        </p>
      </section>

      <!-- 功能入口 -->
      <section class="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-10 sm:mt-12 text-center px-4">
        <button 
          onclick="location.hash='#/local'" 
          class="w-full sm:w-60 px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition shadow-lg text-base sm:text-lg font-bold"
        >
          🎮 ${t('main.playLocal')}
        </button>
        <button 
          onclick="location.hash='#/tournament_setup'" 
          class="w-full sm:w-60 px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 transition shadow-lg text-base sm:text-lg font-bold"
        >
          🏆 ${t('main.playTournament')}
        </button>
      </section>

      <!-- 最近记录或公告 -->
      <section class="max-w-3xl mx-auto mt-12 sm:mt-16 text-center text-sm sm:text-base text-white/70 px-4">
        <h2 class="text-lg sm:text-xl font-semibold mb-2">${t('main.recent')}</h2>
        <p>✨ ${t('main.tip')}</p>
      </section>
    </div>
  `

  bindNavbarEvents()

  // 登录后立即建立 WebSocket 连接，更新在线状态
  if (user?.id) {
    setupPresenceSocket(user.id)
  }

  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}
