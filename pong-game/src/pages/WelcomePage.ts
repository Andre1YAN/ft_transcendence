import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'

export function render() {
  document.body.innerHTML = `
    <div class="relative w-full min-h-screen bg-black overflow-hidden">
      <!-- 动态背景 -->
      <div class="absolute inset-0 bg-gradient-to-br from-[#1f2937] via-[#111827] to-black animate-gradient"></div>

      <!-- 语言切换器 -->
      <div class="absolute top-6 right-6 z-50">
        ${renderLanguageSwitcher()}
      </div>

      <!-- 内容主体 -->
      <div class="relative z-10 flex flex-col items-center justify-center min-h-screen text-white px-4 text-center">
        <h1 class="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 font-press tracking-widest drop-shadow-lg">
          ${t('welcome.title')}
        </h1>
        <p class="text-gray-300 mb-12 text-lg max-w-xl sm:max-w-2xl">
          ${t('welcome.description')}
        </p>

        <!-- 按钮容器 -->
        <div class="w-full max-w-xs sm:max-w-md md:max-w-xl flex flex-col md:flex-row justify-center items-center gap-4">
          <button 
            onclick="location.hash='#/login'" 
            class="w-full md:w-auto px-6 py-3 bg-white text-black font-semibold rounded-full shadow hover:bg-gray-200 transition focus:outline-none focus:ring-2 focus:ring-white">
            ${t('welcome.login')}
          </button>
          <button 
            onclick="location.hash='#/signup'" 
            class="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold rounded-full shadow hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-pink-400">
            ${t('welcome.register')}
          </button>
        </div>
      </div>
    </div>
  `

  bindLanguageSwitcher()
}
