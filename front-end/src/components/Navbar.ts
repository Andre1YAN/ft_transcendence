// src/components/Navbar.ts
import { setMode } from '../State/gameState'
import { t, getCurrentLanguage, setLanguage } from '../State/i18n'

// 🔽 修改后的 renderNavbar 函数
export function renderNavbar() {
  const currentLang = getCurrentLanguage()
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const avatarUrl = user?.avatarUrl || 'https://i.pravatar.cc/40?u=default'

  return `
    <div class="flex justify-between items-center mb-10">
      <div id="logo" class="cursor-pointer font-press text-3xl font-bold text-blue-200 tracking-widest">
        42 PONG
      </div>
      <div class="flex items-center space-x-4 font-press text-sm font-medium text-white">
        <div class="relative">
          <button id="modeDropdownBtn" class="px-4 py-2 rounded-lg shadow transition bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90">
            ${t('navbar.gameMode')} ⌄
          </button>
          <div id="modeDropdownMenu" class="hidden absolute mt-2 w-60 bg-[#1b1b2f] border border-purple-500/30 rounded-xl shadow-lg z-50">
            <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition rounded-t-xl" data-mode="local">
              ${t('navbar.local')}
            </button>
			<button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition" data-mode="ai_game">
			🤖 ${t('navbar.aiGame')}
			</button>
            <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition rounded-b-xl" data-mode="tournament">
              ${t('navbar.tournament')}
            </button>
          </div>
        </div>

        <select id="langSelect" class="bg-transparent border border-white/30 text-white rounded px-2 py-1 outline-none hover:bg-white/10">
          <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🌐 EN</option>
          <option value="zh" ${currentLang === 'zh' ? 'selected' : ''}>🇨🇳 中文</option>
          <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>🇫🇷 FR</option>
        </select>

        <div class="relative">
          <button id="avatarBtn" class="w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:ring-2 hover:ring-pink-400 transition">
            <img src="${avatarUrl}" alt="Avatar" class="w-full h-full object-cover" />
          </button>
          <div id="avatarMenu" class="hidden absolute right-0 mt-2 w-48 bg-[#1b1b2f] border border-purple-500/30 rounded-xl shadow-lg z-50">
            <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition rounded-t-xl" data-tab="profile">👤 ${t('navbar.profile')}</button>
            <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition" data-tab="history">📜 ${t('navbar.history')}</button>
            <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition" data-tab="friends">🤝 ${t('navbar.friends')}</button>
            <!-- 添加登出按钮 -->
            <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition rounded-b-xl" data-tab="logout">🔓 ${t('navbar.logout') || 'Log Out'}</button>
          </div>
        </div>
      </div>
    </div>
  `
}

export function bindNavbarEvents() {
  const dropdownBtn = document.getElementById('modeDropdownBtn')!
  const dropdownMenu = document.getElementById('modeDropdownMenu')!

  if (dropdownBtn && dropdownMenu) {
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
        const el = e.target as HTMLElement
        const mode = el.getAttribute('data-mode')

        if (!mode) return
        setMode(mode as any)

        // 正确的路由跳转
        if (mode === 'tournament') {
          location.hash = '#/tournament_setup'
        } else if (mode === 'local') {
          location.hash = '#/local'
        } else if (mode === 'ai_game') {
          location.hash = '#/ai_game'
        }

        // 更新 UI 状态
        dropdownMenu.classList.add('hidden')
        dropdownBtn.innerHTML = `${t('navbar.gameMode')} ⌄`
      })
    })
  }

  // Language Selector
  const langSelect = document.getElementById('langSelect') as HTMLSelectElement
  if (langSelect) {
    langSelect.addEventListener('change', () => {
      const lang = langSelect.value as 'en' | 'zh' | 'fr'
      setLanguage(lang)
      location.reload()
    })
  }

  // Avatar Dropdown
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
        if (tab) {
          if (tab === 'logout') {
            // 登出操作：关闭全局 WebSocket 连接，清空本地登录信息，并跳转到登录页

            const socket = window.globalSocket?.getSocket();
            if (socket && socket.readyState === WebSocket.OPEN) {
              window.globalSocket?.send({ type: 'offline', userId: window.user?.id });
            }
            window.globalSocket?.close()

            localStorage.removeItem('user')
            localStorage.removeItem('authToken')

            window.user = null
            window.globalSocket = null

            location.hash = '#/login'
          }
          else {
            location.hash = `#/${tab}`
          }
        }
      })
    })
  }

  // logo event
  const logo = document.getElementById('logo')
  if (logo) {
    logo.addEventListener('click', () => {
      location.hash = '#/main'
    })
  }
}
