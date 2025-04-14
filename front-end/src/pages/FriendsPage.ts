// src/pages/FriendsPage.ts

import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'

let friends: { id: number; name: string; avatarUrl: string; online: boolean }[] = []
let socket: WebSocket | null = null

export async function render() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (!user?.id) {
    alert('Please log in first.')
    location.hash = '#/login'
    return
  }

  await fetchFriends(user.id)
  renderUI()
  setupPresenceSocket(user.id)
  bindLanguageSwitcher()
  requestAnimationFrame(() => initStars())
}

function renderUI() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')

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
          <input id="searchInput" name="searchInput" type="text" placeholder="Search..." class="w-full sm:w-1/2 px-4 py-2 rounded-md bg-[#2a2a3d] border border-gray-600 text-white focus:outline-none placeholder:text-gray-400">
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
      <button class="delete-friend text-red-400 hover:text-red-600" data-id="${friend.id}" aria-label="Delete friend">✖</button>
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
      const res = await fetch('http://localhost:3000/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, friendDisplayName: name })
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
}

function bindDeleteEvents(currentUserId: number) {
  document.querySelectorAll<HTMLButtonElement>('.delete-friend').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const friendId = Number(btn.getAttribute('data-id'))
      try {
        const res = await fetch('http://localhost:3000/friends', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, friendId })
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
    const res = await fetch(`http://localhost:3000/friends/${userId}`)
    friends = await res.json()

    const list = document.getElementById('friendList')
    if (list) {
      list.innerHTML = renderFriendItems(friends)
      bindDeleteEvents(userId)
    }
  } catch (err) {
    console.error('Error fetching friends:', err)
    friends = []
  }
}

function setupPresenceSocket(userId: number) {
  try {
    socket = new WebSocket('ws://localhost:3000/ws/presence')

    socket.addEventListener('open', () => {
      socket!.send(JSON.stringify({ type: 'online', userId }))
      setTimeout(() => fetchFriends(userId), 500)
    })

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'presence') {
          const friend = friends.find(f => f.id === data.userId)
          if (friend) {
            friend.online = data.status === 'online'
            updateFriendStatus(friend.id, friend.online)
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    })

    socket.addEventListener('close', () => {
      console.log('WebSocket closed')
      setTimeout(() => {
        if (document.getElementById('friendList')) {
          setupPresenceSocket(userId)
        }
      }, 3000)
    })

    socket.addEventListener('error', (err) => {
      console.error('WebSocket error:', err)
    })
  } catch (err) {
    console.error('Failed to setup WebSocket:', err)
  }
}

function updateFriendStatus(friendId: number, isOnline: boolean) {
  const elements = document.querySelectorAll(`[data-friend-id="${friendId}"]`)
  elements.forEach(el => {
    const status = el.querySelector('.friend-status')
    if (status) {
      status.textContent = isOnline ? t('friends.online') : t('friends.offline')
      status.className = `text-sm friend-status ${isOnline ? 'text-green-400' : 'text-gray-400'}`
    }
  })
}
