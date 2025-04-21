// src/auth/googleSignIn.ts

export function initializeGoogleSignIn() {
	const clientID = '734621834535-529ck0a42jemmd051hbkhkara8nop328.apps.googleusercontent.com';

	function tryInit() {
		if (window.google?.accounts?.id) {
			window.google.accounts.id.initialize({
				client_id: clientID,
				callback: handleCredentialResponse,
				use_fedcm_for_prompt: false
			});

			const btn = document.getElementById('g_id_signin');
			if (btn) {
				window.google.accounts.id.renderButton(btn, {
					theme: 'outline',
					size: 'large',
				});
			} else {
				console.warn('[GoogleSignIn] Sign-in button element not found');
			}

			// 如果你要使用 One Tap 弹窗的话
			// window.google.accounts.id.prompt();

			console.log('[GoogleSignIn] Google initialized ✅');
		} else {
			console.log('[GoogleSignIn] Google not ready, retrying in 100ms...');
			setTimeout(tryInit, 100);
		}
	}

	tryInit();
}

  // 当用户成功登录后，Google 会调用该回调，传回一个包含 ID token 的对象
  function handleCredentialResponse(response: { credential: string }) {
	console.log('Received Google ID token:', response.credential);
	// 将 token 发送给你的后端进行验证
	fetch('https://localhost:3000/auth/google', {
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({ idToken: response.credential })
	})
	  .then(res => res.json())
	  .then(data => {
		console.log('Authentication successful:', data);
		// 存储后端返回的自制令牌（例如 JWT），或更新前端状态
		localStorage.setItem('user', JSON.stringify(data.user));
		localStorage.setItem('authToken', data.token);
		// 跳转到主页面或其它页面
		location.hash = '#/main';
	  })
	  .catch(err => console.error('Authentication error:', err));
  }
  