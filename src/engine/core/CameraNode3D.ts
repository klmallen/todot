import * as THREE from 'three';
import { Node3d } from './Node3d';
import { editable, editableComponent } from './decorators';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Engine from './Engine';

/**
 * CameraNode3D 类 - 表示3D场景中的相机节点
 * 继承自 Node3d，添加了相机支持和控制器
 */
@editableComponent({
  displayName: '相机节点',
  description: '3D场景中的相机对象',
  icon: 'camera',
  category: 'Camera'
})
export class CameraNode3D extends Node3d {
  private camera: THREE.PerspectiveCamera;
  private controls: THREE.OrbitControls | null = null;
  private targetNode: Node3d | null = null;

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
    this.camera = this.getEngineCamera().camera;
    
    console.log(this.camera,'this.camera')
    // this.getThreeObject().add(this.camera);
    this.setType('CameraNode3D');
    this.addTag('camera');

    // 初始化默认控制器
    this.initOrbitControls();
  }

  /**
   * 初始化轨道控制器
   */
  private initOrbitControls(): void {
    console.log( this.getEngineCamera(),'Engine.getInstance()')
    
    this.controls = new OrbitControls(this.camera, this.getEngineDom());
    this.controls.enableDamping = true; // 启用阻尼效果
    
    // 初始状态下启用控制器
    if (this.controls) {
      this.controls.enabled = true;
    }
    
    // 注意：移除了原来的mousedown/mouseup事件监听器
    // 保持控制器始终处于启用状态
  }

  /**
   * 设置相机的目标节点
   * @param targetNode 要关注的目标节点
   */
  setTarget(targetNode: Node3d): void {
    this.targetNode = targetNode;  // 保存目标节点的引用
    
    if (this.controls && targetNode) {
      // 获取目标节点的世界位置
      const targetPosition = new THREE.Vector3();
      targetNode.getThreeObject().getWorldPosition(targetPosition);
      
      // 设置控制器的目标点
      console.log(targetNode,'targetNode')
      this.controls.target.copy(targetPosition);
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
   * 覆盖更新方法
   */
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // 处理相机震动
    if (this.isShaking) {
      this.shakeElapsed += deltaTime;
      
      // 判断是否应该继续震动
      if (this.shakeElapsed < this.shakeDuration) {
        // 计算震动强度的衰减
        let intensityMultiplier = 1.0;
        
        switch (this.shakeDecay) {
          case 'linear':
            intensityMultiplier = 1 - this.shakeElapsed / this.shakeDuration;
            break;
          case 'exponential':
            intensityMultiplier = Math.pow(1 - this.shakeElapsed / this.shakeDuration, 2);
            break;
          case 'none':
            intensityMultiplier = 1.0;
            break;
        }
        
        const currentIntensity = this.shakeIntensity * intensityMultiplier;
        
        // 计算时间偏移，用于震动效果
        const timeOffset = this.shakeElapsed * this.shakeFrequency;
        
        // 复制原始位置
        this.camera.position.copy(this.originalPosition);
        
        // 根据震动模式应用不同的震动效果
        switch (this.shakePattern) {
          case 'random':
            // 只在指定的轴上应用随机震动
            if (this.shakeAxes.x) {
              this.camera.position.x += (Math.random() - 0.5) * 2 * currentIntensity;
            }
            if (this.shakeAxes.y) {
              this.camera.position.y += (Math.random() - 0.5) * 2 * currentIntensity;
            }
            if (this.shakeAxes.z) {
              this.camera.position.z += (Math.random() - 0.5) * 2 * currentIntensity;
            }
            break;
            
          case 'sine':
            // 使用正弦波产生更平滑的周期性震动
            if (this.shakeAxes.x) {
              this.camera.position.x += Math.sin(timeOffset * 1.1) * currentIntensity;
            }
            if (this.shakeAxes.y) {
              this.camera.position.y += Math.sin(timeOffset * 0.95 + 1.5) * currentIntensity;
            }
            if (this.shakeAxes.z) {
              this.camera.position.z += Math.sin(timeOffset * 0.87 + 0.5) * currentIntensity;
            }
            break;
            
          case 'perlin':
            // 使用柏林噪声产生自然的震动
            if (this.shakeAxes.x) {
              this.camera.position.x += (this.perlinNoise(timeOffset * 0.1, 0, 0) * 2 - 1) * currentIntensity;
            }
            if (this.shakeAxes.y) {
              this.camera.position.y += (this.perlinNoise(0, timeOffset * 0.1, 0) * 2 - 1) * currentIntensity;
            }
            if (this.shakeAxes.z) {
              this.camera.position.z += (this.perlinNoise(0, 0, timeOffset * 0.1) * 2 - 1) * currentIntensity;
            }
            break;
        }
        
        // 应用旋转震动（如果启用）
        if (this.shakeRotation) {
          this.camera.rotation.copy(this.originalRotation);
          
          // 根据震动模式应用不同的旋转震动
          switch (this.shakePattern) {
            case 'random':
              this.camera.rotation.x += (Math.random() - 0.5) * 2 * this.shakeRotationIntensity * intensityMultiplier;
              this.camera.rotation.y += (Math.random() - 0.5) * 2 * this.shakeRotationIntensity * intensityMultiplier;
              this.camera.rotation.z += (Math.random() - 0.5) * 2 * this.shakeRotationIntensity * intensityMultiplier;
              break;
              
            case 'sine':
              this.camera.rotation.x += Math.sin(timeOffset * 1.2) * this.shakeRotationIntensity * intensityMultiplier;
              this.camera.rotation.y += Math.sin(timeOffset * 1.1 + 1.0) * this.shakeRotationIntensity * intensityMultiplier;
              this.camera.rotation.z += Math.sin(timeOffset * 1.0 + 2.0) * this.shakeRotationIntensity * intensityMultiplier;
              break;
              
            case 'perlin':
              this.camera.rotation.x += (this.perlinNoise(timeOffset * 0.15, 0, 0) * 2 - 1) * this.shakeRotationIntensity * intensityMultiplier;
              this.camera.rotation.y += (this.perlinNoise(0, timeOffset * 0.15, 0) * 2 - 1) * this.shakeRotationIntensity * intensityMultiplier;
              this.camera.rotation.z += (this.perlinNoise(0, 0, timeOffset * 0.15) * 2 - 1) * this.shakeRotationIntensity * intensityMultiplier;
              break;
          }
        }
      } else {
        // 震动结束，恢复原始位置和旋转
        this.stopShaking();
      }
    }
    
    // 处理相机旋转
    if (this.isRotating) {
      if (this.rotationDuration > 0) {
        this.rotationElapsed += deltaTime;
        if (this.rotationElapsed >= this.rotationDuration) {
          this.isRotating = false;
        }
      }
      
      if (this.isRotating && this.controls) {
        // 手动旋转相机
        this.controls.rotateLeft(this.rotationSpeed.x * deltaTime);
        this.controls.rotateUp(this.rotationSpeed.y * deltaTime);
      }
    }
    
    // 如果有目标节点，更新控制器的目标位置
    if (this.controls && this.targetNode) {
      const targetPosition = new THREE.Vector3();
      this.targetNode.getThreeObject().getWorldPosition(targetPosition);
      this.controls.target.copy(targetPosition);
    }
    
    if (this.controls) {
      this.controls.update();
    }
  }

  /**
   * 序列化为JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.cameraSettings = {
      fov: this.fov,
      near: this.near,
      far: this.far
    };
    return json;
  }
} 