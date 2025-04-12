import { initStars } from '../components/initStars'
import Chart from 'chart.js/auto'

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press overflow-hidden px-4">
      <!-- 星空背景 -->
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <h1 class="text-3xl text-blue-200 mt-10 mb-6 text-center">📜 Match History</h1>

      <!-- 历史记录 -->
      <div class="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl shadow-xl max-w-3xl mx-auto p-6 space-y-4">
        <div class="flex justify-between items-center border-b border-white/10 pb-2">
          <div class="flex items-center gap-2">
            <img class="w-8 h-8 rounded-full" src="https://i.pravatar.cc/40?u=3" alt="left">
            <span class="text-sm">Alice</span>
            <span class="text-gray-400 text-xs">vs</span>
            <span class="text-sm">Bob</span>
            <img class="w-8 h-8 rounded-full" src="https://i.pravatar.cc/40?u=4" alt="right">
          </div>
          <div class="text-right">
            <p class="text-sm opacity-70">2024-04-11</p>
            <p class="text-sm font-bold text-white">11 : 6</p>
          </div>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white/5 rounded-xl p-4 shadow border border-white/10 text-center">
          <h3 class="text-lg text-blue-100 mb-2">🏆 Win Rate</h3>
          <p class="text-3xl font-bold text-green-400">65%</p>
        </div>
        <div class="bg-white/5 rounded-xl p-4 shadow border border-white/10 text-center">
          <h3 class="text-lg text-blue-100 mb-2">📈 Avg Score</h3>
          <p class="text-3xl font-bold text-yellow-300">10.2</p>
        </div>
        <div class="bg-white/5 rounded-xl p-4 shadow border border-white/10 text-center">
          <h3 class="text-lg text-blue-100 mb-2">📉 Avg Loss</h3>
          <p class="text-3xl font-bold text-red-400">8.1</p>
        </div>
      </div>

      <!-- 图表展示 -->
      <div class="mt-10 max-w-4xl mx-auto bg-white/5 rounded-xl p-6 shadow border border-white/10">
        <h2 class="text-center text-xl text-blue-200 mb-4">📊 Performance Overview</h2>
        <canvas id="historyChart" class="w-full h-64"></canvas>
      </div>

      <!-- 返回按钮 -->
		<div class="text-center mt-10 mb-10">
		<button 
			onclick="location.hash = '#/main'" 
			class="btn-glow px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md transition">
			← Back to Game
		</button>
		</div>
  `

  requestAnimationFrame(() => {
    initStars()

    // 模拟数据图表
    const ctx = document.getElementById('historyChart') as HTMLCanvasElement
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Match 1', 'Match 2', 'Match 3', 'Match 4', 'Match 5'],
        datasets: [
          {
            label: 'Your Score',
            data: [11, 9, 10, 12, 8],
            borderColor: 'rgba(59,130,246,1)',
            backgroundColor: 'rgba(59,130,246,0.3)',
			fill: false,
            tension: 0.4,
          },
          {
            label: 'Opponent Score',
            data: [6, 11, 8, 10, 12],
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
              color: '#fff'
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
  })
}