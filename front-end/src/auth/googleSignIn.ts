// src/auth/googleSignIn.ts
export function initializeGoogleSignIn() {
	// 注意替换成你在 Google Cloud Console 获得的 Client ID
	const clientID = '734621834535-529ck0a42jemmd051hbkhkara8nop328.apps.googleusercontent.com';
  
	// 初始化 Google 账户 API
	window.google.accounts.id.initialize({
	  client_id: clientID,
	  callback: handleCredentialResponse,
	});
  
	// 在指定的容器中渲染 Google 登录按钮
	window.google.accounts.id.renderButton(
	  document.getElementById('g_id_signin')!,
	  { theme: 'outline', size: 'large' } // 可根据需求调整样式
	);
  
	// 也可以调用 prompt() 让系统显示 One Tap
	// window.google.accounts.id.prompt();
  }
  
  // 当用户成功登录后，Google 会调用该回调，传回一个包含 ID token 的对象
  function handleCredentialResponse(response: { credential: string }) {
	console.log('Received Google ID token:', response.credential);
	// 将 token 发送给你的后端进行验证
	fetch('http://localhost:3000/auth/google', {
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
  