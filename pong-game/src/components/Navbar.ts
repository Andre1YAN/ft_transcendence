export function renderNavbar() {
	return `
	  <div class="flex justify-between items-center mb-10">
		<!-- 左侧 Logo -->
		<div class="font-press text-3xl font-bold text-blue-200 tracking-widest">42 PONG</div>

		<!-- 右侧按钮组 -->
		<div class="flex items-center space-x-4 font-press text-sm font-medium text-white">

		  <!-- Game Mode Dropdown -->
		  <div class="relative">
			<button id="modeDropdownBtn" class="px-4 py-2 rounded-lg shadow transition bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-pink-300">
			  Game Mode ⌄
			</button>
			<div id="modeDropdownMenu" class="hidden absolute mt-2 w-60 bg-[#1b1b2f] border border-purple-500/30 backdrop-blur-md rounded-xl shadow-lg z-50">
			  <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition rounded-t-xl" data-mode="local">Double Local</button>
			  <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition rounded-b-xl" data-mode="tournament">Tournament</button>
			</div>
		  </div>

		  <!-- Avatar Dropdown -->
		  <div class="relative">
			<button id="avatarBtn" class="w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:ring-2 hover:ring-pink-400 transition">
			  <img src="https://i.pravatar.cc/40?u=user" alt="Avatar" class="w-full h-full object-cover" />
			</button>
			<div id="avatarMenu" class="hidden absolute right-0 mt-2 w-48 bg-[#1b1b2f] border border-purple-500/30 backdrop-blur-md rounded-xl shadow-lg z-50">
			  <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition rounded-t-xl" data-tab="profile">👤 Profile</button>
			  <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition" data-tab="history">📜 History</button>
			  <button class="w-full text-left px-4 py-2 text-white hover:bg-purple-500/20 transition rounded-b-xl" data-tab="friends">🤝 Friends</button>
			</div>
		  </div>

		</div>
	  </div>
	`
}
