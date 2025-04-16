// src/main.ts
import './style.css'
import { initRouter } from './router'
import { initLanguage } from './State/i18n'
import { initGlobalSocket } from './ws/globalSocket'

initLanguage()

if (!location.hash) {
	setTimeout(() => {
		location.hash = '#/';
	  }, 50);	  
  location.hash = '#/'
}

document.addEventListener('DOMContentLoaded', () => {
	console.log('[main] DOMContentLoaded fired')
	const user = JSON.parse(localStorage.getItem('user') || 'null')
	console.log('[main] loaded user from localStorage:', user)

	if (user?.id) {
		console.log('[main] user.id found, init socket')
		window.user = user
		window.globalSocket = initGlobalSocket(user.id); // ✅ 重要
	} else {
		console.warn('[main] No valid user found, skipping socket init')
	}

	initRouter()
})


// 关闭页面前通知服务端下线并关闭连接
window.addEventListener('beforeunload', () => {
	if (window.globalSocket?.getSocket()?.readyState === WebSocket.OPEN && window.user?.id) {
	  window.globalSocket.send({ type: 'offline', userId: window.user.id })
	}
  
	// 真正退出，不要再触发 auto-reconnect
	window.globalSocket?.close(true)
  })
  