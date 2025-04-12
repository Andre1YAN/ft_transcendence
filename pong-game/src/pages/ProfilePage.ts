import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <div class="absolute top-6 right-6 z-50">
        ${renderLanguageSwitcher()}
      </div>

      <div class="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl sm:text-4xl font-bold text-center mb-10 drop-shadow-xl">
          ${t('profile.title')}
        </h1>

        <div class="flex flex-col md:flex-row gap-10 items-center md:items-start">
          <!-- Avatar -->
          <div class="flex flex-col items-center md:items-start w-full md:w-1/3 text-center md:text-left">
            <img src="https://i.pravatar.cc/100?u=user" alt="avatar"
              class="w-32 h-32 rounded-full shadow-lg mb-4" />
            <button class="text-sm px-4 py-1 rounded-full bg-white text-black hover:bg-gray-200 transition">
              ${t('profile.upload')}
            </button>
          </div>

          <!-- Info Form -->
          <div class="flex-1 w-full">
            <div class="space-y-6">
              <div>
                <label class="block text-sm text-gray-300 mb-1">${t('profile.displayName')}</label>
                <input type="text" value="Username42"
                  class="w-full px-4 py-2 rounded-md bg-[#2a2a3d] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
              </div>

              <div class="flex gap-4">
                <div class="flex-1">
                  <p class="text-gray-400 text-sm mb-1">${t('profile.wins')}</p>
                  <div class="text-xl font-bold">12</div>
                </div>
                <div class="flex-1">
                  <p class="text-gray-400 text-sm mb-1">${t('profile.losses')}</p>
                  <div class="text-xl font-bold">8</div>
                </div>
              </div>

              <button
                class="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white hover:opacity-90 transition">
                ${t('profile.update')}
              </button>
            </div>
          </div>
        </div>

        <!-- History -->
        <h2 class="text-2xl font-bold mt-16 mb-4 text-center md:text-left">${t('profile.historyTitle')}</h2>
        <div class="bg-[#1b1b2f] rounded-xl p-4 space-y-3 shadow-inner">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <div class="text-sm sm:text-base">${t('profile.matchDate')}</div>
            <div class="text-sm sm:text-base font-bold text-green-400">${t('profile.matchResult')}</div>
          </div>
        </div>

        <div class="text-center mt-10 mb-10">
          <button onclick="location.hash = '#/main'"
            class="btn-glow px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md transition">
            ${t('profile.back')}
          </button>
        </div>
      </div>
    </div>
  `

  bindLanguageSwitcher()
  requestAnimationFrame(() => initStars())
}
