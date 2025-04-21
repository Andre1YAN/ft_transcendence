// src/pages/MainPage.ts

import { renderNavbar, bindNavbarEvents } from '../components/Navbar'
import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { handlePresenceUpdate } from './FriendsPage'
import { ChannelDTO } from '../types/channel';
import { initGlobalSocket } from '../ws/globalSocket';

// 频道部分 HTML
function renderChannelSection() {
  return `
    <section class="max-w-6xl mx-auto mt-12 backdrop-blur-sm bg-gray-800/40 rounded-2xl p-6 shadow-xl border border-gray-700/50">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">${t('channel.title')}</h2>
        <div class="text-xs text-gray-400">${t('channel.subtitle')}</div>
      </div>
      
      <div class="flex flex-col md:flex-row gap-6">
        <!-- 频道列表侧边栏 -->
        <div class="w-full md:w-1/4 flex flex-col">
          <div class="bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 shadow-md">
            <div class="flex justify-between items-center bg-gray-800/70 p-3 border-b border-gray-700/50">
              <h3 class="font-medium text-gray-200">${t('channel.my_channels')}</h3>
              <div class="flex space-x-1">
                <button id="create-channel-btn" class="group text-xs flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span class="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-1.5 transition-all duration-300 ease-in-out">${t('channel.create')}</span>
                </button>
                <button id="find-channel-btn" class="group text-xs flex items-center justify-center bg-purple-600 hover:bg-purple-500 p-1.5 rounded-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span class="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-1.5 transition-all duration-300 ease-in-out">${t('channel.search')}</span>
                </button>
              </div>
            </div>
            
            <div id="channel-list" class="space-y-1 max-h-[40vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <!-- 频道列表将通过JS填充 -->
              <div class="text-sm text-gray-400 text-center py-6 animate-pulse">
                <svg class="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                ${t('channel.loading')}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 聊天主区域 -->
        <div id="channel-chat-area" class="w-full md:w-3/4 flex flex-col bg-gray-900/60 rounded-xl overflow-hidden border border-gray-800 shadow-md">
          <!-- 频道信息头部 -->
          <div id="channel-info" class="bg-gray-800/70 p-3 border-b border-gray-700/50">
            <p class="text-gray-400 text-sm flex items-center">
              <svg class="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              ${t('channel.select_channel')}
            </p>
          </div>
          
          <!-- 消息显示区域 -->
          <div id="channel-messages" class="flex-grow overflow-y-auto max-h-[50vh] bg-gray-950/40 p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <!-- 消息区域将通过JS填充 -->
            <div class="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <svg class="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <p>${t('channel.select_or_join')}</p>
              <p class="text-xs mt-2 max-w-md">${t('channel.chat_tips')}</p>
            </div>
          </div>
          
          <!-- 消息输入区域 -->
          <div id="channel-input" class="p-3 border-t border-gray-800 bg-gray-800/70">
            <div class="flex gap-2 items-center">
              <input 
                type="text" 
                id="channel-message-input" 
                class="flex-grow bg-gray-900/70 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none"
                placeholder="${t('channel.message_placeholder')}"
                disabled
              />
              <button 
                id="send-channel-message-btn" 
                class="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-4 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                disabled
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                ${t('channel.send')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function render() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const avatarUrl = user.avatarUrl || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'
  const displayName = user.displayName || 'Guest'

  // 确保WebSocket连接已建立
  if (user.id) {
    if (!window.globalSocket || window.globalSocket.getState() !== 'OPEN') {
      console.log(t('websocket.connection_init'))
      window.globalSocket = initGlobalSocket(user.id)
    } else {
      console.log(`${t('websocket.already_connected')}: ${window.globalSocket.getState()}`)
    }
  }

  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#0f172a] to-[#0a0a1a] text-white font-press px-4 sm:px-6 pt-6">
      <!-- 背景动画 -->
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

      <!-- 顶部导航栏 -->
      ${renderNavbar()}

      <!-- 欢迎区域 -->
      <section class="max-w-4xl mx-auto mt-10 sm:mt-14 text-center px-4">
        <img src="${avatarUrl}" class="w-24 h-24 mx-auto rounded-full shadow-lg mb-2" />
        <h1 class="text-2xl font-bold">${t('main.welcome')}, ${displayName}!</h1>
        <p class="text-white/60 text-sm sm:text-base md:text-lg">
          ${t('main.description')}
        </p>
      </section>

      <!-- 功能入口 -->
      <section class="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-10 sm:mt-12 text-center px-4">
        <button 
          onclick="location.hash='#/local'" 
          class="w-full sm:w-60 px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition shadow-lg text-base sm:text-lg font-bold"
        >
          🎮 ${t('main.playLocal')}
        </button>

		<button 
			onclick="location.hash='#/ai_game'" 
			class="w-full sm:w-60 px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 transition shadow-lg text-base sm:text-lg font-bold"
		>
		  🤖 ${t('main.playAI')}
		</button>
        <button 
          onclick="location.hash='#/tournament_setup'" 
          class="w-full sm:w-60 px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 hover:opacity-90 transition shadow-lg text-base sm:text-lg font-bold"
        >
          🏆 ${t('main.playTournament')}
        </button>
      </section>

      <!-- 最近记录或公告 -->
      <section class="max-w-3xl mx-auto mt-12 sm:mt-16 text-center text-sm sm:text-base text-white/70 px-4">
        <h2 class="text-lg sm:text-xl font-semibold mb-2">${t('main.recent')}</h2>
        <p>✨ ${t('main.tip')}</p>
      </section>
      
      <!-- 频道聊天部分 -->
      ${renderChannelSection()}
    </div>
  `

  // 绑定导航栏相关事件
  bindNavbarEvents()

  if (window.globalSocket) {
    window.globalSocket.off('presence', handlePresenceUpdate)  // 防止重复注册
    window.globalSocket.on('presence', handlePresenceUpdate)
  }  

  // 初始化频道功能
  initChannelFeatures()

  // 初始化背景效果
  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}

// 频道功能初始化
function initChannelFeatures() {
  loadChannels()
  
  // 绑定创建频道按钮
  document.getElementById('create-channel-btn')?.addEventListener('click', showCreateChannelDialog)
  
  // 绑定查找频道按钮
  document.getElementById('find-channel-btn')?.addEventListener('click', showSearchChannelDialog)
  
  // 绑定发送消息按钮
  document.getElementById('send-channel-message-btn')?.addEventListener('click', sendChannelMessage)
  
  // 消息输入框回车发送
  document.getElementById('channel-message-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChannelMessage()
    }
  })
  
  // 监听WebSocket事件 - 先移除已有监听器再添加新的
  if (window.globalSocket) {
    console.log(`${t('websocket.already_connected')}: ${window.globalSocket.getState()}`);
    console.log(t('websocket.registration_failed'));
    
    // 频道消息
    window.globalSocket.off('channel_message', handleChannelMessage);
    window.globalSocket.on('channel_message', handleChannelMessage);
    
    // 用户加入频道事件
    window.globalSocket.off('channel_user_joined', handleChannelUserJoined);
    window.globalSocket.on('channel_user_joined', handleChannelUserJoined);
    
    // 用户离开频道事件
    window.globalSocket.off('channel_user_left', handleChannelUserLeft);
    window.globalSocket.on('channel_user_left', handleChannelUserLeft);
    
    // 用户被踢出频道事件
    window.globalSocket.off('channel_user_kicked', handleChannelUserKicked);
    window.globalSocket.on('channel_user_kicked', handleChannelUserKicked);
    
    // 当前用户被踢出频道事件
    window.globalSocket.off('you_were_kicked', handleUserWasKicked);
    window.globalSocket.on('you_were_kicked', handleUserWasKicked);
    
    // 管理员变更事件
    window.globalSocket.off('channel_admin_changed', handleChannelAdminChanged);
    window.globalSocket.on('channel_admin_changed', handleChannelAdminChanged);
    
    // 用户被禁言事件
    window.globalSocket.off('channel_user_muted', handleChannelUserMuted);
    window.globalSocket.on('channel_user_muted', handleChannelUserMuted);
    
    // 用户被解除禁言事件
    window.globalSocket.off('channel_user_unmuted', handleChannelUserUnmuted);
    window.globalSocket.on('channel_user_unmuted', handleChannelUserUnmuted);
    
    // 当前用户被禁言事件
    window.globalSocket.off('you_were_muted', handleUserWasMuted);
    window.globalSocket.on('you_were_muted', handleUserWasMuted);
    
    // 当前用户被解除禁言事件
    window.globalSocket.off('you_were_unmuted', handleUserWasUnmuted);
    window.globalSocket.on('you_were_unmuted', handleUserWasUnmuted);
    
    console.log(t('websocket.event_registered'));
  } else {
    console.warn(t('websocket.not_initialized'));
  }
}

// 加载用户频道列表
function loadChannels() {
  const channelListEl = document.getElementById('channel-list');
  if (!channelListEl) return;
  
  // 清空现有频道列表，确保被踢出的频道不会继续显示
  channelListEl.innerHTML = `
    <div class="text-sm text-gray-400 text-center py-6 animate-pulse">
      <svg class="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
      ${t('channel.loading')}
    </div>
  `;
  
  console.log(`[Debug] ${t('websocket.channel_message.loading')}`);
  
  fetch('https://localhost:3000/api/channels/my-channels', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  })
  .then(res => {
    if (!res.ok) {
      throw new Error(`${t('websocket.connection_error')}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  })
  .then(data => {
    console.log(`[Debug] ${t('channel.load_success')}:`, data.length);
    
    // 确保返回的数据是数组
    const channels = Array.isArray(data) ? data : [];
    
    if (channels.length === 0) {
      channelListEl.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          <p class="text-sm">${t('channel.no_channels')}</p>
          <p class="text-xs mt-2">${t('channel.create_or_join')}</p>
        </div>
      `;
      return;
    }
    
    channelListEl.innerHTML = channels.map((channel: ChannelDTO) => `
      <div class="channel-item p-2.5 rounded-lg hover:bg-gray-800/70 cursor-pointer transition-colors duration-200 ${currentChannelId === channel.id ? 'bg-gray-800/90 border-l-2 border-indigo-500 pl-2' : ''}" data-id="${channel.id}">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${channel.isPrivate ? 'from-yellow-500 to-orange-600' : 'from-blue-500 to-indigo-600'} flex items-center justify-center">
              <span class="text-xs font-bold">${channel.name.substring(0, 2).toUpperCase()}</span>
            </div>
            <span class="font-medium text-sm truncate max-w-[100px]">${channel.name}</span>
          </div>
          ${channel.isAdmin ? 
            `<span class="text-xs bg-yellow-600/80 rounded px-1.5 py-0.5 flex items-center"><svg class="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 10a6 6 0 0012 0c0-.352-.035-.696-.1-1.028A5.001 5.001 0 0010 7z" clip-rule="evenodd"></path></svg>${t('channel.admin')}</span>` : 
            ''}
        </div>
        ${channel.description ? 
          `<p class="text-xs text-gray-400 mt-1 truncate">${channel.description}</p>` : 
          ''}
      </div>
    `).join('');
    
    // 绑定频道点击事件
    document.querySelectorAll('.channel-item').forEach(item => {
      item.addEventListener('click', () => {
        const channelId = item.getAttribute('data-id');
        if (channelId) {
          // 移除所有选中样式
          document.querySelectorAll('.channel-item').forEach(el => {
            el.classList.remove('bg-gray-800/90', 'border-l-2', 'border-indigo-500', 'pl-2');
            el.classList.add('pl-2.5');
          });
          
          // 添加选中样式
          item.classList.add('bg-gray-800/90', 'border-l-2', 'border-indigo-500');
          item.classList.remove('pl-2.5');
          item.classList.add('pl-2');
          
          loadChannelMessages(channelId);
        }
      });
    });
  })
  .catch(err => {
    console.error(`${t('channel.load_error')}:`, err);
    channelListEl.innerHTML = `
      <div class="text-center py-6">
        <svg class="w-8 h-8 mx-auto mb-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <p class="text-sm text-red-400">${t('channel.load_error')}</p>
      </div>
    `;
  });
}

// 创建频道对话框
function showCreateChannelDialog() {
  // 创建模态框
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
  modal.innerHTML = `
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">${t('channel.title')}</h3>
      
      <form id="create-channel-form">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">${t('channel.channel_name')}</label>
          <input type="text" id="channel-name" class="w-full px-3 py-2 bg-gray-700 rounded" required>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">${t('channel.description')}</label>
          <textarea id="channel-description" class="w-full px-3 py-2 bg-gray-700 rounded" rows="2"></textarea>
        </div>
        
        <div class="mb-4 flex items-center">
          <input type="checkbox" id="channel-private" class="mr-2">
          <label class="text-sm">${t('channel.private')}</label>
        </div>
        
        <div id="password-group" class="mb-4 hidden">
          <label class="block text-sm font-medium mb-1">${t('channel.set_password')}</label>
          <input type="password" id="channel-password" class="w-full px-3 py-2 bg-gray-700 rounded">
        </div>
        
        <div class="flex justify-end gap-3">
          <button type="button" id="cancel-create" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">${t('channel.cancel')}</button>
          <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded">${t('channel.create')}</button>
        </div>
      </form>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // 私有频道选项切换密码输入
  const privateCheckbox = document.getElementById('channel-private')
  const passwordGroup = document.getElementById('password-group')
  
  privateCheckbox?.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).checked) {
      passwordGroup?.classList.remove('hidden')
    } else {
      passwordGroup?.classList.add('hidden')
    }
  })
  
  // 取消按钮
  document.getElementById('cancel-create')?.addEventListener('click', () => {
    document.body.removeChild(modal)
  })
  
  // 表单提交
  document.getElementById('create-channel-form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    
    const nameInput = document.getElementById('channel-name') as HTMLInputElement
    const descriptionInput = document.getElementById('channel-description') as HTMLTextAreaElement
    const privateCheckbox = document.getElementById('channel-private') as HTMLInputElement
    const passwordInput = document.getElementById('channel-password') as HTMLInputElement
    
    const data = {
      name: nameInput.value.trim(),
      description: descriptionInput.value.trim(),
      isPrivate: privateCheckbox.checked,
      password: privateCheckbox.checked ? passwordInput.value : undefined
    }
    
    fetch('https://localhost:3000/api/channels/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
      if (response.id) {
        // 创建成功，关闭模态框并刷新频道列表
        document.body.removeChild(modal)
        loadChannels()
      } else {
        alert(response.message || t('channel.create_error'))
      }
    })
    .catch(err => {
      console.error(`${t('channel.create_error')}:`, err);
      alert(t('channel.create_error'));
    })
  })
}

// 搜索频道对话框
function showSearchChannelDialog() {
  // 创建模态框
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
  modal.innerHTML = `
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
      <h3 class="text-xl font-bold mb-4">${t('channel.search')}</h3>
      
      <div class="mb-4">
        <div class="flex gap-2">
          <input type="text" id="search-channel-input" placeholder="${t('channel.search_placeholder')}" class="flex-grow px-3 py-2 bg-gray-700 rounded">
          <button id="search-channel-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded">${t('channel.search')}</button>
        </div>
      </div>
      
      <div id="search-results" class="max-h-60 overflow-y-auto mb-4">
        <p class="text-gray-400 text-center py-2">${t('channel.search_tip')}</p>
      </div>
      
      <div id="join-form" class="hidden mb-4">
        <h4 class="font-medium mb-2">${t('channel.join')}</h4>
        <div id="password-input-group" class="mb-2 hidden">
          <label class="block text-sm mb-1">${t('channel.enter_password')}:</label>
          <input type="password" id="join-password" class="w-full px-3 py-2 bg-gray-700 rounded">
        </div>
        <button id="join-channel-btn" class="w-full py-2 bg-green-600 hover:bg-green-500 rounded">${t('channel.join')}</button>
      </div>
      
      <div class="flex justify-end">
        <button id="close-search" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">${t('channel.close')}</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  let selectedChannelId: string | null = null
  let isPrivateChannel = false
  
  // 搜索按钮
  document.getElementById('search-channel-btn')?.addEventListener('click', () => {
    const searchInput = document.getElementById('search-channel-input') as HTMLInputElement
    const query = searchInput.value.trim()
    
    if (!query) return
    
    const resultsContainer = document.getElementById('search-results')
    if (!resultsContainer) return
    
    resultsContainer.innerHTML = `<p class="text-center py-2">${t('channel.loading')}</p>`
    
    fetch(`https://localhost:3000/api/channels/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
    .then(res => res.json())
    .then(channels => {
      if (channels.length === 0) {
        resultsContainer.innerHTML = `<p class="text-center py-2 text-gray-400">${t('channel.no_matches')}</p>`
        return
      }
      
      resultsContainer.innerHTML = channels.map((channel: any) => `
        <div class="channel-search-item p-2 rounded hover:bg-gray-700 cursor-pointer mb-1" data-id="${channel.id}" data-private="${channel.isPrivate}">
          <div class="flex justify-between items-center">
            <span class="font-medium">${channel.name}</span>
            <span class="text-xs text-gray-400">${channel._count?.members || 0} ${t('channel.members')}</span>
          </div>
          ${channel.description ? `<p class="text-xs text-gray-400">${channel.description}</p>` : ''}
          ${channel.isPrivate ? `<p class="text-xs text-yellow-500">🔒 ${t('channel.private')}</p>` : ''}
        </div>
      `).join('')
      
      // 绑定频道点击事件
      document.querySelectorAll('.channel-search-item').forEach(item => {
        item.addEventListener('click', () => {
          // 移除之前的选中状态
          document.querySelectorAll('.channel-search-item').forEach(i => 
            i.classList.remove('bg-blue-900/30', 'border', 'border-blue-500'))
          
          // 添加选中状态
          item.classList.add('bg-blue-900/30', 'border', 'border-blue-500')
          
          selectedChannelId = item.getAttribute('data-id')
          isPrivateChannel = item.getAttribute('data-private') === 'true'
          
          // 显示加入表单
          const joinForm = document.getElementById('join-form')
          const passwordGroup = document.getElementById('password-input-group')
          
          if (joinForm) joinForm.classList.remove('hidden')
          
          if (passwordGroup) {
            if (isPrivateChannel) {
              passwordGroup.classList.remove('hidden')
            } else {
              passwordGroup.classList.add('hidden')
            }
          }
        })
      })
    })
    .catch(err => {
      console.error(`${t('channel.search_error')}:`, err);
      resultsContainer.innerHTML = `<p class="text-center py-2 text-red-400">${t('channel.search_error')}</p>`;
    })
  })
  
  // 加入频道按钮
  document.getElementById('join-channel-btn')?.addEventListener('click', () => {
    if (!selectedChannelId) return
    
    const passwordInput = document.getElementById('join-password') as HTMLInputElement
    const password = isPrivateChannel ? passwordInput.value : undefined
    
    fetch('https://localhost:3000/api/channels/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        channelId: selectedChannelId,
        password
      })
    })
    .then(res => res.json())
    .then(response => {
      if (response.success || (response.message && response.message.includes(t('channel.join_success')))) {
        // 显示成功提示
        alert(t('channel.join_success'));
        
        // 保存选中的频道ID
        const joinedChannelId = selectedChannelId;
        
        // 不关闭模态框，先直接加载频道消息
        if (joinedChannelId) {
          currentChannelId = joinedChannelId;
          loadChannelMessages(joinedChannelId);
        }
        
        // 立即刷新频道列表（不等待WebSocket通知）
        loadChannels();
        
        // 更新搜索结果中该频道的样式，表明已加入
        const channelSearchItem = document.querySelector(`.channel-search-item[data-id="${joinedChannelId}"]`);
        if (channelSearchItem) {
          channelSearchItem.classList.add('bg-green-900/30', 'border', 'border-green-500');
          const joinStatusIndicator = document.createElement('span');
          joinStatusIndicator.className = 'text-xs bg-green-600 rounded px-1 ml-1';
          joinStatusIndicator.textContent = t('channel.joined');
          channelSearchItem.querySelector('div:first-child')?.appendChild(joinStatusIndicator);
        }
      } else {
        alert(response.message || t('channel.join_error'));
      }
    })
    .catch(err => {
      console.error(`${t('channel.join_error')}:`, err);
      alert(t('channel.join_error'));
    })
  })
  
  // 回车搜索
  document.getElementById('search-channel-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('search-channel-btn')?.click()
    }
  })
  
  // 关闭按钮
  document.getElementById('close-search')?.addEventListener('click', () => {
    document.body.removeChild(modal)
  })
}

// 当前选中的频道ID
let currentChannelId: string | null = null

// 跟踪已显示的消息ID，防止重复显示
const displayedMessageIds = new Set<number | string>();

// 加载频道消息
function loadChannelMessages(channelId: string) {
  currentChannelId = channelId;
  
  // 清空已显示消息的记录
  displayedMessageIds.clear();
  console.log(t('websocket.channel_message.cleared'));
  
  const messagesContainer = document.getElementById('channel-messages')
  const channelInfoEl = document.getElementById('channel-info')
  const messageInput = document.getElementById('channel-message-input') as HTMLInputElement
  const sendButton = document.getElementById('send-channel-message-btn') as HTMLButtonElement
  
  if (!messagesContainer || !channelInfoEl) return
  
  messagesContainer.innerHTML = `<div class="text-center py-4">${t('channel.loading')}</div>`
  channelInfoEl.innerHTML = `<p class="text-gray-400 text-sm">${t('channel.loading')}</p>`
  
  // 启用输入框
  if (messageInput) messageInput.disabled = true
  if (sendButton) sendButton.disabled = true
  
  // 确保WebSocket连接已建立
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.id && (!window.globalSocket || window.globalSocket.getState() !== 'OPEN')) {
    console.log(t('websocket.connection_init'))
    window.globalSocket = initGlobalSocket(user.id)
  }
  
  fetch(`https://localhost:3000/api/channels/${channelId}/messages`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  })
  .then(res => res.json())
  .then(data => {
    if (!data.channelInfo) {
      messagesContainer.innerHTML = `<div class="text-center py-4 text-red-400">${t('channel.cannot_load')}</div>`;
      return;
    }
    
    // 更新频道信息
    updateChannelInfoBar(data);
    
    // 检查当前用户是否被禁言
    const userId = user.id;
    const currentMember = data.members.find((m: any) => m.userId === userId);
    
    // 更新消息列表
    if (data.messages.length === 0) {
      messagesContainer.innerHTML = `<div class="text-center py-4 text-gray-400">${t('channel.no_messages')}</div>`;
    } else {
      messagesContainer.innerHTML = data.messages.map((msg: any) => renderMessage(msg, userId)).join('');
      
      // 滚动到底部
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // 启用/禁用输入框
    if (messageInput && sendButton) {
      if (currentMember && currentMember.isMuted) {
        const muteEndTime = new Date(currentMember.muteEndTime);
        const now = new Date();
        
        if (muteEndTime > now) {
          messageInput.disabled = true;
          sendButton.disabled = true;
          messageInput.placeholder = `${t('channel.muted_until').replace('{time}', muteEndTime.toLocaleString())}`;
        } else {
          messageInput.disabled = false;
          sendButton.disabled = false;
          messageInput.placeholder = t('channel.message_placeholder');
        }
      } else {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.placeholder = t('channel.message_placeholder');
      }
    }
  })
  .catch(err => {
    console.error('加载频道消息失败:', err)
    messagesContainer.innerHTML = `<div class="text-center py-4 text-red-400">${t('channel.load_error')}</div>`
  })
}

// 检查当前用户是否为管理员
function currentUserIsAdmin(members: any[]) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userId = user.id
  return members.some(m => m.userId === userId && m.isAdmin)
}

// 渲染单条消息
function renderMessage(message: any, currentUserId: number) {
  const isCurrentUser = message.user.id === currentUserId;
  const time = new Date(message.createdAt).toLocaleTimeString();
  
  return `
    <div class="message my-3 group ${isCurrentUser ? 'text-right' : 'text-left'} animate-fadeIn">
      <div class="inline-flex max-w-[85%] items-start">
        ${!isCurrentUser ? 
          `<div class="w-8 h-8 rounded-full overflow-hidden mr-2 mt-1 flex-shrink-0">
            <img src="${message.user.avatarUrl || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + message.user.displayName}" 
                 alt="${message.user.displayName}" 
                 class="w-full h-full object-cover" 
                 onerror="this.src='https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback'" />
          </div>` : ''}
          
        <div class="${isCurrentUser ? 
          'bg-gradient-to-r from-indigo-600 to-blue-600 text-white' : 
          'bg-gray-800/90 text-gray-100'} 
          rounded-2xl px-4 py-2 shadow-md transition-all duration-200 hover:shadow-lg
          ${isCurrentUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}">
          <div class="flex items-center gap-1.5 mb-1 text-xs ${isCurrentUser ? 'justify-end' : 'justify-start'}">
            <span class="font-medium ${isCurrentUser ? 'text-blue-200' : 'text-indigo-300'}">
              ${message.user.displayName}
            </span>
            <span class="opacity-70">${time}</span>
          </div>
          <div class="break-words text-sm">${message.content}</div>
        </div>
        
        ${isCurrentUser ? 
          `<div class="w-8 h-8 rounded-full overflow-hidden ml-2 mt-1 flex-shrink-0">
            <img src="${message.user.avatarUrl || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' + message.user.displayName}" 
                 alt="${message.user.displayName}" 
                 class="w-full h-full object-cover" 
                 onerror="this.src='https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback'" />
          </div>` : ''}
      </div>
    </div>
  `;
}

// 发送频道消息
function sendChannelMessage() {
  if (!currentChannelId) return
  
  const messageInput = document.getElementById('channel-message-input') as HTMLInputElement
  const sendButton = document.getElementById('send-channel-message-btn') as HTMLButtonElement
  const content = messageInput.value.trim()
  
  if (!content) return
  
  // 更新UI状态
  messageInput.disabled = true
  sendButton.disabled = true
  sendButton.textContent = t('channel.sending')
  
  // 清空输入框
  messageInput.value = ''
  
  // 获取用户信息
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (!user.id) {
    console.error('未找到用户信息，无法发送消息')
    alert(t('channel.send_error'))
    resetSendUI()
    return
  }
  
  // 检查WebSocket连接
  if (!window.globalSocket) {
    console.log('未找到全局WebSocket连接，尝试重新初始化')
    window.globalSocket = initGlobalSocket(user.id)
  }
  
  // 实际发送消息的函数
  const attemptSend = (retryCount = 0) => {
    // 如果重试次数超过3次，则放弃
    if (retryCount >= 3) {
      console.error('发送消息失败：重试次数已达上限')
      alert(t('channel.send_error'))
      resetSendUI()
      return
    }
    
    // 如果WebSocket连接未就绪，等待连接
    if (!window.globalSocket || window.globalSocket.getState() !== 'OPEN') {
      console.log(`WebSocket连接状态: ${window.globalSocket?.getState() || 'DISCONNECTED'}，尝试重连 (尝试 ${retryCount + 1}/3)`)
      
      if (window.globalSocket) {
        window.globalSocket.reset()
      } else {
        window.globalSocket = initGlobalSocket(user.id)
      }
      
      // 延迟后重试
      setTimeout(() => attemptSend(retryCount + 1), 1000)
      return
    }
    
    // 发送消息
    try {
      // 生成本地临时ID
      const localMessageId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      window.globalSocket.send({
        type: 'channel_message',
        channelId: currentChannelId,
        content,
        localMessageId // 将临时ID发送给服务器，便于追踪
      })
      console.log('消息已发送到服务器，临时ID:', localMessageId)
      
      // 手动添加消息到UI (乐观更新)
      const messagesContainer = document.getElementById('channel-messages')
      if (messagesContainer) {
        const tempMessage = {
          id: localMessageId,
          content,
          createdAt: new Date().toISOString(),
          user: {
            id: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl
          }
        }
        
        // 记录这个消息ID为已显示
        displayedMessageIds.add(localMessageId);
        
        const messageHTML = renderMessage(tempMessage, user.id)
        messagesContainer.insertAdjacentHTML('beforeend', messageHTML)
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
      
      resetSendUI()
    } catch (err) {
      console.error('发送消息时出错:', err)
      if (retryCount < 2) {
        setTimeout(() => attemptSend(retryCount + 1), 1000)
      } else {
        alert(t('channel.send_error'))
        resetSendUI()
      }
    }
  }
  
  // 重置UI状态的辅助函数
  function resetSendUI() {
    messageInput.disabled = false
    sendButton.disabled = false
    sendButton.textContent = t('channel.send')
    messageInput.focus()
  }
  
  // 开始发送流程
  attemptSend()
}

// 处理接收到的频道消息
function handleChannelMessage(data: any) {
  if (!currentChannelId || data.channelId !== currentChannelId) return
  
  const messagesContainer = document.getElementById('channel-messages')
  if (!messagesContainer) return
  
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userId = user.id
  
  // 获取消息ID
  const messageId = data.message.id;
  
  // 如果这是服务器返回的消息，并且包含localMessageId，我们用它来确认是否已显示
  if (data.localMessageId && displayedMessageIds.has(data.localMessageId)) {
    console.log(`跳过已通过临时ID ${data.localMessageId} 显示的消息 ${messageId}`);
    
    // 更新ID映射，将临时ID关联到真实ID
    displayedMessageIds.delete(data.localMessageId);
    displayedMessageIds.add(messageId);
    return;
  }
  
  // 检查消息ID是否已显示过（针对没有localMessageId的情况）
  if (displayedMessageIds.has(messageId)) {
    console.log('跳过已显示的消息:', messageId);
    return;
  }
  
  // 记录该消息ID为已显示
  displayedMessageIds.add(messageId);
  console.log(`显示新消息: ${messageId}`);
  
  // 添加消息到列表
  const messageHTML = renderMessage(data.message, userId)
  messagesContainer.insertAdjacentHTML('beforeend', messageHTML)
  
  // 滚动到底部
  messagesContainer.scrollTop = messagesContainer.scrollHeight
}

// 处理用户加入频道事件
function handleChannelUserJoined(data: any) {
  console.log(`${t('websocket.channel_message.received')}: ${data.member.displayName} ${t('channel.user_joined').replace('{user}', '')}`);
  
  // 如果是自己加入了频道，刷新频道列表并切换到该频道
  if (data.isSelf) {
    console.log(`自己加入了频道 ${data.channelId}，正在切换到该频道...`);
    
    // 刷新频道列表
    loadChannels();
    
    // 如果当前没有选中的频道或当前频道不是刚加入的频道，则切换
    if (!currentChannelId || currentChannelId !== data.channelId) {
      // 设置当前频道ID
      currentChannelId = data.channelId;
      
      // 加载该频道消息
      loadChannelMessages(data.channelId);
    }
    
    return;
  }
  
  // 如果不是当前频道，忽略
  if (!currentChannelId || data.channelId !== currentChannelId) return;
  
  // 在频道消息区域显示一条系统消息
  const messagesContainer = document.getElementById('channel-messages');
  if (messagesContainer) {
    const joinMessage = `
      <div class="text-center my-2">
        <span class="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
          ${t('channel.user_joined').replace('{user}', data.member.displayName)}
        </span>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', joinMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 重新加载频道信息以更新成员列表
  fetch(`https://localhost:3000/api/channels/${currentChannelId}/messages`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  })
  .then(res => res.json())
  .then(channelData => {
    if (!channelData.channelInfo) return;
    
    // 更新频道信息栏
    updateChannelInfoBar(channelData);
  })
  .catch(err => {
    console.error('更新频道成员信息失败:', err);
  });
}

// 处理用户离开频道事件
function handleChannelUserLeft(data: any) {
  // 如果不是当前频道，忽略
  if (!currentChannelId || data.channelId !== currentChannelId) return;
  
  console.log(`${t('websocket.channel_message.received')}: ${data.displayName} ${t('channel.user_left').replace('{user}', '')}`);
  
  // 在频道消息区域显示一条系统消息
  const messagesContainer = document.getElementById('channel-messages');
  if (messagesContainer) {
    const leaveMessage = `
      <div class="text-center my-2">
        <span class="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
          ${t('channel.user_left').replace('{user}', data.displayName)}
        </span>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', leaveMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 重新加载频道信息以更新成员列表
  fetch(`https://localhost:3000/api/channels/${currentChannelId}/messages`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  })
  .then(res => res.json())
  .then(channelData => {
    if (!channelData.channelInfo) return;
    
    // 更新频道信息栏
    updateChannelInfoBar(channelData);
  })
  .catch(err => {
    console.error('更新频道成员信息失败:', err);
  });
}

// 处理用户被踢出频道事件
function handleChannelUserKicked(data: any) {
  // 如果不是当前频道，忽略
  if (!currentChannelId || data.channelId !== currentChannelId) return;
  
  console.log(`${t('websocket.channel_message.received')}: ${data.displayName} ${t('channel.user_kicked').replace('{user}', '')}`);
  
  // 在频道消息区域显示一条系统消息
  const messagesContainer = document.getElementById('channel-messages');
  if (messagesContainer) {
    const kickMessage = `
      <div class="text-center my-2">
        <span class="text-xs bg-red-800/50 text-gray-300 px-2 py-1 rounded">
          ${t('channel.user_kicked').replace('{user}', data.displayName)}
        </span>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', kickMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 重新加载频道信息以更新成员列表
  fetch(`https://localhost:3000/api/channels/${currentChannelId}/messages`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  })
  .then(res => res.json())
  .then(channelData => {
    if (!channelData.channelInfo) return;
    
    // 更新频道信息栏
    updateChannelInfoBar(channelData);
  })
  .catch(err => {
    console.error('更新频道成员信息失败:', err);
  });
}

// 处理当前用户被踢出频道事件
function handleUserWasKicked(data: any) {
  console.log('===============================================================');
  console.log(`[WebSocket-Debug] ${t('websocket.channel_message.received')}:`, JSON.stringify(data));
  console.log(`${t('channel.you_kicked').replace('{admin}', data.adminName).replace('{channel}', data.channelName)}`);
  console.log(`${t('channel.no_channel_selected')}: ${currentChannelId}`);
  console.log('===============================================================');
  
  // 无论用户是否在查看被踢出的频道，都刷新频道列表
  loadChannels();
  
  // 如果当前正在查看被踢出的频道，则重置界面
  if (currentChannelId === data.channelId) {
    // 显示通知
    alert(t('channel.you_kicked').replace('{admin}', data.adminName).replace('{channel}', data.channelName));
    
    // 重置当前频道ID
    currentChannelId = null;
    
    // 重置聊天区域
    resetChatArea();
  } else {
    // 如果用户不在查看被踢出的频道，仍然显示通知，但使用较不干扰的方式
    const toastDiv = document.createElement('div');
    toastDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50';
    toastDiv.innerHTML = t('channel.you_kicked').replace('{admin}', data.adminName).replace('{channel}', data.channelName);
    document.body.appendChild(toastDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
      if (document.body.contains(toastDiv)) {
        document.body.removeChild(toastDiv);
      }
    }, 3000);
  }
}

// 更新频道信息栏
function updateChannelInfoBar(channelData: any) {
  const channelInfoEl = document.getElementById('channel-info');
  if (!channelInfoEl) return;
  
  const adminCount = channelData.members.filter((m: any) => m.isAdmin).length;
  
  channelInfoEl.innerHTML = `
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-full mr-2 bg-gradient-to-br ${channelData.channelInfo.isPrivate ? 'from-yellow-500 to-orange-600' : 'from-blue-500 to-indigo-600'} flex items-center justify-center">
          <span class="text-sm font-bold">${channelData.channelInfo.name.substring(0, 2).toUpperCase()}</span>
        </div>
        <div>
          <h3 class="font-medium text-gray-200">${channelData.channelInfo.name}</h3>
          ${channelData.channelInfo.description ? 
            `<p class="text-xs text-gray-400">${channelData.channelInfo.description}</p>` : ''}
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <div class="text-xs bg-gray-800 px-2 py-1 rounded-full flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>${channelData.members.length}</span>
          ${adminCount > 0 ? 
            `<span class="mx-1 text-gray-500">·</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="text-yellow-500">${adminCount}</span>` : 
            ''}
        </div>
        <button id="leave-channel-btn" class="text-xs bg-red-600 hover:bg-red-500 px-2.5 py-1 rounded flex items-center transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ${t('channel.leave')}
        </button>
        ${currentUserIsAdmin(channelData.members) ? 
          `<button id="channel-settings-btn" class="text-xs bg-gray-700 hover:bg-gray-600 px-2.5 py-1 rounded flex items-center transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ${t('channel.manage')}
          </button>` : ''}
      </div>
    </div>
  `;
  
  // 绑定管理按钮事件
  document.getElementById('channel-settings-btn')?.addEventListener('click', () => {
    showChannelSettings(currentChannelId!, channelData);
  });
  
  // 绑定退出频道按钮
  document.getElementById('leave-channel-btn')?.addEventListener('click', () => {
    handleLeaveChannel(currentChannelId!);
  });
}

// 添加一个新的函数用于处理退出频道的逻辑
function handleLeaveChannel(channelId: string) {
  if (!confirm(t('channel.leave_confirm'))) return;
  
  fetch(`https://localhost:3000/api/channels/${channelId}/leave`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  })
  .then(res => res.json())
  .then(response => {
    alert(response.message || t('channel.leave_success'));
    
    // 重置当前频道ID
    currentChannelId = null;
    
    // 刷新频道列表
    loadChannels();
    
    // 重置聊天区域
    resetChatArea();
    
    // 如果有打开的设置对话框，关闭它
    const existingModal = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (existingModal) {
      document.body.removeChild(existingModal as Node);
    }
  })
  .catch(err => {
    console.error(`${t('channel.leave_error')}:`, err);
    alert(t('channel.leave_error'));
  });
}

// 添加一个新的函数用于重置聊天区域
function resetChatArea() {
  // 重置聊天消息区域
  const messagesContainer = document.getElementById('channel-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-center text-gray-500">
        <svg class="w-16 h-16 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <p>${t('channel.select_or_join')}</p>
        <p class="text-xs mt-2 max-w-md">${t('channel.chat_tips')}</p>
      </div>
    `;
  }
  
  // 重置频道信息区域
  const channelInfoEl = document.getElementById('channel-info');
  if (channelInfoEl) {
    channelInfoEl.innerHTML = `
      <p class="text-gray-400 text-sm flex items-center">
        <svg class="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        ${t('channel.select_channel')}
      </p>
    `;
  }
  
  // 禁用消息输入框和发送按钮
  const messageInput = document.getElementById('channel-message-input') as HTMLInputElement;
  const sendButton = document.getElementById('send-channel-message-btn') as HTMLButtonElement;
  if (messageInput) {
    messageInput.disabled = true;
    messageInput.value = '';
    messageInput.placeholder = t('channel.message_placeholder');
  }
  if (sendButton) {
    sendButton.disabled = true;
  }
}

// 处理频道管理员变更事件
function handleChannelAdminChanged(data: any) {
  // 如果不是当前频道，忽略
  if (!currentChannelId || data.channelId !== currentChannelId) return;
  
  console.log(`${t('websocket.channel_message.received')}: ${data.displayName} ${t('channel.admin_changed').replace('{user}', '').replace('{action}', data.isAdmin ? t('channel.set_as_admin') : t('channel.removed_as_admin'))}`);
  
  // 在频道消息区域显示一条系统消息
  const messagesContainer = document.getElementById('channel-messages');
  if (messagesContainer) {
    const adminChangeMessage = `
      <div class="text-center my-2">
        <span class="text-xs bg-yellow-600/50 text-gray-200 px-2 py-1 rounded">
          ${t('channel.admin_changed').replace('{user}', data.displayName).replace('{action}', data.isAdmin ? t('channel.set_as_admin') : t('channel.removed_as_admin'))}
        </span>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', adminChangeMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 获取当前用户信息
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user.id;
  
  // 如果当前用户是变更的对象，检查我们自己的管理员状态
  if (currentUserId === data.userId) {
    console.log(`${t('websocket.channel_message.received')}: ${data.isAdmin ? t('channel.admin_set_success') : t('channel.admin_removed_success')}`);
    
    // 显示通知
    const toastDiv = document.createElement('div');
    toastDiv.className = 'fixed top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded shadow-lg z-50';
    toastDiv.innerHTML = data.isAdmin ? t('channel.admin_set_success') : t('channel.admin_removed_success');
    document.body.appendChild(toastDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
      if (document.body.contains(toastDiv)) {
        document.body.removeChild(toastDiv);
      }
    }, 3000);
  }
  
  // 重新加载频道信息以更新成员列表
  fetch(`https://localhost:3000/api/channels/${currentChannelId}/messages`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  })
  .then(res => res.json())
  .then(channelData => {
    if (!channelData.channelInfo) return;
    
    // 更新频道信息栏
    updateChannelInfoBar(channelData);
  })
  .catch(err => {
    console.error('更新频道成员信息失败:', err);
  });
}

// 频道管理设置
function showChannelSettings(channelId: string, channelData: any) {
  // 创建模态框
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50'
  modal.innerHTML = `
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
      <h3 class="text-xl font-bold mb-4">${t('channel.management').replace('{name}', channelData.channelInfo.name)}</h3>
      
      <div class="mb-4">
        <h4 class="font-medium mb-2">${t('channel.channel_settings')}</h4>
        <div class="mb-3">
          <button id="set-password-btn" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded mr-2">
            ${channelData.channelInfo.isPrivate ? t('channel.set_password') : t('channel.set_password')}
          </button>
          ${channelData.channelInfo.isPrivate ? 
            `<button id="remove-password-btn" class="px-3 py-1 bg-red-600 hover:bg-red-500 rounded">${t('channel.remove_password')}</button>` : ''}
        </div>
      </div>
      
      <div class="mb-4">
        <h4 class="font-medium mb-2">${t('channel.member_management')}</h4>
        <div id="members-list" class="max-h-60 overflow-y-auto">
          ${channelData.members.map((member: any) => `
            <div class="member-item flex justify-between items-center p-2 mb-1 bg-gray-700/50 rounded">
              <div>
                <span class="font-medium">${member.displayName}</span>
                ${member.isAdmin ? `<span class="text-xs bg-yellow-600 rounded px-1 ml-1">${t('channel.admin_badge')}</span>` : ''}
                ${member.isMuted ? `<span class="text-xs bg-red-600 rounded px-1 ml-1">${t('channel.muted_until').replace('{time}', '')}</span>` : ''}
              </div>
              <div class="member-actions" data-user-id="${member.userId}">
                ${!member.isAdmin ? 
                  `<button class="set-admin-btn text-xs bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded mr-1">
                    ${t('channel.set_admin')}
                  </button>` : ''}
                ${member.isAdmin && !isSelf(member.userId) ? 
                  `<button class="remove-admin-btn text-xs bg-yellow-700 hover:bg-yellow-600 px-2 py-1 rounded mr-1">
                    ${t('channel.remove_admin')}
                  </button>` : ''}
                ${!member.isMuted && !member.isAdmin ? 
                  `<button class="mute-btn text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded mr-1">
                    ${t('channel.mute')}
                  </button>` : ''}
                ${member.isMuted ? 
                  `<button class="unmute-btn text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded mr-1">
                    ${t('channel.unmute')}
                  </button>` : ''}
                ${!member.isAdmin && !isSelf(member.userId) ? 
                  `<button class="kick-btn text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded">
                    ${t('channel.kick')}
                  </button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="flex justify-between">
        <button id="close-settings" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">${t('channel.close')}</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // 检查是否为当前用户
  function isSelf(userId: number) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.id === userId
  }
  
  // 关闭按钮
  document.getElementById('close-settings')?.addEventListener('click', () => {
    document.body.removeChild(modal)
  })
  
  // 退出频道按钮
  document.getElementById('leave-channel-btn')?.addEventListener('click', () => {
    handleLeaveChannel(channelId);
  })
  
  // 设置密码
  document.getElementById('set-password-btn')?.addEventListener('click', () => {
    const newPassword = prompt(t('channel.enter_password'))
    if (newPassword === null) return
    
    fetch('https://localhost:3000/api/channels/set-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        channelId,
        password: newPassword
      })
    })
    .then(res => res.json())
    .then(response => {
      alert(response.message || t('channel.set_password_success'))
      // 重新加载频道信息
      loadChannelMessages(channelId)
      document.body.removeChild(modal)
    })
    .catch(err => {
      console.error(`${t('channel.set_password_error')}:`, err)
      alert(t('channel.set_password_error'))
    })
  })
  
  // 移除密码
  document.getElementById('remove-password-btn')?.addEventListener('click', () => {
    if (!confirm(t('channel.remove_password_confirm'))) return
    
    fetch('https://localhost:3000/api/channels/set-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        channelId,
        password: ''
      })
    })
    .then(res => res.json())
    .then(response => {
      alert(response.message || t('channel.password_removed'))
      // 重新加载频道信息
      loadChannelMessages(channelId)
      document.body.removeChild(modal)
    })
    .catch(err => {
      console.error(`${t('channel.remove_password_error')}:`, err)
      alert(t('channel.remove_password_error'))
    })
  })
  
  // 成员管理事件委托
  document.getElementById('members-list')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.classList) return
    
    // 找到操作按钮和用户ID
    const actionButton = target.closest('button')
    if (!actionButton) return
    
    const actionContainer = actionButton.closest('.member-actions')
    if (!actionContainer) return
    
    const targetUserId = actionContainer.getAttribute('data-user-id')
    if (!targetUserId) return
    
    // 设为管理员
    if (actionButton.classList.contains('set-admin-btn')) {
      fetch('https://localhost:3000/api/channels/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          channelId,
          targetUserId
        })
      })
      .then(res => res.json())
      .then(response => {
        alert(response.message || t('channel.admin_set_success'))
        loadChannelMessages(channelId)
        document.body.removeChild(modal)
      })
      .catch(err => {
        console.error(`${t('channel.operation_failed')}:`, err)
        alert(t('channel.operation_failed'))
      })
    }
    
    // 取消管理员
    if (actionButton.classList.contains('remove-admin-btn')) {
      fetch('https://localhost:3000/api/channels/remove-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          channelId,
          targetUserId
        })
      })
      .then(res => res.json())
      .then(response => {
        alert(response.message || t('channel.admin_removed_success'))
        loadChannelMessages(channelId)
        document.body.removeChild(modal)
      })
      .catch(err => {
        console.error(`${t('channel.admin_removed_success')} ${t('channel.operation_failed')}:`, err)
        alert(t('channel.operation_failed'))
      })
    }
    
    // 禁言用户
    if (actionButton.classList.contains('mute-btn')) {
      const duration = prompt(t('channel.enter_mute_duration'), '30')
      if (!duration) return
      
      fetch('https://localhost:3000/api/channels/mute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          channelId,
          targetUserId,
          duration
        })
      })
      .then(res => res.json())
      .then(response => {
        alert(response.message || t('channel.mute_success'))
        loadChannelMessages(channelId)
        document.body.removeChild(modal)
      })
      .catch(err => {
        console.error(`${t('channel.mute_error')}:`, err)
        alert(t('channel.operation_failed'))
      })
    }
    
    // 解除禁言
    if (actionButton.classList.contains('unmute-btn')) {
      fetch('https://localhost:3000/api/channels/unmute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          channelId,
          targetUserId
        })
      })
      .then(res => res.json())
      .then(response => {
        alert(response.message || t('channel.unmute_success'))
        loadChannelMessages(channelId)
        document.body.removeChild(modal)
      })
      .catch(err => {
        console.error(`${t('channel.unmute_error')}:`, err)
        alert(t('channel.operation_failed'))
      })
    }
    
    // 踢出用户
    if (actionButton.classList.contains('kick-btn')) {
      if (!confirm(t('channel.kick_confirm_general'))) return
      
      fetch('https://localhost:3000/api/channels/kick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          channelId,
          targetUserId
        })
      })
      .then(res => res.json())
      .then(response => {
        alert(response.message || t('channel.kick_success_general'))
        loadChannelMessages(channelId)
        document.body.removeChild(modal)
      })
      .catch(err => {
        console.error(`${t('channel.kick_error')}:`, err)
        alert(t('channel.operation_failed'))
      })
    }
  })
}

// 处理踢出用户

// 在适当位置（建议在handleUserWasKicked函数后面）添加以下函数

// 处理频道中某用户被禁言事件
function handleChannelUserMuted(data: any) {
  // 如果不是当前频道，忽略
  if (!currentChannelId || data.channelId !== currentChannelId) return;
  
  console.log(`${t('websocket.channel_message.received')}: ${data.displayName} ${t('channel.user_muted').replace('{user}', '').replace('{duration}', data.duration)}`);
  
  // 在频道消息区域显示一条系统消息
  const messagesContainer = document.getElementById('channel-messages');
  if (messagesContainer) {
    const muteMessage = `
      <div class="text-center my-2">
        <span class="text-xs bg-red-800/50 text-gray-300 px-2 py-1 rounded">
          ${t('channel.user_muted').replace('{user}', data.displayName).replace('{duration}', data.duration)}
        </span>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', muteMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 重新加载频道信息以更新成员列表
  fetch(`https://localhost:3000/api/channels/${currentChannelId}/messages`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  })
  .then(res => res.json())
  .then(channelData => {
    if (!channelData.channelInfo) return;
    
    // 更新频道信息栏
    updateChannelInfoBar(channelData);
  })
  .catch(err => {
    console.error(`${t('channel.load_error')}:`, err);
  });
}

// 处理频道中某用户被解除禁言事件
function handleChannelUserUnmuted(data: any) {
  // 如果不是当前频道，忽略
  if (!currentChannelId || data.channelId !== currentChannelId) return;
  
  console.log(`${t('websocket.channel_message.received')}: ${data.displayName} ${t('channel.user_unmuted').replace('{user}', '')}`);
  
  // 在频道消息区域显示一条系统消息
  const messagesContainer = document.getElementById('channel-messages');
  if (messagesContainer) {
    const unmuteMessage = `
      <div class="text-center my-2">
        <span class="text-xs bg-green-800/50 text-gray-300 px-2 py-1 rounded">
          ${t('channel.user_unmuted').replace('{user}', data.displayName)}
        </span>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', unmuteMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // 重新加载频道信息以更新成员列表
  fetch(`https://localhost:3000/api/channels/${currentChannelId}/messages`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  })
  .then(res => res.json())
  .then(channelData => {
    if (!channelData.channelInfo) return;
    
    // 更新频道信息栏
    updateChannelInfoBar(channelData);
  })
  .catch(err => {
    console.error(`${t('channel.load_error')}:`, err);
  });
}

// 处理当前用户被禁言事件
function handleUserWasMuted(data: any) {
  console.log('===============================================================');
  console.log(`[WebSocket-Debug] ${t('websocket.channel_message.received')}:`, JSON.stringify(data));
  console.log(`${t('channel.you_muted').replace('{admin}', data.adminName).replace('{channel}', data.channelName).replace('{duration}', data.duration)}`);
  console.log(`${t('channel.no_channel_selected')}: ${currentChannelId}`);
  console.log('===============================================================');
  
  // 无论用户是否在查看被禁言的频道，都显示通知
  const toastDiv = document.createElement('div');
  toastDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50';
  toastDiv.innerHTML = t('channel.you_muted')
    .replace('{admin}', data.adminName)
    .replace('{channel}', data.channelName)
    .replace('{duration}', data.duration);
  document.body.appendChild(toastDiv);
  
  // 5秒后自动消失
  setTimeout(() => {
    if (document.body.contains(toastDiv)) {
      document.body.removeChild(toastDiv);
    }
  }, 5000);
  
  // 如果当前正在查看被禁言的频道，则更新界面
  if (currentChannelId !== null && currentChannelId === data.channelId) {
    // 重新加载频道消息以更新禁言状态
    loadChannelMessages(currentChannelId);
  }
}

// 处理当前用户被解除禁言事件
function handleUserWasUnmuted(data: any) {
  console.log('===============================================================');
  console.log(`[WebSocket-Debug] ${t('websocket.channel_message.received')}:`, JSON.stringify(data));
  console.log(`${t('channel.you_unmuted').replace('{admin}', data.adminName).replace('{channel}', data.channelName)}`);
  console.log(`${t('channel.no_channel_selected')}: ${currentChannelId}`);
  console.log('===============================================================');
  
  // 无论用户是否在查看被解除禁言的频道，都显示通知
  const toastDiv = document.createElement('div');
  toastDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50';
  toastDiv.innerHTML = t('channel.you_unmuted')
    .replace('{admin}', data.adminName)
    .replace('{channel}', data.channelName);
  document.body.appendChild(toastDiv);
  
  // 5秒后自动消失
  setTimeout(() => {
    if (document.body.contains(toastDiv)) {
      document.body.removeChild(toastDiv);
    }
  }, 5000);
  
  // 如果当前正在查看被解除禁言的频道，则更新界面
  if (currentChannelId !== null && currentChannelId === data.channelId) {
    // 重新加载频道消息以更新禁言状态
    loadChannelMessages(currentChannelId);
  }
}

// 创建一个简单的提示函数

