export function render() {
	document.body.innerHTML = `
	  <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-center px-4">
		<h1 class="text-3xl font-bold text-gray-800 mb-6">📜 Match History</h1>
		<div class="bg-white shadow-lg rounded-xl w-full max-w-3xl p-6 space-y-4">
		  <div class="flex justify-between items-center border-b pb-2">
			<div class="flex items-center gap-2">
			  <img class="w-8 h-8 rounded-full" src="https://i.pravatar.cc/40?u=3" alt="left">
			  <span class="text-sm font-semibold">Alice</span>
			  <span class="text-gray-400 text-xs">vs</span>
			  <span class="text-sm font-semibold">Bob</span>
			  <img class="w-8 h-8 rounded-full" src="https://i.pravatar.cc/40?u=4" alt="right">
			</div>
			<div class="text-right">
			  <p class="text-sm text-gray-600">2024-04-11</p>
			  <p class="text-sm font-bold text-black">11 : 6</p>
			</div>
		  </div>
		</div>
		<button onclick="location.hash = '#/main'" class="mt-8 px-6 py-2 bg-black text-white rounded-full hover:opacity-90 transition">
		  ← Back to Game
		</button>
	  </div>
	`
  }
  