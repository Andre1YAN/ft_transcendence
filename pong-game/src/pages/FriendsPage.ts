import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'

let friends = [
  { name: 'Alice', online: true },
  { name: 'Bob', online: false }
]

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press px-4">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <div class="absolute top-6 right-6 z-50">
        ${renderLanguageSwitcher()}
      </div>

      <div class="max-w-4xl mx-auto py-16">
        <h1 class="text-4xl font-bold text-center mb-10 drop-shadow-xl">${t('friends.title')}</h1>

        <!-- 搜索框和添加好友 -->
        <div class="flex flex-col sm:flex-row items-center gap-4 justify-between mb-6">
          <input id="searchInput" type="text" placeholder="Search..." class="w-full sm:w-1/2 px-4 py-2 rounded-md bg-[#2a2a3d] border border-gray-600 text-white focus:outline-none placeholder:text-gray-400">
          <button id="addFriendBtn" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md">+ Add</button>
        </div>

        <div id="friendList" class="space-y-4">
          ${renderFriendItems(friends)}
        </div>

        <div class="mt-10 text-center">
          <button onclick="location.hash='#/main'" class="btn-glow px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md transition">
            ${t('friends.back')}
          </button>
        </div>
      </div>
    </div>
  `

  bindLanguageSwitcher()
  bindFriendEvents()
  requestAnimationFrame(() => initStars())
}

function renderFriendItems(friendArray: { name: string, online: boolean }[]) {
  return friendArray.map(friend => `
    <div class="flex items-center justify-between bg-[#1b1b2f] p-4 rounded-xl shadow-md">
      <div class="flex items-center gap-4">
        <img src="https://i.pravatar.cc/50?u=${friend.name}" class="w-10 h-10 rounded-full" />
        <div>
          <p class="text-lg font-semibold">${friend.name}</p>
          <p class="text-sm ${friend.online ? 'text-green-400' : 'text-gray-400'}">${friend.online ? t('friends.online') : t('friends.offline')}</p>
        </div>
      </div>
      <button class="delete-friend text-red-400 hover:text-red-600" data-name="${friend.name}">✖</button>
    </div>
  `).join('')
}

function bindFriendEvents() {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement
  const addFriendBtn = document.getElementById('addFriendBtn') as HTMLButtonElement
  const friendList = document.getElementById('friendList')!

  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.toLowerCase()
    const filtered = friends.filter(f => f.name.toLowerCase().includes(keyword))
    friendList.innerHTML = renderFriendItems(filtered)
    bindDeleteEvents()
  })

  addFriendBtn.addEventListener('click', () => {
    const name = searchInput.value.trim()
    if (name && !friends.find(f => f.name.toLowerCase() === name.toLowerCase())) {
      friends.push({ name, online: Math.random() > 0.5 })
      friendList.innerHTML = renderFriendItems(friends)
      searchInput.value = ''
      bindDeleteEvents()
    }
  })

  bindDeleteEvents()
}

function bindDeleteEvents() {
  document.querySelectorAll<HTMLButtonElement>('.delete-friend').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-name')!
      friends = friends.filter(f => f.name !== name)
      const list = document.getElementById('friendList')!
      list.innerHTML = renderFriendItems(friends)
      bindDeleteEvents()
    })
  })
}
