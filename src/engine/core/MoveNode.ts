import * as THREE from 'three';
import { Node3d } from './Node3d';
import { editable, editableComponent } from './decorators';

/**
 * MoveNode - 增强移动能力的Node3d子类
 * 提供丰富的移动、旋转和朝向能力
 */
@editableComponent({
  displayName: '移动节点',
  description: '具有增强移动能力的3D节点',
  icon: 'directions',
  category: 'Movement'
})
export class MoveNode extends Node3d {
  @editable({
    displayName: '移动速度',
    description: '节点移动的基本速度',
    type: 'number',
    group: 'Movement'
  })
  private moveSpeed: number = 5;

  @editable({
    displayName: '旋转速度',
    description: '节点旋转的基本速度',
    type: 'number',
    group: 'Movement'
  })
  private rotationSpeed: number = 2;

  @editable({
    displayName: '启用物理',
    description: '是否启用简单物理模拟',
    type: 'boolean',
    group: 'Physics'
  })
  private enablePhysics: boolean = false;

  // 物理属性
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private acceleration: THREE.Vector3 = new THREE.Vector3();
  private angularVelocity: THREE.Euler = new THREE.Euler();
  private gravity: number = 9.8;
  private mass: number = 1.0;
  private drag: number = 0.1;

  // 目标跟踪
  private followTarget: Node3d | null = null;
  private followDistance: number = 5;
  private followHeight: number = 2;
  private followLerp: number = 0.1; // 跟随平滑度

  // 路径跟随
  private pathPoints: THREE.Vector3[] = [];
  private currentPathIndex: number = 0;
  private pathLoop: boolean = false;
  private reachedEnd: boolean = false;
  private pathThreshold: number = 0.1;

  // 动画任务
  private moveTasks: ((deltaTime: number) => boolean)[] = [];

  constructor(
    name: string,
    options?: { position?: THREE.Vector3, rotation?: THREE.Euler, moveSpeed?: number, rotationSpeed?: number }
  ) {
    super(name, options);
    
    this.setType('MoveNode');
    
    if (options) {
      if (options.moveSpeed !== undefined) this.moveSpeed = options.moveSpeed;
      if (options.rotationSpeed !== undefined) this.rotationSpeed = options.rotationSpeed;
    }
  }

  /**
   * 向目标位置移动
   * @param target 目标位置或目标节点
   * @param speed 移动速度，如果未指定则使用默认速度
   * @returns 是否到达目标
   */
  public moveTo(target: THREE.Vector3 | Node3d, speed?: number, deltaTime?: number): boolean {
    const targetPosition = target instanceof Node3d
      ? new THREE.Vector3().setFromMatrixPosition(target.getThreeObject().matrixWorld)
      : target.clone();

    const currentPos = this.position.clone();
    const direction = new THREE.Vector3().subVectors(targetPosition, currentPos);
    const distance = direction.length();

    // 如果已经到达目标位置
    if (distance < 0.01) {
      return true;
    }

    // 使用指定速度或默认速度
    const actualSpeed = speed !== undefined ? speed : this.moveSpeed;
    const dt = deltaTime !== undefined ? deltaTime : (1/60);
    const moveDistance = Math.min(actualSpeed * dt, distance);

    // 更新位置
    this.position.add(direction.normalize().multiplyScalar(moveDistance));

    return false;
  }

  /**
   * 平滑移动到目标位置
   * @param target 目标位置或目标节点
   * @param duration 过渡持续时间（秒）
   * @param easing 缓动系数 (0-1之间，0为线性，1为最大缓动)
   * @param onComplete 完成回调
   */
  public smoothMoveTo(
    target: THREE.Vector3 | Node3d,
    duration: number = 1.0,
    easing: number = 0.2,
    onComplete?: () => void
  ): void {
    const targetPosition = target instanceof Node3d
      ? new THREE.Vector3().setFromMatrixPosition(target.getThreeObject().matrixWorld)
      : target.clone();

    const startPosition = this.position.clone();
    const startTime = performance.now() / 1000;

    // 创建动画任务
    const moveTask = (deltaTime: number): boolean => {
      const currentTime = performance.now() / 1000;
      const elapsedTime = currentTime - startTime;

      if (elapsedTime >= duration) {
        // 动画结束，设置到最终位置
        this.position.copy(targetPosition);
        if (onComplete) onComplete();
        return true; // 动画完成
      }

      // 计算进度 (0-1)
      let t = elapsedTime / duration;

      // 应用缓动函数
      if (easing > 0) {
        t = t < 0.5
          ? Math.pow(2 * t, 1 + easing) / 2
          : 1 - Math.pow(2 * (1 - t), 1 + easing) / 2;
      }

      // 插值计算新位置
      const newPosition = new THREE.Vector3().lerpVectors(startPosition, targetPosition, t);
      this.position.copy(newPosition);

      return false; // 动画未完成
    };

    this.addMoveTask(moveTask);
  }

  /**
   * 沿方向移动指定距离
   * @param direction 移动方向（将被归一化）
   * @param distance 移动距离
   */
  public moveDirection(direction: THREE.Vector3, distance: number): void {
    const normalizedDir = direction.clone().normalize();
    this.position.add(normalizedDir.multiplyScalar(distance));
  }

  /**
   * 平滑朝向某个目标
   * @param target 目标位置或目标节点
   * @param speed 旋转速度系数
   * @param deltaTime 时间增量
   * @returns 是否已完成朝向
   */
  public smoothLookAt(target: THREE.Vector3 | Node3d, speed?: number, deltaTime?: number): boolean {
    const actualSpeed = speed !== undefined ? speed : this.rotationSpeed;
    const dt = deltaTime !== undefined ? deltaTime : (1/60);
    
    const targetPosition = target instanceof Node3d
      ? new THREE.Vector3().setFromMatrixPosition(target.getThreeObject().matrixWorld)
      : target.clone();

    const obj = this.getThreeObject();

    // 获取当前世界位置
    const currentPosition = new THREE.Vector3();
    obj.getWorldPosition(currentPosition);
    
    // 计算目标方向
    const direction = new THREE.Vector3().subVectors(targetPosition, currentPosition).normalize();

    // 创建临时目标四元数
    const targetQuaternion = new THREE.Quaternion();
    const m = new THREE.Matrix4();
    m.lookAt(currentPosition, targetPosition, obj.up);
    targetQuaternion.setFromRotationMatrix(m);

    // 平滑插值到目标朝向
    obj.quaternion.slerp(targetQuaternion, Math.min(actualSpeed * dt, 1));

    // 检查是否接近目标朝向
    return obj.quaternion.angleTo(targetQuaternion) < 0.01;
  }

  /**
   * 旋转节点
   * @param x X轴旋转弧度
   * @param y Y轴旋转弧度
   * @param z Z轴旋转弧度
   */
  public rotate(x: number, y: number, z: number): void {
    const euler = this.rotation;
    euler.x += x;
    euler.y += y;
    euler.z += z;
  }

  /**
   * 平滑旋转到目标欧拉角
   * @param targetEuler 目标欧拉角
   * @param duration 过渡持续时间（秒）
   * @param easing 缓动系数
   * @param onComplete 完成回调
   */
  public smoothRotateTo(
    targetEuler: THREE.Euler,
    duration: number = 1.0,
    easing: number = 0.2,
    onComplete?: () => void
  ): void {
    const startRotation = this.rotation.clone();
    const startQuaternion = new THREE.Quaternion().setFromEuler(startRotation);
    const targetQuaternion = new THREE.Quaternion().setFromEuler(targetEuler);
    const startTime = performance.now() / 1000;

    // 创建动画任务
    const rotateTask = (deltaTime: number): boolean => {
      const currentTime = performance.now() / 1000;
      const elapsedTime = currentTime - startTime;

      if (elapsedTime >= duration) {
        // 动画结束，设置到最终旋转
        this.rotation.copy(targetEuler);
        if (onComplete) onComplete();
        return true; // 动画完成
      }

      // 计算进度 (0-1)
      let t = elapsedTime / duration;

      // 应用缓动函数
      if (easing > 0) {
        t = t < 0.5
          ? Math.pow(2 * t, 1 + easing) / 2
          : 1 - Math.pow(2 * (1 - t), 1 + easing) / 2;
      }

      // 四元数插值
      const newQuaternion = new THREE.Quaternion();
      newQuaternion.slerpQuaternions(startQuaternion, targetQuaternion, t);
      
      // 应用到节点
      this.getThreeObject().quaternion.copy(newQuaternion);

      return false; // 动画未完成
    };

    this.addMoveTask(rotateTask);
  }

  /**
   * 设置跟随目标
   * @param target 要跟随的目标
   * @param distance 保持的距离
   * @param height 保持的高度
   * @param smoothness 跟随平滑度 (0-1)
   */
  public follow(
    target: Node3d | null,
    distance: number = 5,
    height: number = 2,
    smoothness: number = 0.1
  ): void {
    this.followTarget = target;
    this.followDistance = distance;
    this.followHeight = height;
    this.followLerp = Math.max(0, Math.min(1, smoothness));
  }

  /**
   * 停止跟随
   */
  public stopFollowing(): void {
    this.followTarget = null;
  }

  /**
   * 设置路径点并开始沿路径移动
   * @param points 路径点数组
   * @param loop 是否循环
   */
  public followPath(points: THREE.Vector3[], loop: boolean = false): void {
    if (points.length === 0) return;

    this.pathPoints = [...points];
    this.currentPathIndex = 0;
    this.pathLoop = loop;
    this.reachedEnd = false;
  }

  /**
   * 清除路径
   */
  public clearPath(): void {
    this.pathPoints = [];
    this.currentPathIndex = 0;
    this.reachedEnd = false;
  }

  /**
   * 应用力（用于物理模拟）
   * @param force 要应用的力向量
   */
  public applyForce(force: THREE.Vector3): void {
    if (!this.enablePhysics) return;
    
    // F = ma, 所以 a = F/m
    const acc = force.clone().divideScalar(this.mass);
    this.acceleration.add(acc);
  }

  /**
   * 应用冲量（立即改变速度）
   * @param impulse 冲量向量
   */
  public applyImpulse(impulse: THREE.Vector3): void {
    if (!this.enablePhysics) return;
    
    // 直接修改速度
    this.velocity.add(impulse.clone().divideScalar(this.mass));
  }

  /**
   * 设置重力
   * @param gravity 重力值
   */
  public setGravity(gravity: number): void {
    this.gravity = gravity;
  }

  /**
   * 创建一个震动效果
   * @param intensity 震动强度
   * @param duration 持续时间（秒）
   * @param decayRate 衰减速率
   */
  public shake(intensity: number = 0.5, duration: number = 0.5, decayRate: number = 0.95): void {
    const originalPosition = this.position.clone();
    const startTime = performance.now() / 1000;
    let currentIntensity = intensity;

    const shakeTask = (deltaTime: number): boolean => {
      const currentTime = performance.now() / 1000;
      const elapsedTime = currentTime - startTime;

      if (elapsedTime >= duration || currentIntensity < 0.01) {
        // 震动结束，恢复原始位置
        this.position.copy(originalPosition);
        return true;
      }

      // 计算随机偏移
      const offsetX = (Math.random() * 2 - 1) * currentIntensity;
      const offsetY = (Math.random() * 2 - 1) * currentIntensity;
      const offsetZ = (Math.random() * 2 - 1) * currentIntensity;

      // 应用偏移
      this.position.set(
        originalPosition.x + offsetX,
        originalPosition.y + offsetY,
        originalPosition.z + offsetZ
      );

      // 衰减强度
      currentIntensity *= decayRate;

      return false;
    };

    this.addMoveTask(shakeTask);
  }

  /**
   * 添加移动任务
   * @param task 移动任务函数
   */
  private addMoveTask(task: (deltaTime: number) => boolean): void {
    this.moveTasks.push(task);
  }

  /**
   * 重写update方法
   */
  update(deltaTime: number): void {
    super.update(deltaTime);

    // 处理物理
    if (this.enablePhysics) {
      this.updatePhysics(deltaTime);
    }

    // 处理目标跟随
    if (this.followTarget) {
      this.updateFollow(deltaTime);
    }

    // 处理路径移动
    if (this.pathPoints.length > 0 && !this.reachedEnd) {
      this.updatePathFollow(deltaTime);
    }

    // 更新所有移动任务
    this.updateMoveTasks(deltaTime);
  }

  /**
   * 更新物理
   */
  private updatePhysics(deltaTime: number): void {
    // 添加重力
    this.applyForce(new THREE.Vector3(0, -this.gravity * this.mass, 0));

    // 更新速度
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

    // 应用阻力
    this.velocity.multiplyScalar(1 - this.drag * deltaTime);

    // 更新位置
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // 重置加速度
    this.acceleration.set(0, 0, 0);
  }

  /**
   * 更新目标跟随
   */
  private updateFollow(deltaTime: number): void {
    if (!this.followTarget) return;

    const targetPosition = new THREE.Vector3();
    this.followTarget.getThreeObject().getWorldPosition(targetPosition);

    // 计算理想位置（在目标后方一定距离）
    const targetDirection = new THREE.Vector3(0, 0, -1);
    targetDirection.applyQuaternion(this.followTarget.getThreeObject().quaternion);
    
    const idealPosition = new THREE.Vector3().copy(targetPosition)
      .add(targetDirection.multiplyScalar(this.followDistance))
      .add(new THREE.Vector3(0, this.followHeight, 0));
    
    // 平滑移动到理想位置
    this.position.lerp(idealPosition, this.followLerp);

    // 节点朝向目标
    this.smoothLookAt(targetPosition, undefined, deltaTime);
  }

  /**
   * 更新路径跟随
   */
  private updatePathFollow(deltaTime: number): void {
    if (this.pathPoints.length === 0 || this.currentPathIndex >= this.pathPoints.length) {
      return;
    }

    // 获取当前目标点
    const targetPoint = this.pathPoints[this.currentPathIndex];
    
    // 移向目标点
    const reached = this.moveTo(targetPoint, undefined, deltaTime);
    
    // 如果到达当前点，移动到下一个点
    if (reached) {
      this.currentPathIndex++;
      
      // 检查是否到达路径末尾
      if (this.currentPathIndex >= this.pathPoints.length) {
        if (this.pathLoop) {
          // 如果是循环路径，从头开始
          this.currentPathIndex = 0;
        } else {
          // 标记为已到达终点
          this.reachedEnd = true;
        }
      }
    }
  }

  /**
   * 更新所有移动任务
   */
  private updateMoveTasks(deltaTime: number): void {
    // 从后向前迭代，以便在遍历过程中安全移除已完成的任务
    for (let i = this.moveTasks.length - 1; i >= 0; i--) {
      const isCompleted = this.moveTasks[i](deltaTime);
      if (isCompleted) {
        this.moveTasks.splice(i, 1);
      }
    }
  }
} 