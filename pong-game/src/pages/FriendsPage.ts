// src/pages/FriendsPage.ts
import { initStars } from '../components/initStars'

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <div class="max-w-4xl mx-auto py-16 px-6">
        <h1 class="text-4xl font-bold text-center mb-10 drop-shadow-xl">👥 Friends</h1>

        <div class="space-y-4">
          <!-- 示例好友条目 -->
          <div class="flex items-center justify-between bg-[#1b1b2f] p-4 rounded-xl shadow-md">
            <div class="flex items-center gap-4">
              <img src="https://i.pravatar.cc/50?u=alice" class="w-10 h-10 rounded-full" />
              <div>
                <p class="text-lg font-semibold">Alice</p>
                <p class="text-sm text-green-400">● Online</p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between bg-[#1b1b2f] p-4 rounded-xl shadow-md">
            <div class="flex items-center gap-4">
              <img src="https://i.pravatar.cc/50?u=bob" class="w-10 h-10 rounded-full" />
              <div>
                <p class="text-lg font-semibold">Bob</p>
                <p class="text-sm text-gray-400">● Offline</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-10 text-center">
          <button onclick="location.hash='#/main'" class="btn-glow px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md transition">

            ← Back to Game
          </button>
        </div>
      </div>
    </div>
  `

  requestAnimationFrame(() => initStars())
}