import * as THREE from 'three';
import { Node3d } from './Node3d';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { editable, editableComponent } from './decorators';

/**
 * 动画选项接口
 */
interface AnimationOptions {
  loop?: boolean;
  speed?: number;
  onEnd?: () => void;
  onFrame?: (frame: number) => void;
  transitionDuration?: number;
}

/**
 * 动画状态接口
 */
interface AnimationState {
  name: string;
  animationName: string;
  transitionTime?: number;
  speed?: number;
  loop?: boolean;
  priority?: number;
  conditions?: Map<string, any>;
}

/**
 * 动画事件接口
 */
interface AnimationEvent {
  time: number;
  callback: Function;
  once: boolean;
  triggered: boolean;
}

/**
 * 混合动画接口
 */
interface BlendAnimation {
  name: string;
  action: THREE.AnimationAction;
  weight: number;
  targetWeight: number;
}

/**
 * 动画参数接口
 */
type AnimationParameter = number | boolean | string;

/**
 * 动画序列项接口
 */
interface AnimationSequenceItem {
  type: 'animation' | 'delay' | 'function';
  name?: string;
  options?: AnimationOptions;
  duration?: number;
  callback?: Function;
}

/**
 * 动画控制器接口
 */
interface AnimationController {
  play(): void;
  pause(): void;
  stop(): void;
  setSpeed(speed: number): void;
  onComplete(callback: Function): void;
  chain(animation: string | Function | number, options?: AnimationOptions): AnimationController;
  delay(seconds: number): AnimationController;
  then(callback: Function): AnimationController;
  repeat(times: number): AnimationController;
  yoyo(enabled?: boolean): AnimationController;
}

/**
 * 骨骼显示选项
 */
export interface SkeletonVisualOptions {
  showSkeleton: boolean;       // 显示骨骼
  boneColor: number;           // 骨骼颜色
  jointColor: number;          // 关节颜色
  boneSize: number;            // 骨骼大小
}

/**
 * ModelLoader3D 类 - 用于加载和渲染GLB/GLTF/FBX模型
 * 继承自 Node3d
 */
@editableComponent({
  displayName: '模型加载器',
  description: '用于加载和渲染GLB/GLTF/FBX模型',
  icon: 'model',
  category: 'Renderable'
})
export class ModelLoader3D extends Node3d implements PromiseLike<THREE.Group> {
  // 添加一个Promise来跟踪模型加载状态
  private modelLoadPromise: Promise<THREE.Group>;
  private modelResolve: ((model: THREE.Group) => void) | null = null;
  private modelReject: ((error: any) => void) | null = null;

  public model: THREE.Group | null = null;
  private gltfLoader: GLTFLoader;
  private fbxLoader: FBXLoader;
  private onLoadedCallback: ((model: THREE.Group) => void) | null = null;
  private animations: Map<string, THREE.AnimationClip> = new Map();
  public addAnimations: THREE.AnimationClip[] = [];

  // 动画相关属性
  private mixer: THREE.AnimationMixer | null = null;
  private currentAction: THREE.AnimationAction | null = null;
  private isPlaying: boolean = false;
  private transitionDuration: number = 0.3; // 默认过渡时间

  // 动画状态系统
  private states: Map<string, AnimationState> = new Map();
  private currentState: string | null = null;
  private defaultState: string | null = null;

  // 动画事件系统
  private animationEvents: Map<string, AnimationEvent[]> = new Map();

  // 动画混合系统
  private blendAnimations: Map<string, BlendAnimation> = new Map();
  private isBlending: boolean = false;

  // 动画参数系统
  private parameters: Map<string, AnimationParameter> = new Map();
  private parameterTriggers: Map<string, { condition: (value: any) => boolean, action: () => void }[]> = new Map();

  // 动画层系统
  private animationLayers: Map<string, { priority: number, weight: number }> = new Map();

  // 动画队列
  private animationQueue: { name: string, options: AnimationOptions }[] = [];
  private isProcessingQueue: boolean = false;

  // 动画序列系统
  private sequenceControllers: Map<string, AnimationController> = new Map();
  private activeSequences: Set<string> = new Set();
  private sequenceCounter: number = 0;
  private interruptible: boolean = true; // 是否允许打断动画序列

  @editable({
    displayName: '模型路径',
    description: 'GLB/GLTF/FBX模型文件的路径',
    type: 'string',
    group: '资源'
  })
  private modelPath: string = '';

  @editable({
    displayName: '动画速度',
    description: '动画播放速度',
    type: 'number',
    group: '动画'
  })
  private animationSpeed: number = 1.0;

  // DOM元素引用
  private domElement: HTMLElement | null = null;

  // 骨骼显示相关属性
  private skeletonHelper: THREE.SkeletonHelper | null = null;
  
  @editable({
    displayName: '显示骨骼',
    description: '是否显示模型骨骼结构',
    type: 'boolean',
    group: '可视化'
  })
  private showSkeleton: boolean = false;
  
  @editable({
    displayName: '骨骼颜色',
    description: '骨骼线条的颜色',
    type: 'color',
    group: '可视化'
  })
  private boneColor: number = 0xffffff;
  
  @editable({
    displayName: '骨骼大小',
    description: '骨骼线条的粗细',
    type: 'number',
    min: 0.1,
    max: 10,
    step: 0.1,
    group: '可视化'
  })
  private boneSize: number = 1.0;

  constructor(name: string = '模型加载器', modelPath?: string, options?: { position?: THREE.Vector3, rotation?: THREE.Euler }) {
    super(name, options);
    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
    
    // 创建Promise
    this.modelLoadPromise = new Promise<THREE.Group>((resolve, reject) => {
      this.modelResolve = resolve;
      this.modelReject = reject;
    });
    
    if (modelPath) {
      this.modelPath = modelPath;
      this.loadModel(modelPath);
    }
  }

  /**
   * 实现PromiseLike接口
   */
  then<TResult1 = THREE.Group, TResult2 = never>(
    onfulfilled?: ((value: THREE.Group) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.modelLoadPromise.then(onfulfilled, onrejected);
  }

  /**
   * 等待模型加载完成
   * @returns 加载完成的模型对象
   */
  public async waitForLoad(): Promise<THREE.Group> {
    return this.modelLoadPromise;
  }

  /**
   * 加载模型
   * @param path 模型文件路径
   */
  public loadModel(path: string): void {
    // 根据文件扩展名选择合适的加载器
    const extension = path.split('.').pop()?.toLowerCase();
    this.modelPath = path;
    if (extension === 'fbx') {
      // 使用FBX加载器
      this.loadFBXModel(path);
    } else {
      // 默认使用GLTF加载器
      this.loadGLTFModel(path);
    }
  }

  /**
   * 加载GLTF/GLB模型
   * @param path 模型文件路径
   */
  private loadGLTFModel(path: string): void {
    this.gltfLoader.load(
      path,
      (gltf) => {
        console.log('GLTF模型加载成功:', gltf);
        this.model = gltf.scene;
        this.getThreeObject().add(this.model);
        this.setType('ModelLoader3D');
        this.addTag('model');
        this.addTag('renderable');

        // 初始化动画混合器
        if (this.model) {
          this.mixer = new THREE.AnimationMixer(this.model);

          // 添加事件监听器
          this.mixer.addEventListener('finished', this.onAnimationFinished.bind(this));
          this.mixer.addEventListener('loop', this.onAnimationLoop.bind(this));
        }

        // 缓存动画数据
        if (gltf.animations && gltf.animations.length > 0) {
          this.addAnimations = gltf.animations;
          gltf.animations.forEach(animation => {
            this.animations.set(animation.name, animation);
          });

          // 输出可用动画
          const animNames = this.getAnimationNames();
          if (animNames.length > 0) {
            console.log(`模型 [${this.name}] 可用动画:`, animNames);
          }
        }

        // 处理模型结构，默认隐藏骨骼和辅助对象
        this.model.traverse((object: THREE.Object3D) => {
          // 骨骼和辅助对象的可见性现在由showSkeleton控制
          if (object.type === 'Bone' ||
              object.name.includes('helper') ||
              object.name.includes('Helper') ||
              object.name.includes('Skeleton') ||
              object.name.includes('Control')) {
            object.visible = this.showSkeleton;
          }
        });
        
        // 调用我们的模型加载完成处理
        this.onModelLoaded();
        
        // 调用加载完成回调
        if (this.onLoadedCallback && this.model) {
          this.onLoadedCallback(this.model);
        }
        
        // 解析Promise
        if (this.modelResolve && this.model) {
          this.modelResolve(this.model);
        }
        
        // 如果有默认状态，自动播放
        if (this.defaultState) {
          this.transitionTo(this.defaultState);
        }
      },
      undefined,
      (error) => {
        console.error('GLTF模型加载失败:', error);
        // 拒绝Promise
        if (this.modelReject) {
          this.modelReject(error);
        }
      }
    );
  }

  /**
   * 加载FBX模型
   * @param path 模型文件路径
   */
  private loadFBXModel(path: string): void {
    console.log('开始加载FBX模型:', path);
    
    this.fbxLoader.load(
      path,
      (fbxModel) => {
        console.log('FBX模型加载成功:', fbxModel);
        
        // FBX加载器直接返回Object3D，需要包装成Group
        this.model = new THREE.Group();
        this.model.add(fbxModel);
        
        this.getThreeObject().add(this.model);
        this.setType('ModelLoader3D');
        this.addTag('model');
        this.addTag('renderable');

        // 初始化动画混合器
        if (this.model) {
          this.mixer = new THREE.AnimationMixer(this.model);
          
          // 添加事件监听器
          this.mixer.addEventListener('finished', this.onAnimationFinished.bind(this));
          this.mixer.addEventListener('loop', this.onAnimationLoop.bind(this));
        }
        
        // 缓存动画数据
        if (fbxModel.animations && fbxModel.animations.length > 0) {
          this.addAnimations = fbxModel.animations;
          fbxModel.animations.forEach((animation: THREE.AnimationClip) => {
            this.animations.set(animation.name, animation);
          });
          
          // 输出可用动画
          const animNames = this.getAnimationNames();
          if (animNames.length > 0) {
            console.log(`模型 [${this.name}] 可用动画:`, animNames);
          }
        }
        
        // 处理模型结构
        this.model.traverse((object: THREE.Object3D) => {
          // 隐藏骨骼和辅助对象
          if (object.type === 'Bone' || 
              object.name.includes('helper') || 
              object.name.includes('Helper') ||
              object.name.includes('Skeleton') ||
              object.name.includes('Control')) {
            object.visible = false;
          }
        });
        
        // 调用加载完成回调
        if (this.onLoadedCallback && this.model) {
          console.log('调用模型加载完成回调');
          this.onLoadedCallback(this.model);
        }
        
        // 解析Promise
        if (this.modelResolve && this.model) {
          console.log('解析模型加载Promise');
          this.modelResolve(this.model);
        }
        
        // 如果有默认状态，自动播放
        if (this.defaultState) {
          this.transitionTo(this.defaultState);
        }
        
        // 关键部分：确保模型加载后立即渲染
        this.ensureRender();
      },
      // 进度回调
      (progress) => {
        console.log(`FBX模型加载进度: ${Math.round(progress.loaded / progress.total * 100)}%`);
      },
      // 错误回调
      (error) => {
        console.error('FBX模型加载失败:', error);
        // 拒绝Promise
        if (this.modelReject) {
          this.modelReject(error);
        }
      }
    );
  }

  /**
   * 确保模型加载后立即渲染
   * 使用多种方法触发渲染更新
   */
  private ensureRender(): void {
    console.log('尝试确保模型立即渲染');
    
    // 方法1: 使用requestAnimationFrame
    requestAnimationFrame(() => {
      this.forceRender();
      
      // 再次尝试渲染，以防第一次不成功
      setTimeout(() => {
        this.forceRender();
      }, 50);
    });
    
    // 方法2: 使用setTimeout
    setTimeout(() => {
      this.forceRender();
    }, 16); // 约一帧的时间
    
    // 方法3: 连续多次尝试渲染
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.forceRender();
      }, 100 * i);
    }
  }
  
  /**
   * 强制渲染当前场景
   */
  private forceRender(): void {
    try {
      // 尝试获取引擎实例
      const engine = (window as any).currentEngine;
      if (engine && typeof engine.renderer?.render === 'function') {
        console.log('强制渲染场景');
        
        // 尝试获取当前场景和相机
        const activeSceneName = Array.from(engine.activeScenes)[0];
        if (activeSceneName) {
          const scene = engine.scenes.get(activeSceneName);
          if (scene) {
            const camera = scene.getActiveCamera();
            if (camera && camera.getThreeCamera()) {
              // 强制渲染
              engine.renderer.render(scene.getThreeScene(), camera.getThreeCamera());
              console.log('场景已强制渲染');
              
              // 标记材质需要更新
              scene.getThreeScene().traverse((object) => {
                if (object instanceof THREE.Mesh && object.material) {
                  if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.needsUpdate = true);
                  } else {
                    object.material.needsUpdate = true;
                  }
                }
              });
            }
          }
        }
        
        // 尝试调用引擎的update方法
        if (typeof engine.update === 'function') {
          engine.update(0.016); // 模拟一帧的更新
        }
      }
    } catch (error) {
      console.warn('强制渲染失败:', error);
    }
  }

  /**
   * 当动画完成时的回调
   */
  private onAnimationFinished(event: any): void {
    const action = event.action;
    const clipName = action.getClip().name;

    // 触发动画结束事件
    if (this.currentState && this.states.has(this.currentState)) {
      const state = this.states.get(this.currentState)!;
      if (state.animationName === clipName) {
        // 完成当前状态
        this.onStateComplete(this.currentState);
      }
    }

    // 处理动画队列
    if (this.animationQueue.length > 0 && !this.isProcessingQueue) {
      this.processAnimationQueue();
    }
  }

  /**
   * 当动画循环时的回调
   */
  private onAnimationLoop(event: any): void {
    const action = event.action;
    const clipName = action.getClip().name;
    const time = action.time;

    // 检查并触发动画事件
    this.checkAnimationEvents(clipName, time);
  }

  /**
   * 检查并触发动画事件
   */
  private checkAnimationEvents(animationName: string, time: number): void {
    if (!this.animationEvents.has(animationName)) return;

    const events = this.animationEvents.get(animationName)!;
    const clipDuration = this.animations.get(animationName)?.duration || 0;

    for (const event of events) {
      // 考虑循环，计算当前实际时间
      const normalizedTime = time % clipDuration;

      // 如果时间匹配，触发事件
      if (normalizedTime >= event.time && !event.triggered) {
        event.callback();
        event.triggered = true;

        // 如果事件只触发一次，从列表中移除
        if (event.once) {
          const index = events.indexOf(event);
          if (index !== -1) {
            events.splice(index, 1);
          }
        }
      } else if (normalizedTime < event.time) {
        // 重置触发状态，为下一个循环做准备
        event.triggered = false;
      }
    }
  }

  /**
   * 当状态完成时的回调
   */
  private onStateComplete(stateName: string): void {
    // 这里可以添加状态完成后的逻辑
    console.log(`状态 ${stateName} 完成`);

    // 如果有下一个状态要过渡到，可以在这里处理
  }

  /**
   * 设置模型加载完成后的回调函数
   * @param callback 加载完成后的回调函数
   */
  setOnLoaded(callback: (model: THREE.Group) => void): void {
    this.onLoadedCallback = callback;
    // 如果模型已经加载，立即调用回调
    if (this.model && this.onLoadedCallback) {
      this.onLoadedCallback(this.model);
    }
  }

  /**
   * 播放动画
   * @param name 动画名称
   * @param options 动画选项
   */
  playAnimation(name: string, options: AnimationOptions = {}): void {
    if (!this.mixer || !this.model) return;

    const clip = this.animations.get(name);
    if (!clip) {
      // 尝试查找包含关键字的动画
      const foundAnim = this.findAnimation(name);
      if (foundAnim) {
        console.log(`找到类似动画: ${foundAnim}`);
        this.playAnimation(foundAnim, options);
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
   * 添加动画状态
   * @param state 状态定义
   */
  addState(state: AnimationState): void {
    this.states.set(state.name, state);

    // 如果这是第一个状态，设为默认状态
    if (this.states.size === 1 && !this.defaultState) {
      this.setDefaultState(state.name);
    }
  }

  /**
   * 移除动画状态
   * @param stateName 状态名称
   */
  removeState(stateName: string): void {
    this.states.delete(stateName);

    // 如果移除的是默认状态，重置默认状态
    if (this.defaultState === stateName) {
      this.defaultState = this.states.size > 0 ? Array.from(this.states.keys())[0] : null;
    }

    // 如果移除的是当前状态，停止当前动画
    if (this.currentState === stateName) {
      this.stopAnimation();
      this.currentState = null;

      // 如果有默认状态，切换回默认状态
      if (this.defaultState) {
        this.transitionTo(this.defaultState);
      }
    }
  }

  /**
   * 设置默认状态
   * @param stateName 状态名称
   */
  setDefaultState(stateName: string): void {
    if (!this.states.has(stateName)) {
      console.warn(`状态 "${stateName}" 不存在`);
      return;
    }

    this.defaultState = stateName;
  }

  /**
   * 转换到指定状态
   * @param stateName 状态名称
   * @param forceTransition 是否强制过渡
   */
  transitionTo(stateName: string, forceTransition: boolean = false): void {
    if (!this.states.has(stateName)) {
      console.warn(`状态 "${stateName}" 不存在`);
      return;
    }

    // 如果已经是当前状态且不强制过渡，则忽略
    if (this.currentState === stateName && !forceTransition) {
      return;
    }

    const state = this.states.get(stateName)!;

    // 检查条件
    if (state.conditions && !forceTransition) {
      for (const [param, value] of state.conditions.entries()) {
        if (this.parameters.get(param) !== value) {
          console.log(`状态 "${stateName}" 的条件不满足`);
          return;
        }
      }
    }

    // 播放动画
    this.playAnimation(state.animationName, {
      loop: state.loop,
      speed: state.speed,
      transitionDuration: state.transitionTime
    });

    // 更新当前状态
    this.currentState = stateName;
  }

  /**
   * 添加动画事件
   * @param animName 动画名称
   * @param time 事件时间(秒)
   * @param callback 回调函数
   * @param once 是否只触发一次
   */
  addAnimationEvent(animName: string, time: number, callback: Function, once: boolean = false): void {
    if (!this.animations.has(animName)) {
      console.warn(`动画 "${animName}" 不存在`);
      return;
    }

    if (!this.animationEvents.has(animName)) {
      this.animationEvents.set(animName, []);
    }

    const event: AnimationEvent = {
      time,
      callback,
      once,
      triggered: false
    };

    this.animationEvents.get(animName)!.push(event);

    // 按时间排序
    this.animationEvents.get(animName)!.sort((a, b) => a.time - b.time);
  }

  /**
   * 移除动画事件
   * @param animName 动画名称
   * @param time 事件时间，可选，不提供则删除该动画的所有事件
   */
  removeAnimationEvent(animName: string, time?: number): void {
    if (!this.animationEvents.has(animName)) return;

    if (time === undefined) {
      // 移除所有事件
      this.animationEvents.delete(animName);
    } else {
      // 移除指定时间的事件
      const events = this.animationEvents.get(animName)!;
      const newEvents = events.filter(event => event.time !== time);

      if (newEvents.length === 0) {
        this.animationEvents.delete(animName);
      } else {
        this.animationEvents.set(animName, newEvents);
      }
    }
  }

  /**
   * 设置动画参数
   * @param name 参数名称
   * @param value 参数值
   */
  setParameter(name: string, value: AnimationParameter): void {
    this.parameters.set(name, value);

    // 检查参数触发器
    if (this.parameterTriggers.has(name)) {
      const triggers = this.parameterTriggers.get(name)!;

      for (const trigger of triggers) {
        if (trigger.condition(value)) {
          trigger.action();
        }
      }
    }
  }

  /**
   * 获取动画参数
   * @param name 参数名称
   */
  getParameter(name: string): AnimationParameter | undefined {
    return this.parameters.get(name);
  }

  /**
   * 添加参数触发器
   * @param paramName 参数名称
   * @param condition 触发条件
   * @param action 触发动作
   */
  addParameterTrigger(paramName: string, condition: (value: any) => boolean, action: () => void): void {
    if (!this.parameterTriggers.has(paramName)) {
      this.parameterTriggers.set(paramName, []);
    }

    this.parameterTriggers.get(paramName)!.push({ condition, action });
  }

  /**
   * 设置混合动画
   * @param animations 动画列表，包含名称和权重
   */
  setBlendAnimations(animations: { name: string, weight: number }[]): void {
    // 清除当前混合动画
    this.clearBlendAnimations();

    if (!this.mixer) return;

    // 添加新的混合动画
    for (const anim of animations) {
      const clip = this.animations.get(anim.name);
      if (!clip) {
        console.warn(`动画 "${anim.name}" 不存在`);
        continue;
      }

      const action = this.mixer.clipAction(clip);
      action.play();
      action.setEffectiveWeight(anim.weight);

      this.blendAnimations.set(anim.name, {
        name: anim.name,
        action,
        weight: anim.weight,
        targetWeight: anim.weight
      });
    }

    this.isBlending = true;
    this.isPlaying = true;
  }

  /**
   * 设置混合动画权重
   * @param name 动画名称
   * @param weight 权重
   * @param duration 过渡时间
   */
  setBlendAnimationWeight(name: string, weight: number, duration: number = 0.3): void {
    if (!this.blendAnimations.has(name)) {
      console.warn(`混合动画 "${name}" 不存在`);
      return;
    }

    const blendAnim = this.blendAnimations.get(name)!;

    if (duration <= 0) {
      // 立即设置权重
      blendAnim.weight = weight;
      blendAnim.targetWeight = weight;
      blendAnim.action.setEffectiveWeight(weight);
    } else {
      // 设置目标权重，在update中平滑过渡
      blendAnim.targetWeight = weight;
    }
  }

  /**
   * 清除所有混合动画
   */
  clearBlendAnimations(): void {
    for (const [_, blendAnim] of this.blendAnimations) {
      blendAnim.action.stop();
    }

    this.blendAnimations.clear();
    this.isBlending = false;
  }

  /**
   * 将动画添加到队列
   * @param name 动画名称
   * @param options 动画选项
   */
  queueAnimation(name: string, options: AnimationOptions = {}): void {
    this.animationQueue.push({ name, options });

    // 如果当前没有动画在播放且没有在处理队列，开始处理队列
    if (!this.isPlaying && !this.isProcessingQueue) {
      this.processAnimationQueue();
    }
  }

  /**
   * 清空动画队列
   */
  clearAnimationQueue(): void {
    this.animationQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * 处理动画队列
   */
  private processAnimationQueue(): void {
    if (this.animationQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;

    const nextAnim = this.animationQueue.shift()!;

    // 创建新的选项对象，添加队列处理回调
    const options: AnimationOptions = { ...nextAnim.options };

    // 保存原始的onEnd回调
    const originalOnEnd = options.onEnd;

    // 添加队列处理回调
    options.onEnd = () => {
      // 调用原始回调
      if (originalOnEnd) originalOnEnd();

      // 处理下一个动画
      setTimeout(() => this.processAnimationQueue(), 0);
    };

    // 播放动画
    this.playAnimation(nextAnim.name, options);
  }

  /**
   * 创建动画剪辑
   * @param name 动画名称
   * @param duration 动画时长
   * @param tracks 轨道数据
   */
  createAnimation(name: string, duration: number, tracks: THREE.KeyframeTrack[]): void {
    const clip = new THREE.AnimationClip(name, duration, tracks);
    this.animations.set(name, clip);
    this.addAnimations.push(clip);
  }

  /**
   * 暂停当前动画
   */
  pauseAnimation(): void {
    if (this.currentAction) {
      this.currentAction.paused = true;
      this.isPlaying = false;
    }

    // 暂停所有混合动画
    if (this.isBlending) {
      for (const [_, blendAnim] of this.blendAnimations) {
        blendAnim.action.paused = true;
      }
    }
  }

  /**
   * 恢复当前动画
   */
  resumeAnimation(): void {
    if (this.currentAction) {
      this.currentAction.paused = false;
      this.isPlaying = true;
    }

    // 恢复所有混合动画
    if (this.isBlending) {
      for (const [_, blendAnim] of this.blendAnimations) {
        blendAnim.action.paused = false;
      }
    }
  }

  /**
   * 停止当前动画
   */
  stopAnimation(): void {
    if (this.currentAction) {
      this.currentAction.stop();
      this.currentAction = null;
      this.isPlaying = false;
    }

    // 清除所有混合动画
    this.clearBlendAnimations();
  }

  /**
   * 设置动画速度
   * @param speed 速度值
   */
  setAnimationSpeed(speed: number): void {
    this.animationSpeed = speed;
    if (this.currentAction) {
      this.currentAction.timeScale = speed;
    }

    // 设置所有混合动画的速度
    if (this.isBlending) {
      for (const [_, blendAnim] of this.blendAnimations) {
        blendAnim.action.timeScale = speed;
      }
    }
  }

  /**
   * 设置动画过渡时间
   * @param duration 过渡时间(秒)
   */
  setTransitionDuration(duration: number): void {
    this.transitionDuration = duration;
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
   * 设置关联的DOM元素
   * @param element DOM元素
   */
  setDomElement(element: HTMLElement): void {
    this.domElement = element;
  }

  /**
   * 获取关联的DOM元素
   */
  getDomElement(): HTMLElement | null {
    return this.domElement;
  }

  /**
   * 获取模型对象
   */
  getModel(): THREE.Group | null {
    return this.model;
  }

  /**
   * 获取缓存的动画数据
   */
  getAnimations(): Map<string, THREE.AnimationClip> {
    return this.animations;
  }

  /**
   * 获取动画名称列表
   */
  getAnimationNames(): string[] {
    return Array.from(this.animations.keys());
  }

  /**
   * 获取当前播放的动画名称
   */
  getCurrentAnimationName(): string | null {
    if (!this.currentAction) return null;
    return this.currentAction.getClip().name;
  }

  /**
   * 获取当前状态名称
   */
  getCurrentStateName(): string | null {
    return this.currentState;
  }

  /**
   * 检查是否正在播放动画
   */
  isAnimationPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * 设置模型路径并加载
   * @param path 新的模型路径
   */
  setModelPath(path: string): void {
    // 如果路径相同，不重复加载
    if (this.modelPath === path) {
      return;
    }

    this.modelPath = path;
    this.loadModel(path);
  }

  /**
   * 创建一个动画序列
   * @returns 动画控制器
   */
  sequence(): AnimationController {
    const sequenceId = `sequence_${++this.sequenceCounter}`;
    const items: AnimationSequenceItem[] = [];
    let repeatCount: number = 0;
    let yoyoEnabled: boolean = false;
    let completeCallbacks: Function[] = [];
    let speed: number = this.animationSpeed;
    let isPlaying: boolean = false;
    let currentItemIndex: number = 0;

    // 当前序列是否正在运行
    const isSequenceActive = () => this.activeSequences.has(sequenceId);

    // 播放下一个序列项
    const playNextItem = () => {
      if (!isPlaying || !isSequenceActive()) return;

      if (currentItemIndex >= items.length) {
        if (repeatCount === 0) {
          // 序列完成
          completeCallbacks.forEach(callback => callback());
          this.activeSequences.delete(sequenceId);
          return;
        } else {
          // 重复序列
          if (repeatCount > 0) repeatCount--;

          if (yoyoEnabled) {
            // 反向播放
            items.reverse();
          }

          currentItemIndex = 0;
        }
      }

      const item = items[currentItemIndex++];

      switch (item.type) {
        case 'animation':
          if (item.name) {
            this.playAnimation(item.name, {
              ...(item.options || {}),
              speed: (item.options?.speed !== undefined) ? item.options.speed : speed,
              onEnd: () => {
                if (item.options?.onEnd) item.options.onEnd();
                // 顺序播放下一个项
                playNextItem();
              }
            });
          }
          break;

        case 'delay':
          if (item.duration) {
            setTimeout(() => {
              if (isSequenceActive()) {
                playNextItem();
              }
            }, item.duration * 1000);
          }
          break;

        case 'function':
          if (item.callback) {
            item.callback();
            // 立即播放下一个
            playNextItem();
          }
          break;
      }
    };

    // 创建控制器
    const controller: AnimationController = {
      play: () => {
        if (this.interruptible || !isPlaying) {
          isPlaying = true;
          currentItemIndex = 0;
          this.activeSequences.add(sequenceId);
          playNextItem();
        }
        return controller;
      },

      pause: () => {
        isPlaying = false;
        this.pauseAnimation();
        return controller;
      },

      stop: () => {
        isPlaying = false;
        this.activeSequences.delete(sequenceId);
        this.stopAnimation();
        return controller;
      },

      setSpeed: (newSpeed) => {
        speed = newSpeed;
        if (this.currentAction) {
          this.currentAction.timeScale = newSpeed;
        }
        return controller;
      },

      onComplete: (callback) => {
        completeCallbacks.push(callback);
        return controller;
      },

      chain: (animation, options) => {
        if (typeof animation === 'string') {
          // 添加动画项
          items.push({
            type: 'animation',
            name: animation,
            options: options || {}
          });
        } else if (typeof animation === 'function') {
          // 添加函数项
          items.push({
            type: 'function',
            callback: animation
          });
        } else if (typeof animation === 'number') {
          // 添加延迟项
          items.push({
            type: 'delay',
            duration: animation
          });
        }
        return controller;
      },

      delay: (seconds) => {
        items.push({
          type: 'delay',
          duration: seconds
        });
        return controller;
      },

      then: (callback) => {
        items.push({
          type: 'function',
          callback
        });
        return controller;
      },

      repeat: (times) => {
        repeatCount = times;
        return controller;
      },

      yoyo: (enabled = true) => {
        yoyoEnabled = enabled;
        return controller;
      }
    };

    this.sequenceControllers.set(sequenceId, controller);
    return controller;
  }

  /**
   * 设置动画序列是否可中断
   * @param value 是否可中断
   */
  setInterruptible(value: boolean): void {
    this.interruptible = value;
  }

  /**
   * 停止所有动画序列
   */
  stopAllSequences(): void {
    this.sequenceControllers.forEach(controller => controller.stop());
    this.activeSequences.clear();
  }

  /**
   * 在指定的延迟后执行动画
   * @param name 动画名称
   * @param delay 延迟时间（秒）
   * @param options 动画选项
   * @returns 延迟ID，可用于取消
   */
  playAnimationDelayed(name: string, delay: number, options: AnimationOptions = {}): number {
    const timeoutId = window.setTimeout(() => {
      this.playAnimation(name, options);
    }, delay * 1000);

    return timeoutId;
  }

  /**
   * 取消延迟的动画播放
   * @param id 延迟ID
   */
  cancelDelayedAnimation(id: number): void {
    window.clearTimeout(id);
  }

  /**
   * 一次性播放多个动画（交叉淡入淡出）
   * @param animations 动画名称和选项的数组
   */
  crossFade(animations: { name: string, options?: AnimationOptions }[]): void {
    animations.forEach(({ name, options }) => {
      const clip = this.animations.get(name);
      if (!clip) {
        console.warn(`动画 "${name}" 未找到`);
        return;
      }

      if (!this.mixer) return;

      const action = this.mixer.clipAction(clip);
      action.reset();
      action.play();

      // 应用选项
      if (options) {
        if (options.loop !== undefined) {
          action.loop = options.loop ? THREE.LoopRepeat : THREE.LoopOnce;
        }
        if (options.speed !== undefined) {
          action.timeScale = options.speed;
        }
      }
    });

    // 淡入第一个动画
    if (animations.length > 0) {
      const firstAnim = animations[0];
      const clip = this.animations.get(firstAnim.name);
      if (clip && this.mixer) {
        const action = this.mixer.clipAction(clip);
        action.fadeIn(0.5);
        this.currentAction = action;
      }
    }

    this.isPlaying = true;
  }

  /**
   * 覆盖销毁方法，添加清理动画序列的逻辑
   */
  destroy(): void {
    // 停止所有动画序列
    this.stopAllSequences();
    this.sequenceControllers.clear();

    // 调用原方法
    this.stopAnimation();
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.model);
      this.mixer = null;
    }

    // 清除状态和事件
    this.states.clear();
    this.animationEvents.clear();
    this.parameters.clear();
    this.parameterTriggers.clear();
    this.animationLayers.clear();
    this.animationQueue = [];

    if (this.model) {
      this.getThreeObject().remove(this.model);
    }
  }

  /**
   * 覆盖更新方法
   */
  override update(deltaTime: number): void {
    super.update(deltaTime);

    // 更新动画混合器
    if (this.mixer && (this.isPlaying || this.isBlending)) {
      this.mixer.update(deltaTime);

      // 更新混合动画权重
      if (this.isBlending) {
        let allReachedTarget = true;

        for (const [_, blendAnim] of this.blendAnimations) {
          if (blendAnim.weight !== blendAnim.targetWeight) {
            // 平滑过渡权重
            const weightDiff = blendAnim.targetWeight - blendAnim.weight;
            const step = Math.sign(weightDiff) * Math.min(Math.abs(weightDiff), deltaTime * 3);

            blendAnim.weight += step;
            blendAnim.action.setEffectiveWeight(blendAnim.weight);

            if (Math.abs(blendAnim.targetWeight - blendAnim.weight) > 0.001) {
              allReachedTarget = false;
            }
          }
        }

        // 如果所有权重都达到目标，检查是否应该停止混合
        if (allReachedTarget) {
          let hasActiveBlend = false;

          for (const [_, blendAnim] of this.blendAnimations) {
            if (blendAnim.weight > 0) {
              hasActiveBlend = true;
              break;
            }
          }

          if (!hasActiveBlend) {
            this.isBlending = false;
          }
        }
      }
    }

    // 更新骨骼辅助对象
    if (this.skeletonHelper && this.showSkeleton) {
      this.skeletonHelper.update();
    }
  }

  /**
   * 序列化为JSON
   */
  override toJSON(): any {
    const json = super.toJSON();
    json.modelPath = this.modelPath;
    return json;
  }

  /**
   * 获取模型路径
   */
  public getModelPath(): string {
    return this.modelPath;
  }

  /**
   * 设置骨骼显示选项
   * @param options 骨骼显示选项
   */
  @editable({
    displayName: '设置骨骼显示',
    description: '配置骨骼显示选项',
    type: 'function',
    group: '可视化'
  })
  public setSkeletonOptions(options: Partial<SkeletonVisualOptions>): void {
    // 更新选项
    if (options.showSkeleton !== undefined) {
      this.showSkeleton = options.showSkeleton;
    }
    
    if (options.boneColor !== undefined) {
      this.boneColor = options.boneColor;
    }
    
    if (options.boneSize !== undefined) {
      this.boneSize = options.boneSize;
    }
    
    // 应用更改
    this.updateSkeletonVisibility();
  }
  
  /**
   * 显示/隐藏骨骼
   * @param show 是否显示骨骼
   */
  @editable({
    displayName: '显示/隐藏骨骼',
    description: '控制模型骨骼的显示状态',
    type: 'boolean',
    group: '可视化'
  })
  public showSkeletonHelper(show: boolean): void {
    this.showSkeleton = show;
    this.updateSkeletonVisibility();
  }
  
  /**
   * 设置骨骼颜色
   * @param color 骨骼颜色（十六进制）
   */
  @editable({
    displayName: '设置骨骼颜色',
    description: '设置骨骼显示的颜色',
    type: 'color',
    group: '可视化'
  })
  public setSkeletonColor(color: number): void {
    this.boneColor = color;
    
    // 如果骨骼辅助对象已存在，更新颜色
    if (this.skeletonHelper) {
      (this.skeletonHelper.material as THREE.LineBasicMaterial).color.setHex(color);
    }
  }
  
  /**
   * 更新骨骼显示状态
   * @private
   */
  private updateSkeletonVisibility(): void {
    // 首先检查模型是否已加载
    if (!this.model) return;
    
    // 如果需要显示骨骼但没有骨骼辅助对象，创建一个
    if (this.showSkeleton && !this.skeletonHelper) {
      // 查找模型中的骨骼
      let rootBone: THREE.Bone | null = null;
      
      this.model.traverse((object) => {
        // 查找SkinnedMesh
        if (object instanceof THREE.SkinnedMesh && object.skeleton) {
          // 使用第一个骨骼作为根骨骼
          if (object.skeleton.bones.length > 0 && !rootBone) {
            rootBone = object.skeleton.bones[0];
          }
        }
      });
      
      // 如果找到了骨骼，创建骨骼辅助对象
      if (rootBone) {
        this.skeletonHelper = new THREE.SkeletonHelper(rootBone);
        
        // 设置骨骼颜色和大小
        const material = this.skeletonHelper.material as THREE.LineBasicMaterial;
        material.color.setHex(this.boneColor);
        material.linewidth = this.boneSize;
        
        // 将骨骼辅助对象添加到场景
        const scene = this.getScene();
        if (scene) {
          scene.add(this.skeletonHelper);
        } else {
          this.getThreeObject().add(this.skeletonHelper);
        }
      }
    } 
    // 如果已有骨骼辅助对象，控制其可见性
    else if (this.skeletonHelper) {
      this.skeletonHelper.visible = this.showSkeleton;
      
      // 更新骨骼颜色和大小
      const material = this.skeletonHelper.material as THREE.LineBasicMaterial;
      material.color.setHex(this.boneColor);
      material.linewidth = this.boneSize;
    }
  }
  
  /**
   * 覆盖原有的加载完成处理，添加骨骼处理
   */
  private onModelLoaded(): void {
    // 初始化骨骼显示
    this.updateSkeletonVisibility();
    
    // 如果设置了显示骨骼，确保显示
    if (this.showSkeleton) {
      this.showSkeletonHelper(true);
    }
  }
}


