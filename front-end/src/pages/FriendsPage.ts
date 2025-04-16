// src/pages/FriendsPage.ts

import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'
import { initGlobalSocket } from '../ws/globalSocket'

// 全局变量 friends 保持不变
let friends: { id: number; name: string; avatarUrl: string; online: boolean; blocked: boolean }[] = []

// 用于跟踪已显示的消息，防止重复
const displayedMessages = new Set<string>();

export async function render() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (!user?.id) {
    alert('Please log in first.')
    location.hash = '#/login'
    return
  }

  await fetchFriends(user.id)
  if (!window.globalSocket && user?.id) {
	console.log('[FriendsPage] No socket found, init manually for user', user.id)
	window.globalSocket = initGlobalSocket(user.id)
	}
  renderUI()
  // 不再重复建立 WebSocket，本页依赖全局的 window.globalSocket（在 main.ts 中已初始化）
  bindLanguageSwitcher()
  
  // 注册全局 WebSocket 事件回调，更新在线状态和接收聊天消息
  const currentUser = user; // 已解析的 user 对象
  if (window.globalSocket) {
    window.globalSocket.on('chat', (data: any) => {
      // data 格式: { type: 'chat', from: number, message: string, messageId: string }
      const fromId = data.from
      const message = data.message
      const messageId = data.messageId
      if (!currentUser?.id) return
      
      // 不处理自己发送的消息，因为发送时已经显示
      if (fromId === currentUser.id) {
        return
      }
      
      // 如果聊天窗口未打开则延时追加消息
      const existingBox = document.getElementById(`chat-box-${fromId}`)
      if (!existingBox) {
        setTimeout(() => appendMessage(currentUser.id, fromId, message, false, messageId), 300)
      } else {
        appendMessage(currentUser.id, fromId, message, false, messageId)
      }
    })
    
    // 添加消息发送确认处理
    window.globalSocket.on('message_sent', (data: any) => {
      console.log('Message sent confirmation:', data)
      // 在这里显示消息已发送确认
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user?.id) {
        appendMessage(user.id, data.to, data.message, true, data.messageId)
      }
    })
  }
  
  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}

function renderUI() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press px-4">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>
      <div class="absolute top-6 right-6 z-50">
        ${renderLanguageSwitcher()}
      </div>
      <div class="max-w-4xl mx-auto py-16">
        <div class="flex items-center gap-4 justify-center mb-10">
          <h1 class="text-4xl font-bold text-center drop-shadow-xl">${t('friends.title')}</h1>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-4 justify-between mb-6">
          <input id="searchInput" name="searchInput" type="text" placeholder="Search name..." class="w-full sm:w-1/2 px-4 py-2 rounded-md bg-[#2a2a3d] border border-gray-600 text-white focus:outline-none placeholder:text-gray-400">
          <button id="addFriendBtn" name="addFriendBtn" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center">
            <span class="mr-2">+</span> Add
          </button>
        </div>
        <div id="statusMessage" class="mb-4 px-4 py-2 rounded-md hidden"></div>
        <div id="friendList" class="space-y-4">
          ${renderFriendItems(friends)}
        </div>
        <div class="mt-10 text-center">
          <button id="backButton" name="backButton" onclick="location.hash='#/main'" class="btn-glow px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md transition">
            ← Back to Game
          </button>
        </div>
      </div>
    </div>
  `

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (user?.id) {
    bindFriendEvents(user.id)
  }
}

function renderFriendItems(list: typeof friends) {
  if (list.length === 0) {
    return `<div class="text-center text-gray-400 py-8">No friends found. Add friends to see them here.</div>`
  }

  return list.map(friend => `
    <div class="flex items-center justify-between bg-[#1b1b2f] p-4 rounded-xl shadow-md" data-friend-id="${friend.id}">
      <div class="flex items-center gap-4">
        <img src="${friend.avatarUrl || `https://i.pravatar.cc/50?u=${friend.name}`}" class="w-10 h-10 rounded-full" alt="${friend.name}" />
        <div>
          <p class="text-lg font-semibold">${friend.name}</p>
          <p class="text-sm friend-status ${friend.online ? 'text-green-400' : 'text-gray-400'}">
            ${friend.online ? t('friends.online') : t('friends.offline')}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="open-chat text-blue-400 hover:text-blue-600" data-id="${friend.id}" data-name="${friend.name}" aria-label="Chat">💬</button>
        <button class="delete-friend text-red-400 hover:text-red-600" data-id="${friend.id}" aria-label="Delete friend">✖</button>
		  <button class="toggle-block text-yellow-400 hover:text-yellow-600" data-id="${friend.id}">
			${friend.blocked ? '✅ Unblock' : '🔒 Block'}
		</button>
      </div>
    </div>
  `).join('')
}

function showStatusMessage(message: string, isError: boolean = false) {
  const statusElement = document.getElementById('statusMessage')
  if (!statusElement) return

  statusElement.textContent = message
  statusElement.className = `mb-4 px-4 py-2 rounded-md ${isError ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`
  statusElement.classList.remove('hidden')

  setTimeout(() => {
    if (statusElement) {
      statusElement.classList.add('hidden')
      statusElement.textContent = ''
    }
  }, 2000)
}

function hideStatusMessage() {
  const statusElement = document.getElementById('statusMessage')
  if (statusElement) {
    statusElement.classList.add('hidden')
    statusElement.textContent = ''
  }
}

function bindFriendEvents(currentUserId: number) {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement
  const addFriendBtn = document.getElementById('addFriendBtn') as HTMLButtonElement
  const friendList = document.getElementById('friendList')!

  document.addEventListener('click', () => hideStatusMessage())

    // 👇插入这里
	friendList.addEventListener('click', async (e) => {
		const target = e.target as HTMLElement
		if (!target.classList.contains('toggle-block')) return
	
		const friendId = Number(target.getAttribute('data-id'))
		const isUnblock = target.textContent?.includes('Unblock')
	
		try {
		  const url = isUnblock
			? `http://localhost:3000/users/block/${friendId}`
			: 'http://localhost:3000/users/block'
	
		  console.log(`[${isUnblock ? 'UNBLOCK' : 'BLOCK'}] sending request to ${url}`)
	
		  const res = await fetch(url, {
			method: isUnblock ? 'DELETE' : 'POST',
			headers: {
			  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
			  ...(isUnblock ? {} : { 'Content-Type': 'application/json' }),
			},
			...(isUnblock ? {} : { body: JSON.stringify({ blockedId: friendId }) }),
		  })
	
		  const data = await res.json()
		  if (!res.ok) {
			showStatusMessage(data.message || 'Failed to update block status', true)
			return
		  }
	
		  showStatusMessage(data.message || 'Success')
		  await fetchFriends(currentUserId)
		} catch (err) {
		  console.error('Block/unblock error:', err)
		  showStatusMessage('Network error while updating block status', true)
		}
	  })

	  
  searchInput.addEventListener('input', () => {
    hideStatusMessage()
    const keyword = searchInput.value.toLowerCase()
    const filtered = friends.filter(f => f.name.toLowerCase().includes(keyword))
    friendList.innerHTML = renderFriendItems(filtered)
    bindDeleteEvents(currentUserId)
  })

  addFriendBtn.addEventListener('click', async () => {
    const name = searchInput.value.trim()
    if (!name) {
      showStatusMessage('Please enter a friend name', true)
      return
    }

    try {
      const res = await fetch('http://localhost:3000/users/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ displayName: name })
      })

      const responseData = await res.json()
      if (!res.ok) {
        showStatusMessage(responseData.message || 'Failed to add friend', true)
        return
      }

      showStatusMessage('Friend added successfully')
      searchInput.value = ''
      await fetchFriends(currentUserId)
    } catch (err) {
      console.error('Add friend error:', err)
      showStatusMessage('Network error. Please try again.', true)
    }
  })

  bindDeleteEvents(currentUserId)
  bindChatEvents(currentUserId)
}

function bindChatEvents(currentUserId: number) {
  document.querySelectorAll<HTMLButtonElement>('.open-chat').forEach(btn => {
    btn.addEventListener('click', async () => {
      const friendId = Number(btn.getAttribute('data-id'))
      const friendName = btn.getAttribute('data-name') || `User ${friendId}`
      openChatWindow(currentUserId, friendId, friendName)
    })
  })
}

function bindDeleteEvents(currentUserId: number) {
  document.querySelectorAll<HTMLButtonElement>('.delete-friend').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const friendId = Number(btn.getAttribute('data-id'))
      try {
        const res = await fetch(`http://localhost:3000/users/friends/${friendId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        })

        const responseData = await res.json()
        if (!res.ok) {
          showStatusMessage(responseData.message || 'Failed to delete friend', true)
          return
        }

        showStatusMessage('Friend removed successfully')
        await fetchFriends(currentUserId)
      } catch (err) {
        console.error('Delete friend error:', err)
        showStatusMessage('Network error while deleting friend', true)
      }
    })
  })
}

async function fetchFriends(userId: number) {
  try {
    const res = await fetch(`http://localhost:3000/users/${userId}/friends`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    })
    friends = await res.json()

    const list = document.getElementById('friendList')
    if (list) {
      list.innerHTML = renderFriendItems(friends)
      bindDeleteEvents(userId)
      bindChatEvents(userId)
    }
  } catch (err) {
    console.error('Error fetching friends:', err)
    friends = []
  }
}

// 使用全局的 window.globalSocket 来发送消息，不再重复建立 WebSocket 连接
async function sendMessage(receiverId: number, content: string) {
  try {
    const response = await fetch(`http://localhost:3000/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ receiverId, content })
    })
    
    // 获取消息ID用于跟踪
    const messageData = await response.json()
    const messageId = messageData.id
    
    if (
      window.globalSocket &&
      window.globalSocket.getSocket() &&
      window.globalSocket.getSocket().readyState === WebSocket.OPEN
    ) {
      window.globalSocket.send({
        type: 'chat',
        to: receiverId,
        message: content,
        messageId: messageId // 添加消息ID
      })
    }
    
    // 不在这里显示消息，而是等待WebSocket的message_sent事件
    // 移除: appendMessage(JSON.parse(localStorage.getItem('user') || '{}').id, receiverId, content, true, messageId)
    
  } catch (err) {
    console.error('Failed to send message:', err)
    // 请求失败时仍然显示消息，并使用时间戳作为临时ID
    const tempId = `temp-${Date.now()}`
    appendMessage(JSON.parse(localStorage.getItem('user') || '{}').id, receiverId, content, true, tempId)
  }
}

function appendMessage(userId: number, friendId: number, text: string, isSelf: boolean, messageId?: string) {
  const box = document.getElementById(`chat-messages-${friendId}`)
  if (!box) return
  
  // 生成消息唯一标识
  const msgIdentifier = messageId || `${userId}-${friendId}-${text}-${Date.now()}`
  
  // 如果消息已经显示过，则不再显示
  if (displayedMessages.has(msgIdentifier)) {
    return
  }
  
  // 标记消息为已显示
  displayedMessages.add(msgIdentifier)
  
  const bubble = document.createElement('div')
  bubble.className = `
    max-w-[75%] px-4 py-2 rounded-xl text-sm break-words
    ${isSelf ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white ml-auto text-right' : 'bg-[#3a3a4d] text-white'}
  `
  bubble.dataset.messageId = msgIdentifier
  bubble.textContent = text
  box.appendChild(bubble)
  box.scrollTop = box.scrollHeight
}

async function loadMessages(userId: number, friendId: number) {
  try {
    const res = await fetch(`http://localhost:3000/messages/${friendId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    })
    const messages = await res.json()
    const box = document.getElementById(`chat-messages-${friendId}`)
    if (box) {
      box.innerHTML = ''
      // 清空已显示消息的集合
      displayedMessages.clear()
      for (const msg of messages) {
        appendMessage(userId, friendId, msg.content, msg.senderId === userId, msg.id)
      }
    }
  } catch (err) {
    console.error('Failed to load messages:', err)
  }
}

function updateFriendStatus(friendId: number, isOnline: boolean) {
	const statusElements = document.querySelectorAll(`[data-friend-id="${friendId}"] .friend-status`);
	statusElements.forEach(el => {
	  el.textContent = isOnline ? t('friends.online') : t('friends.offline');
	  el.className = `text-sm friend-status ${isOnline ? 'text-green-400' : 'text-gray-400'}`;
	});
  }

async function openChatWindow(userId: number, friendId: number, friendName: string) {
  const existing = document.getElementById(`chat-box-${friendId}`)
  if (existing) return

  const container = document.createElement('div')
  container.id = `chat-box-${friendId}`
  container.className = `
    fixed bottom-4 right-4 w-80 bg-[#1e1e2f]/90 backdrop-blur-md
    rounded-2xl shadow-2xl text-white z-50 flex flex-col max-h-[80vh] overflow-hidden
  `
  container.innerHTML = `
    <div class="flex justify-between items-center px-4 py-2 bg-[#2a2a3d] border-b border-[#333]">
      <span class="font-semibold text-lg">${friendName}</span>
      <button class="close-chat text-red-400 hover:text-red-600 transition-transform transform hover:scale-125">✖</button>
    </div>
    <div class="flex-1 overflow-y-auto p-3 space-y-2 text-sm" id="chat-messages-${friendId}">
      <div class="text-center text-gray-400">Loading...</div>
    </div>
    <div class="p-2 border-t border-[#333] bg-[#1b1b2f]">
      <input
        type="text"
        placeholder="Type a message..."
        class="w-full px-3 py-2 rounded-xl bg-[#2a2a3d] border border-[#444] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        id="chat-input-${friendId}"
      >
    </div>
  `
  document.body.appendChild(container)
  container.querySelector('.close-chat')?.addEventListener('click', () => container.remove())

  const input = container.querySelector(`#chat-input-${friendId}`) as HTMLInputElement
  input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const content = input.value.trim()
      input.value = ''
      sendMessage(friendId, content)
      // 移除：appendMessage(userId, friendId, content, true)
    }
  })

  await loadMessages(userId, friendId)
}

export function handlePresenceUpdate(data: { type: 'presence'; userId: number; status: 'online' | 'offline' }) {
	console.log('[handlePresenceUpdate] Got presence update:', data)
  
	const friend = friends.find(f => f.id === data.userId)
	if (friend) {
	  friend.online = data.status === 'online'
	  updateFriendStatus(friend.id, friend.online)
	}
  }
  