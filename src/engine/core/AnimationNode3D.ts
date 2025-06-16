import * as THREE from 'three';
import { Node3d } from './Node3d';
import { editable, editableComponent } from './decorators';

interface AnimationOptions {
  loop?: boolean;
  speed?: number;
  onEnd?: () => void;
  onFrame?: (frame: number) => void;
  transitionDuration?: number;
}

/**
 * 动画节点 - 用于管理模型的动画状态
 */
@editableComponent({
  displayName: '动画节点',
  description: '管理3D模型的动画状态',
  category: 'Animation'
})
export class AnimationNode3D extends Node3d {
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationClip> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private isPlaying: boolean = false;
  private transitionDuration: number = 0.3;

  @editable({
    displayName: '动画速度',
    description: '动画播放速度',
    type: 'number',
    group: '动画'
  })
  private _animationSpeed: number = 1.0;

  constructor(name: string = '动画节点') {
    super(name);
  }

  /**
   * 初始化动画系统
   */
  initializeWithAnimations(object: THREE.Object3D, animations: THREE.AnimationClip[]): void {
    // 初始化动画混合器
    this.mixer = new THREE.AnimationMixer(object);
      
    // 缓存动画
    animations.forEach(animation => {
            this.animations.set(animation.name, animation);
          });
      
    // 输出可用动画
      const animNames = this.getAnimationNames();
      if (animNames.length > 0) {
        console.log(`动画节点 [${this.name}] 可用动画:`, animNames);
    }
  }

  /**
   * 播放动画
   */
  play(name: string, options: AnimationOptions = {}): void {
    if (!this.mixer) return;

    const clip = this.animations.get(name);
    if (!clip) {
      console.warn(`动画 "${name}" 未找到。可用动画: ${this.getAnimationNames().join(', ')}`);
      return;
    }

    const action = this.mixer.clipAction(clip);
    
    // 设置动画属性
    action.loop = options.loop ?? true ? THREE.LoopRepeat : THREE.LoopOnce;
    action.timeScale = options.speed ?? this._animationSpeed;
    
    // 处理过渡效果
    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(options.transitionDuration ?? this.transitionDuration);
    }
    
    action.reset()
      .fadeIn(options.transitionDuration ?? this.transitionDuration)
      .play();

    this.currentAction = action;
    this.isPlaying = true;

    // 设置回调
    if (options.onEnd) {
      const onEndHandler = (e: any) => {
        if (e.action === action) {
          options.onEnd!();
          this.mixer?.removeEventListener('finished', onEndHandler);
        }
      };
      this.mixer.addEventListener('finished', onEndHandler);
    }

    if (options.onFrame) {
      const onFrameHandler = (e: any) => {
        if (e.action === action) {
          options.onFrame!(e.action.time);
        }
      };
      this.mixer.addEventListener('loop', onFrameHandler);
    }
  }

  /**
   * 暂停当前动画
   */
  pause(): void {
    if (this.currentAction) {
      this.currentAction.paused = true;
      this.isPlaying = false;
    }
  }

  /**
   * 恢复当前动画
   */
  resume(): void {
    if (this.currentAction) {
      this.currentAction.paused = false;
      this.isPlaying = true;
    }
  }

  /**
   * 停止当前动画
   */
  stop(): void {
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
      this.isPlaying = false;
    }
  }

  /**
   * 设置动画速度
   */
  setSpeed(speed: number): void {
    this._animationSpeed = speed;
    if (this.currentAction) {
      this.currentAction.timeScale = speed;
    }
  }

  /**
   * 获取动画速度
   */
  getAnimationSpeed(): number {
    return this._animationSpeed;
  }

  /**
   * 获取可用的动画名称列表
   */
  getAnimationNames(): string[] {
    return Array.from(this.animations.keys());
  }

  /**
   * 设置过渡时间
   */
  setTransitionDuration(duration: number): void {
    this.transitionDuration = duration;
  }

  /**
   * 更新动画状态
   */
  override update(deltaTime: number): void {
    super.update(deltaTime);
    if (this.mixer && this.isPlaying) {
      this.mixer.update(deltaTime);
    }
  }

  /**
   * 销毁节点
   */
  override destroy(): void {
    this.stop();
    if (this.mixer) {
      this.mixer.stopAllAction();
    this.mixer = null;
    }
    this.animations.clear();
    super.destroy();
  }
} 