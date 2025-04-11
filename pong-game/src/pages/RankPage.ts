export function render() {
	document.body.innerHTML = `
	  <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center text-center px-4">
		<h1 class="text-3xl font-bold text-gray-800 mb-6">🏆 Tournament Rank</h1>
		<div class="bg-white shadow-lg rounded-xl w-full max-w-2xl p-6 space-y-4">
		  <div class="flex justify-between items-center border-b pb-2">
			<div class="flex items-center gap-3">
			  <img class="w-10 h-10 rounded-full" src="https://i.pravatar.cc/40?u=1" alt="avatar">
			  <span class="font-medium text-gray-800">PlayerOne</span>
			</div>
			<span class="text-gray-600 font-semibold">1250 pts</span>
		  </div>
		  <div class="flex justify-between items-center border-b pb-2">
			<div class="flex items-center gap-3">
			  <img class="w-10 h-10 rounded-full" src="https://i.pravatar.cc/40?u=2" alt="avatar">
			  <span class="font-medium text-gray-800">PlayerTwo</span>
			</div>
			<span class="text-gray-600 font-semibold">1190 pts</span>
		  </div>
		</div>
		<button onclick="location.hash = '#/main'" class="mt-8 px-6 py-2 bg-black text-white rounded-full hover:opacity-90 transition">
		  ← Back to Game
		</button>
	  </div>
	`
  }
  