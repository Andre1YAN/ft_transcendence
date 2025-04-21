import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'
import { initializeGoogleSignIn } from '../auth/googleSignIn'

export function render() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-br from-[#0a0a1a] to-[#000000] flex items-center justify-center px-4 font-press">

      <!-- Language Switcher -->
      <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 text-sm sm:text-base">
        ${renderLanguageSwitcher()}
      </div>

      <!-- Background Animation -->
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <!-- Register Box -->
      <div class="backdrop-blur-md bg-white/10 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md text-white">
        <h2 class="text-2xl sm:text-3xl font-bold text-center mb-6">${t('signup.title')}</h2>

        <!-- Google 登录按钮容器（单独放置，不嵌套在 <button> 内） -->
		<div id="g_id_signin" class="mb-5"></div>


        <!-- 分割线 -->
        <div class="relative mb-5 text-center text-sm text-white/60">
          <span class="bg-[#0a0a1a] px-2 z-10 relative">${t('signup.or')}</span>
          <div class="absolute left-0 right-0 top-1/2 border-t border-white/20 transform -translate-y-1/2 z-0"></div>
        </div>

        <!-- 表单 -->
        <form id="registerForm" class="space-y-4">
          <input
            type="email"
            placeholder="${t('signup.emailPlaceholder')}"
            class="w-full bg-transparent border border-white/20 rounded-md px-4 py-2 sm:py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition placeholder:text-white/40 text-white"
          />
          <input
            type="password"
            placeholder="${t('signup.passwordPlaceholder')}"
            class="w-full bg-transparent border border-white/20 rounded-md px-4 py-2 sm:py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400 transition placeholder:text-white/40 text-white"
          />
		  <input type="checkbox" id="enable2fa" class="accent-orange-500" />
		<label for="enable2fa">${t('signup.enable2fa')}</label>
		<label
		for="avatarInput"
		class="block cursor-pointer bg-white/20 hover:bg-white/30 transition text-white px-4 py-2 rounded-md text-center text-sm"
		>
		${t('signup.upload')}
		</label>
		<input
		type="file"
		id="avatarInput"
		accept="image/*"
		class="hidden"
		/>
		<p id="uploadStatus" class="text-sm text-green-400 mt-2 hidden">✅ ${t('signup.uploadSuccess')}</p>

          <button
            type="submit"
            class="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold py-2 sm:py-2.5 rounded-md hover:opacity-90 transition"
          >
            ${t('signup.submit')}
          </button>
        </form>

        <!-- 登录提示 -->
        <p class="text-sm sm:text-base text-center text-white/60 mt-6">
          ${t('signup.footer')}
          <a href="#/login" class="text-orange-400 hover:underline">${t('signup.login')}</a>
        </p>
      </div>
    </div>
  `

  bindLanguageSwitcher()
  requestAnimationFrame(() => initStars())
  initializeGoogleSignIn()

  const fileInput = document.getElementById('avatarInput') as HTMLInputElement
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return

    try {
      await toBase64(file)  // 确保可读取
      showUploadStatus(true)
    } catch {
      showUploadStatus(false)
    }
  })

  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
	e.preventDefault()
  
	const inputs = document.querySelectorAll<HTMLInputElement>('form input')
	const email = inputs[0].value.trim()
	const password = inputs[1].value.trim()
	const avatarFile = (document.getElementById('avatarInput') as HTMLInputElement)?.files?.[0]
	const enable2FA = (document.getElementById('enable2fa') as HTMLInputElement)?.checked
  
	if (!email || !password) {
	  alert('Email and password are required!')
	  return
	}
  
	let avatarBase64: string | undefined
	if (avatarFile) {
	  avatarBase64 = await toBase64(avatarFile)
	}
  
	try {
	  const res = await fetch('https://localhost:3000/auth/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
		  email,
		  password,
		  displayName: email.split('@')[0],
		  avatarBase64, // optional
		  is2FAEnabled: enable2FA
		})
	  })
  
	  const data = await res.json()
	  if (!res.ok) throw new Error(data.message || 'Registration failed.')
  
	  alert(`Welcome, ${data.displayName}!`)
	  location.hash = '#/login'
	} catch (err: any) {
	  alert(err.message || 'Something went wrong.')
	}
  })
  
  // 将图片转为 base64
  function toBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
	  const reader = new FileReader()
	  reader.readAsDataURL(file)
	  reader.onload = () => resolve(reader.result as string)
	  reader.onerror = reject
	})
  }
}

function showUploadStatus(success: boolean) {
	const el = document.getElementById('uploadStatus')
	if (!el) return
  
	el.textContent = success
	  ? '✅ ' + t('signup.uploadSuccess')
	  : '❌ ' + t('signup.uploadFail')
  
	el.classList.remove('hidden')
	el.className = `text-sm mt-2 ${success ? 'text-green-400' : 'text-red-400'}`
  
	setTimeout(() => {
	  el?.classList.add('hidden')
	}, 2000)
  }
  