import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-br from-[#0a0a1a] to-[#000000] flex items-center justify-center px-4 font-press">
      <div class="absolute top-6 right-6 z-50">
        ${renderLanguageSwitcher()}
      </div>
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <div class="backdrop-blur-md bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md text-white">
        <h2 class="text-3xl font-bold text-center mb-6">${t('login.title')}</h2>

        <!-- Google 登录 -->
        <button class="w-full flex items-center justify-center gap-2 border border-white/20 rounded-md py-2 mb-5 hover:bg-white/10 transition">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" />
          <span class="font-medium">${t('login.loginGoogle')}</span>
        </button>

        <div class="relative mb-5 text-center text-sm text-white/60">
          <span class="bg-[#0a0a1a] px-2 z-10 relative">${t('login.or')}</span>
          <div class="absolute left-0 right-0 top-1/2 border-t border-white/20 transform -translate-y-1/2 z-0"></div>
        </div>

        <form class="space-y-4">
          <input
            type="email"
            placeholder="${t('login.emailPlaceholder')}"
            class="w-full bg-transparent border border-white/20 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition placeholder:text-white/40 text-white"
          />
          <input
            type="password"
            placeholder="${t('login.passwordPlaceholder')}"
            class="w-full bg-transparent border border-white/20 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition placeholder:text-white/40 text-white"
          />

          <button
            type="submit"
            class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-2 rounded-md hover:opacity-90 transition"
          >
            ${t('login.submit')}
          </button>
        </form>

        <p class="text-sm text-center text-white/60 mt-6">
          ${t('login.noAccount')}
          <a href="#/signup" class="text-orange-400 hover:underline">${t('login.signup')}</a>
        </p>
      </div>
    </div>
  `

  bindLanguageSwitcher()
  requestAnimationFrame(() => initStars())
}
