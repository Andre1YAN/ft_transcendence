// src/pages/TwoFA.ts

export function render() {
	document.body.innerHTML = `
	  <div class="min-h-screen flex items-center justify-center bg-black text-white font-press px-4">
		<div class="bg-white/10 p-6 rounded-xl shadow-2xl w-full max-w-sm">
		  <h2 class="text-xl text-center mb-4">🔐 Enter 2FA Code</h2>
		  <form class="space-y-4">
			<input
				type="tel"
				autofocus
				inputmode="numeric"
				pattern="[0-9]*"
				placeholder="6-digit code"
				maxlength="6"
				class="w-full text-center border border-white/20 bg-transparent rounded px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
			/>
			<button
			  type="submit"
			  class="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-2 rounded hover:opacity-90 transition"
			>
			  Verify
			</button>
		  </form>
		</div>
	  </div>
	`
  
	document.querySelector('form')?.addEventListener('submit', async (e) => {
	  e.preventDefault()
	  const code = document.querySelector<HTMLInputElement>('input')?.value.trim()
	  const userId = localStorage.getItem('2fa_userId')
  
	  if (!code || !userId) {
		alert('Missing code or user info')
		return
	  }
  
	  try {
		const res = await fetch('https://localhost:3000/auth/2fa/verify', {
		  method: 'POST',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({ userId: Number(userId), code })
		})
  
		const data = await res.json()
		if (!res.ok) throw new Error(data.message)
  
		localStorage.removeItem('2fa_userId')
		localStorage.setItem('user', JSON.stringify(data.user))
		localStorage.setItem('authToken', data.token)
  
		location.hash = '#/main'
	  } catch (err: any) {
		alert(err.message || 'Invalid code')
	  }
	})
  }
  