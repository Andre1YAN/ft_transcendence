// src/ws/globalSocket.ts
import { t } from '../State/i18n';

type WSCallback = (data: any) => void;

interface WSListeners {
  presence: WSCallback[];
  chat: WSCallback[];
  message_sent: WSCallback[];
  game_invitation: WSCallback[];
  game_invitation_sent: WSCallback[];
  game_invitation_response: WSCallback[];

    // 新增频道相关事件
	channel_message: WSCallback[];      // 频道消息
	channel_user_joined: WSCallback[];  // 用户加入频道
	channel_user_left: WSCallback[];    // 用户离开频道
	channel_user_kicked: WSCallback[];  // 用户被踢出
	channel_user_muted: WSCallback[];   // 用户被禁言
	channel_user_unmuted: WSCallback[]; // 用户被解除禁言
	channel_admin_changed: WSCallback[]; // 管理员变更
	you_were_kicked: WSCallback[];     // 当前用户被踢出
	you_were_muted: WSCallback[];      // 当前用户被禁言
	you_were_unmuted: WSCallback[];    // 当前用户被解除禁言
}

export class GlobalSocket {
	private socket: WebSocket | null = null;
	private listeners: WSListeners = { 
	  presence: [], 
	  chat: [], 
	  message_sent: [],
	  game_invitation: [],
	  game_invitation_sent: [],
	  game_invitation_response: [],
	  channel_message: [],
	  channel_user_joined: [],
	  channel_user_left: [],
	  channel_user_kicked: [],
	  channel_user_muted: [],
	  channel_user_unmuted: [],
	  channel_admin_changed: [],
	  you_were_kicked: [],
	  you_were_muted: [],
	  you_were_unmuted: []
	};
	private userId: number;
	private pingIntervalId: ReturnType<typeof setInterval> | null = null;
	private manuallyClosed = false;
	private messageQueue: any[] = []; // 添加消息队列，保存断线期间的消息
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	private connectionStartTime: number = 0;
  
	constructor(userId: number) {
	  this.userId = userId;
	  this.init();
	  
	  // 定期检查连接状态
	  setInterval(() => this.checkConnection(), 10000);
	}
	
	// 检查连接状态，如果连接断开则重连
	private checkConnection() {
	  if (!this.socket || this.socket.readyState > 1) { // 1=OPEN, >1表示关闭中或已关闭
	    console.log(`[GlobalSocket] 检测到WebSocket未连接，状态: ${this.socket?.readyState}，尝试重连...`);
	    this.init();
	  } else if (this.socket.readyState === 1) {
	    const connectedTime = Math.floor((Date.now() - this.connectionStartTime) / 1000);
	    console.log(`[GlobalSocket] WebSocket连接状态良好，已连接: ${connectedTime}秒`);
	  }
	}
  
	private init() {
	  if (this.socket && this.socket.readyState <= 1) {
	    console.log(t('websocket.already_connected'));
	    return;
	  }
	  
	  if (this.manuallyClosed) {
	    console.log(t('websocket.connection_closed'));
	    return;
	  }
	  
	  try {
	    console.log(t('websocket.connection_init'));
	    this.socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3000/ws/presence`);
    
	    this.socket.addEventListener('open', () => {
	      console.log(t('websocket.connection_open'));
	      
	      // 发送上线消息
	      this.socket?.send(JSON.stringify({ type: 'online', userId: this.userId }));
	      
	      // 发送队列中的消息
	      this.messageQueue.forEach(msg => {
	        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
	          this.socket.send(JSON.stringify(msg));
	        }
	      });
	      
	      // 清空队列
	      this.messageQueue = [];
	      
	      // 设置定时ping来保持连接
	      if (this.pingIntervalId) {
	        clearInterval(this.pingIntervalId);
	      }
	      
	      this.pingIntervalId = setInterval(() => {
	        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
	          console.log(t('websocket.ping_sent'));
	          this.socket.send(JSON.stringify({ type: 'ping' }));
	        }
	      }, 30000); // 每30秒ping一次
	    });
	    
	    this.socket.addEventListener('close', (event) => {
	      console.log(`[GlobalSocket] WebSocket连接关闭，代码: ${event.code}, 原因: ${event.reason || '未知'}`);
	    
	      if (this.pingIntervalId) {
	        clearInterval(this.pingIntervalId);
	        this.pingIntervalId = null;
	      }
	    
	      this.socket = null;
	    
	      // 如果不是手动关闭，则尝试重连
	      if (!this.manuallyClosed) {
	        this.reconnectAttempts++;
	        
	        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
	          const delay = Math.min(3000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
	          console.log(`[GlobalSocket] 尝试第${this.reconnectAttempts}次重连，延迟: ${delay}ms`);
	          
	          if (this.reconnectTimeout) {
	            clearTimeout(this.reconnectTimeout);
	          }
	          
	          this.reconnectTimeout = setTimeout(() => this.init(), delay);
	        } else {
	          console.error(`[GlobalSocket] 达到最大重连次数(${this.maxReconnectAttempts})，停止重连`);
	          // 通知用户刷新页面
	          alert('聊天连接已断开，请刷新页面重新连接。');
	        }
	      }
	    });
	    
	    this.socket.addEventListener('message', (event) => {
	      try {
	        const data = JSON.parse(event.data);
	        console.log(`[GlobalSocket] 收到消息: ${data.type}`);
	        
	        if (data.type === 'presence') {
	          console.log(`[GlobalSocket] 收到状态更新: 用户${data.userId} ${data.status}`);
	          this.listeners.presence.forEach((cb) => cb(data));
	        } else if (data.type === 'chat') {
	          console.log(`[GlobalSocket] 收到聊天消息: 来自${data.from}`);
	          this.listeners.chat.forEach((cb) => cb(data));
	        } else if (data.type === 'message_sent') {
	          console.log(`[GlobalSocket] 收到消息确认: 发送给${data.to}`);
	          this.listeners.message_sent.forEach((cb) => cb(data));
	        } else if (data.type === 'game_invitation') {
	          console.log(`[GlobalSocket] 收到游戏邀请: 来自${data.from}, ID: ${data.invitationId}`);
	          this.listeners.game_invitation.forEach((cb) => cb(data));
	        } else if (data.type === 'game_invitation_sent') {
	          console.log(`[GlobalSocket] 收到游戏邀请已送达确认: ${data.invitationId}`);
	          this.listeners.game_invitation_sent.forEach((cb) => cb(data));
	        } else if (data.type === 'game_invitation_response') {
	          console.log(`[GlobalSocket] 收到游戏邀请回应: ${data.response}`);
	          this.listeners.game_invitation_response.forEach((cb) => cb(data));
	        } else if (data.type === 'channel_message') {
	          console.log(`[GlobalSocket] 收到频道消息: 频道${data.channelId}`);
	          this.listeners.channel_message.forEach((cb) => cb(data));
	        } else if (data.type === 'channel_user_joined') {
	          console.log(t('websocket.channel_message.received'));
	          this.listeners.channel_user_joined.forEach((cb) => cb(data));
	        } else if (data.type === 'channel_user_left') {
	          console.log(t('websocket.channel_message.received'));
	          this.listeners.channel_user_left.forEach((cb) => cb(data));
	        } else if (data.type === 'channel_user_kicked') {
	          console.log(t('websocket.channel_message.received'));
	          this.listeners.channel_user_kicked.forEach((cb) => cb(data));
	        } else if (data.type === 'channel_user_muted') {
	          console.log(t('websocket.channel_message.received'));
	          this.listeners.channel_user_muted.forEach((cb) => cb(data));
	        } else if (data.type === 'channel_user_unmuted') {
	          console.log(t('websocket.channel_message.received'));
	          this.listeners.channel_user_unmuted.forEach((cb) => cb(data));
	        } else if (data.type === 'channel_admin_changed') {
	          console.log(t('websocket.channel_message.received'));
	          this.listeners.channel_admin_changed.forEach((cb) => cb(data));
	        } else if (data.type === 'you_were_kicked') {
	          console.log(t('websocket.channel_message.received'));
	          this.listeners.you_were_kicked.forEach((cb) => cb(data));
	        } else if (data.type === 'you_were_muted') {
	          console.log(t('websocket.channel_message.received'));
	          this.listeners.you_were_muted.forEach((cb) => cb(data));
	        } else if (data.type === 'you_were_unmuted') {
	          console.log(t('websocket.channel_message.received'));
	          this.listeners.you_were_unmuted.forEach((cb) => cb(data));
	        } else {
	          console.log(t('websocket.invalid_message') + ': ' + data.type);
	        }
	      } catch (err) {
	        console.error(t('websocket.invalid_message'), err);
	      }
	    });
	    
	    this.socket.addEventListener('error', (err) => {
	      console.error(t('websocket.connection_error'), err);
	    });
	    
	  } catch (err) {
	    console.error(t('websocket.connection_error'), err);
	    // 过一段时间后重试
	    setTimeout(() => this.init(), 5000);
	  }
	}
  
	public on(eventType: keyof WSListeners, callback: WSCallback) {
	  this.listeners[eventType].push(callback);
	  console.log(`[GlobalSocket] 注册${eventType}事件监听器，当前共${this.listeners[eventType].length}个`);
	  return this; // 支持链式调用
	}

	public off(eventType: keyof WSListeners, callback: WSCallback) {
		this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
		console.log(`[GlobalSocket] 移除${eventType}事件监听器，剩余${this.listeners[eventType].length}个`);
		return this; // 支持链式调用
	}	  
  
	public send(data: any) {
	  if (!data) {
	    console.error('[GlobalSocket] 无效的消息数据');
	    return;
	  }
	  
	  // 如果WebSocket已连接，直接发送
	  if (this.socket && this.socket.readyState === WebSocket.OPEN) {
	    try {
	      // 确保消息正确序列化
	      let message: string;
	      if (typeof data === 'string') {
	        message = data;
	      } else {
	        // 记录消息类型便于调试
	        const msgType = data.type || 'unknown';
	        console.log(`[GlobalSocket] 准备发送${msgType}类型消息`);
	        
	        // 确保channelId是字符串类型（如果存在）
	        if (data.type === 'channel_message' && data.channelId) {
	          data.channelId = String(data.channelId);
	          console.log(`[GlobalSocket] 发送频道消息到频道 ${data.channelId}`);
	        }
	        
	        message = JSON.stringify(data);
	      }
	      
	      console.log(`[GlobalSocket] 发送消息: ${data.type || 'unknown type'}`);
	      this.socket.send(message);
	    } catch (err) {
	      console.error('[GlobalSocket] 发送消息时出错:', err);
	      // 添加到队列中，等待连接恢复后发送
	      this.messageQueue.push(data);
	    }
	  } else {
	    // WebSocket未连接，添加到队列
	    console.log(`[GlobalSocket] WebSocket未连接，消息添加到队列: ${data.type}`);
	    this.messageQueue.push(data);
	    // 如果WebSocket已关闭，尝试重连
	    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
	      console.log('[GlobalSocket] 重新初始化WebSocket连接');
	      this.init();
	    }
	  }
	}
  
	public getSocket() {
	  return this.socket;
	}
	
	public getState() {
	  if (!this.socket) return 'DISCONNECTED';
	  return ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][this.socket.readyState];
	}
  
	public close(isExit = false) {
		this.manuallyClosed = true;
		console.log('[GlobalSocket] 手动关闭WebSocket连接');
		
		if (this.reconnectTimeout) {
		  clearTimeout(this.reconnectTimeout);
		  this.reconnectTimeout = null;
		}
		
		if (this.socket) {
		  try {
		    this.socket.close();
		  } catch (err) {
		    console.error('[GlobalSocket] 关闭WebSocket时出错:', err);
		  }
		}
	  
		if (isExit) {
		  // 防止后续被自动重连
		  this.socket = null;
		  if (this.pingIntervalId) {
		    clearInterval(this.pingIntervalId);
		    this.pingIntervalId = null;
		  }
		}
	}	  

	public reset() {
		this.manuallyClosed = false;
		console.log('[GlobalSocket] 重置WebSocket连接状态');
	  
		// 强制关闭旧连接后，重新初始化
		if (this.socket) {
		  try {
		    this.socket.close();
		  } catch (err) {
		    console.error('[GlobalSocket] 重置时关闭WebSocket出错:', err);
		  }
		}
		
		this.init();
	}		
}  

let globalSocket: GlobalSocket | null = null;

export function initGlobalSocket(userId: number): GlobalSocket {
	if (!globalSocket) {
	  console.log('[GlobalSocket] 初始化全局WebSocket，用户ID:', userId);
	  globalSocket = new GlobalSocket(userId);
	} else if (globalSocket.getState() !== 'OPEN') {
	  console.log('[GlobalSocket] 现有WebSocket未连接，重置');
	  globalSocket.reset();
	} else {
	  console.log('[GlobalSocket] 复用现有WebSocket连接');
	}
  
	return globalSocket;
}  

export function getSocket() {
  return window.globalSocket;
}  
