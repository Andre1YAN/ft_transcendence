// src/ws/presenceClient.ts

export function setupPresenceSocket(userId: number) {
	if (window.socket) return // 避免重复连接
  
	const socket = new WebSocket('ws://localhost:3000/ws/presence')
  
	socket.addEventListener('open', () => {
	  socket.send(JSON.stringify({ type: 'online', userId }))
	  setInterval(() => {
		if (socket.readyState === WebSocket.OPEN) {
		  socket.send(JSON.stringify({ type: 'ping' }))
		}
	  }, 30000)
	})
  
	socket.addEventListener('close', () => {
	  console.log('🔌 WebSocket closed')
	})
  
	socket.addEventListener('error', (err) => {
	  console.error('❌ WebSocket error:', err)
	})
  
	window.socket = socket
  }
  