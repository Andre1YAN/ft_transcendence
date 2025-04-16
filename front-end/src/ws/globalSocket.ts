// src/ws/globalSocket.ts
type WSCallback = (data: any) => void;

interface WSListeners {
  presence: WSCallback[];
  chat: WSCallback[];
}

class GlobalSocket {
	private socket: WebSocket | null = null;
	private listeners: WSListeners = { presence: [], chat: [] };
	private userId: number;
	private pingIntervalId: ReturnType<typeof setInterval> | null = null;
	private manuallyClosed = false; // ✅ 新增
  
	constructor(userId: number) {
	  this.userId = userId;
	  this.init();
	}
  
	private init() {
	  if (this.socket || this.manuallyClosed) return; // ✅ 如果是手动关闭，就不重连
  
	  this.socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://localhost:3000/ws/presence`);
  
	  this.socket.addEventListener('open', () => {
		console.log(`WebSocket opened for user ${this.userId}`);
		this.socket?.send(JSON.stringify({ type: 'online', userId: this.userId }));
  
		this.pingIntervalId = setInterval(() => {
		  if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify({ type: 'ping' }));
		  }
		}, 30000);
	  });
  
	  this.socket.addEventListener('close', () => {
		console.log('GlobalSocket closed, retry in 3 seconds');
  
		if (this.pingIntervalId) {
		  clearInterval(this.pingIntervalId);
		  this.pingIntervalId = null;
		}
  
		this.socket = null;
  
		if (!this.manuallyClosed) {
		  setTimeout(() => this.init(), 3000); // ✅ 自动重连仅当不是主动退出
		}
	  });
  
	  this.socket.addEventListener('message', (event) => {
		try {
		  const data = JSON.parse(event.data);
		  if (data.type === 'presence') {
			this.listeners.presence.forEach((cb) => cb(data));
		  } else if (data.type === 'chat') {
			this.listeners.chat.forEach((cb) => cb(data));
		  }
		} catch (err) {
		  console.error('GlobalSocket message error:', err);
		}
	  });
  
	  this.socket.addEventListener('error', (err) => {
		console.error('🚨 GlobalSocket error:', err);
	  });
	}
  
	public on(eventType: 'presence' | 'chat', callback: WSCallback) {
	  this.listeners[eventType].push(callback);
	}

	public off(eventType: 'presence' | 'chat', callback: WSCallback) {
		this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback)
	  }	  
  
	public send(data: any) {
	  if (this.socket && this.socket.readyState === WebSocket.OPEN) {
		this.socket.send(JSON.stringify(data));
	  }
	}
  
	public getSocket() {
	  return this.socket;
	}
  
	public close(isExit = false) {
		this.manuallyClosed = true
		this.socket?.close()
	  
		if (isExit) {
		  // 防止后续被自动重连
		  this.socket = null
		  this.pingIntervalId && clearInterval(this.pingIntervalId)
		}
	  }	  

	public reset() {
		this.manuallyClosed = false;
	  
		// 🔄 强制关闭旧连接后，重新初始化
		if (this.socket) {
		  this.socket.close(); // 会自动触发 `close` 监听逻辑
		} else {
		  this.init();
		}
	  }		
  }  

let globalSocket: GlobalSocket | null = null;

export function initGlobalSocket(userId: number): GlobalSocket {
	if (!globalSocket) {
	  console.log('🆕 Initializing GlobalSocket for user', userId);
	  globalSocket = new GlobalSocket(userId);
	} else {
	  console.log('♻️ Reusing existing GlobalSocket');
	  globalSocket.reset(); // ✅ 更干净优雅
	}
  
	return globalSocket;
  }  
