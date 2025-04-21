// src/pages/LoginPage.ts

import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'
import { initializeGoogleSignIn } from '../auth/googleSignIn'  // 导入 Google 初始化函数
import { initGlobalSocket } from '../ws/globalSocket'

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-br from-[#0a0a1a] to-[#000000] flex items-center justify-center px-4 font-press">
      
      <!-- Language Switcher -->
      <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 text-sm sm:text-base">
        ${renderLanguageSwitcher()}
      </div>

      <!-- 背景粒子动画 -->
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <!-- 登录面板 -->
      <div class="backdrop-blur-md bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md text-white">
        <h2 class="text-2xl sm:text-3xl font-bold text-center mb-6">${t('login.title')}</h2>

        <!-- Google 登录按钮容器（单独放置，不嵌套在按钮内） -->
        <div id="g_id_signin" class="mb-5"></div>

        <!-- 分割线 -->
        <div class="relative mb-5 text-center text-sm text-white/60">
          <span class="bg-[#0a0a1a] px-2 z-10 relative">${t('login.or')}</span>
          <div class="absolute left-0 right-0 top-1/2 border-t border-white/20 transform -translate-y-1/2 z-0"></div>
        </div>

        <!-- 表单 -->
        <form class="space-y-4">
          <input
            type="email"
            placeholder="${t('login.emailPlaceholder')}"
            class="w-full bg-transparent border border-white/20 rounded-md px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition placeholder:text-white/40 text-white text-sm sm:text-base"
          />
          <input
            type="password"
            placeholder="${t('login.passwordPlaceholder')}"
            class="w-full bg-transparent border border-white/20 rounded-md px-4 py-2 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition placeholder:text-white/40 text-white text-sm sm:text-base"
          />

          <button
            type="submit"
            class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-2 sm:py-2.5 rounded-md hover:opacity-90 transition"
          >
            ${t('login.submit')}
          </button>
        </form>

        <!-- 底部提示 -->
        <p class="text-sm sm:text-base text-center text-white/60 mt-6">
          ${t('login.noAccount')}
          <a href="#/signup" class="text-orange-400 hover:underline">${t('login.signup')}</a>
        </p>
      </div>
    </div>
  `

  bindLanguageSwitcher()
  requestAnimationFrame(() => initStars())

  // 初始化 Google 登录按钮
  initializeGoogleSignIn()

  document.querySelector('form')?.addEventListener('submit', async (e) => {
	e.preventDefault()
  
	const inputs = document.querySelectorAll<HTMLInputElement>('form input')
	const email = inputs[0].value.trim()
	const password = inputs[1].value.trim()
  
	if (!email || !password) {
	  alert('Email and password are required!')
	  return
	}
  
	try {
	  const res = await fetch('https://localhost:3000/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	  })
  
	  const data = await res.json()
  
	  if (!res.ok) {
		throw new Error(data.message || 'Login failed')
	  }
  
	  // ✅ 检查是否需要 2FA
	  if (data.step === '2fa_required') {
		localStorage.setItem('2fa_userId', data.userId)
		location.hash = '#/2fa'
		return
	  }
  
	  // ✅ 否则直接登录成功
	  localStorage.setItem('user', JSON.stringify(data.user || data)) // 兼容老结构
	  localStorage.setItem('authToken', data.token)
	  const currentUser = data.user || data
    window.user = currentUser
    window.globalSocket = initGlobalSocket(currentUser.id)

		alert(`Welcome back, ${currentUser.displayName || 'Player'}!`)
	  location.hash = '#/main'
  
	} catch (err: any) {
	  alert(err.message || 'Something went wrong.')
	}
  })
}  
