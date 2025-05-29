import * as THREE from 'three';
import { Node3d } from './Node3d';
import { editable, editableComponent } from './decorators';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ICamera } from './interfaces';

/**
 * CameraNode3D 类 - 表示3D场景中的相机节点
 * 继承自 Node3d，添加了相机支持和控制器
 */

// 相机跟随模式枚举
export enum CameraFollowMode {
  INSTANT = 'instant',           // 立即跟随
  SMOOTH = 'smooth',            // 平滑跟随
  SPRING = 'spring',           // 弹性跟随
  CUSTOM = 'custom'            // 自定义跟随曲线
}

// 轨道控制器配置接口
export interface OrbitControlsConfig {
  minDistance?: number;        // 最小距离
  maxDistance?: number;        // 最大距离
  minPolarAngle?: number;      // 最小极角
  maxPolarAngle?: number;      // 最大极角
  minAzimuthAngle?: number;    // 最小方位角
  maxAzimuthAngle?: number;    // 最大方位角
  enableDamping?: boolean;     // 启用阻尼
  dampingFactor?: number;      // 阻尼系数
  enableZoom?: boolean;        // 启用缩放
  enableRotate?: boolean;      // 启用旋转
  enablePan?: boolean;         // 启用平移
  rotateSpeed?: number;        // 旋转速度
  zoomSpeed?: number;          // 缩放速度
  panSpeed?: number;           // 平移速度
  enableLeftClick?: boolean;   // 启用鼠标左键
  enableRightClick?: boolean;  // 启用鼠标右键
  enableMiddleClick?: boolean; // 启用鼠标中键
  enableWheel?: boolean;       // 启用鼠标滚轮
}

// 相机偏移配置接口
export interface CameraOffsetConfig {
  heightOffset: number;       // 相机高度偏移（Y轴）
  zOffset: number;            // 相机Z轴偏移
  xOffset: number;            // 相机X轴偏移
}

// 键盘输入事件接口
export interface KeyboardEventHandler {
  onKeyDown?: (key: string) => void;   // 按键按下时触发
  onKeyUp?: (key: string) => void;     // 按键释放时触发
  onKeyHold?: (key: string, duration: number) => void; // 按键持续按下时触发
}

// 键盘映射配置接口
export interface KeyboardConfig {
  forward: string;
  backward: string;
  left: string;
  right: string;
  up: string;
  down: string;
  lookUp: string;
  lookDown: string;
  lookLeft: string;
  lookRight: string;
}

// 扩展相机跟随配置接口
export interface FollowConfig {
  mode: CameraFollowMode;
  distance?: number;           // 跟随距离
  height?: number;            // 跟随高度
  angle?: {                   // 跟随角度
    horizontal?: number;      // 水平角度
    vertical?: number;        // 垂直角度
  };
  offset?: {                  // 位置偏移
    x?: number;
    y?: number;
    z?: number;
  };
  smoothSpeed?: number;       // 平滑跟随的速度系数
  springStrength?: number;    // 弹性跟随的弹性系数
  springDamping?: number;     // 弹性跟随的阻尼系数
  customCurve?: (t: number) => number;  // 自定义跟随曲线
  lookAtTarget?: boolean;     // 是否始终看向目标
  keepAboveGround?: boolean;  // 保持在地面以上
  minHeight?: number;         // 最小高度
}

@editableComponent({
  displayName: '相机节点',
  description: '3D场景中的相机对象',
  icon: 'camera',
  category: 'Camera'
})
export class CameraNode3D extends Node3d {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls | null = null;
  private targetNode: Node3d | null = null;
  private isEngineCamera: boolean = false;
  private isInitialized: boolean = false;

  @editable({
    displayName: '视野',
    description: '相机的视野角度',
    type: 'number',
    group: '相机设置'
  })
  private fov: number;

  @editable({
    displayName: '近剪裁面',
    description: '相机的近剪裁面距离',
    type: 'number',
    group: '相机设置'
  })
  private near: number;

  @editable({
    displayName: '远剪裁面',
    description: '相机的远剪裁面距离',
    type: 'number',
    group: '相机设置'
  })
  private far: number;

  @editable({
    displayName: '相机偏移',
    description: '相机相对于目标的偏移值',
    type: 'object',
    group: '相机位置'
  })
  private cameraOffset: CameraOffsetConfig = {
    heightOffset: 0,  // 默认高度偏移
    zOffset: 0,        // 默认Z轴偏移
    xOffset: 0         // 默认X轴偏移
  };

  @editable({
    displayName: '禁用轨道控制',
    description: '禁用相机的轨道控制功能',
    type: 'object',
    group: '控制器设置'
  })
  private disableOrbitControls: {
    leftClick: boolean;
    rightClick: boolean;
    middleClick: boolean;
    wheel: boolean;
  } = {
    leftClick: false,
    rightClick: false,
    middleClick: false,
    wheel: false
  };

  private isShaking: boolean = false;
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeElapsed: number = 0;
  private originalPosition: THREE.Vector3 = new THREE.Vector3();
  
  private isRotating: boolean = false;
  private rotationSpeed: THREE.Vector2 = new THREE.Vector2();
  private rotationDuration: number = 0;
  private rotationElapsed: number = 0;
  private autoRotate: boolean = false;
  private autoRotateSpeed: number = 2.0;

  private shakeAxes: {x: boolean, y: boolean, z: boolean} = {x: true, y: true, z: true};
  private shakeFrequency: number = 10; // 震动频率
  private shakePattern: 'random' | 'sine' | 'perlin' = 'random'; // 震动模式
  private shakeRotation: boolean = false; // 是否包含旋转震动
  private shakeRotationIntensity: number = 0; // 旋转震动强度
  private originalRotation: THREE.Euler = new THREE.Euler();
  private shakeDecay: 'linear' | 'exponential' | 'none' = 'linear'; // 震动衰减模式
  private lastShakeTime: number = 0; // 上次震动更新时间

  // 添加新的属性
  private followMode: CameraFollowMode = CameraFollowMode.INSTANT;
  private followConfig: FollowConfig = {
    mode: CameraFollowMode.INSTANT
  };
  private keyboardConfig: KeyboardConfig = {
    forward: 'KeyW',
    backward: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    up: 'Space',
    down: 'ShiftLeft',
    lookUp: 'ArrowUp',
    lookDown: 'ArrowDown',
    lookLeft: 'ArrowLeft',
    lookRight: 'ArrowRight'
  };

  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private currentVelocity: THREE.Vector3 = new THREE.Vector3();

  private orbitConfig: OrbitControlsConfig = {
    minDistance: 1,
    maxDistance: 1000,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enableRotate: true,
    enablePan: true,
    rotateSpeed: 1.0,
    zoomSpeed: 1.0,
    panSpeed: 1.0
  };

  // 键盘状态跟踪
  private keyStates: Map<string, { pressed: boolean, duration: number }> = new Map();
  private keyboardEventHandlers: KeyboardEventHandler[] = [];

  constructor(
    name: string = '相机节点',
    fov: number = 75,
    near: number = 0.1,
    far: number = 1000,
    options?: { position?: THREE.Vector3, rotation?: THREE.Euler }
  ) {
    super(name, options);
    this.fov = fov;
    this.near = near;
    this.far = far;

    // 创建相机但延迟初始化
    this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
    
    // 初始化键盘事件监听
    this.initKeyboardListeners();
  }

  /**
   * 初始化键盘事件监听器
   * @private
   */
  private initKeyboardListeners(): void {
    // 添加键盘按下事件
    window.addEventListener('keydown', (event) => {
      const key = event.code;
      
      // 如果键不在状态映射中，添加它
      if (!this.keyStates.has(key)) {
        this.keyStates.set(key, { pressed: true, duration: 0 });
        
        // 触发键盘按下事件
        this.keyboardEventHandlers.forEach(handler => {
          if (handler.onKeyDown) {
            handler.onKeyDown(key);
          }
        });
      }
    });
    
    // 添加键盘释放事件
    window.addEventListener('keyup', (event) => {
      const key = event.code;
      
      if (this.keyStates.has(key)) {
        // 重置键状态
        this.keyStates.delete(key);
        
        // 触发键盘释放事件
        this.keyboardEventHandlers.forEach(handler => {
          if (handler.onKeyUp) {
            handler.onKeyUp(key);
          }
        });
      }
    });
    
    // 页面失去焦点时清除所有按键状态
    window.addEventListener('blur', () => {
      this.keyStates.clear();
    });
  }

  /**
   * 添加键盘事件处理器
   * @param handler 键盘事件处理器
   * @returns 处理器ID，用于后续移除
   */
  public addKeyboardEventHandler(handler: KeyboardEventHandler): number {
    this.keyboardEventHandlers.push(handler);
    return this.keyboardEventHandlers.length - 1;
  }

  /**
   * 移除键盘事件处理器
   * @param id 处理器ID
   */
  public removeKeyboardEventHandler(id: number): void {
    if (id >= 0 && id < this.keyboardEventHandlers.length) {
      this.keyboardEventHandlers.splice(id, 1);
    }
  }

  /**
   * 检查键是否被按下
   * @param key 键码
   * @returns 是否被按下
   */
  public isKeyPressed(key: string): boolean {
    return this.keyStates.has(key) && this.keyStates.get(key)!.pressed;
  }

  /**
   * 获取键被按下的持续时间
   * @param key 键码
   * @returns 持续时间（秒）
   */
  public getKeyPressDuration(key: string): number {
    if (this.keyStates.has(key)) {
      return this.keyStates.get(key)!.duration;
    }
    return 0;
  }

  /**
   * 更新键盘状态
   * @param deltaTime 时间间隔
   * @private
   */
  private updateKeyboardState(deltaTime: number): void {
    // 更新所有按下的键的持续时间
    this.keyStates.forEach((state, key) => {
      state.duration += deltaTime;
      
      // 触发键盘持续按下事件
      this.keyboardEventHandlers.forEach(handler => {
        if (handler.onKeyHold) {
          handler.onKeyHold(key, state.duration);
        }
      });
    });
  }

  /**
   * 初始化相机节点
   * 确保在引擎初始化完成后调用
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const engine = this.getEngine();
      if (!engine) {
        throw new Error('无法获取引擎实例');
      }

      // 等待引擎初始化完成
      if (!engine.isEngineInitialized()) {
        throw new Error('引擎尚未初始化完成');
      }

      // 初始化相机控制器
      this.initOrbitControls();
      
      this.isInitialized = true;
      console.log('Camera node initialization completed');
    } catch (error) {
      console.error('Camera node initialization failed:', error);
      throw error;
    }
  }

  /**
   * 初始化轨道控制器
   */
  private initOrbitControls(): void {
    try {
      const dom = this.getEngineDom();
      this.controls = new OrbitControls(this.camera, dom);
      
      // 使用与 Engine.ts 相同的基础配置
      if (this.controls) {
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.enableZoom = true;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 1000;
        
        // 应用鼠标按键和滚轮设置
        this.updateOrbitControlsMouseSettings();
      }
    } catch (error) {
      console.error("初始化轨道控制器失败:", error);
    }
  }

  /**
   * 更新轨道控制器的鼠标设置
   */
  private updateOrbitControlsMouseSettings(): void {
    if (!this.controls) return;
    
    // 禁用特定的鼠标按键和滚轮
    if (this.disableOrbitControls.leftClick) {
      this.controls.enableRotate = false; // 左键通常用于旋转
    }
    
    if (this.disableOrbitControls.rightClick) {
      this.controls.enablePan = false; // 右键通常用于平移
    }
    
    if (this.disableOrbitControls.wheel) {
      this.controls.enableZoom = false; // 滚轮通常用于缩放
    }
    
    // 应用 OrbitControlsConfig 的设置
    if (this.orbitConfig.enableLeftClick !== undefined) {
      // 左键控制旋转
      this.controls.enableRotate = this.orbitConfig.enableLeftClick;
    }
    
    if (this.orbitConfig.enableRightClick !== undefined) {
      // 右键控制平移
      this.controls.enablePan = this.orbitConfig.enableRightClick;
    }
    
    if (this.orbitConfig.enableWheel !== undefined) {
      // 滚轮控制缩放
      this.controls.enableZoom = this.orbitConfig.enableWheel;
    }
  }
  
  /**
   * 设置是否禁用特定的轨道控制器功能
   * @param options 禁用选项
   */
  @editable({
    displayName: '设置轨道控制器禁用选项',
    description: '配置轨道控制器的鼠标禁用选项',
    type: 'function',
    group: '控制器设置'
  })
  public setOrbitControlsDisabled(options: {
    leftClick?: boolean,
    rightClick?: boolean,
    middleClick?: boolean,
    wheel?: boolean
  }): void {
    if (options.leftClick !== undefined) {
      this.disableOrbitControls.leftClick = options.leftClick;
    }
    
    if (options.rightClick !== undefined) {
      this.disableOrbitControls.rightClick = options.rightClick;
    }
    
    if (options.middleClick !== undefined) {
      this.disableOrbitControls.middleClick = options.middleClick;
    }
    
    if (options.wheel !== undefined) {
      this.disableOrbitControls.wheel = options.wheel;
    }
    
    // 更新控制器设置
    this.updateOrbitControlsMouseSettings();
  }

  /**
   * 设置相机的目标节点
   * @param targetNode 要关注的目标节点
   */
  setTarget(targetNode: Node3d): void {
    this.targetNode = targetNode;
    
    if (this.controls && targetNode) {
      // 获取目标节点的世界位置
      const targetPosition = new THREE.Vector3();
      targetNode.getThreeObject().getWorldPosition(targetPosition);
      
      // 设置控制器的目标点
      this.controls.target.copy(targetPosition);
      
      // 设置相机初始位置（在目标后上方）
      const distance = 10;  // 增加距离到10个单位
      const height = 50;    // 增加高度到5个单位
      const angle = -Math.PI / 6; // 向下倾斜30度
      
      // 计算相机位置（在目标后上方）
      this.camera.position.copy(targetPosition);
      // 先向后移动
      this.camera.position.z += distance;
      // 再抬高
      this.camera.position.y += height;
      
      // 设置相机朝向
      this.camera.lookAt(targetPosition);
      // 应用向下倾斜角度
      this.camera.rotateX(angle);
      
      // 更新控制器
      this.controls.update();
    }
  }

  /**
   * 清除相机的目标节点
   */
  clearTarget(): void {
    this.targetNode = null;
  }

  /**
   * 获取相机对象
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * 更新相机的视野
   * @param fov 新的视野角度
   */
  setFov(fov: number): void {
    this.fov = fov;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 更新相机的近剪裁面
   * @param near 新的近剪裁面距离
   */
  setNear(near: number): void {
    this.near = near;
    this.camera.near = near;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 更新相机的远剪裁面
   * @param far 新的远剪裁面距离
   */
  setFar(far: number): void {
    this.far = far;
    this.camera.far = far;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 使相机震动 - 高级版本
   * @param intensity 震动强度
   * @param duration 震动持续时间（秒）
   * @param options 高级震动选项
   */
  shake(
    intensity: number = 0.5, 
    duration: number = 0.5, 
    options: {
      axes?: {x?: boolean, y?: boolean, z?: boolean},
      frequency?: number, // 震动频率 - 每秒震动次数
      pattern?: 'random' | 'sine' | 'perlin', // 震动模式
      rotation?: boolean, // 是否包含旋转震动
      rotationIntensity?: number, // 旋转震动强度
      decay?: 'linear' | 'exponential' | 'none' // 震动衰减模式
    } = {}
  ): void {
    this.isShaking = true;
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
    this.lastShakeTime = 0;
    
    // 保存震动轴向设置
    this.shakeAxes = {
      x: options.axes?.x !== undefined ? options.axes.x : true,
      y: options.axes?.y !== undefined ? options.axes.y : true,
      z: options.axes?.z !== undefined ? options.axes.z : true
    };
    
    // 设置震动频率
    this.shakeFrequency = options.frequency !== undefined ? options.frequency : 10;
    
    // 设置震动模式
    this.shakePattern = options.pattern !== undefined ? options.pattern : 'random';
    
    // 设置旋转震动
    this.shakeRotation = options.rotation !== undefined ? options.rotation : false;
    this.shakeRotationIntensity = options.rotationIntensity !== undefined ? options.rotationIntensity : 0.02;
    
    // 设置衰减模式
    this.shakeDecay = options.decay !== undefined ? options.decay : 'linear';
    
    // 保存原始位置和旋转
    this.originalPosition.copy(this.camera.position);
    this.originalRotation.copy(this.camera.rotation);
  }

  /**
   * 生成0-1之间的伪随机柏林噪声值
   * 简化版本，用于模拟柏林噪声的效果
   */
  private perlinNoise(x: number, y: number = 0, z: number = 0): number {
    // 简化版本，实际上使用sin函数模拟柏林噪声效果
    return (Math.sin(x * 12.9898 + y * 78.233 + z * 45.54) * 43758.5453) % 1;
  }

  /**
   * 停止相机震动
   */
  stopShaking(): void {
    if (this.isShaking) {
      this.isShaking = false;
      this.camera.position.copy(this.originalPosition);
      if (this.shakeRotation) {
        this.camera.rotation.copy(this.originalRotation);
      }
    }
  }

  /**
   * 旋转相机（临时旋转）
   * @param speedX X轴旋转速度（弧度/秒）
   * @param speedY Y轴旋转速度（弧度/秒）
   * @param duration 旋转持续时间（秒），0表示无限旋转
   */
  rotate(speedX: number = 0.01, speedY: number = 0.01, duration: number = 0): void {
    this.isRotating = true;
    this.rotationSpeed.set(speedX, speedY);
    this.rotationDuration = duration;
    this.rotationElapsed = 0;
  }

  /**
   * 停止相机旋转
   */
  stopRotating(): void {
    this.isRotating = false;
  }

  /**
   * 启用/禁用自动旋转
   * @param enable 是否启用
   * @param speed 旋转速度
   */
  setAutoRotate(enable: boolean, speed: number = 2.0): void {
    this.autoRotate = enable;
    this.autoRotateSpeed = speed;
    
    if (this.controls) {
      this.controls.autoRotate = enable;
      this.controls.autoRotateSpeed = speed;
    }
  }

  /**
   * 设置相机跟随配置
   */
  @editable({
    displayName: '设置跟随配置',
    description: '配置相机如何跟随目标节点',
    type: 'function',
    group: '相机跟随'
  })
  setFollowConfig(config: Partial<FollowConfig>): void {
    this.followConfig = { ...this.followConfig, ...config };
    
    // 如果提供了 offset，更新相机偏移
    if (config.offset) {
      this.setCameraOffset({
        heightOffset: config.offset.y || this.cameraOffset.heightOffset,
        zOffset: config.offset.z || this.cameraOffset.zOffset,
        xOffset: config.offset.x || this.cameraOffset.xOffset
      });
    }
  }

  /**
   * 设置键盘映射配置
   */
  @editable({
    displayName: '设置键盘映射',
    description: '配置相机控制的键盘映射',
    type: 'function',
    group: '键盘控制'
  })
  setKeyboardConfig(config: Partial<KeyboardConfig>): void {
    this.keyboardConfig = { ...this.keyboardConfig, ...config };
  }

  /**
   * 设置轨道控制器配置
   */
  @editable({
    displayName: '设置轨道控制器',
    description: '配置相机的轨道控制器参数',
    type: 'function',
    group: '控制器设置'
  })
  setOrbitControlsConfig(config: Partial<OrbitControlsConfig>): void {
    this.orbitConfig = { ...this.orbitConfig, ...config };
    
    // 如果控制器已初始化，应用设置
    if (this.controls) {
      // 应用距离限制
      if (config.minDistance !== undefined) {
        this.controls.minDistance = config.minDistance;
      }
      if (config.maxDistance !== undefined) {
        this.controls.maxDistance = config.maxDistance;
      }
      
      // 应用角度限制
      if (config.minPolarAngle !== undefined) {
        this.controls.minPolarAngle = config.minPolarAngle;
      }
      if (config.maxPolarAngle !== undefined) {
        this.controls.maxPolarAngle = config.maxPolarAngle;
      }
      if (config.minAzimuthAngle !== undefined) {
        this.controls.minAzimuthAngle = config.minAzimuthAngle;
      }
      if (config.maxAzimuthAngle !== undefined) {
        this.controls.maxAzimuthAngle = config.maxAzimuthAngle;
      }
      
      // 应用阻尼设置
      if (config.enableDamping !== undefined) {
        this.controls.enableDamping = config.enableDamping;
      }
      if (config.dampingFactor !== undefined) {
        this.controls.dampingFactor = config.dampingFactor;
      }
      
      // 应用速度设置
      if (config.rotateSpeed !== undefined) {
        this.controls.rotateSpeed = config.rotateSpeed;
      }
      if (config.zoomSpeed !== undefined) {
        this.controls.zoomSpeed = config.zoomSpeed;
      }
      if (config.panSpeed !== undefined) {
        this.controls.panSpeed = config.panSpeed;
      }
      
      // 更新鼠标设置
      this.updateOrbitControlsMouseSettings();
    }
  }
  
  /**
   * 设置相机偏移
   * @param offset 相机偏移配置
   */
  @editable({
    displayName: '设置相机偏移',
    description: '设置相机相对于目标的偏移值',
    type: 'function',
    group: '相机位置'
  })
  setCameraOffset(offset: Partial<CameraOffsetConfig>): void {
    if (offset.heightOffset !== undefined) {
      this.cameraOffset.heightOffset = offset.heightOffset;
    }
    
    if (offset.zOffset !== undefined) {
      this.cameraOffset.zOffset = offset.zOffset;
    }
    
    if (offset.xOffset !== undefined) {
      this.cameraOffset.xOffset = offset.xOffset;
    }
  }

  /**
   * 处理键盘输入
   */
  private handleKeyboardInput(deltaTime: number): void {
    if (!this.controls) return;

    const moveSpeed = 0.1;
    const rotateSpeed = 0.02;

    // 获取按键状态
    const isKeyPressed = (key: string) => {
      return key && document.querySelector(`[data-key="${key}"]`)?.classList.contains('active');
    };

    // 获取相机的前进方向和右方向
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    // 获取相机的方向向量
    this.camera.getWorldDirection(forward);
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    // 创建平移向量
    const pan = new THREE.Vector3();
    
    // 处理平移
    if (isKeyPressed(this.keyboardConfig.forward)) {
      pan.add(forward.multiplyScalar(moveSpeed));
    }
    if (isKeyPressed(this.keyboardConfig.backward)) {
      pan.sub(forward.multiplyScalar(moveSpeed));
    }
    if (isKeyPressed(this.keyboardConfig.left)) {
      pan.sub(right.multiplyScalar(moveSpeed));
    }
    if (isKeyPressed(this.keyboardConfig.right)) {
      pan.add(right.multiplyScalar(moveSpeed));
    }

    // 应用平移到相机和目标点
    if (pan.lengthSq() > 0) {
      // 移动相机
      this.camera.position.add(pan);
      // 同时移动控制器的目标点
      this.controls.target.add(pan);
      this.controls.update();
    }

    // 处理旋转
    if (isKeyPressed(this.keyboardConfig.lookUp)) {
      // 绕X轴旋转
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationX(rotateSpeed);
      const offset = this.camera.position.clone().sub(this.controls.target);
      offset.applyMatrix4(rotationMatrix);
      this.camera.position.copy(this.controls.target).add(offset);
    }
    if (isKeyPressed(this.keyboardConfig.lookDown)) {
      // 绕X轴旋转
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationX(-rotateSpeed);
      const offset = this.camera.position.clone().sub(this.controls.target);
      offset.applyMatrix4(rotationMatrix);
      this.camera.position.copy(this.controls.target).add(offset);
    }
    if (isKeyPressed(this.keyboardConfig.lookLeft)) {
      // 绕Y轴旋转
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationY(rotateSpeed);
      const offset = this.camera.position.clone().sub(this.controls.target);
      offset.applyMatrix4(rotationMatrix);
      this.camera.position.copy(this.controls.target).add(offset);
    }
    if (isKeyPressed(this.keyboardConfig.lookRight)) {
      // 绕Y轴旋转
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationY(-rotateSpeed);
      const offset = this.camera.position.clone().sub(this.controls.target);
      offset.applyMatrix4(rotationMatrix);
      this.camera.position.copy(this.controls.target).add(offset);
    }
    
    // 确保相机始终看向目标点
    this.camera.lookAt(this.controls.target);
    this.controls.update();
  }

  /**
   * 更新相机位置
   */
  private updateCameraPosition(deltaTime: number): void {
    if (!this.targetNode || !this.controls) return;

    // 获取目标位置
    this.targetNode.getThreeObject().getWorldPosition(this.targetPosition);

    // 应用偏移量
    if (this.followConfig.offset) {
      this.targetPosition.x += this.followConfig.offset.x || 0;
      this.targetPosition.y += this.followConfig.offset.y || 0;
      this.targetPosition.z += this.followConfig.offset.z || 0;
    }

    // 计算目标距离和高度
    const distance = this.followConfig.distance || 10;
    const height = this.followConfig.height || 5;

    // 计算相机目标位置
    const targetCameraPosition = new THREE.Vector3();
    
    if (this.followConfig.angle) {
      const horizontalAngle = this.followConfig.angle.horizontal || 0;
      const verticalAngle = this.followConfig.angle.vertical || 0;
      
      // 使用球坐标系计算相机位置
      targetCameraPosition.x = this.targetPosition.x + distance * Math.sin(horizontalAngle) * Math.cos(verticalAngle);
      targetCameraPosition.y = this.targetPosition.y + height + distance * Math.sin(verticalAngle);
      targetCameraPosition.z = this.targetPosition.z + distance * Math.cos(horizontalAngle) * Math.cos(verticalAngle);
    } else {
      // 默认位置（在目标后方和上方）
      targetCameraPosition.copy(this.targetPosition)
        .add(new THREE.Vector3(0, height, distance));
    }

    // 根据跟随模式更新位置
    switch (this.followConfig.mode) {
      case CameraFollowMode.INSTANT:
        this.camera.position.copy(targetCameraPosition);
        break;

      case CameraFollowMode.SMOOTH:
        const smoothSpeed = this.followConfig.smoothSpeed || 0.1;
        this.camera.position.lerp(targetCameraPosition, smoothSpeed * deltaTime);
        break;

      case CameraFollowMode.SPRING:
        const strength = this.followConfig.springStrength || 10;
        const damping = this.followConfig.springDamping || 0.8;
        
        // 计算弹性力
        const force = new THREE.Vector3().subVectors(targetCameraPosition, this.camera.position);
        force.multiplyScalar(strength * deltaTime);
        
        // 应用阻尼
        this.currentVelocity.multiplyScalar(1 - damping * deltaTime);
        this.currentVelocity.add(force);
        
        // 更新位置
        this.camera.position.add(this.currentVelocity);
        break;

      case CameraFollowMode.CUSTOM:
        if (this.followConfig.customCurve) {
          const t = this.followConfig.customCurve(deltaTime);
          this.camera.position.lerp(targetCameraPosition, t);
        }
        break;
    }

    // 保持在最小高度以上
    if (this.followConfig.keepAboveGround && this.followConfig.minHeight) {
      this.camera.position.y = Math.max(this.camera.position.y, this.followConfig.minHeight);
    }

    // 更新控制器目标点
    this.controls.target.copy(this.targetPosition);

    // 如果需要始终看向目标
    if (this.followConfig.lookAtTarget) {
      this.camera.lookAt(this.targetPosition);
    }

    this.controls.update();
  }

  /**
   * 覆盖更新方法
   */
  override update(deltaTime: number): void {
    // 调用父类的 update 方法
    super.update(deltaTime);
    
    console.log('CameraNode3D update called', this.targetNode?.getName());
    
    // 更新键盘状态
    this.updateKeyboardState(deltaTime);
    
    // 如果有目标节点和控制器，更新相机位置
    if (this.targetNode && this.controls) {
      // 获取目标的最新位置
      const targetPosition = new THREE.Vector3();
      this.targetNode.getThreeObject().getWorldPosition(targetPosition);
      
      // 保持相对位置
      const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
      
      // 使用结构化的偏移属性
      // offset.y = this.cameraOffset.heightOffset;
      // offset.z = this.cameraOffset.zOffset;
      // offset.x = this.cameraOffset.xOffset;
      
      // 更新控制器目标点到新位置
      this.controls.target.copy(targetPosition);
      
      // 更新相机位置，保持相对偏移
      this.camera.position.copy(targetPosition).add(offset);
      
      // 确保相机始终看向目标
      this.camera.lookAt(targetPosition);
      
      // 更新控制器
      this.controls.update();
    }
  }

  /**
   * 序列化为JSON
   */
  override toJSON(): any {
    const json = super.toJSON();
    json.cameraSettings = {
      fov: this.fov,
      near: this.near,
      far: this.far
    };
    return json;
  }

  /**
   * 设置为引擎相机
   */
  public async setAsEngineCamera(): Promise<void> {
    try {
      // 确保相机节点已初始化
      await this.initialize();

      const engine = this.getEngine();
      if (engine) {
        engine.setGameCamera(this);
        this.isEngineCamera = true;
      }
    } catch (error) {
      console.error('Failed to set as engine camera:', error);
      throw error;
    }
  }

  /**
   * 取消设置为引擎相机
   */
  public unsetAsEngineCamera(): void {
    const engine = this.getEngine();
    if (engine && this.isEngineCamera) {
      engine.setGameCamera(null);
      this.isEngineCamera = false;
    }
  }

  /**
   * 检查是否为引擎相机
   */
  public isActiveEngineCamera(): boolean {
    return this.isEngineCamera;
  }

  /**
   * 覆盖销毁方法，确保清理相机引用
   */
  public override dispose(): void {
    this.unsetAsEngineCamera();
    super.dispose();
  }

  /**
   * 将相机信息暴露给脚本系统
   * @returns 相机信息对象
   */
  public getCameraInfo(): {
    position: THREE.Vector3,
    rotation: THREE.Euler,
    fov: number,
    offset: CameraOffsetConfig,
    target: Node3d | null,
    isOrbitControlsEnabled: boolean
  } {
    return {
      position: this.camera.position.clone(),
      rotation: this.camera.rotation.clone(),
      fov: this.fov,
      offset: { ...this.cameraOffset },
      target: this.targetNode,
      isOrbitControlsEnabled: !!(this.controls && !this.disableOrbitControls.leftClick && !this.disableOrbitControls.rightClick)
    };
  }

  /**
   * 获取键盘状态，供脚本系统使用
   * @returns 键盘状态映射
   */
  public getKeyboardStates(): Map<string, { pressed: boolean, duration: number }> {
    return new Map(this.keyStates);
  }

  /**
   * 检查某组键是否同时被按下，供脚本系统使用
   * @param keys 要检查的键数组
   * @returns 是否所有键都被按下
   */
  public areKeysPressed(keys: string[]): boolean {
    return keys.every(key => this.isKeyPressed(key));
  }
  
  /**
   * 根据键盘输入移动相机，供脚本系统使用
   * @param moveSpeed 移动速度
   * @param rotateSpeed 旋转速度
   */
  public moveByKeyboard(moveSpeed: number = 0.1, rotateSpeed: number = 0.02): void {
    if (!this.controls) return;
    
    // 获取前进和右方向
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    // 初始化移动向量
    const moveVector = new THREE.Vector3();
    
    // 处理WASD移动
    if (this.isKeyPressed(this.keyboardConfig.forward)) {
      moveVector.add(forward.clone().multiplyScalar(moveSpeed));
    }
    if (this.isKeyPressed(this.keyboardConfig.backward)) {
      moveVector.sub(forward.clone().multiplyScalar(moveSpeed));
    }
    if (this.isKeyPressed(this.keyboardConfig.left)) {
      moveVector.sub(right.clone().multiplyScalar(moveSpeed));
    }
    if (this.isKeyPressed(this.keyboardConfig.right)) {
      moveVector.add(right.clone().multiplyScalar(moveSpeed));
    }
    
    // 应用移动
    if (moveVector.lengthSq() > 0) {
      this.camera.position.add(moveVector);
      this.controls.target.add(moveVector);
    }
    
    // 处理视角旋转
    let hasRotation = false;
    const rotationMatrix = new THREE.Matrix4();
    
    if (this.isKeyPressed(this.keyboardConfig.lookUp)) {
      rotationMatrix.makeRotationX(rotateSpeed);
      hasRotation = true;
    } else if (this.isKeyPressed(this.keyboardConfig.lookDown)) {
      rotationMatrix.makeRotationX(-rotateSpeed);
      hasRotation = true;
    }
    
    if (hasRotation) {
      const offset = this.camera.position.clone().sub(this.controls.target);
      offset.applyMatrix4(rotationMatrix);
      this.camera.position.copy(this.controls.target).add(offset);
    }
    
    hasRotation = false;
    
    if (this.isKeyPressed(this.keyboardConfig.lookLeft)) {
      rotationMatrix.makeRotationY(rotateSpeed);
      hasRotation = true;
    } else if (this.isKeyPressed(this.keyboardConfig.lookRight)) {
      rotationMatrix.makeRotationY(-rotateSpeed);
      hasRotation = true;
    }
    
    if (hasRotation) {
      const offset = this.camera.position.clone().sub(this.controls.target);
      offset.applyMatrix4(rotationMatrix);
      this.camera.position.copy(this.controls.target).add(offset);
    }
    
    // 更新控制器
    this.controls.update();
  }
} 