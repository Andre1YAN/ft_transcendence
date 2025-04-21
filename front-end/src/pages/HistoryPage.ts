import { initStars } from '../components/initStars'
import Chart from 'chart.js/auto'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press overflow-hidden px-4">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <div class="absolute top-6 right-6 z-50">
        ${renderLanguageSwitcher()}
      </div>

      <h1 class="text-3xl text-blue-200 mt-10 mb-6 text-center">${t('history.title')}</h1>

      <!-- 历史战绩 -->
      <div id="matchList" class="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl shadow-xl max-w-3xl mx-auto p-6 space-y-4 max-h-[300px] overflow-y-auto"></div>

      <!-- 数据概览 -->
      <div class="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white/5 rounded-xl p-4 shadow border border-white/10 text-center">
          <h3 class="text-lg text-blue-100 mb-2">${t('history.winRate')}</h3>
          <p id="winRate" class="text-3xl font-bold text-green-400">--%</p>
        </div>
        <div class="bg-white/5 rounded-xl p-4 shadow border border-white/10 text-center">
          <h3 class="text-lg text-blue-100 mb-2">${t('history.avgScore')}</h3>
          <p id="avgScore" class="text-3xl font-bold text-yellow-300">--</p>
        </div>
        <div class="bg-white/5 rounded-xl p-4 shadow border border-white/10 text-center">
          <h3 class="text-lg text-blue-100 mb-2">${t('history.avgLoss')}</h3>
          <p id="avgLoss" class="text-3xl font-bold text-red-400">--</p>
        </div>
      </div>

      <!-- 折线图 -->
      <div class="mt-10 max-w-4xl mx-auto bg-white/5 rounded-xl p-6 shadow border border-white/10">
        <h2 class="text-center text-xl text-blue-200 mb-4">${t('history.performance')}</h2>
        <div class="w-full overflow-x-auto">
          <div class="min-w-[600px]">
            <canvas id="historyChart" class="w-full aspect-[2/1]"></canvas>
          </div>
        </div>
      </div>

      <!-- 返回按钮 -->
      <div class="text-center mt-10 mb-10">
        <button 
          onclick="location.hash = '#/main'" 
          class="btn-glow px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md transition">
          ${t('history.back')}
        </button>
      </div>
    </div>
  `

  bindLanguageSwitcher()

  requestAnimationFrame(async () => {
    initStars()

    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user?.id) {
      alert('User not logged in.')
      return
    }

    try {
      const res = await fetch(`https://localhost:3000/users/${user.id}/matches`, {
        headers: {'Authorization': `Bearer ${localStorage.getItem('authToken')}`}
      }
      )
      const matches = await res.json()

      const historyContainer = document.getElementById('matchList')
      if (historyContainer) {
        historyContainer.innerHTML = matches.map((m: any) => {
          // 判断是否为AI Bot或Guest用户
          //const isAIBot = m.user2.email === 'ai@fake.com' || m.user1.email === 'ai@fake.com';
          //const isGuest = m.user2.email === 'guest@fake.com' || m.user1.email === 'guest@fake.com';
          
          // 为特殊用户添加样式
          let user1Class = '';
          let user2Class = '';
          
          if (m.user1.email === 'ai@fake.com') {
            user1Class = 'text-red-400 font-bold';
          } else if (m.user1.email === 'guest@fake.com') {
            user1Class = 'text-green-400 font-bold';
          }
          
          if (m.user2.email === 'ai@fake.com') {
            user2Class = 'text-red-400 font-bold';
          } else if (m.user2.email === 'guest@fake.com') {
            user2Class = 'text-green-400 font-bold';
          }
          
          return `
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <div class="flex items-center gap-2">
              <img class="w-8 h-8 rounded-full" src="${m.user1.avatarUrl}" alt="left">
              <span class="text-sm ${user1Class}">${m.user1.displayName}</span>
              <span class="text-gray-400 text-xs">${t('history.vs')}</span>
              <span class="text-sm ${user2Class}">${m.user2.displayName}</span>
              <img class="w-8 h-8 rounded-full" src="${m.user2.avatarUrl}" alt="right">
            </div>
            <div class="text-right">
              <p class="text-sm opacity-70">${new Date(m.playedAt).toLocaleDateString()}</p>
              <p class="text-sm font-bold text-white">${m.score1} : ${m.score2}</p>
            </div>
          </div>
        `}).join('')
      }

      const yourScores = []
      const opponentScores = []
      const labels = []
      let wins = 0, totalYour = 0, totalOpp = 0

      for (let i = 0; i < matches.length; i++) {
        const m = matches[i]
        const isUser1 = m.user1.id === user.id
        const yourScore = isUser1 ? m.score1 : m.score2
        const oppScore = isUser1 ? m.score2 : m.score1

        yourScores.push(yourScore)
        opponentScores.push(oppScore)
        labels.push(`Match ${i + 1}`)

        totalYour += yourScore
        totalOpp += oppScore
        if (yourScore > oppScore) wins++
      }

      const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0
      const avgScore = matches.length ? (totalYour / matches.length).toFixed(1) : '0'
      const avgLoss = matches.length ? (totalOpp / matches.length).toFixed(1) : '0'

      document.getElementById('winRate')!.textContent = `${winRate}%`
      document.getElementById('avgScore')!.textContent = avgScore
      document.getElementById('avgLoss')!.textContent = avgLoss

      const ctx = document.getElementById('historyChart') as HTMLCanvasElement
      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: t('history.yourScore'),
              data: yourScores,
              borderColor: 'rgba(59,130,246,1)',
              backgroundColor: 'rgba(59,130,246,0.3)',
              fill: false,
              tension: 0.4,
            },
            {
              label: t('history.opponentScore'),
              data: opponentScores,
              borderColor: 'rgba(239,68,68,1)',
              backgroundColor: 'rgba(239,68,68,0.2)',
              fill: false,
              tension: 0.4,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: '#fff',
                font: { size: 12, family: 'sans-serif' }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#ccc' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
              ticks: { color: '#ccc' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            }
          }
        }
      })
    } catch (err) {
      console.error('Failed to load match history', err)
      alert('Failed to load match history.')
    }
  })
}
