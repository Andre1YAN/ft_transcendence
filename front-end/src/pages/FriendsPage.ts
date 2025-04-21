// src/pages/FriendsPage.ts

import { initStars } from '../components/initStars'
import { t } from '../State/i18n'
import { renderLanguageSwitcher, bindLanguageSwitcher } from '../components/LanguageSwitcher'
import { initGlobalSocket } from '../ws/globalSocket'

// 全局变量 friends 保持不变
let friends: { id: number; name: string; avatarUrl: string; online: boolean; blocked: boolean }[] = []

// 用于跟踪已显示的消息，防止重复
const displayedMessages = new Set<string>();

// 定义邀请状态的类型
type InvitationStatus = 'pending' | 'accepted' | 'rejected';

// 定义邀请状态存储的接口
interface InvitationStatuses {
  [key: string]: InvitationStatus;
}

export async function render() {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (!user?.id) {
    alert('Please log in first.')
    location.hash = '#/login'
    return
  }

  await fetchFriends(user.id)
  if (!window.globalSocket && user?.id) {
	console.log('[FriendsPage] No socket found, init manually for user', user.id)
	window.globalSocket = initGlobalSocket(user.id)
	}
  renderUI()
  bindLanguageSwitcher()
  
  // 注册全局 WebSocket 事件回调
  registerWebSocketEvents(user)
  
  requestAnimationFrame(() => setTimeout(() => initStars(), 0))
}

function renderUI() {
  document.body.innerHTML = `
    <div class="relative z-0 min-h-screen bg-gradient-to-b from-[#1e1e2f] to-[#10101a] text-white font-press px-4">
      <canvas id="smoke-bg" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>
      <div class="absolute top-6 right-6 z-50">
        ${renderLanguageSwitcher()}
      </div>
      <div class="max-w-4xl mx-auto py-16">
        <div class="flex items-center gap-4 justify-center mb-10">
          <h1 class="text-4xl font-bold text-center drop-shadow-xl">${t('friends.title')}</h1>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-4 justify-between mb-6">
          <input id="searchInput" name="searchInput" type="text" placeholder="Search name..." class="w-full sm:w-1/2 px-4 py-2 rounded-md bg-[#2a2a3d] border border-gray-600 text-white focus:outline-none placeholder:text-gray-400">
          <button id="addFriendBtn" name="addFriendBtn" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center">
            <span class="mr-2">+</span> Add
          </button>
        </div>
        <div id="statusMessage" class="mb-4 px-4 py-2 rounded-md hidden"></div>
        <div id="friendList" class="space-y-4">
          ${renderFriendItems(friends)}
        </div>
        <div class="mt-10 text-center">
          <button id="backButton" name="backButton" onclick="location.hash='#/main'" class="btn-glow px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full shadow-md transition">
            ← Back to Game
          </button>
        </div>
      </div>
    </div>
  `

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (user?.id) {
    bindFriendEvents(user.id)
  }
}

function renderFriendItems(list: typeof friends) {
  if (list.length === 0) {
    return `<div class="text-center text-gray-400 py-8">No friends found. Add friends to see them here.</div>`
  }

  return list.map(friend => `
    <div class="flex items-center justify-between bg-[#1b1b2f] p-4 rounded-xl shadow-md" data-friend-id="${friend.id}">
      <div class="flex items-center gap-4">
        <img src="${friend.avatarUrl || `https://i.pravatar.cc/50?u=${friend.name}`}" class="w-10 h-10 rounded-full" alt="${friend.name}" />
        <div>
          <p class="text-lg font-semibold">${friend.name}</p>
          <p class="text-sm friend-status ${friend.online ? 'text-green-400' : 'text-gray-400'}">
            ${friend.online ? t('friends.online') : t('friends.offline')}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="open-chat text-blue-400 hover:text-blue-600" data-id="${friend.id}" data-name="${friend.name}" aria-label="Chat">💬</button>
        <button class="delete-friend text-red-400 hover:text-red-600" data-id="${friend.id}" aria-label="Delete friend">✖</button>
		  <button class="toggle-block text-yellow-400 hover:text-yellow-600" data-id="${friend.id}">
			${friend.blocked ? '✅ Unblock' : '🔒 Block'}
		</button>
      </div>
    </div>
  `).join('')
}

function showStatusMessage(message: string, isError: boolean = false) {
  const statusElement = document.getElementById('statusMessage')
  if (!statusElement) return

  statusElement.textContent = message
  statusElement.className = `mb-4 px-4 py-2 rounded-md ${isError ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`
  statusElement.classList.remove('hidden')

  setTimeout(() => {
    if (statusElement) {
      statusElement.classList.add('hidden')
      statusElement.textContent = ''
    }
  }, 2000)
}

function hideStatusMessage() {
  const statusElement = document.getElementById('statusMessage')
  if (statusElement) {
    statusElement.classList.add('hidden')
    statusElement.textContent = ''
  }
}

function bindFriendEvents(currentUserId: number) {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement
  const addFriendBtn = document.getElementById('addFriendBtn') as HTMLButtonElement
  const friendList = document.getElementById('friendList')!

  document.addEventListener('click', () => hideStatusMessage())

    // 👇插入这里
	friendList.addEventListener('click', async (e) => {
		const target = e.target as HTMLElement
		if (!target.classList.contains('toggle-block')) return
	
		const friendId = Number(target.getAttribute('data-id'))
		const isUnblock = target.textContent?.includes('Unblock')
	
		try {
		  const url = isUnblock
			? `https://localhost:3000/users/block/${friendId}`
			: 'https://localhost:3000/users/block'
	
		  console.log(`[${isUnblock ? 'UNBLOCK' : 'BLOCK'}] sending request to ${url}`)
	
		  const res = await fetch(url, {
			method: isUnblock ? 'DELETE' : 'POST',
			headers: {
			  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
			  ...(isUnblock ? {} : { 'Content-Type': 'application/json' }),
			},
			...(isUnblock ? {} : { body: JSON.stringify({ blockedId: friendId }) }),
		  })
	
		  const data = await res.json()
		  if (!res.ok) {
			showStatusMessage(data.message || 'Failed to update block status', true)
			return
		  }
	
		  showStatusMessage(data.message || 'Success')
		  await fetchFriends(currentUserId)
		} catch (err) {
		  console.error('Block/unblock error:', err)
		  showStatusMessage('Network error while updating block status', true)
		}
	  })

	  
  searchInput.addEventListener('input', () => {
    hideStatusMessage()
    const keyword = searchInput.value.toLowerCase()
    const filtered = friends.filter(f => f.name.toLowerCase().includes(keyword))
    friendList.innerHTML = renderFriendItems(filtered)
    bindDeleteEvents(currentUserId)
  })

  addFriendBtn.addEventListener('click', async () => {
    const name = searchInput.value.trim()
    if (!name) {
      showStatusMessage('Please enter a friend name', true)
      return
    }

    try {
      const res = await fetch('https://localhost:3000/users/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ displayName: name })
      })

      const responseData = await res.json()
      if (!res.ok) {
        showStatusMessage(responseData.message || 'Failed to add friend', true)
        return
      }

      showStatusMessage('Friend added successfully')
      searchInput.value = ''
      await fetchFriends(currentUserId)
    } catch (err) {
      console.error('Add friend error:', err)
      showStatusMessage('Network error. Please try again.', true)
    }
  })

  bindDeleteEvents(currentUserId)
  bindChatEvents(currentUserId)
}

function bindChatEvents(currentUserId: number) {
  document.querySelectorAll<HTMLButtonElement>('.open-chat').forEach(btn => {
    btn.addEventListener('click', async () => {
      const friendId = Number(btn.getAttribute('data-id'))
      const friendName = btn.getAttribute('data-name') || `User ${friendId}`
      openChatWindow(currentUserId, friendId, friendName)
    })
  })
}

function bindDeleteEvents(currentUserId: number) {
  document.querySelectorAll<HTMLButtonElement>('.delete-friend').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const friendId = Number(btn.getAttribute('data-id'))
      try {
        const res = await fetch(`https://localhost:3000/users/friends/${friendId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        })

        const responseData = await res.json()
        if (!res.ok) {
          showStatusMessage(responseData.message || 'Failed to delete friend', true)
          return
        }

        showStatusMessage('Friend removed successfully')
        await fetchFriends(currentUserId)
      } catch (err) {
        console.error('Delete friend error:', err)
        showStatusMessage('Network error while deleting friend', true)
      }
    })
  })
}

async function fetchFriends(userId: number) {
  try {
    const res = await fetch(`https://localhost:3000/users/${userId}/friends`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    })
    friends = await res.json()

    const list = document.getElementById('friendList')
    if (list) {
      list.innerHTML = renderFriendItems(friends)
      bindDeleteEvents(userId)
      bindChatEvents(userId)
    }
  } catch (err) {
    console.error('Error fetching friends:', err)
    friends = []
  }
}

// 使用全局的 window.globalSocket 来发送消息，不再重复建立 WebSocket 连接
async function sendMessage(receiverId: number, content: string, metadata?: any) {
  try {
    console.log(`发送消息 - 接收者: ${receiverId}, 内容: ${content}${metadata ? ', 包含元数据' : ''}`);
    const response = await fetch(`https://localhost:3000/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ 
        receiverId, 
        content,
        ...(metadata ? { metadata } : {})
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`消息发送请求失败: ${response.status} ${errorText}`);
      throw new Error(`发送消息失败: ${response.status}`);
    }
    
    // 获取消息ID用于跟踪
    const messageData = await response.json();
    const messageId = messageData.id;
    console.log(`消息已保存到服务器，ID: ${messageId}`);
    
    // 重要：通过WebSocket发送消息，触发实时通知
    if (window.globalSocket && window.globalSocket.getState() === 'OPEN') {
      console.log(`通过WebSocket发送消息，ID: ${messageId}`);
      window.globalSocket.send({
        type: 'chat',
        to: receiverId,
        message: content,
        messageId: messageId
      });
    } else {
      console.error('WebSocket未连接，无法发送实时消息');
      // 如果WebSocket未连接，直接显示消息，不等待确认
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser?.id) {
        appendMessage(currentUser.id, receiverId, content, true, messageId);
      }
    }
    
    return messageId;
  } catch (err) {
    console.error('发送消息失败:', err);
    // 请求失败时仍然显示消息，并使用时间戳作为临时ID
    const tempId = `temp-${Date.now()}`;
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser?.id) {
      appendMessage(currentUser.id, receiverId, content, true, tempId);
    }
    return null;
  }
}

function appendMessage(senderId: number, chatContainerId: number, text: string, isSelf: boolean, messageId?: string) {
  console.log(`添加消息 - senderId: ${senderId}, chatContainerId: ${chatContainerId}, isSelf: ${isSelf}, messageId: ${messageId}`);
  
  const box = document.getElementById(`chat-messages-${chatContainerId}`);
  if (!box) {
    console.error(`找不到聊天消息容器: chat-messages-${chatContainerId}`);
    return;
  }
  
  // 生成消息唯一标识
  const msgIdentifier = messageId || `${senderId}-${chatContainerId}-${text}-${Date.now()}`;
  
  // 如果消息已经显示过，则不再显示
  if (displayedMessages.has(msgIdentifier)) {
    console.log(`消息已显示过，跳过: ${msgIdentifier}`);
    return;
  }
  
  // 标记消息为已显示
  displayedMessages.add(msgIdentifier);
  
  const bubble = document.createElement('div');
  bubble.className = `
    max-w-[75%] px-4 py-2 rounded-xl text-sm break-words
    ${isSelf ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white ml-auto text-right' : 'bg-[#3a3a4d] text-white'}
  `;
  bubble.dataset.messageId = msgIdentifier;
  bubble.textContent = text;
  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
  console.log(`消息已添加到DOM，当前容器子元素数量: ${box.children.length}`);
}

// 修改loadMessages函数，处理邀请状态的获取
async function loadMessages(userId: number, friendId: number) {
  try {
    console.log(`开始加载消息 - userId: ${userId}, friendId: ${friendId}`);
    const box = document.getElementById(`chat-messages-${friendId}`);
    if (box) {
      // 显示加载指示器
      box.innerHTML = '<div class="text-center text-gray-400">Loading...</div>';
    }
    
    const res = await fetch(`https://localhost:3000/messages/${friendId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    });
    const messages = await res.json();
    console.log(`已加载 ${messages.length} 条消息`);
    
    if (box) {
      box.innerHTML = '';
      // 清空已显示消息的集合
      displayedMessages.clear();
      
      if (messages.length === 0) {
        box.innerHTML = '<div class="text-center text-gray-400">No messages yet. Send a message to start chatting!</div>';
        return;
      }
      
      // 获取本地存储的邀请状态，如果有的话
      let storedInvitationStatuses: InvitationStatuses = {};
      try {
        const storedData = localStorage.getItem('invitationStatuses');
        if (storedData) {
          storedInvitationStatuses = JSON.parse(storedData) as InvitationStatuses;
          console.log('从本地存储读取的邀请状态:', storedInvitationStatuses);
        }
      } catch (e) {
        console.error('读取本地存储的邀请状态失败:', e);
      }
      
      for (const msg of messages) {
        if (msg.metadata && typeof msg.metadata === 'object' && msg.metadata.type === 'game_invitation') {
          console.log(`发现游戏邀请消息: ${msg.id}, invitationId: ${msg.metadata.invitationId}`);
          // 处理游戏邀请消息
          const invitationId = msg.metadata.invitationId as string;
          
          // 从多个来源确定状态，优先级：本地存储 > 元数据 > 默认pending
          let status: InvitationStatus = 'pending';
          
          // 检查本地存储中是否有更新的状态
          if (storedInvitationStatuses[invitationId]) {
            status = storedInvitationStatuses[invitationId];
            console.log(`从本地存储获取邀请状态: ${invitationId} = ${status}`);
          } 
          // 如果没有本地存储的状态，则使用元数据中的状态
          else if (msg.metadata.status && 
                  ['pending', 'accepted', 'rejected'].includes(msg.metadata.status)) {
            status = msg.metadata.status as InvitationStatus;
            console.log(`从消息元数据获取邀请状态: ${invitationId} = ${status}`);
            
            // 将从服务器获取的状态也保存到本地，以备将来使用
            try {
              storedInvitationStatuses[invitationId] = status;
              localStorage.setItem('invitationStatuses', JSON.stringify(storedInvitationStatuses));
            } catch (e) {
              console.error('保存状态到本地存储失败:', e);
            }
          }
          
          console.log(`最终使用的邀请状态: ${invitationId} = ${status}`);
          
          // 显示游戏邀请卡片
          const isSender = msg.senderId === userId;
          showGameInvitationCard(
            isSender ? userId : msg.senderId,
            isSender ? msg.receiverId : friendId,
            invitationId,
            isSender,
            status
          );
        } else {
          // 普通消息
          appendMessage(msg.senderId, friendId, msg.content, msg.senderId === userId, msg.id);
        }
      }
    } else {
      console.error(`无法找到消息容器: chat-messages-${friendId}`);
    }
  } catch (err) {
    console.error('加载消息失败:', err);
    const box = document.getElementById(`chat-messages-${friendId}`);
    if (box) {
      box.innerHTML = '<div class="text-center text-red-400">Failed to load messages. Please try again.</div>';
    }
  }
}

function updateFriendStatus(friendId: number, isOnline: boolean) {
  console.log(`[updateFriendStatus] 更新好友 ${friendId} 的状态为 ${isOnline ? '在线' : '离线'}`);
  
	const statusElements = document.querySelectorAll(`[data-friend-id="${friendId}"] .friend-status`);
  console.log(`[updateFriendStatus] 找到 ${statusElements.length} 个状态元素需要更新`);
  
	statusElements.forEach(el => {
	  el.textContent = isOnline ? t('friends.online') : t('friends.offline');
	  el.className = `text-sm friend-status ${isOnline ? 'text-green-400' : 'text-gray-400'}`;
	});
  
  if (statusElements.length === 0) {
    console.warn(`[updateFriendStatus] 未找到好友 ${friendId} 的状态元素`);
  }
  }

// 修改聊天窗口打开函数，确保正确初始化
async function openChatWindow(userId: number, friendId: number, friendName: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      console.log(`打开聊天窗口 - userId: ${userId}, friendId: ${friendId}, friendName: ${friendName}`);
      const existing = document.getElementById(`chat-box-${friendId}`);
      if (existing) {
        console.log(`聊天窗口已存在，跳过创建`);
        resolve();
        return;
      }

      // 获取好友数据以获取头像
      const friend = friends.find(f => f.id === friendId);
      const friendAvatar = friend?.avatarUrl || `https://i.pravatar.cc/40?u=${friendId}`;

      const container = document.createElement('div');
      container.id = `chat-box-${friendId}`;
  container.className = `
    fixed bottom-4 right-4 w-80 bg-[#1e1e2f]/90 backdrop-blur-md
    rounded-2xl shadow-2xl text-white z-50 flex flex-col max-h-[80vh] overflow-hidden
      `;
  container.innerHTML = `
    <div class="flex justify-between items-center px-4 py-2 bg-[#2a2a3d] border-b border-[#333]">
      <div class="flex items-center gap-2">
        <img src="${friendAvatar}" class="w-8 h-8 rounded-full cursor-pointer friend-avatar" data-friend-id="${friendId}" alt="${friendName}" />
      <span class="font-semibold text-lg">${friendName}</span>
      </div>
      <div class="flex items-center">
        <button class="invite-game text-yellow-400 hover:text-yellow-600 mr-3" title="${t('game.invitation.invite_button')}">${'🎮'}</button>
      <button class="close-chat text-red-400 hover:text-red-600 transition-transform transform hover:scale-125">✖</button>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-3 space-y-2 text-sm" id="chat-messages-${friendId}">
      <div class="text-center text-gray-400">Loading...</div>
    </div>
    <div class="p-2 border-t border-[#333] bg-[#1b1b2f]">
      <input
        type="text"
        placeholder="Type a message..."
        class="w-full px-3 py-2 rounded-xl bg-[#2a2a3d] border border-[#444] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        id="chat-input-${friendId}"
      >
    </div>
      `;
      document.body.appendChild(container);
      console.log(`聊天窗口DOM已创建，id: chat-box-${friendId}`);
      
      // 绑定关闭按钮事件
      const closeButton = container.querySelector('.close-chat');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          console.log(`关闭聊天窗口`);
          container.remove();
        });
      }
      
      // 添加头像点击事件
      const avatarElement = container.querySelector('.friend-avatar');
      if (avatarElement) {
        avatarElement.addEventListener('click', () => {
          showFriendProfile(friendId, friendName, friendAvatar);
        });
      }
      
      // 添加邀战按钮事件
      const inviteButton = container.querySelector('.invite-game');
      if (inviteButton) {
        inviteButton.addEventListener('click', () => {
          console.log(`点击邀请游戏按钮`);
          sendGameInvitation(friendId, friendName);
        });
      }

      const input = container.querySelector(`#chat-input-${friendId}`) as HTMLInputElement;
      if (input) {
  input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
            const content = input.value.trim();
            input.value = ''; // 清空输入框
            console.log(`发送消息到聊天窗口: ${friendId}, 内容: ${content}`);
            try {
              await sendMessage(friendId, content);
            } catch (err) {
              console.error('发送消息时出错:', err);
            }
          }
        });
      }

      // 加载消息
      loadMessages(userId, friendId).then(() => {
        console.log(`消息加载完成`);
        // 确保拉到底部
        const messageBox = document.getElementById(`chat-messages-${friendId}`);
        if (messageBox) {
          messageBox.scrollTop = messageBox.scrollHeight;
        }
        resolve();
      }).catch(err => {
        console.error('加载消息失败:', err);
        reject(err);
      });
    } catch (err) {
      console.error('创建聊天窗口失败:', err);
      reject(err);
    }
  });
}

// 添加显示好友资料卡片的函数
function showFriendProfile(friendId: number, friendName: string, avatarUrl: string) {
  // 检查是否已经有显示的资料卡片，如果有，先移除
  const existingProfile = document.getElementById('friend-profile-card');
  if (existingProfile) {
    existingProfile.remove();
  }

  // 从friends数组中获取完整的好友信息
  const friend = friends.find(f => f.id === friendId);
  
  // 创建资料卡片
  const profileCard = document.createElement('div');
  profileCard.id = 'friend-profile-card';
  profileCard.className = `
    fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
    w-96 bg-[#2a2a3d] rounded-xl shadow-2xl z-[60] p-6 border border-indigo-500/30
    flex flex-col items-center gap-3 backdrop-blur-md max-h-[90vh] overflow-y-auto
  `;
  
  // 初始内容
  profileCard.innerHTML = `
    <div class="absolute top-3 right-3">
      <button id="close-profile" class="text-gray-400 hover:text-red-400">✖</button>
    </div>
    
    <div class="flex flex-col items-center w-full">
      <img src="${avatarUrl}" class="w-24 h-24 rounded-full border-2 border-indigo-500 mb-3" alt="${friendName}" />
      <h3 class="text-xl font-bold text-white">${friendName}</h3>
      <div class="text-sm ${friend?.online ? 'text-green-400' : 'text-gray-400'} mb-4">
        ${friend?.online ? t('friends.online') : t('friends.offline')}
      </div>
      
      <!-- 游戏统计 -->
      <div class="w-full bg-[#1b1b2f] rounded-lg p-4 mb-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-gray-300">${t('profile.wins')}</span>
          <span id="friend-wins" class="text-lg font-bold text-green-400">-</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-300">${t('profile.losses')}</span>
          <span id="friend-losses" class="text-lg font-bold text-red-400">-</span>
        </div>
      </div>
      
      <!-- 比赛历史 -->
      <h4 class="text-md font-bold text-white self-start mb-2">${t('profile.historyTitle')}</h4>
      <div id="friend-match-history" class="w-full bg-[#1b1b2f] rounded-lg p-3 max-h-60 overflow-y-auto">
        <p class="text-center text-gray-400">${t('profile.loading')}</p>
      </div>
    </div>
    
    <div class="w-full border-t border-gray-600 my-3"></div>
    <div class="flex justify-center gap-4 w-full">
      <button id="profile-chat" class="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md text-white text-sm">
        💬 ${t('friends.chat')}
      </button>
      <button id="profile-invite" class="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-md text-white text-sm">
        🎮 ${t('game.invitation.invite_button')}
      </button>
    </div>
  `;
  
  // 添加到页面
  document.body.appendChild(profileCard);
  
  // 绑定关闭按钮事件
  document.getElementById('close-profile')?.addEventListener('click', () => {
    profileCard.remove();
  });
  
  // 绑定聊天按钮事件
  document.getElementById('profile-chat')?.addEventListener('click', () => {
    profileCard.remove();
    const existingChat = document.getElementById(`chat-box-${friendId}`);
    if (!existingChat) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser?.id) {
        openChatWindow(currentUser.id, friendId, friendName);
      }
    }
  });
  
  // 绑定邀请游戏按钮事件
  document.getElementById('profile-invite')?.addEventListener('click', () => {
    profileCard.remove();
    sendGameInvitation(friendId, friendName);
  });
  
  // 点击其他地方关闭资料卡片
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[59]';
  document.body.appendChild(overlay);
  
  overlay.addEventListener('click', () => {
    profileCard.remove();
    overlay.remove();
  });
  
  // 加载好友的比赛记录
  fetchFriendMatchHistory(friendId);
}

// 获取好友的比赛记录
async function fetchFriendMatchHistory(friendId: number) {
  try {
    const res = await fetch(`https://localhost:3000/users/${friendId}/matches`, {
      method: "GET",
      headers: {'Authorization': `Bearer ${localStorage.getItem('authToken')}`}
    });
    
    const matches = await res.json();
    
    // 更新胜负场数
    let wins = 0;
    let losses = 0;
    
    // 当前用户信息（用于比较比赛结果）
    
    if (Array.isArray(matches)) {
      matches.forEach((match) => {
        const isUser1 = match.user1.id === friendId;
        const myScore = isUser1 ? match.score1 : match.score2;
        const oppScore = isUser1 ? match.score2 : match.score1;
        if (myScore > oppScore) wins++;
        else losses++;
      });
      
      // 更新UI
      const winsElement = document.getElementById('friend-wins');
      const lossesElement = document.getElementById('friend-losses');
      
      if (winsElement) winsElement.textContent = String(wins);
      if (lossesElement) lossesElement.textContent = String(losses);
      
      // 更新比赛历史
      const historyContainer = document.getElementById('friend-match-history');
      if (historyContainer) {
        if (matches.length === 0) {
          historyContainer.innerHTML = `<p class="text-center text-gray-400">${t('profile.noMatches')}</p>`;
        } else {
          historyContainer.innerHTML = matches.map((match: any) => {
            const isUser1 = match.user1.id === friendId;
            const isWin = isUser1 ? match.score1 > match.score2 : match.score2 > match.score1;
            
            const opponent = isUser1 ? match.user2 : match.user1;
            
            return `
              <div class="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                <div class="flex items-center gap-2">
                  <img class="w-6 h-6 rounded-full" src="${opponent.avatarUrl}" />
                  <span class="text-sm">${opponent.displayName}</span>
                </div>
                <div class="text-right">
                  <p class="text-xs text-white/40">${new Date(match.playedAt).toLocaleDateString()}</p>
                  <p class="text-sm font-bold ${isWin ? 'text-green-400' : 'text-red-400'}">
                    ${match.score1} : ${match.score2}
                  </p>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }
  } catch (err) {
    console.error('获取好友比赛记录失败:', err);
    
    // 更新UI显示错误
    const winsElement = document.getElementById('friend-wins');
    const lossesElement = document.getElementById('friend-losses');
    const historyContainer = document.getElementById('friend-match-history');
    
    if (winsElement) winsElement.textContent = '-';
    if (lossesElement) lossesElement.textContent = '-';
    if (historyContainer) {
      historyContainer.innerHTML = `<p class="text-center text-red-400">${t('profile.errorFetching')}</p>`;
    }
  }
}

export function handlePresenceUpdate(data: any) {
  if (!data || !data.userId || typeof data.status !== 'string') {
    console.error('[handlePresenceUpdate] 无效的存在状态更新:', data);
    return;
  }
  
  console.log(`[handlePresenceUpdate] 收到好友在线状态更新: 用户 ${data.userId} ${data.status === 'online' ? '上线' : '下线'}`);
  
  const friend = friends.find(f => f.id === data.userId);
  if (friend) {
    const oldStatus = friend.online;
    friend.online = data.status === 'online';
    
    console.log(`[handlePresenceUpdate] 好友 ${friend.name}(ID: ${friend.id}) 状态从 ${oldStatus ? '在线' : '离线'} 变为 ${friend.online ? '在线' : '离线'}`);
    
    // 更新UI显示
    updateFriendStatus(friend.id, friend.online);
  } else {
    console.log(`[handlePresenceUpdate] 收到未知用户的状态更新: ${data.userId}`);
  }
}
  
// 添加函数 - 发送游戏邀请
async function sendGameInvitation(friendId: number, friendName: string) {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!currentUser.id) {
    console.error('无法发送游戏邀请：未找到当前用户ID');
    return;
  }
  
  console.log(`准备发送游戏邀请给好友：${friendName}(ID: ${friendId})，发送者：${currentUser.displayName}(ID: ${currentUser.id})`);
  
  // 确保WebSocket连接已就绪
  if (!ensureWebSocketReady()) {
    console.log('WebSocket未就绪，延迟发送游戏邀请');
    setTimeout(() => sendGameInvitation(friendId, friendName), 1000);
    return;
  }
  
  const invitationId = `inv-${Date.now()}`;

  // 初始状态保存到本地存储
  try {
    const storedStatuses: InvitationStatuses = JSON.parse(localStorage.getItem('invitationStatuses') || '{}');
    storedStatuses[invitationId] = 'pending';
    localStorage.setItem('invitationStatuses', JSON.stringify(storedStatuses));
    console.log(`初始邀请状态已保存到本地: ${invitationId} = pending`);
  } catch (err) {
    console.error('保存邀请状态到本地存储时出错:', err);
  }
  
  try {
    // 1. 先保存邀请消息到数据库
    console.log(`保存游戏邀请消息到数据库`);
    await sendMessage(friendId, t('game.invitation.message'), {
      type: 'game_invitation',
      invitationId,
      status: 'pending' // 明确设置初始状态为pending
    });
    
    // 2. 通过WebSocket发送实时邀请
    const inviteData = {
      type: 'game_invitation',
      to: friendId,
      from: currentUser.id,
      fromName: currentUser.displayName,
      invitationId: invitationId,
      status: 'pending' // 同样在WebSocket消息中设置状态
    };
    
    console.log('发送游戏邀请数据:', inviteData);
    
    // 添加确认回调
    const sentConfirmation = new Promise<boolean>((resolve) => {
      const confirmHandler = (data: any) => {
        if (data.invitationId === invitationId) {
          console.log('收到游戏邀请已送达确认');
          window.globalSocket?.off('game_invitation_sent', confirmHandler);
          resolve(true);
        }
      };
      
      // 设置超时处理
      
      // 注册一次性确认处理器
      window.globalSocket?.on('game_invitation_sent', confirmHandler);
    });
    
    // 发送邀请
    window.globalSocket?.send(inviteData);
    
    // 在本地显示邀请消息卡片 - 修正参数，使用friendId作为聊天容器ID
    showGameInvitationCard(currentUser.id, friendId, invitationId, true, 'pending');
    
    // 等待确认结果
    const sent = await sentConfirmation;
    if (!sent) {
      console.log('未收到游戏邀请确认，尝试重新发送');
      // 尝试重新发送
      setTimeout(() => {
        if (window.globalSocket?.getState() === 'OPEN') {
          console.log('重新发送游戏邀请');
          window.globalSocket.send(inviteData);
        }
      }, 1000);
    }
    
  } catch (err) {
    console.error('发送游戏邀请失败:', err);
  }
}

// 辅助函数 - 确保WebSocket已连接
function ensureWebSocketReady(): boolean {
  if (!window.globalSocket) {
    console.error('WebSocket未初始化');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) {
      window.globalSocket = initGlobalSocket(user.id);
    }
    return false;
  }
  
  const state = window.globalSocket.getState();
  console.log(`当前WebSocket状态: ${state}`);
  
  if (state !== 'OPEN') {
    console.log('WebSocket未连接，尝试重置连接');
    window.globalSocket.reset();
    return false;
  }
  
  return true;
}

// 添加函数 - 显示游戏邀请卡片
function showGameInvitationCard(senderId: number, chatContainerId: number, invitationId: string, isSender: boolean, status: InvitationStatus) {
  console.log(`开始显示游戏邀请卡片 - senderId: ${senderId}, chatContainerId: ${chatContainerId}, invitationId: ${invitationId}, isSender: ${isSender}, status: ${status}`);
  
  // 使用chatContainerId作为消息容器的ID
  const box = document.getElementById(`chat-messages-${chatContainerId}`);
  if (!box) {
    console.error(`找不到聊天消息容器: chat-messages-${chatContainerId}`);
    return;
  }
  
  const msgIdentifier = `game-invitation-${invitationId}`;
  console.log(`邀请消息标识符: ${msgIdentifier}, 是否已显示: ${displayedMessages.has(msgIdentifier)}`);
  
  // 打印当前显示过的消息集合
  console.log('当前已显示消息集合:', Array.from(displayedMessages));
  
  // 防止重复显示
  if (displayedMessages.has(msgIdentifier)) {
    console.log(`邀请 ${invitationId} 已经显示过，检查是否需要更新状态`);
    // 如果是状态更新，找到现有卡片并更新
    const existingCard = box.querySelector(`[data-invitation-id="${invitationId}"]`);
    if (existingCard && status !== 'pending') {
      console.log(`找到现有卡片，更新状态为: ${status}`);
      const statusElement = existingCard.querySelector('.invitation-status');
      if (statusElement) {
        statusElement.textContent = status === 'accepted' ? t('game.invitation.accepted') : t('game.invitation.rejected');
        statusElement.className = `invitation-status text-sm ${status === 'accepted' ? 'text-green-400' : 'text-red-400'}`;
      }
      // 移除按钮
      const buttonContainer = existingCard.querySelector('.invitation-buttons');
      if (buttonContainer) {
        buttonContainer.remove();
      }
    } else if (!existingCard) {
      console.warn(`邀请 ${invitationId} 标记为已显示，但找不到对应的卡片元素，可能需要重新创建`);
      // 强制重新创建卡片
      displayedMessages.delete(msgIdentifier);
      setTimeout(() => showGameInvitationCard(senderId, chatContainerId, invitationId, isSender, status), 0);
      return;
    }
    return;
  }
  
  // 标记为已显示 - 移到卡片成功创建后再标记
  
  const card = document.createElement('div');
  card.dataset.invitationId = invitationId;
  card.className = `
    ${isSender ? 'ml-auto' : ''}
    p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 
    max-w-[85%] shadow-lg my-2
  `;
  
  if (isSender) {
    card.innerHTML = `
      <div class="text-white font-medium">${t('game.invitation.sent')}</div>
      <div class="invitation-status text-sm text-gray-200">${status !== 'pending' ? (status === 'accepted' ? t('game.invitation.accepted') : t('game.invitation.rejected')) : t('game.invitation.waiting')}</div>
    `;
  } else {
    // 接收方看到的卡片，带有接受/拒绝按钮
    if (status === 'pending') {
      card.innerHTML = `
        <div class="text-white font-medium">${t('game.invitation.received')}</div>
        <div class="invitation-status text-sm text-gray-200">${t('game.invitation.accept_question')}</div>
        <div class="invitation-buttons flex mt-2 gap-2">
          <button class="accept-invitation bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-white text-sm" data-invitation-id="${invitationId}" data-friend-id="${senderId}">
            ${t('game.invitation.accept')}
          </button>
          <button class="reject-invitation bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white text-sm" data-invitation-id="${invitationId}" data-friend-id="${senderId}">
            ${t('game.invitation.reject')}
          </button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="text-white font-medium">${t('game.invitation.received')}</div>
        <div class="invitation-status text-sm ${status === 'accepted' ? 'text-green-400' : 'text-red-400'}">
          ${status === 'accepted' ? t('game.invitation.accepted') : t('game.invitation.rejected')}
        </div>
      `;
    }
  }
  
  try {
    // 添加卡片到DOM
    box.appendChild(card);
    console.log(`游戏邀请卡片已添加到DOM，invitationId: ${invitationId}，当前box.children.length: ${box.children.length}`);
    box.scrollTop = box.scrollHeight;
    
    // 现在卡片已成功添加，标记为已显示
    displayedMessages.add(msgIdentifier);
    
    // 绑定接受/拒绝按钮事件
    if (!isSender && status === 'pending') {
      const acceptButton = card.querySelector('.accept-invitation');
      const rejectButton = card.querySelector('.reject-invitation');
      
      if (acceptButton && rejectButton) {
        acceptButton.addEventListener('click', () => {
          console.log(`接受游戏邀请 ${invitationId}`);
          respondToGameInvitation(invitationId, senderId, true);
        });
        
        rejectButton.addEventListener('click', () => {
          console.log(`拒绝游戏邀请 ${invitationId}`);
          respondToGameInvitation(invitationId, senderId, false);
        });
        console.log('邀请按钮事件已绑定');
      } else {
        console.error('未找到接受/拒绝按钮元素');
      }
    }
  } catch (err) {
    console.error('添加游戏邀请卡片时出错:', err);
  }
}

// 修改respondToGameInvitation函数，添加本地状态存储
async function respondToGameInvitation(invitationId: string, senderId: number, isAccepted: boolean) {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const status: InvitationStatus = isAccepted ? 'accepted' : 'rejected';
  
  // 更新本地UI
  const card = document.querySelector(`[data-invitation-id="${invitationId}"]`);
  if (card) {
    const statusElement = card.querySelector('.invitation-status');
    if (statusElement) {
      statusElement.textContent = isAccepted ? t('game.invitation.accepted') : t('game.invitation.rejected');
      statusElement.className = `invitation-status text-sm ${isAccepted ? 'text-green-400' : 'text-red-400'}`;
    }
    
    // 移除按钮
    const buttonContainer = card.querySelector('.invitation-buttons');
    if (buttonContainer) {
      buttonContainer.remove();
    }
  }
  
  // 存储邀请状态到本地存储
  try {
    const storedStatuses: InvitationStatuses = JSON.parse(localStorage.getItem('invitationStatuses') || '{}');
    storedStatuses[invitationId] = status;
    localStorage.setItem('invitationStatuses', JSON.stringify(storedStatuses));
    console.log(`邀请状态已保存到本地: ${invitationId} = ${status}`);
  } catch (err) {
    console.error('保存邀请状态到本地存储时出错:', err);
  }
  
  try {
    // 1. 更新消息元数据，将状态持久化到数据库
    console.log(`更新邀请状态到数据库 - invitationId: ${invitationId}, 状态: ${status}`);
    const response = await fetch(`https://localhost:3000/messages/invitation/${invitationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        status
      })
    });
    
    if (!response.ok) {
      console.error(`更新邀请状态失败: ${response.status}`);
    } else {
      console.log(`邀请状态已成功更新到数据库`);
    }
  } catch (err) {
    console.error('更新邀请状态时出错:', err);
    // 失败时不必中断，已经更新了本地UI和本地存储
  }
  
  // 2. 通过WebSocket发送响应
  const socket = window.globalSocket;
  if (
    socket && 
    socket.getSocket() && 
    socket.getSocket()?.readyState === WebSocket.OPEN
  ) {
    socket.send({
      type: 'game_invitation_response',
      to: senderId,
      from: currentUser.id,
      invitationId: invitationId,
      response: status
    });
  }
}

// 修改handleGameInvitationResponse函数，添加本地存储
function handleGameInvitationResponse(data: any) {
  console.log('收到游戏邀请回应:', data);
  const invitationId = data.invitationId;
  const response = data.response as InvitationStatus;
  
  // 存储邀请状态到本地存储
  try {
    const storedStatuses: InvitationStatuses = JSON.parse(localStorage.getItem('invitationStatuses') || '{}');
    storedStatuses[invitationId] = response;
    localStorage.setItem('invitationStatuses', JSON.stringify(storedStatuses));
    console.log(`邀请状态已保存到本地: ${invitationId} = ${response}`);
  } catch (err) {
    console.error('保存邀请状态到本地存储时出错:', err);
  }
  
  // 更新邀请卡片状态
  const existingCard = document.querySelector(`[data-invitation-id="${invitationId}"]`);
  
  if (existingCard) {
    const statusElement = existingCard.querySelector('.invitation-status');
    if (statusElement) {
      statusElement.textContent = response === 'accepted' ? t('game.invitation.accepted') : t('game.invitation.rejected');
      statusElement.className = `invitation-status text-sm ${response === 'accepted' ? 'text-green-400' : 'text-red-400'}`;
    }
    
    // 更新元数据状态到数据库
    updateInvitationStatus(invitationId, response);
  } else {
    console.error(`找不到对应的邀请卡片: ${invitationId}`);
  }
}

// 辅助函数 - 更新邀请状态，增加重试和错误处理
async function updateInvitationStatus(invitationId: string, status: InvitationStatus): Promise<void> {
  let retries = 3;
  
  while (retries > 0) {
    try {
      const res = await fetch(`https://localhost:3000/messages/invitation/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          status
        })
      });
      
      if (!res.ok) {
        console.error(`更新邀请状态失败 (尝试 ${4-retries}/3): ${res.status}`);
        retries--;
        
        if (retries > 0) {
          console.log(`将在1秒后重试更新邀请状态...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        console.log(`邀请状态已成功更新到数据库 - ${invitationId}: ${status}`);
        return;
      }
    } catch (err) {
      console.error(`更新邀请状态时出错 (尝试 ${4-retries}/3):`, err);
      retries--;
      
      if (retries > 0) {
        console.log(`将在1秒后重试更新邀请状态...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.warn(`无法更新邀请状态到数据库，但已保存在本地存储中`);
}

// 提取WebSocket事件注册到单独的函数，确保事件不会重复注册
function registerWebSocketEvents(currentUser: any) {
  if (!window.globalSocket) {
    console.error('无法注册WebSocket事件：globalSocket不存在')
    return
  }
  
  // 先移除可能存在的旧监听器，防止重复
  window.globalSocket.off('chat', handleChatMessage)
  window.globalSocket.off('message_sent', handleMessageSent)
  window.globalSocket.off('game_invitation', handleGameInvitation)
  window.globalSocket.off('game_invitation_sent', handleGameInvitationSent)
  window.globalSocket.off('game_invitation_response', handleGameInvitationResponse)
  window.globalSocket.off('presence', handlePresenceUpdate)
  
  // 重新注册事件监听器
  window.globalSocket.on('chat', handleChatMessage)
  window.globalSocket.on('message_sent', handleMessageSent)
  window.globalSocket.on('game_invitation', handleGameInvitation)
  window.globalSocket.on('game_invitation_sent', handleGameInvitationSent)
  window.globalSocket.on('game_invitation_response', handleGameInvitationResponse)
  window.globalSocket.on('presence', handlePresenceUpdate)
  
  // 通知客户端已准备好接收游戏邀请
  console.log('WebSocket事件监听器已成功注册，准备接收游戏邀请')
  
  // 消息处理函数
  function handleChatMessage(data: any) {
    console.log('收到聊天消息:', data)
    const fromId = data.from
    const message = data.message
    const messageId = data.messageId
    if (!currentUser?.id) return
    
    // 不处理自己发送的消息，因为发送时已经显示
    if (fromId === currentUser.id) {
      return
    }
    
    console.log(`处理聊天消息 - 从${fromId}收到消息: "${message.substring(0, 20)}${message.length > 20 ? '...' : ''}"`);
    
    // 如果聊天窗口未打开则延时追加消息
    const existingBox = document.getElementById(`chat-box-${fromId}`)
    if (!existingBox) {
      // 打开聊天窗口并显示消息
      const friend = friends.find(f => f.id === fromId);
	if (friend) {
        console.log(`聊天窗口未打开，开始打开窗口显示消息`);
        openChatWindow(currentUser.id, fromId, friend.name).then(() => {
          console.log(`聊天窗口已打开，现在添加消息`);
          setTimeout(() => {
            // 确保消息容器存在
            const messageBox = document.getElementById(`chat-messages-${fromId}`);
            if (messageBox) {
              // 清除可能的Loading消息
              if (messageBox.children.length === 1 && messageBox.firstElementChild?.textContent?.includes('Loading')) {
                messageBox.innerHTML = '';
              }
              appendMessage(fromId, fromId, message, false, messageId);
            } else {
              console.error(`无法找到消息容器: chat-messages-${fromId}`);
            }
          }, 300);
        });
      } else {
        console.error(`无法找到发送者信息: ${fromId}`);
      }
    } else {
      // 聊天窗口已打开，确保正确的参数顺序 - 第二个参数是聊天容器的ID
      console.log(`聊天窗口已打开，直接显示消息`);
      appendMessage(fromId, fromId, message, false, messageId);
    }
  }
  
  function handleMessageSent(data: any) {
    console.log('消息发送确认:', data);
    // 在这里显示消息已发送确认
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.id) return;
    
    console.log(`处理消息发送确认 - 发送给: ${data.to}, 消息ID: ${data.messageId}`);
    
    // 第二个参数是聊天容器的ID，应该是接收者ID
    // 为了确保消息显示在正确的聊天窗口中，我们需要使用正确的容器ID
    const chatContainerId = data.to; // 接收者ID就是聊天窗口的ID
    
    // 检查消息是否已经显示
    const msgIdentifier = data.messageId || `${user.id}-${chatContainerId}-${data.message}-${Date.now()}`;
    
    if (displayedMessages.has(msgIdentifier)) {
      console.log(`消息已经显示过，不再重复显示: ${msgIdentifier}`);
      return;
    }
    
    // 确保聊天窗口存在
    const existingBox = document.getElementById(`chat-box-${chatContainerId}`);
    if (!existingBox) {
      console.log(`聊天窗口不存在，暂不显示消息`);
      return;
    }
    
    // 显示消息
    appendMessage(user.id, chatContainerId, data.message, true, data.messageId);
  }
  
  function handleGameInvitation(data: any) {
    console.log('收到游戏邀请:', data);
    const fromId = data.from;
    const invitationId = data.invitationId;
    
    if (fromId === currentUser.id) {
      console.log('忽略自己发送的游戏邀请');
      return;
    }
    
    // 关键修复：确保参数顺序正确 - friendId必须是聊天框所属的用户ID
    // 打印关键参数以便调试
    console.log(`处理游戏邀请，关键参数: 当前用户ID=${currentUser.id}, 发送者ID=${fromId}, invitationId=${invitationId}`);
    
    // 如果聊天窗口未打开，先打开窗口
    const existingBox = document.getElementById(`chat-box-${fromId}`);
    if (!existingBox) {
      // 获取好友名字
      const friend = friends.find(f => f.id === fromId);
	if (friend) {
        console.log(`打开与好友 ${friend.name} 的聊天窗口并显示游戏邀请`);
        openChatWindow(currentUser.id, fromId, friend.name).then(() => {
          // 聊天窗口打开后显示邀请
          console.log(`聊天窗口已打开，现在显示游戏邀请，fromId: ${fromId}, currentUser.id: ${currentUser.id}`);
          
          // 检查聊天容器是否存在
          const chatContainer = document.getElementById(`chat-messages-${fromId}`);
          if (!chatContainer) {
            console.error(`致命错误：打开聊天窗口后找不到消息容器 chat-messages-${fromId}`);
            alert(`无法显示游戏邀请：系统错误`);
            return;
          }
          
          // 添加短暂延迟，确保DOM完全加载
          setTimeout(() => {
            const messageBox = document.getElementById(`chat-messages-${fromId}`);
            if (messageBox) {
              console.log(`消息框已找到，当前有 ${messageBox.children.length} 个子元素`);
              // 先清除可能的Loading消息
              if (messageBox.children.length === 1 && messageBox.firstElementChild?.textContent?.includes('Loading')) {
                messageBox.innerHTML = '';
              }
              
              // 更正参数顺序 - 使用fromId作为容器ID参数
              showGameInvitationCard(fromId, fromId, invitationId, false, 'pending');
            } else {
              console.error(`延迟后仍然找不到消息容器: chat-messages-${fromId}`);
            }
          }, 500);
        }).catch(err => {
          console.error('打开聊天窗口时出错:', err);
        });
      } else {
        console.error(`无法找到好友信息，ID: ${fromId}`);
      }
    } else {
      // 聊天窗口已打开，直接显示邀请
      console.log(`聊天窗口已打开，直接显示游戏邀请`);
      
      // 检查聊天容器是否存在
      const chatContainer = document.getElementById(`chat-messages-${fromId}`);
      if (!chatContainer) {
        console.error(`聊天窗口存在但找不到消息容器 chat-messages-${fromId}`);
        return;
      }
      
      // 添加短暂延迟，确保DOM完成更新
      setTimeout(() => {
        // 更正参数顺序 - 使用fromId作为容器ID参数
        showGameInvitationCard(fromId, fromId, invitationId, false, 'pending');
      }, 100);
    }
  }
  
  function handleGameInvitationSent(data: any) {
    console.log('游戏邀请已送达确认:', data)
    // 可以在这里添加额外的UI反馈
	}
  }
  