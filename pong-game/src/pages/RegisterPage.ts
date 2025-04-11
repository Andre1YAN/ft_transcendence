export function render() {
	document.body.innerHTML = `
	  <div class="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4">
		<div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
		  <h2 class="text-3xl font-bold text-center mb-6 text-gray-800 font-press">Create Account</h2>
  
		  <!-- Google 注册 -->
		  <button class="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 mb-5 hover:bg-gray-100 transition text-black">
			<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" />
			<span class="font-medium">Sign up with Google</span>
		  </button>
  
		  <div class="relative mb-5 text-center text-gray-500 text-sm">
			<span class="bg-white px-2">or sign up with email</span>
			<div class="absolute left-0 right-0 top-1/2 border-t border-gray-300 transform -translate-y-1/2 z-[-1]"></div>
		  </div>
  
		  <form class="space-y-4">
			<input
			  type="email"
			  placeholder="Email address"
			  class="w-full bg-white text-black border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
			/>
			<input
			  type="password"
			  placeholder="Password"
			  class="w-full bg-white text-black border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
			/>
  
			<button
			  type="submit"
			  class="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white font-semibold py-2 rounded-md hover:opacity-90 transition"
			>
			  Register
			</button>
		  </form>
  
		  <p class="text-sm text-center text-gray-500 mt-6">
			Already have an account?
			<a href="#/login" class="text-orange-500 hover:underline">Login</a>
		  </p>
		</div>
	  </div>
	`
  }
  