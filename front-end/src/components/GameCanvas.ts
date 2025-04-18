import { t } from '../State/i18n'

export type GameMode = 'local' | 'tournament'

export class GameCanvas {
  // 添加静态实例跟踪，防止多实例问题
  private static instances: Map<string, GameCanvas> = new Map();
  private static instanceCount: number = 0;
  
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  public leftScore = 0
  public rightScore = 0
  private leftY = 0
  private rightY = 0
  private ballX = 0
  private ballY = 0
  private ballSpeedX = 5
  private ballSpeedY = 5
  private animationId: number | null = null
  private isRunning = false
  private isPaused = false
  private gameMode: 'local' | 'ai' | 'tournament' = 'local'
  private lastTimestamp: number = 0
  private pauseCount: number = 0
  private updatesCount: number = 0
  private showingPauseUI: boolean = false
  private gameSessionId: string = ''
  
  // 添加销毁标记
  private isDestroyed: boolean = false;

  private paddleWidth: number
  private paddleHeight: number
  private ballSize: number
  private paddleSpeed: number
  private maxScore = 11
  private server: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right'

  private keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
  }
  
  // 实例清理方法
  private cleanupOldInstances(instanceId: string) {
    // 查找并清理同类型的旧实例
    GameCanvas.instances.forEach((instance, id) => {
      if (id !== instanceId && instance.gameMode === this.gameMode) {
        console.log(`清理同类型的旧游戏实例: ${id}, 模式: ${instance.gameMode}`);
        instance.destroy();
        GameCanvas.instances.delete(id);
      }
    });
    
    // 如果实例太多，清理所有实例
    if (GameCanvas.instances.size > 3) {
      console.warn(`检测到过多游戏实例(${GameCanvas.instances.size})，清理所有旧实例`);
      GameCanvas.instances.forEach((instance, id) => {
        if (id !== instanceId) {
          instance.destroy();
          GameCanvas.instances.delete(id);
        }
      });
    }
  }

  constructor(
    private canvasId: string,
    private onGameEnd?: (result: {
      winnerAlias: string,
      leftAlias: string,
      rightAlias: string,
      leftScore: number,
      rightScore: number
    }) => void,
    private scale: number = 1,
    private players: { leftAlias: string, rightAlias: string } = {
      leftAlias: 'Player A',
      rightAlias: 'Player B'
    },
	public aiMode: boolean = false
  ) {
    this.gameSessionId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
    console.log(`创建新游戏会话: ${this.gameSessionId}, 当前实例数: ${GameCanvas.instanceCount + 1}`);
    
    // 清理同一画布上的旧实例
    const oldInstance = Array.from(GameCanvas.instances.values())
      .find(instance => instance.canvasId === this.canvasId);
      
    if (oldInstance) {
      console.log(`检测到同一画布上的旧实例，正在清理: ${oldInstance.gameSessionId}`);
      oldInstance.destroy();
      GameCanvas.instances.delete(oldInstance.gameSessionId);
    }
    
    // 清理其他冗余实例
    this.cleanupOldInstances(this.gameSessionId);
    
    // 注册新实例
    GameCanvas.instances.set(this.gameSessionId, this);
    GameCanvas.instanceCount++;
    
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) throw new Error(`Canvas element with id "${canvasId}" not found`)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not found')
    this.canvas = canvas
    this.ctx = ctx

    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height

    this.paddleWidth = 10 * this.scale
    this.paddleHeight = 100 * this.scale
    this.ballSize = 10 * this.scale
    this.paddleSpeed = 6 * this.scale

    this.gameMode = aiMode ? 'ai' : (canvasId === 'tournamentGameCanvas' ? 'tournament' : 'local')

    this.handleKeyboard()
    
    if (this.gameMode !== 'tournament') {
      document.addEventListener('keydown', this.escKeyHandler);
    }
    
    // 初始化时确保游戏不会自动运行，但也不显示暂停UI
    this.isRunning = false;
    this.isPaused = true;
    this.showingPauseUI = false; // 确保初始化时不显示暂停UI
    
    // 将球和挡板放在画布中央位置
    this.leftY = this.canvas.height / 2 - this.paddleHeight / 2;
    this.rightY = this.canvas.height / 2 - this.paddleHeight / 2;
    this.ballX = this.canvas.width / 2;
    this.ballY = this.canvas.height / 2;
    
    // 立即重置DOM中的比分显示
    this.leftScore = 0;
    this.rightScore = 0;
    this.updateScoreDOM();
    this.clearWinner();
    
    // 强制清除任何可能存在的胜利者显示
    requestAnimationFrame(() => {
      if (this.isDestroyed) return;
      const winnerElement = document.getElementById('winner');
      if (winnerElement) {
        winnerElement.textContent = '';
      }
    });
    
    // 初始化时重置所有DOM状态
    setTimeout(() => {
      // 延迟执行确保DOM已完全加载
      if (!this.isDestroyed) {
        // 再次确保分数显示为0
        this.resetScore();
        // 确保UI干净
        this.hidePauseUI();
        // 绘制初始状态但不显示暂停文字
        this.draw(true);
      }
    }, 100);
  }
  
  // 新增Esc键处理函数，便于移除事件监听器
  private escKeyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.togglePause();
    }
  };
  
  // 新增销毁方法
  public destroy() {
    if (this.isDestroyed) return;
    
    console.log(`销毁游戏实例: ${this.gameSessionId}, 模式: ${this.gameMode}`);
    
    // 停止游戏循环
    this.stopGameLoop();
    
    // 移除事件监听器
    document.removeEventListener('keydown', this.escKeyHandler);
    document.removeEventListener('keydown', this.keydownHandler);
    document.removeEventListener('keyup', this.keyupHandler);
    
    // 隐藏任何UI
    this.hidePauseUI();
    
    // 标记为已销毁
    this.isDestroyed = true;
    
    // 从实例映射中移除
    GameCanvas.instances.delete(this.gameSessionId);
    GameCanvas.instanceCount--;
    
    console.log(`游戏实例已销毁, 剩余实例数: ${GameCanvas.instanceCount}`);
  }
  
  // 提取键盘处理函数，便于移除事件监听器
  private keydownHandler = (e: KeyboardEvent) => {
    if (e.key in this.keys) this.keys[e.key as keyof typeof this.keys] = true;
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
    }
  };
  
  private keyupHandler = (e: KeyboardEvent) => {
    if (e.key in this.keys) this.keys[e.key as keyof typeof this.keys] = false;
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
    }
  };

  public start() {
    if (this.isDestroyed) {
      console.error("尝试启动已销毁的游戏实例");
      return;
    }
    
    // 重置游戏状态
    this.resetGameState();
    
    // 手动设置初始状态
    this.leftScore = 0;
    this.rightScore = 0;
    
    // 确保挡板在中间位置
    this.leftY = this.canvas.height / 2 - this.paddleHeight / 2;
    this.rightY = this.canvas.height / 2 - this.paddleHeight / 2;
    
    // 生成新的会话ID
    this.gameSessionId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
    console.log(`开始游戏会话: ${this.gameSessionId}，比分已重置为0:0`);
    
    // 更新实例映射中的键
    GameCanvas.instances.delete(this.gameSessionId);
    GameCanvas.instances.set(this.gameSessionId, this);
    
    // 重置所有状态计数器
    this.pauseCount = 0;
    this.updatesCount = 0;
    this.lastTimestamp = 0;
    
    // 设置服务方向并重置球
    this.server = Math.random() < 0.5 ? 'left' : 'right';
    this.resetBall();
    
    // 更新UI
    this.clearWinner();
    this.updateScoreDOM();
    
    // 开始游戏
    this.isRunning = true;
    this.isPaused = false;
    this.showingPauseUI = false;

    // 启动游戏循环
    this.gameLoop();
  }

  public stop() {
    if (this.isDestroyed) return;
    
    this.stopGameLoop();
    this.isRunning = false
    this.isPaused = false
    this.showingPauseUI = false
    
    // 停止时也重置比分显示
    this.resetScore();
  }
  
  private stopGameLoop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
      console.log(`游戏循环已停止，会话ID: ${this.gameSessionId}`);
    }
  }
  
  public togglePause() {
    if (this.isDestroyed) return false;
    if (this.gameMode === 'tournament') return false;
    if (!this.isRunning && !this.isPaused) return false;
    
    this.pauseCount++;
    console.log(`暂停/恢复操作 #${this.pauseCount}, 运行状态:${this.isRunning}, 暂停UI状态:${this.showingPauseUI}, 会话ID: ${this.gameSessionId}`);
    
    // 状态一致性检查
    if (this.showingPauseUI) {
      if (!this.isPaused) {
        console.log("状态不一致：UI显示但游戏未暂停，强制暂停");
        this.isPaused = true;
      }
    }
    
    // 切换暂停状态
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      // 彻底停止游戏循环
      this.stopGameLoop();
      // 显示暂停UI
      this.showPauseUI();
      
      // 确认游戏完全停止
      console.log(`游戏已暂停，强制停止游戏循环, 会话ID: ${this.gameSessionId}, 比分: ${this.leftScore}:${this.rightScore}`);
      this.isRunning = false; // 暂时设置为false，恢复时再设回true
    } else {
      // 隐藏暂停UI
      this.hidePauseUI();
      // 恢复游戏运行
      this.isRunning = true;
      console.log(`尝试恢复游戏运行, 会话ID: ${this.gameSessionId}, 比分: ${this.leftScore}:${this.rightScore}`);
      
      // 确保游戏循环完全重置
      this.stopGameLoop();
      this.lastTimestamp = 0;
      this.gameLoop();
    }
    
    return this.isPaused;
  }

  private showPauseUI() {
    if (this.isDestroyed) return;
    if (this.showingPauseUI) return;
    
    let pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
      pauseOverlay.remove();
    }
    
    // 先确保游戏完全停止
    this.stopGameLoop();
    this.isPaused = true;
    this.isRunning = false;
    this.showingPauseUI = true;
    
    pauseOverlay = document.createElement('div');
    pauseOverlay.id = 'pause-overlay';
    pauseOverlay.className = 'fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center';
    
    // 简化UI，只显示基本的暂停界面
    let content = `
      <div class="bg-[#2a2a3d] rounded-xl p-6 w-80 text-center shadow-2xl border border-indigo-500/30">
        <h3 class="text-2xl text-white font-bold mb-4">${t('main.gamePaused')}</h3>
        <p class="text-gray-300 mb-6">${t('main.pressEscOrButton')}</p>
        
        <div class="flex justify-center gap-4">
          <button id="resume-game" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md">
            ${t('main.resume')}
          </button>
        </div>
      </div>
    `;
    
    pauseOverlay.innerHTML = content;
    document.body.appendChild(pauseOverlay);
    
    // 确保游戏此时只绘制一次以显示当前状态，但不运行
    this.draw();
    
    const resumeButton = document.getElementById('resume-game');
    
    if (resumeButton) {
      const oldResumeButton = resumeButton.cloneNode(true);
      resumeButton.parentNode?.replaceChild(oldResumeButton, resumeButton);
    }
    
    document.getElementById('resume-game')?.addEventListener('click', () => {
      if (!this.isDestroyed) {
        this.togglePause();
      }
    });
  }
  
  private hidePauseUI() {
    if (this.isDestroyed) return;
    
    const wasShowingUI = this.showingPauseUI;
    this.showingPauseUI = false;
    
    const pauseOverlay = document.getElementById('pause-overlay');
    if (pauseOverlay) {
      pauseOverlay.remove();
    }
    
    // 隐藏暂停UI不应该自动启动游戏
    // 只有在被togglePause函数明确调用，且isPaused=false时才启动游戏
    if (wasShowingUI && !this.isPaused) {
      console.log("UI被隐藏，检查是否应该恢复游戏");
      // 只有当明确调用恢复游戏时才启动游戏循环
      if (this.isRunning) {
        console.log("游戏状态为运行，启动游戏循环");
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.gameLoop();
          }
        }, 0);
      } else {
        console.log("游戏状态为停止，不启动游戏循环");
      }
    }
  }

  // 重新添加必要的基础方法
  private handleKeyboard() {
    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);
  }

  private resetBall() {
    if (this.isDestroyed) return;
    
    this.ballX = this.canvas.width / 2
    this.ballY = this.canvas.height / 2
    const speed = 5 * this.scale
    const angle = (Math.random() * 0.6 - 0.3)
    const direction = this.server === 'left' ? 1 : -1
    this.ballSpeedX = Math.cos(angle) * speed * direction
    this.ballSpeedY = Math.sin(angle) * speed
  }

  public resetGameState() {
    if (this.isDestroyed) return;
    
    console.log('重置游戏状态');
    
    // 首先停止所有游戏循环
    this.stopGameLoop();
    
    // 完全重置所有游戏状态
    this.isPaused = false;
    this.isRunning = false;
    this.showingPauseUI = false;
    this.lastTimestamp = 0;
    this.pauseCount = 0;
    this.updatesCount = 0;
    this.leftScore = 0;
    this.rightScore = 0;
    
    // 重置球和挡板位置
    this.leftY = this.canvas.height / 2 - this.paddleHeight / 2;
    this.rightY = this.canvas.height / 2 - this.paddleHeight / 2;
    this.ballX = this.canvas.width / 2;
    this.ballY = this.canvas.height / 2;
    
    // 生成新的游戏会话ID
    this.gameSessionId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
    console.log(`重置游戏状态完成，新会话ID: ${this.gameSessionId}`);
    
    // 更新实例映射中的键
    GameCanvas.instances.delete(this.gameSessionId);
    GameCanvas.instances.set(this.gameSessionId, this);
    
    // 隐藏任何UI
    this.hidePauseUI();
    
    // 更新显示
    this.updateScoreDOM();
    this.draw();
  }
  
  public restart() {
    if (this.isDestroyed) return;
    
    console.log("完全重启游戏");
    
    // 停止所有游戏循环
    this.stopGameLoop();
    this.hidePauseUI();
    
    // 重置所有游戏数据
    this.resetGameState();
    
    // 更新DOM显示
    this.resetScore();
    this.clearWinner();
    
    // 生成全新会话ID并启动
    this.gameSessionId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
    console.log(`开始全新游戏会话: ${this.gameSessionId}`);
    
    // 更新实例映射中的键
    GameCanvas.instances.delete(this.gameSessionId);
    GameCanvas.instances.set(this.gameSessionId, this);
    
    // 启动新游戏
    this.start();
  }

  // 添加resetScore方法
  public resetScore() {
    if (this.isDestroyed) return;
    
    this.leftScore = 0;
    this.rightScore = 0;
    this.updateScoreDOM();
  }

  private update() {
    if (this.isDestroyed) return;
    
    // 多重检查确保游戏在暂停状态下不会更新
    if (this.isPaused || this.showingPauseUI || !this.isRunning) {
      return;
    }
    
    this.updatesCount++;
    if (this.updatesCount % 100 === 0) {
      console.log(`游戏更新计数: ${this.updatesCount}, 分数: ${this.leftScore}:${this.rightScore}, 会话ID: ${this.gameSessionId}`);
    }

    // 计算球的新位置
    const newBallX = this.ballX + this.ballSpeedX;
    const newBallY = this.ballY + this.ballSpeedY;

    // 垂直边界碰撞检测
    if (newBallY <= 0 || newBallY + this.ballSize >= this.canvas.height) {
      this.ballSpeedY = -this.ballSpeedY;
      // 调整球的位置，确保它不会穿过边界
      if (newBallY <= 0) {
        this.ballY = 0;
      } else {
        this.ballY = this.canvas.height - this.ballSize;
      }
    } else {
      this.ballY = newBallY;
    }

    // 左侧挡板碰撞检测
    if (
      newBallX <= this.paddleWidth &&
      newBallX > 0 &&
      newBallY + this.ballSize >= this.leftY &&
      newBallY <= this.leftY + this.paddleHeight
    ) {
      this.ballSpeedX = -this.ballSpeedX;
      this.ballX = this.paddleWidth; // 确保球在挡板外侧
    }
    // 右侧挡板碰撞检测
    else if (
      newBallX + this.ballSize >= this.canvas.width - this.paddleWidth &&
      newBallX + this.ballSize < this.canvas.width &&
      newBallY + this.ballSize >= this.rightY &&
      newBallY <= this.rightY + this.paddleHeight
    ) {
      this.ballSpeedX = -this.ballSpeedX;
      this.ballX = this.canvas.width - this.paddleWidth - this.ballSize; // 确保球在挡板外侧
    }
    // 左右边界得分检测
    else if (newBallX < 0) {
      if (this.rightScore < this.maxScore) {
        this.rightScore++;
        this.updateScoreDOM();
        console.log(`得分更新: 右方得分，当前 ${this.leftScore}:${this.rightScore}, 会话ID: ${this.gameSessionId}`);
        
        if (this.rightScore >= this.maxScore) {
          this.isRunning = false;
          this.showWinner(this.players.rightAlias);
          this.onGameEnd?.({
            winnerAlias: this.players.rightAlias,
            leftAlias: this.players.leftAlias,
            rightAlias: this.players.rightAlias,
            leftScore: this.leftScore,
            rightScore: this.rightScore
          });
          return;
        }
        this.updateServer();
        this.resetBall();
      }
    }
    else if (newBallX > this.canvas.width) {
      if (this.leftScore < this.maxScore) {
        this.leftScore++;
        this.updateScoreDOM();
        console.log(`得分更新: 左方得分，当前 ${this.leftScore}:${this.rightScore}, 会话ID: ${this.gameSessionId}`);
        
        if (this.leftScore >= this.maxScore) {
          this.isRunning = false;
          this.showWinner(this.players.leftAlias);
          this.onGameEnd?.({
            winnerAlias: this.players.leftAlias,
            leftAlias: this.players.leftAlias,
            rightAlias: this.players.rightAlias,
            leftScore: this.leftScore,
            rightScore: this.rightScore
          });
          return;
        }
        this.updateServer();
        this.resetBall();
      }
    }
    // 如果没有碰撞，正常更新球的X位置
    else {
      this.ballX = newBallX;
    }

    // 更新挡板位置
    if (this.keys.w && this.leftY > 0) this.leftY -= this.paddleSpeed;
    if (this.keys.s && this.leftY + this.paddleHeight < this.canvas.height) this.leftY += this.paddleSpeed;
    
    if (this.aiMode) {
      const paddleCenter = this.rightY + this.paddleHeight / 2;
      const ballCenter = this.ballY + this.ballSize / 2;
      const aiSpeed = this.paddleSpeed * 0.9;
  
      if (paddleCenter < ballCenter - 10) {
        this.rightY += aiSpeed;
      } else if (paddleCenter > ballCenter + 10) {
        this.rightY -= aiSpeed;
      }
  
      if (this.rightY < 0) {
        this.rightY = 0;
      } else if (this.rightY + this.paddleHeight > this.canvas.height) {
        this.rightY = this.canvas.height - this.paddleHeight;
      }
    } else {
      if (this.keys.ArrowUp && this.rightY > 0) this.rightY -= this.paddleSpeed;
      if (this.keys.ArrowDown && this.rightY + this.paddleHeight < this.canvas.height) this.rightY += this.paddleSpeed;
    }
  }

  private draw(skipPauseText = false) {
    if (this.isDestroyed) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(this.ballX, this.ballY, this.ballSize, this.ballSize)
    this.ctx.fillRect(0, this.leftY, this.paddleWidth, this.paddleHeight)
    this.ctx.fillRect(this.canvas.width - this.paddleWidth, this.rightY, this.paddleWidth, this.paddleHeight)
    
    // 只有当isPaused为true且不跳过暂停文字时才显示暂停覆盖层
    if (this.isPaused && !skipPauseText && this.gameMode !== 'tournament') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = `${20 * this.scale}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(t('main.paused'), this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  private gameLoop = (timestamp: number = 0) => {
    if (this.isDestroyed) return;
    
    // 记录当前状态，用于调试
    const sessionId = this.gameSessionId;
    const leftScore = this.leftScore;
    const rightScore = this.rightScore;
    
    // 保存当前的animationId，用于检测重复循环
    const currentAnimationId = this.animationId;
    
    // 多重检查确保游戏不会在不应该运行的情况下运行
    if (this.isPaused) {
      console.log(`游戏已暂停，不继续循环, 会话ID: ${sessionId}, 比分: ${leftScore}:${rightScore}, animationId: ${currentAnimationId}`);
      return;
    }
    
    if (!this.isRunning) {
      console.log(`游戏未设置为运行状态，不继续循环, 会话ID: ${sessionId}, 比分: ${leftScore}:${rightScore}, animationId: ${currentAnimationId}`);
      return;
    }
    
    if (this.showingPauseUI) {
      console.log(`正在显示暂停UI，不继续循环, 会话ID: ${sessionId}, 比分: ${leftScore}:${rightScore}, animationId: ${currentAnimationId}`);
      // 强制一致性
      this.isPaused = true;
      this.isRunning = false;
      return;
    }
    
    // 检测重复的游戏循环调用
    if (currentAnimationId && currentAnimationId !== this.animationId) {
      console.error(`检测到重复的游戏循环! 当前: ${currentAnimationId}, 存储: ${this.animationId}`);
      // 取消当前帧的循环，避免多个循环同时运行
      return;
    }
    
    // 检测新的游戏循环
    if (this.animationId === null) {
      console.log(`启动新的游戏循环，会话ID: ${sessionId}, 比分: ${leftScore}:${rightScore}`);
      this.lastTimestamp = timestamp;
    }

    // 如果是首帧或时间戳被重置
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
      this.draw();
      // 状态再次检查，确保游戏仍应该运行
      if (this.isRunning && !this.isPaused && !this.showingPauseUI && !this.isDestroyed) {
        this.animationId = requestAnimationFrame(this.gameLoop);
      } else {
        console.log(`状态变化，取消游戏循环, 会话ID: ${sessionId}, 比分: ${leftScore}:${rightScore}`);
        this.animationId = null;
      }
      return;
    }

    const elapsed = timestamp - this.lastTimestamp;
    
    // 限制更新频率，确保稳定的游戏速度
    if (elapsed > 16) { // 约 60fps
      this.lastTimestamp = timestamp;
      this.update();
    }
    
    this.draw();
    
    // 确保只有在游戏应该运行时才请求下一帧
    if (this.isRunning && !this.isPaused && !this.showingPauseUI && !this.isDestroyed) {
      // 取消任何可能存在的动画帧（防止重复）
      if (this.animationId !== null) {
        cancelAnimationFrame(this.animationId);
      }
      
      // 请求新的动画帧
      this.animationId = requestAnimationFrame(this.gameLoop);
    } else {
      console.log(`游戏状态变化，不请求下一帧, 会话ID: ${sessionId}, 比分: ${leftScore}:${rightScore}`);
      this.animationId = null;
    }
  }

  private updateScoreDOM() {
    if (this.isDestroyed) return;
    
    const leftScore = this.leftScore;
    const rightScore = this.rightScore;
    
    requestAnimationFrame(() => {
      const left = document.getElementById('leftScore')
      const right = document.getElementById('rightScore')
      if (left) left.textContent = String(leftScore)
      if (right) right.textContent = String(rightScore)
    });
  }

  private updateServer() {
    const totalPoints = this.leftScore + this.rightScore
    if (this.leftScore >= 10 && this.rightScore >= 10) {
      this.server = this.server === 'left' ? 'right' : 'left'
    } else if (totalPoints % 2 === 0) {
      this.server = this.server === 'left' ? 'right' : 'left'
    }
  }

  private showWinner(name: string) {
    if (this.isDestroyed) return;
    
    const text = document.getElementById('winner')
    if (text) text.textContent = `${name} ${t('main.wins')}`
  }

  private clearWinner() {
    if (this.isDestroyed) return;
    
    const text = document.getElementById('winner')
    if (text) text.textContent = ''
  }

  // 重置所有分数显示
  public static resetAllScores() {
    console.log(`静态方法：重置所有游戏实例的分数显示`);
    
    // 无论实例如何，强制重置DOM中的分数
    requestAnimationFrame(() => {
      const leftScore = document.getElementById('leftScore');
      const rightScore = document.getElementById('rightScore');
      const winner = document.getElementById('winner');
      
      if (leftScore) leftScore.textContent = '0';
      if (rightScore) rightScore.textContent = '0';
      if (winner) winner.textContent = '';
    });
    
    // 同时重置所有实例中的分数
    GameCanvas.instances.forEach(instance => {
      if (!instance.isDestroyed) {
        instance.resetScore();
      }
    });
  }
  
  // 获取页面中首个活跃的游戏实例
  public static getActiveInstance(): GameCanvas | null {
    // 找到第一个未销毁的实例
    for (const instance of GameCanvas.instances.values()) {
      if (!instance.isDestroyed) {
        return instance;
      }
    }
    return null;
  }
  
  // 页面初始化时调用，清理所有实例
  public static cleanup() {
    console.log(`静态清理：移除所有游戏实例`);
    GameCanvas.instances.forEach(instance => {
      instance.destroy();
    });
    GameCanvas.instances.clear();
    GameCanvas.instanceCount = 0;
    
    // 重置DOM中的分数显示
    GameCanvas.resetAllScores();
  }
}
