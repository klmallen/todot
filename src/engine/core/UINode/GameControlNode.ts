import { BaseUINode } from './BaseUINode';
import Engine from '../Engine';
import { getIsPlaying, setIsPlaying } from '../../states/useEditorMode';

/**
 * 游戏控制节点类 - 提供类似Unity的游戏控制界面
 */
export class GameControlNode extends BaseUINode {
  private fpsDisplay: HTMLElement | null = null;
  private playButton: HTMLElement | null = null;
  private pauseButton: HTMLElement | null = null;
  private returnButton: HTMLElement | null = null;
  private statsContainer: HTMLElement | null = null;
  
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsUpdateInterval: number = 500; // 每500ms更新一次FPS
  private fpsHistory: number[] = [];
  private maxFpsHistoryLength: number = 60; // 存储最近60帧数据
  private animationFrameId: number | null = null;

  constructor() {
    super('游戏控制');
    // 设置样式和位置
    this.size = { width: 320, height: 'auto' as any };
    this.position = { x: 10, y: -10 };
    
    // 扩展基础样式
    Object.assign(this.style, {
      backgroundColor: 'hsla(215, 30%, 25%, 0.9)',
      color: '#fff',
      padding: '0',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    // 监听游戏状态变化
    this.createEffect(() => {
      const isPlaying = getIsPlaying();
      this.updateButtonStates(isPlaying);
    }, [getIsPlaying]);
  }

  /**
   * 初始化UI
   */
  public override initialize(): void {
    super.initialize();
    
    const contentContainer = this.getContentContainer();
    if (!contentContainer) return;
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
      display: 'flex',
      gap: '8px',
      padding: '10px',
      justifyContent: 'center'
    });
    
    // 创建播放按钮
    this.playButton = this.createButton('▶️ 开始', this.handlePlay.bind(this));
    buttonContainer.appendChild(this.playButton);
    
    // 创建暂停按钮
    this.pauseButton = this.createButton('⏸️ 暂停', this.handlePause.bind(this));
    buttonContainer.appendChild(this.pauseButton);
    
    // 创建返回编辑器按钮
    this.returnButton = this.createButton('🔙 返回编辑器', this.handleReturn.bind(this));
    buttonContainer.appendChild(this.returnButton);
    
    contentContainer.appendChild(buttonContainer);
    
    // 创建状态显示区域
    this.statsContainer = document.createElement('div');
    Object.assign(this.statsContainer.style, {
      padding: '10px',
      borderTop: '1px solid hsla(215, 30%, 35%, 0.8)',
      fontSize: '14px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    });
    
    // 添加FPS显示
    this.fpsDisplay = document.createElement('div');
    Object.assign(this.fpsDisplay.style, {
      fontFamily: 'monospace',
      color: '#4fc3f7'
    });
    this.fpsDisplay.textContent = 'FPS: 0.0';
    this.statsContainer.appendChild(this.fpsDisplay);
    
    contentContainer.appendChild(this.statsContainer);
    
    // 初始化按钮状态
    this.updateButtonStates(getIsPlaying());
    
    // 开始FPS计算循环
    this.startFPSMonitoring();
  }

  /**
   * 创建按钮
   */
  private createButton(text: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.textContent = text;
    Object.assign(button.style, {
      backgroundColor: 'hsla(215, 30%, 40%, 1)',
      color: 'white',
      border: 'none',
      padding: '8px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      flex: '1'
    });
    
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = 'hsla(215, 30%, 45%, 1)';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = 'hsla(215, 30%, 40%, 1)';
    });
    
    button.addEventListener('click', onClick);
    
    return button;
  }

  /**
   * 开始FPS监控
   */
  private startFPSMonitoring(): void {
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    const updateFPS = () => {
      this.frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - this.lastTime;
      
      // 每隔一段时间更新FPS显示
      if (elapsed >= this.fpsUpdateInterval) {
        this.fps = (this.frameCount * 1000) / elapsed;
        
        // 添加到历史记录
        this.fpsHistory.push(this.fps);
        if (this.fpsHistory.length > this.maxFpsHistoryLength) {
          this.fpsHistory.shift();
        }
        
        // 计算平均FPS
        const avgFps = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
        
        // 更新显示
        if (this.fpsDisplay) {
          this.fpsDisplay.textContent = `FPS: ${this.fps.toFixed(1)} (平均: ${avgFps.toFixed(1)})`;
          
          // 根据FPS值设置颜色
          if (this.fps >= 50) {
            this.fpsDisplay.style.color = '#4caf50'; // 良好 - 绿色
          } else if (this.fps >= 30) {
            this.fpsDisplay.style.color = '#ffeb3b'; // 中等 - 黄色
          } else {
            this.fpsDisplay.style.color = '#f44336'; // 较差 - 红色
          }
        }
        
        // 重置计数器
        this.lastTime = currentTime;
        this.frameCount = 0;
      }
      
      // 继续循环
      this.animationFrameId = requestAnimationFrame(updateFPS);
    };
    
    // 启动循环
    this.animationFrameId = requestAnimationFrame(updateFPS);
  }

  /**
   * 停止FPS监控
   */
  private stopFPSMonitoring(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 处理开始游戏事件
   */
  private handlePlay(): void {
    const engine = Engine.getInstance();
    engine.startScripts();
    setIsPlaying(true);
  }

  /**
   * 处理暂停游戏事件
   */
  private handlePause(): void {
    const engine = Engine.getInstance();
    engine.stopScripts();
    setIsPlaying(false);
  }

  /**
   * 处理返回编辑器事件
   */
  private handleReturn(): void {
    const engine = Engine.getInstance();
    
    // 如果正在播放，先停止脚本
    if (getIsPlaying()) {
      engine.stopScripts();
      setIsPlaying(false);
    }
    
    // 切换到编辑器模式
    if (!engine.isEditorMode()) {
      engine.toggleEditorMode();
    }
  }

  /**
   * 根据当前游戏状态更新按钮状态
   */
  private updateButtonStates(isPlaying: boolean): void {
    if (!this.playButton || !this.pauseButton) return;
    
    if (isPlaying) {
      this.playButton.style.opacity = '0.5';
      this.playButton.style.cursor = 'default';
      this.pauseButton.style.opacity = '1';
      this.pauseButton.style.cursor = 'pointer';
    } else {
      this.playButton.style.opacity = '1';
      this.playButton.style.cursor = 'pointer';
      this.pauseButton.style.opacity = '0.5';
      this.pauseButton.style.cursor = 'default';
    }
  }

  /**
   * 清理资源
   */
  public override dispose(): void {
    this.stopFPSMonitoring();
    super.destroy();
  }
} 