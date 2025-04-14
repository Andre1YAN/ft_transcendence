// src/State/i18n.ts
import en from '../locales/en.json'
import zh from '../locales/zh.json'
import fr from '../locales/fr.json'

const translations = { en, zh, fr }

let currentLang: 'en' | 'zh' | 'fr' = (localStorage.getItem('lang') as any) || 'en'

// ✅ 新的嵌套 key 解析函数
function getNestedValue(obj: any, key: string): string | undefined {
  return key.split('.').reduce((acc, part) => acc?.[part], obj)
}

export function initLanguage() {
	const stored = localStorage.getItem('lang') as 'en' | 'zh' | 'fr' | null
	currentLang = stored ?? 'en'
  }

export function t(key: string): string {
  const result = getNestedValue(translations[currentLang], key)
  return result ?? key // fallback: 返回 key 本身
}

export function setLanguage(lang: 'en' | 'zh' | 'fr') {
  currentLang = lang
  localStorage.setItem('lang', lang)
  location.reload() // 或用路由重新挂载
}

export function getCurrentLanguage() {
  return currentLang
}
