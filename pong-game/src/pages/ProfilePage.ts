// src/pages/ProfilePage.ts
import { initStars } from '../components/initStars'

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <div class="max-w-4xl mx-auto py-16 px-6">
        <h1 class="text-4xl font-bold text-center mb-10 drop-shadow-xl">👤 Profile</h1>

        <div class="flex flex-col md:flex-row gap-10 items-center md:items-start">
          <div class="flex flex-col items-center w-full md:w-1/3">
            <img src="https://i.pravatar.cc/100?u=user" alt="avatar" class="w-32 h-32 rounded-full shadow-lg mb-4" />
            <button class="text-sm px-4 py-1 rounded-full bg-white text-black hover:bg-gray-200 transition">
              Upload Avatar
            </button>
          </div>

          <div class="flex-1 space-y-6">
            <div>
              <label class="block text-sm text-gray-300 mb-1">Display Name</label>
              <input type="text" value="Username42" class="w-full px-4 py-2 rounded-md bg-[#2a2a3d] border border-gray-600 text-white focus:outline-none" />
            </div>

            <div class="flex gap-4">
              <div class="flex-1">
                <p class="text-gray-400 text-sm mb-1">Wins</p>
                <div class="text-xl font-bold">12</div>
              </div>
              <div class="flex-1">
                <p class="text-gray-400 text-sm mb-1">Losses</p>
                <div class="text-xl font-bold">8</div>
              </div>
            </div>

            <button class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white hover:opacity-90 transition">
              Update Info
            </button>
          </div>
        </div>

        <h2 class="text-2xl font-bold mt-12 mb-4">Match History</h2>
        <div class="bg-[#1b1b2f] rounded-xl p-4 space-y-3">
          <div class="flex justify-between items-center border-b border-white/10 pb-2">
            <div>2024-04-11</div>
            <div class="text-lg font-bold">WIN</div>
          </div>
        </div>

		      <!-- 返回按钮 -->
		<div class="text-center mt-10 mb-10">
		<button 
			onclick="location.hash = '#/main'" 
			class="btn-glow px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md transition">
			← Back to Game
		</button>
		</div>
		
      </div>
    </div>
  `

  requestAnimationFrame(() => initStars())
}