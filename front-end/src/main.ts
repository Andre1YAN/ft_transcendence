// src/main.ts
import './style.css'
import { initRouter } from './router'
import { initLanguage } from './State/i18n'
import { setupPresenceSocket } from './ws/presenceClient'

initLanguage()

if (!location.hash) {
  location.hash = '#/'
}

const user = JSON.parse(localStorage.getItem('user') || 'null')
if (user?.id) {
  setupPresenceSocket(user.id)
  window.user = user // 挂载全局供 beforeunload 用
}

initRouter()

window.addEventListener('beforeunload', () => {
	if (window.socket?.readyState === WebSocket.OPEN && window.user?.id) {
	  window.socket.send(JSON.stringify({ type: 'offline', userId: window.user.id }))
	}
	window.socket?.close()
  })
  