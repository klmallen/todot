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
  private isPlaying: boolean = false;

  constructor(name: string = 'Game Control') {
    super(name);
    this.setSize(40, 80);
    this.setPosition(-40, 500);
    
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
    
    const container = this.getContentContainer();
    if (!container) return;
    
    // 设置容器样式
    Object.assign(container.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '8px',
      backgroundColor: 'var(--tp-container-background-color)',
      borderRadius: '4px'
    });
    
    // 创建开始/停止按钮
    const playButton = document.createElement('button');
    Object.assign(playButton.style, {
      width: '24px',
      height: '24px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      transition: 'background-color 0.2s ease'
    });

    // 设置图标
    const updatePlayButtonIcon = () => {
      playButton.innerHTML = this.isPlaying
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--tp-label-foreground-color)"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="var(--tp-label-foreground-color)"><path d="M8 5v14l11-7z"/></svg>';
    };
    updatePlayButtonIcon();

    // 添加悬停效果
    playButton.addEventListener('mouseover', () => {
      playButton.style.backgroundColor = 'var(--tp-container-background-color-active)';
    });

    playButton.addEventListener('mouseout', () => {
      playButton.style.backgroundColor = 'transparent';
    });

    // 添加点击事件
    playButton.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      updatePlayButtonIcon();
      
      // 切换游戏模式
      Engine.getInstance().setGameMode(this.isPlaying);
    });

    container.appendChild(playButton);
    
    // 创建返回编辑器按钮
    this.returnButton = this.createButton('🔙 返回编辑器', this.handleReturn.bind(this));
    container.appendChild(this.returnButton);
    
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
    
    container.appendChild(this.statsContainer);
    
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
    // 确保在销毁时退出游戏模式
    if (this.isPlaying) {
      Engine.getInstance().setGameMode(false);
    }
    super.dispose();
  }
} 