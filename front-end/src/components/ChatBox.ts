// src/components/ChatBox.ts

export function renderChatBox(userId: number, socket: WebSocket) {
	const displayName = JSON.parse(localStorage.getItem('user') || '{}')?.displayName || `User`

	const chatHTML = `
	  <div id="chatBox" class="fixed bottom-4 right-4 w-72 bg-white/10 text-white rounded-lg shadow-lg overflow-hidden text-sm font-mono z-50">
		<div class="bg-white/20 px-4 py-2 font-bold">💬 Live Chat</div>
		<div id="chatMessages" class="h-40 overflow-y-auto px-4 py-2 space-y-1 text-xs"></div>
		<form id="chatForm" class="flex border-t border-white/20">
		  <input
			type="text"
			id="chatInput"
			placeholder="Type a message..."
			class="flex-grow px-3 py-2 bg-transparent text-white placeholder:text-white/40 focus:outline-none"
		  />
		  <button
			type="submit"
			class="px-3 bg-purple-500 hover:bg-purple-600 transition"
		  >
			➤
		  </button>
		</form>
	  </div>
	`
	const container = document.createElement('div')
	container.innerHTML = chatHTML
	document.body.appendChild(container)
  
	const form = document.getElementById('chatForm') as HTMLFormElement
	const input = document.getElementById('chatInput') as HTMLInputElement
	const messages = document.getElementById('chatMessages')!
  
	// 🔹 发送消息
	form.addEventListener('submit', (e) => {
	  e.preventDefault()
	  const text = input.value.trim()
	  if (!text) return
  
	  socket.send(JSON.stringify({
		type: 'chat',
		from: userId,
		fromName: displayName, 
		message: text,
	  }))

	  input.value = ''
	})
  
	// 🔹 接收消息
	socket.addEventListener('message', (event) => {
	  try {
		const data = JSON.parse(event.data)
		if (data.type === 'chat') {
		  addMessage(`${data.fromName || 'User ' + data.from}: ${data.message}`)
		}
	  } catch (err) {
		console.error('Chat parse error:', err)
	  }
	})
  
	function addMessage(msg: string) {
	  const div = document.createElement('div')
	  div.textContent = msg
	  messages.appendChild(div)
	  messages.scrollTop = messages.scrollHeight
	}
  }
  