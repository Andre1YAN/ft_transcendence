import { getCurrentLanguage, setLanguage } from '../State/i18n'

export function renderLanguageSwitcher(): string {
  const currentLang = getCurrentLanguage()

  return `
    <select id="langSelect" class="bg-transparent border border-white/30 text-white rounded px-2 py-1 outline-none hover:bg-white/10">
      <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🌐 EN</option>
      <option value="zh" ${currentLang === 'zh' ? 'selected' : ''}>🇨🇳 中文</option>
      <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>🇫🇷 FR</option>
    </select>
  `
}

// 绑定切换逻辑，需在页面 mount 后调用
export function bindLanguageSwitcher() {
  const select = document.getElementById('langSelect') as HTMLSelectElement | null
  if (select) {
    select.addEventListener('change', () => {
      const lang = select.value as 'en' | 'zh' | 'fr'
      setLanguage(lang)
      location.reload() // 强制刷新页面重新渲染当前语言
    })
  }
}
