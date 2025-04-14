// src/main.ts
import './style.css'
import { initRouter } from './router'
import { initLanguage } from './State/i18n'

initLanguage()

if (!location.hash) {
  location.hash = '#/'
}

initRouter()
