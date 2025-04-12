import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'


export function render() {
  document.body.innerHTML = `

    <div class="relative w-full h-screen bg-black overflow-hidden">
      <!-- 动态背景 -->
      <div class="absolute inset-0 bg-gradient-to-br from-[#1f2937] via-[#111827] to-black animate-gradient"></div>

	  <div class="absolute top-6 right-6 z-50">
        ${renderLanguageSwitcher()}
      </div>

      <!-- 内容区域 -->
      <div class="relative z-10 flex flex-col items-center justify-center h-full text-white">
        <h1 class="text-4xl md:text-6xl font-bold mb-6 font-press tracking-widest drop-shadow-lg">
          ${t('welcome.title')}
        </h1>
        <p class="text-gray-300 mb-12 text-center max-w-xl px-4">${t('welcome.description')}</p>
        
        <div class="space-x-6">
          <button 
            onclick="location.hash='#/login'" 
            class="px-6 py-3 bg-white text-black font-semibold rounded-full shadow hover:bg-gray-200 transition">
            ${t('welcome.login')}
          </button>
          <button 
            onclick="location.hash='#/signup'" 
            class="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold rounded-full shadow hover:opacity-90 transition">
            ${t('welcome.register')}
          </button>
        </div>
      </div>
    </div>
  `
bindLanguageSwitcher()

}

