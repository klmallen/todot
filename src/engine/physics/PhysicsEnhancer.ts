import * as THREE from 'three';
import { Node3d } from '../core/Node3d';
import { CannonCollider, CannonColliderType } from './CannonCollider';
import { Collider } from './Collider';
import Engine from '../core/Engine';

/**
 * 物理配置接口
 */
export interface PhysicsOptions {
  /** 碰撞体类型 */
  colliderType?: CannonColliderType;
  /** 质量 (kg) */
  mass?: number;
  /** 是否为运动学物体 */
  isKinematic?: boolean;
  /** 摩擦系数 */
  friction?: number;
  /** 恢复系数 */
  restitution?: number;
  /** 线性阻尼 */
  linearDamping?: number;
  /** 角阻尼 */
  angularDamping?: number;
  /** 碰撞组 */
  collisionGroup?: number;
  /** 碰撞掩码 */
  collisionMask?: number;
  /** 是否显示碰撞体 */
  showCollider?: boolean;
}

/**
 * 物理节点接口
 * 定义了带有物理能力的节点应该提供的方法
 */
export interface IPhysicsCapable {
  /** 获取关联的碰撞体 */
  getCollider(): Collider | null;

  /** 设置碰撞体类型 */
  setColliderType(type: CannonColliderType): void;

  /** 获取碰撞体类型 */
  getColliderType(): CannonColliderType;

  /** 设置质量 */
  setMass(mass: number): void;

  /** 获取质量 */
  getMass(): number;

  /** 设置是否为运动学物体 */
  setKinematic(isKinematic: boolean): void;

  /** 获取是否为运动学物体 */
  isKinematic(): boolean;

  /** 设置摩擦系数 */
  setFriction(friction: number): void;

  /** 获取摩擦系数 */
  getFriction(): number;

  /** 设置恢复系数 */
  setRestitution(restitution: number): void;

  /** 获取恢复系数 */
  getRestitution(): number;

  /** 设置线性阻尼 */
  setLinearDamping(damping: number): void;

  /** 获取线性阻尼 */
  getLinearDamping(): number;

  /** 设置角阻尼 */
  setAngularDamping(damping: number): void;

  /** 获取角阻尼 */
  getAngularDamping(): number;

  /** 设置碰撞组 */
  setCollisionGroup(group: number): void;

  /** 获取碰撞组 */
  getCollisionGroup(): number;

  /** 设置碰撞掩码 */
  setCollisionMask(mask: number): void;

  /** 获取碰撞掩码 */
  getCollisionMask(): number;

  /** 应用力 */
  applyForce(force: THREE.Vector3, worldPoint?: THREE.Vector3): void;

  /** 应用冲量 */
  applyImpulse(impulse: THREE.Vector3, worldPoint?: THREE.Vector3): void;

  /** 应用扭矩 */
  applyTorque(torque: THREE.Vector3): void;

  /** 设置线性速度 */
  setLinearVelocity(velocity: THREE.Vector3): void;

  /** 设置角速度 */
  setAngularVelocity(velocity: THREE.Vector3): void;

  /** 设置物体进入休眠状态 */
  sleep(): void;

  /** 唤醒物体 */
  wakeUp(): void;

  /** 获取是否启用物理 */
  isPhysicsEnabled(): boolean;

  /** 设置是否启用物理 */
  enablePhysics(enabled: boolean): void;

  /** 显示或隐藏碰撞体可视化 */
  showColliderVisual(show: boolean): void;

  /** 清理物理资源 */
  cleanupPhysics(): void;
}

/**
 * 物理增强器
 * 用于为现有节点添加物理能力
 */
export class PhysicsEnhancer {
  /**
   * 为节点添加物理能力
   * @param node 要增强的节点
   * @param options 物理配置选项
   * @returns 增强后的节点
   */
  public static enhance<T extends Node3d>(node: T, options: PhysicsOptions = {}): T & IPhysicsCapable {
    // 确保节点没有被增强过
    if ((node as any)._physicsEnhanced) {
      console.warn(`节点 ${node.getName()} 已经具有物理能力`);
      return node as T & IPhysicsCapable;
    }

    // 物理属性
    const physicsProps = {
      _physicsEnhanced: true,
      _collider: null as Collider | null,
      _colliderType: options.colliderType || CannonColliderType.BOX,
      _mass: options.mass !== undefined ? options.mass : 1,
      _isKinematic: options.isKinematic || false,
      _friction: options.friction !== undefined ? options.friction : 0.3,
      _restitution: options.restitution !== undefined ? options.restitution : 0.3,
      _linearDamping: options.linearDamping !== undefined ? options.linearDamping : 0.01,
      _angularDamping: options.angularDamping !== undefined ? options.angularDamping : 0.01,
      _collisionGroup: options.collisionGroup || 1,
      _collisionMask: options.collisionMask !== undefined ? options.collisionMask : -1,
      _physicsEnabled: true,
      _showCollider: options.showCollider || false,
      _colliderVisual: null as THREE.Object3D | null,
    };

    // 物理方法
    const physicsMethods = {
      /**
       * 获取关联的碰撞体
       */
      getCollider(): Collider | null {
        return this._collider;
      },

      /**
       * 设置碰撞体类型
       */
      setColliderType(type: CannonColliderType): void {
        this._colliderType = type;
        this.recreateCollider();
      },

      /**
       * 获取碰撞体类型
       */
      getColliderType(): CannonColliderType {
        return this._colliderType;
      },

      /**
       * 设置质量
       */
      setMass(mass: number): void {
        this._mass = mass;
        if (this._collider) {
          (this._collider as CannonCollider).setMass(mass);
        }
      },

      /**
       * 获取质量
       */
      getMass(): number {
        return this._mass;
      },

      /**
       * 设置是否为运动学物体
       */
      setKinematic(isKinematic: boolean): void {
        this._isKinematic = isKinematic;
        if (this._collider) {
          (this._collider as CannonCollider).setKinematic(isKinematic);
        }
      },

      /**
       * 获取是否为运动学物体
       */
      isKinematic(): boolean {
        return this._isKinematic;
      },

      /**
       * 设置摩擦系数
       */
      setFriction(friction: number): void {
        this._friction = friction;
        if (this._collider) {
          this._collider.setFriction(friction);
        }
      },

      /**
       * 获取摩擦系数
       */
      getFriction(): number {
        return this._friction;
      },

      /**
       * 设置恢复系数
       */
      setRestitution(restitution: number): void {
        this._restitution = restitution;
        if (this._collider) {
          this._collider.setRestitution(restitution);
        }
      },

      /**
       * 获取恢复系数
       */
      getRestitution(): number {
        return this._restitution;
      },

      /**
       * 设置线性阻尼
       */
      setLinearDamping(damping: number): void {
        this._linearDamping = damping;
        if (this._collider) {
          (this._collider as CannonCollider).setLinearDamping(damping);
        }
      },

      /**
       * 获取线性阻尼
       */
      getLinearDamping(): number {
        return this._linearDamping;
      },

      /**
       * 设置角阻尼
       */
      setAngularDamping(damping: number): void {
        this._angularDamping = damping;
        if (this._collider) {
          (this._collider as CannonCollider).setAngularDamping(damping);
        }
      },

      /**
       * 获取角阻尼
       */
      getAngularDamping(): number {
        return this._angularDamping;
      },

      /**
       * 设置碰撞组
       */
      setCollisionGroup(group: number): void {
        this._collisionGroup = group;
        if (this._collider) {
          this._collider.setGroup(group);
        }
      },

      /**
       * 获取碰撞组
       */
      getCollisionGroup(): number {
        return this._collisionGroup;
      },

      /**
       * 设置碰撞掩码
       */
      setCollisionMask(mask: number): void {
        this._collisionMask = mask;
        if (this._collider) {
          this._collider.setMask(mask);
        }
      },

      /**
       * 获取碰撞掩码
       */
      getCollisionMask(): number {
        return this._collisionMask;
      },

      /**
       * 应用力
       */
      applyForce(force: THREE.Vector3, worldPoint?: THREE.Vector3): void {
        if (this._collider && this._physicsEnabled) {
          (this._collider as CannonCollider).applyForce(force, worldPoint);
        }
      },

      /**
       * 应用冲量
       */
      applyImpulse(impulse: THREE.Vector3, worldPoint?: THREE.Vector3): void {
        if (this._collider && this._physicsEnabled) {
          (this._collider as CannonCollider).applyImpulse(impulse, worldPoint);
        }
      },

      /**
       * 应用扭矩
       */
      applyTorque(torque: THREE.Vector3): void {
        if (this._collider && this._physicsEnabled) {
          const body = (this._collider as CannonCollider).getBody();
          body.torque.set(torque.x, torque.y, torque.z);
        }
      },

      /**
       * 设置线性速度
       */
      setLinearVelocity(velocity: THREE.Vector3): void {
        if (this._collider && this._physicsEnabled) {
          (this._collider as CannonCollider).setLinearVelocity(velocity);
        }
      },

      /**
       * 设置角速度
       */
      setAngularVelocity(velocity: THREE.Vector3): void {
        if (this._collider && this._physicsEnabled) {
          (this._collider as CannonCollider).setAngularVelocity(velocity);
        }
      },

      /**
       * 设置物体进入休眠状态
       */
      sleep(): void {
        if (this._collider && this._physicsEnabled) {
          (this._collider as CannonCollider).sleep();
        }
      },

      /**
       * 唤醒物体
       */
      wakeUp(): void {
        if (this._collider && this._physicsEnabled) {
          (this._collider as CannonCollider).wakeUp();
        }
      },

      /**
       * 获取是否启用物理
       */
      isPhysicsEnabled(): boolean {
        return this._physicsEnabled;
      },

      /**
       * 设置是否启用物理
       */
      enablePhysics(enabled: boolean): void {
        this._physicsEnabled = enabled;
        if (this._collider) {
          this._collider.setEnabled(enabled);
        }
      },

      /**
       * 初始化物理系统
       */
      initPhysics(): void {
        // 如果已经有碰撞体，先清理
        this.cleanupPhysics();

        // 创建碰撞体
        this._collider = new CannonCollider(this as any as Node3d, this._colliderType);

        // 设置碰撞体属性
        this._collider.setEnabled(this._physicsEnabled);
        (this._collider as CannonCollider).setMass(this._mass);
        (this._collider as CannonCollider).setKinematic(this._isKinematic);
        this._collider.setFriction(this._friction);
        this._collider.setRestitution(this._restitution);
        (this._collider as CannonCollider).setLinearDamping(this._linearDamping);
        (this._collider as CannonCollider).setAngularDamping(this._angularDamping);
        this._collider.setGroup(this._collisionGroup);
        this._collider.setMask(this._collisionMask);

        // 将碰撞体添加到物理引擎
        const engine = Engine.getInstance();
        if (engine && engine.getPhysics()) {
          engine.getPhysics().addCollider(this._collider);
        }

        // 如果需要显示碰撞体可视化
        if (this._showCollider) {
          this.createColliderVisual();
        }
      },

      /**
       * 重新创建碰撞体
       */
      recreateCollider(): void {
        // 清理旧的碰撞体
        this.cleanupPhysics();

        // 重新初始化
        this.initPhysics();
      },

      /**
       * 创建碰撞体可视化
       */
      createColliderVisual(): void {
        if (!this._collider) return;

        // 清理旧的可视化
        if (this._colliderVisual) {
          this.getThreeObject().remove(this._colliderVisual);
          this._colliderVisual = null;
        }

        // 创建可视化网格
        const material = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          wireframe: true,
          transparent: true,
          opacity: 0.3
        });

        let geometry: THREE.BufferGeometry;
        let visualMesh: THREE.Mesh | null = null;

        // 获取物理体
        const body = (this._collider as CannonCollider).getBody();
        if (!body || !body.shapes || body.shapes.length === 0) {
          console.warn('无法创建碰撞体可视化：物理体不存在或没有形状');
          return;
        }

        // 根据碰撞体类型创建可视化几何体
        switch (this._colliderType) {
          case CannonColliderType.BOX:
            // 直接使用物理形状的尺寸
            if (body.shapes[0].type === CANNON.Shape.types.BOX) {
              const boxShape = body.shapes[0] as CANNON.Box;
              geometry = new THREE.BoxGeometry(
                boxShape.halfExtents.x * 2,
                boxShape.halfExtents.y * 2,
                boxShape.halfExtents.z * 2
              );
              visualMesh = new THREE.Mesh(geometry, material);
            } else {
              // 回退到使用包围盒
              const box = new THREE.Box3().setFromObject(this.getThreeObject());
              const size = box.getSize(new THREE.Vector3());
              geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
              visualMesh = new THREE.Mesh(geometry, material);
            }
            break;

          case CannonColliderType.SPHERE:
            // 直接使用物理形状的半径
            if (body.shapes[0].type === CANNON.Shape.types.SPHERE) {
              const sphereShape = body.shapes[0] as CANNON.Sphere;
              geometry = new THREE.SphereGeometry(sphereShape.radius, 16, 16);
              visualMesh = new THREE.Mesh(geometry, material);
            } else {
              // 回退到使用包围球
              const sphere = new THREE.Sphere();
              const boundingSphere = new THREE.Box3().setFromObject(this.getThreeObject()).getBoundingSphere(sphere);
              geometry = new THREE.SphereGeometry(boundingSphere.radius, 16, 16);
              visualMesh = new THREE.Mesh(geometry, material);
            }
            break;

          case CannonColliderType.CYLINDER:
            // 直接使用物理形状的尺寸
            if (body.shapes[0].type === CANNON.Shape.types.CYLINDER) {
              const cylinderShape = body.shapes[0] as CANNON.Cylinder;
              geometry = new THREE.CylinderGeometry(
                cylinderShape.radiusTop,
                cylinderShape.radiusBottom,
                cylinderShape.height,
                16
              );
              visualMesh = new THREE.Mesh(geometry, material);
              // 旋转以匹配 CANNON.js 的坐标系
              visualMesh.rotation.x = Math.PI / 2;
            } else {
              // 回退到使用包围盒
              const cylinderBox = new THREE.Box3().setFromObject(this.getThreeObject());
              const cylinderSize = cylinderBox.getSize(new THREE.Vector3());
              const radius = Math.max(cylinderSize.x, cylinderSize.z) * 0.5;
              geometry = new THREE.CylinderGeometry(radius, radius, cylinderSize.y, 16);
              visualMesh = new THREE.Mesh(geometry, material);
            }
            break;

          case CannonColliderType.PLANE:
            // 直接使用物理形状
            if (body.shapes[0].type === CANNON.Shape.types.PLANE) {
              // 平面可视化
              geometry = new THREE.PlaneGeometry(20, 20);
              visualMesh = new THREE.Mesh(geometry, material);
            } else {
              // 回退到使用平面
              geometry = new THREE.PlaneGeometry(10, 10);
              visualMesh = new THREE.Mesh(geometry, material);
            }
            break;

          default:
            // 默认使用盒体可视化
            const defaultBox = new THREE.Box3().setFromObject(this.getThreeObject());
            const defaultSize = defaultBox.getSize(new THREE.Vector3());
            geometry = new THREE.BoxGeometry(defaultSize.x, defaultSize.y, defaultSize.z);
            visualMesh = new THREE.Mesh(geometry, material);
        }

        // 创建可视化网格
        if (!visualMesh && geometry) {
          visualMesh = new THREE.Mesh(geometry, material);
        }

        if (visualMesh) {
          this._colliderVisual = visualMesh;
          this._colliderVisual.name = '碰撞体可视化';

          // 使可视化网格不参与射线检测
          this._colliderVisual.raycast = () => {};

          // 添加到节点
          this.getThreeObject().add(this._colliderVisual);
        } else {
          console.warn('无法创建碰撞体可视化网格');
        }
      },

      /**
       * 显示或隐藏碰撞体可视化
       */
      showColliderVisual(show: boolean): void {
        this._showCollider = show;

        if (show) {
          if (!this._colliderVisual) {
            this.createColliderVisual();
          } else if (this._colliderVisual) {
            this._colliderVisual.visible = true;
          }
        } else if (this._colliderVisual) {
          this._colliderVisual.visible = false;
        }
      },

      /**
       * 清理物理资源
       */
      cleanupPhysics(): void {
        // 从物理引擎移除碰撞体
        if (this._collider) {
          const engine = Engine.getInstance();
          if (engine && engine.getPhysics()) {
            engine.getPhysics().removeCollider(this._collider);
          }

          // 清理碰撞体
          this._collider = null;
        }

        // 清理可视化
        if (this._colliderVisual) {
          this.getThreeObject().remove(this._colliderVisual);
          this._colliderVisual = null;
        }
      }
    };

    // 保存原始的方法
    const originalUpdate = node.update;
    const originalDestroy = node.destroy;
    const originalOnEnterScene = node.onEnterScene || (() => {});
    const originalOnExitScene = node.onExitScene || (() => {});

    // 替换方法
    Object.assign(node, {
      /**
       * 重写更新方法
       */
      update(deltaTime: number): void {
        // 调用原始更新方法
        originalUpdate.call(node, deltaTime);

        // 更新碰撞体（仅发送节点变换到物理体，不需要在这里从物理体同步回节点，因为物理引擎会处理）
        // 物理系统已经在CannonPhysics.syncBodiesToNodes()中将位置同步回节点
        if (this._collider && this._physicsEnabled) {
          this._collider.update();

          // 更新碰撞体可视化的位置
          if (this._colliderVisual) {
            this._colliderVisual.position.set(0, 0, 0);
            this._colliderVisual.quaternion.set(0, 0, 0, 1);
          }
        }
      },

      /**
       * 重写销毁方法
       */
      destroy(): void {
        // 清理物理资源
        this.cleanupPhysics();

        // 调用原始销毁方法
        originalDestroy.call(node);
      },

      /**
       * 重写进入场景方法
       */
      onEnterScene(): void {
        // 调用原始方法
        originalOnEnterScene.call(node);

        // 初始化物理
        this.initPhysics();
      },

      /**
       * 重写离开场景方法
       */
      onExitScene(): void {
        // 清理物理
        this.cleanupPhysics();

        // 调用原始方法
        originalOnExitScene.call(node);
      }
    });

    // 混入物理属性和方法
    Object.assign(node, physicsProps, physicsMethods);

    return node as T & IPhysicsCapable;
  }
}