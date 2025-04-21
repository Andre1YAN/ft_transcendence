import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'
import { MatchHistoryDto } from '../types/match.dto'

export function render() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const avatarUrl = user?.avatarUrl || 'https://i.pravatar.cc/100?u=default'
  const displayName = user?.displayName || 'Unknown'
  const wins = '-'
  const losses = '-'

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <div class="absolute top-6 right-6 z-50">
        ${renderLanguageSwitcher()}
      </div>

      <div class="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl sm:text-4xl font-bold text-center mb-10 drop-shadow-xl">
          ${t('profile.title')}
        </h1>

        <div class="flex flex-col md:flex-row gap-10 items-center md:items-start">
          <!-- Avatar -->
          <div class="flex flex-col items-center md:items-start w-full md:w-1/3 text-center md:text-left">
            <img id="avatarPreview" src="${avatarUrl}" alt="avatar"
              class="w-32 h-32 rounded-full shadow-lg mb-4 object-cover" />
            <input type="file" id="avatarUpload" accept="image/*" class="hidden" />
            <button id="uploadTriggerBtn"
              class="text-sm px-4 py-1 rounded-full bg-white text-black hover:bg-gray-200 transition">
              ${t('profile.upload')}
            </button>
          </div>

          <!-- Info Form -->
          <div class="flex-1 w-full">
            <div class="space-y-6">
              <div>
                <label class="block text-sm text-gray-300 mb-1">${t('profile.displayName')}</label>
                <input id="displayNameInput" type="text" value="${displayName}"
                  class="w-full px-4 py-2 rounded-md bg-[#2a2a3d] border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition" />
              </div>

              <div class="flex gap-4">
                <div class="flex-1">
                  <p class="text-gray-400 text-sm mb-1">${t('profile.wins')}</p>
                  <div id="wins" class="text-xl font-bold">${wins}</div>
                </div>
                <div class="flex-1">
                  <p class="text-gray-400 text-sm mb-1">${t('profile.losses')}</p>
                  <div id="losses" class="text-xl font-bold">${losses}</div>
                </div>
              </div>

              <button id="updateBtn"
                class="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white hover:opacity-90 transition">
                ${t('profile.update')}
              </button>
            </div>
          </div>
        </div>

		<!-- History -->
		<h2 class="text-2xl font-bold mt-16 mb-4 text-center md:text-left">${t('profile.historyTitle')}</h2>
		<div id="matchHistory" class="bg-[#1b1b2f] rounded-xl p-4 space-y-3 shadow-inner">
		<p class="text-white/50 text-sm">${t('profile.loading')}</p>
		</div>

        <div class="text-center mt-10 mb-10">
          <button onclick="location.hash = '#/main'"
            class="btn-glow px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md transition">
            ${t('profile.back')}
          </button>
        </div>
      </div>
    </div>
  `

  bindLanguageSwitcher()
  requestAnimationFrame(() => initStars())

  // 🎯 拉取用户比赛记录
fetch(`https://localhost:3000/users/${user.id}/matches`, {
  method: "GET",
  headers: {'Authorization': `Bearer ${localStorage.getItem('authToken')}`}
})
.then(res => res.json())
.then((matches) => {

	let wins = 0
let losses = 0

matches.forEach((match: MatchHistoryDto) => {
  const isUser1 = match.user1.id === user.id
  const myScore = isUser1 ? match.score1 : match.score2
  const oppScore = isUser1 ? match.score2 : match.score1
  if (myScore > oppScore) wins++
  else losses++
})

document.getElementById('wins')!.textContent = String(wins)
document.getElementById('losses')!.textContent = String(losses)

  const container = document.getElementById('matchHistory')!
  if (!Array.isArray(matches)) {
	container.innerHTML = `<p class="text-red-400 text-sm">❌ ${t('profile.errorFetching')}</p>`
	return
  }

  if (matches.length === 0) {
	container.innerHTML = `<p class="text-white/50 text-sm">${t('profile.noMatches')}</p>`
	return
  }

  // ✅ 渲染每条比赛
  container.innerHTML = matches.map((match: any) => {
	const isWin = match.user1.id === user.id
	  ? match.score1 > match.score2
	  : match.score2 > match.score1

	const opponent = match.user1.id === user.id ? match.user2 : match.user1
    
	// 添加特殊用户样式
	let opponentClass = '';
	if (opponent.email === 'ai@fake.com') {
	  opponentClass = 'text-red-400 font-bold';
	} else if (opponent.email === 'guest@fake.com') {
	  opponentClass = 'text-green-400 font-bold';
	}

	return `
	  <div class="flex justify-between items-center border-b border-white/10 pb-2">
		<div class="flex items-center gap-2">
		  <img class="w-8 h-8 rounded-full" src="${opponent.avatarUrl}" />
		  <span class="text-sm ${opponentClass}">${opponent.displayName}</span>
		</div>
		<div class="text-right">
		  <p class="text-xs text-white/40">${new Date(match.playedAt).toLocaleDateString()}</p>
		  <p class="text-sm font-bold ${isWin ? 'text-green-400' : 'text-red-400'}">
			${match.score1} : ${match.score2}
		  </p>
		</div>
	  </div>
	`
  }).join('')
})
.catch(() => {
  document.getElementById('matchHistory')!.innerHTML =
	`<p class="text-red-400 text-sm">⚠️ ${t('profile.errorFetching')}</p>`
})


  // 🧠 上传头像功能：预览
  document.getElementById('updateBtn')?.addEventListener('click', async () => {
	const displayName = (document.getElementById('displayNameInput') as HTMLInputElement)?.value.trim()
	const user = JSON.parse(localStorage.getItem('user') || 'null')
	const file = (document.getElementById('avatarUpload') as HTMLInputElement)?.files?.[0]
  
	if (!user || !user.id || !displayName) {
	  alert('Missing user or display name')
	  return
	}
  
	let avatarBase64 = avatarUrl
	if (file) {
	  avatarBase64 = await toBase64(file)
	}
  
	try {
	  const res = await fetch('https://localhost:3000/users/profile', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}`},
		body: JSON.stringify({displayName, avatarBase64})
	  })
  
	  const data = await res.json()
	  if (!res.ok) throw new Error(data.message || 'Update failed')
  
	  // 成功后更新本地用户信息
	  localStorage.setItem('user', JSON.stringify(data))
	  alert('✅ Profile updated!')
  
	  // 刷新页面数据
	  location.reload()
	} catch (err: any) {
	  alert(err.message || 'Something went wrong.')
	}
  })
  
  function toBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
	  const reader = new FileReader()
	  reader.readAsDataURL(file)
	  reader.onload = () => resolve(reader.result as string)
	  reader.onerror = reject
	})
  }

  // ✨ Avatar upload button triggers file input
document.getElementById('uploadTriggerBtn')?.addEventListener('click', () => {
	(document.getElementById('avatarUpload') as HTMLInputElement)?.click()
  })
  
  // ✨ 显示本地预览
  document.getElementById('avatarUpload')?.addEventListener('change', (e) => {
	const file = (e.target as HTMLInputElement)?.files?.[0]
	const preview = document.getElementById('avatarPreview') as HTMLImageElement
  
	if (file && preview) {
	  const reader = new FileReader()
	  reader.onload = () => {
		preview.src = reader.result as string
	  }
	  reader.readAsDataURL(file)
	}
  })
  
}