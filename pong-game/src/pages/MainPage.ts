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
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#0f172a] to-[#0a0a1a] text-white font-press px-6 pt-6">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <!-- 顶部导航 -->
      ${renderNavbar()}

      <!-- 欢迎区 -->
      <section class="max-w-4xl mx-auto mt-12 text-center">
        <img src="${currentUser.avatar}" alt="avatar" class="mx-auto w-24 h-24 rounded-full shadow-lg border-4 border-blue-400 mb-4">
        <h1 class="text-3xl md:text-4xl font-bold mb-2 text-blue-200">👋 ${t('main.welcome')}, <span class="text-pink-400">${currentUser.username}</span></h1>
        <p class="text-white/60 text-base md:text-lg">${t('main.description')}</p>
      </section>

      <!-- 功能入口 -->
      <section class="flex flex-col md:flex-row justify-center gap-6 mt-12 text-center">
        <button onclick="location.hash='#/local'" class="w-full md:w-60 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition shadow-lg text-lg font-bold">
          🎮 ${t('main.playLocal')}
        </button>
        <button onclick="location.hash='#/tournament_setup'" class="w-full md:w-60 px-6 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 transition shadow-lg text-lg font-bold">
          🏆 ${t('main.playTournament')}
        </button>
      </section>

      <!-- 最近记录 / 公告（可选） -->
      <section class="max-w-3xl mx-auto mt-16 text-sm text-white/70 text-center">
        <h2 class="text-xl font-semibold mb-2">${t('main.recent')}</h2>
        <p>✨ ${t('main.tip')}</p>
      </section>
    </div>
  `

  bindNavbarEvents()
  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}
