import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'

// 模拟当前用户数据（登录后你可以用真实用户替换）
const currentUser = {
  username: 'AliceTheChampion',
  avatar: 'https://i.pravatar.cc/100?u=alice'
}

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#0f172a] to-[#0a0a1a] text-white font-press px-4 sm:px-6 pt-6">

      <!-- 背景动画 -->
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <!-- 顶部导航栏 -->
      ${renderNavbar()}

      <!-- 欢迎区域 -->
      <section class="max-w-4xl mx-auto mt-10 sm:mt-14 text-center px-4">
        <img 
          src="${currentUser.avatar}" 
          alt="avatar" 
          class="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg border-4 border-blue-400 mb-4 transition-transform hover:scale-105"
        />
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-blue-200">
          👋 ${t('main.welcome')}, 
          <span class="text-pink-400">${currentUser.username}</span>
        </h1>
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
  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}
