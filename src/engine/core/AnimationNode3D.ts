import * as THREE from 'three';
import { Node3d } from './Node3d';
import { editable, editableComponent } from './decorators';
import { ModelLoader3D } from './ModelLoader3D';

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
  icon: 'animation',
  category: 'Animation'
})
export class AnimationNode3D extends Node3d {
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationClip> = new Map();
  private currentAction: THREE.AnimationAction | null = null;
  private model: THREE.Object3D | null = null;
  private isPlaying: boolean = false;
  private animationSpeed: number = 1.0;
  private frameCallbacks: Map<number, (() => void)[]> = new Map();
  private animationEndCallbacks: Map<string, (() => void)[]> = new Map();
  private transitionDuration: number = 0.3; // 默认过渡时间

  @editable({
    displayName: '动画速度',
    description: '动画播放速度',
    type: 'number',
    group: '动画'
  })
  private _animationSpeed: number = 1.0;

  constructor(name: string = '动画节点', options?: { position?: THREE.Vector3, rotation?: THREE.Euler }) {
    super(name, options);
  }

  /**
   * 设置模型并初始化动画系统
   */
  setModel(model: THREE.Object3D | ModelLoader3D): void {
    if (model instanceof ModelLoader3D) {
      this.model = model.getModel();
      this.animations = model.getAnimations();
      console.log(model,'model.getModel()')
    } else {
      this.model = model;
      
      // 检查并提取普通Object3D中的动画
      if (model) {
        // 直接从模型中获取动画
        if ('animations' in model && Array.isArray(model.animations)) {
          model.animations.forEach((animation: THREE.AnimationClip) => {
            this.animations.set(animation.name, animation);
          });
        }
        
        // 递归查找子对象中的动画
        model.traverse((child: any) => {
          if (child.animations && Array.isArray(child.animations)) {
            child.animations.forEach((animation: THREE.AnimationClip) => {
              if (!this.animations.has(animation.name)) {
                this.animations.set(animation.name, animation);
              }
            });
          }
        });
      }
    }
    console.log(this.model,'this.model')
    if (this.model) {
      
      this.mixer = new THREE.AnimationMixer(this.model);
      
      // 在控制台输出可用的动画
      const animNames = this.getAnimationNames();
      if (animNames.length > 0) {
        console.log(`动画节点 [${this.name}] 可用动画:`, animNames);
      } else {
        console.warn(`动画节点 [${this.name}] 没有找到可用动画`);
      }
    }
  }

  /**
   * 播放动画
   */
  play(name: string, options: AnimationOptions = {}): void {
    console.log(this,'AnimationOptions')
    if (!this.mixer || !this.model) return;
    const clip = this.animations.get(name);
    if (!clip) {
      // 尝试查找包含关键字的动画
      const foundAnim = this.findAnimation(name);
      if (foundAnim) {
        console.log(`找到类似动画: ${foundAnim}`);
        this.play(foundAnim, options);
        return;
      }
      
      console.warn(`动画 "${name}" 未找到。可用动画: ${this.getAnimationNames().join(', ')}`);
      return;
    }

    const action = this.mixer.clipAction(clip);
    
    // 设置动画属性
    action.loop = options.loop ?? true ? THREE.LoopRepeat : THREE.LoopOnce;
    action.timeScale = options.speed ?? this.animationSpeed;
    
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
    this.animationSpeed = speed;
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
   * 查找动画
   * @param name 动画名称或部分名称
   */
  findAnimation(name: string): string | null {
    const names = this.getAnimationNames();
    return names.find(n => n.toLowerCase().includes(name.toLowerCase())) || null;
  }

  /**
   * 添加动画结束回调
   * @param name 动画名称
   * @param callback 回调函数
   */
  addAnimationEndCallback(name: string, callback: () => void): void {
    if (!this.animationEndCallbacks.has(name)) {
      this.animationEndCallbacks.set(name, []);
    }
    this.animationEndCallbacks.get(name)!.push(callback);
  }

  /**
   * 添加帧回调
   * @param callback 回调函数
   */
  addFrameCallback(callback: (frame: number) => void): void {
    if (!this.frameCallbacks.has(0)) {
      this.frameCallbacks.set(0, []);
    }
    this.frameCallbacks.get(0)!.push(() => callback(0));
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
  destroy(): void {
    this.stop();
    this.mixer = null;
    this.animations.clear();
    this.frameCallbacks.clear();
    this.animationEndCallbacks.clear();
    // 不调用super.destroy()，因为基类中没有这个方法
  }

  /**
   * 设置过渡时间
   */
  setTransitionDuration(duration: number): void {
    this.transitionDuration = duration;
  }
} 