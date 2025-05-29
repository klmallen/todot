import * as THREE from 'three';
import { Node3d } from '../core/Node3d';
import { CannonCollider, CannonColliderType } from './CannonCollider';
import { editable, editableComponent } from '../core/decorators';
import Engine from '../core/Engine';

/**
 * 碰撞体可视化选项
 */
export interface ColliderVisualOptions {
  visible: boolean;       // 是否可见
  color: number;          // 颜色
  opacity: number;        // 透明度
  wireframe: boolean;     // 是否显示为线框
}

/**
 * 物理节点
 * 具有物理模拟能力的3D节点
 */
@editableComponent({
  displayName: '物理节点',
  description: '具有物理模拟能力的3D节点',
  icon: 'smart_toy',
  category: 'Physics'
})
export class PhysicsNode extends Node3d {
  /** 碰撞体 */
  private collider: CannonCollider;
  
  /** 是否启用物理 */
  @editable({
    displayName: '启用物理',
    description: '是否启用物理模拟',
    type: 'boolean',
    group: 'Physics'
  })
  private physicsEnabled: boolean = true;
  
  /** 碰撞体类型 */
  @editable({
    displayName: '碰撞体类型',
    description: '物理碰撞体的形状类型',
    type: 'enum',
    options: [
      { label: '盒体', value: CannonColliderType.BOX },
      { label: '球体', value: CannonColliderType.SPHERE },
      { label: '平面', value: CannonColliderType.PLANE },
      { label: '圆柱体', value: CannonColliderType.CYLINDER },
      { label: '三角网格', value: CannonColliderType.TRIMESH }
    ],
    group: 'Physics'
  })
  private colliderType: CannonColliderType = CannonColliderType.BOX;
  
  /** 质量 */
  @editable({
    displayName: '质量',
    description: '物体的质量 (kg)，0表示静态物体',
    type: 'number',
    min: 0,
    max: 1000,
    group: 'Physics'
  })
  private mass: number = 1;
  
  /** 是否是运动学物体 */
  @editable({
    displayName: '运动学',
    description: '是否为运动学物体，运动学物体可以移动但不受力的影响',
    type: 'boolean',
    group: 'Physics'
  })
  private isKinematic: boolean = false;
  
  /** 摩擦系数 */
  @editable({
    displayName: '摩擦系数',
    description: '物体表面的摩擦系数',
    type: 'number',
    min: 0,
    max: 1,
    group: 'Physics'
  })
  private friction: number = 0.3;
  
  /** 恢复系数 */
  @editable({
    displayName: '恢复系数',
    description: '物体的弹性系数',
    type: 'number',
    min: 0,
    max: 1,
    group: 'Physics'
  })
  private restitution: number = 0.3;
  
  /** 线性阻尼 */
  @editable({
    displayName: '线性阻尼',
    description: '线性运动阻尼系数',
    type: 'number',
    min: 0,
    max: 1,
    group: 'Physics'
  })
  private linearDamping: number = 0.01;
  
  /** 角阻尼 */
  @editable({
    displayName: '角阻尼',
    description: '角运动阻尼系数',
    type: 'number',
    min: 0,
    max: 1,
    group: 'Physics'
  })
  private angularDamping: number = 0.01;
  
  /** 碰撞组 */
  @editable({
    displayName: '碰撞组',
    description: '碰撞过滤组',
    type: 'number',
    min: 1,
    max: 16,
    group: 'Physics'
  })
  private collisionGroup: number = 1;
  
  /** 碰撞掩码 */
  @editable({
    displayName: '碰撞掩码',
    description: '碰撞过滤掩码，-1表示与所有组碰撞',
    type: 'number',
    min: -1,
    max: 65535,
    group: 'Physics'
  })
  private collisionMask: number = -1;
  
  /** 是否显示碰撞体 */
  @editable({
    displayName: '显示碰撞体',
    description: '是否显示碰撞体的可视化表示',
    type: 'boolean',
    group: '可视化'
  })
  private showCollider: boolean = false;
  
  /** 碰撞体颜色 */
  @editable({
    displayName: '碰撞体颜色',
    description: '碰撞体可视化的颜色',
    type: 'color',
    group: '可视化'
  })
  private colliderColor: number = 0x00ff00;
  
  /** 碰撞体透明度 */
  @editable({
    displayName: '碰撞体透明度',
    description: '碰撞体可视化的透明度 (0-1)',
    type: 'slider',
    min: 0,
    max: 1,
    step: 0.1,
    group: '可视化'
  })
  private colliderOpacity: number = 0.3;
  
  /** 碰撞体线框模式 */
  @editable({
    displayName: '线框模式',
    description: '是否将碰撞体显示为线框',
    type: 'boolean',
    group: '可视化'
  })
  private colliderWireframe: boolean = true;
  
  /** 碰撞体可视化对象 */
  private colliderVisual: THREE.Object3D | null = null;
  
  /**
   * 创建物理节点
   * @param name 节点名称
   */
  constructor(name: string = '物理节点') {
    super(name);
  }
  
  /**
   * 节点准备完成时调用
   */
  onReady(): void {
    // 创建碰撞体
    this.initCollider();
    
    // 如果需要，创建碰撞体可视化
    if (this.showCollider) {
      this.createColliderVisual();
    }
  }
  
  /**
   * 节点进入场景时调用
   */
  onEnterScene(): void {
    // 初始化物理
    this.initPhysics();
  }
  
  /**
   * 节点离开场景时调用
   */
  onExitScene(): void {
    // 清理物理
    this.cleanupPhysics();
  }
  
  /**
   * 初始化碰撞体
   */
  private initCollider(): void {
    // 创建碰撞体
    this.collider = new CannonCollider(this, this.colliderType);
    
    // 设置碰撞体属性
    this.collider.setMass(this.mass);
    this.collider.setKinematic(this.isKinematic);
    this.collider.setFriction(this.friction);
    this.collider.setRestitution(this.restitution);
    this.collider.setLinearDamping(this.linearDamping);
    this.collider.setAngularDamping(this.angularDamping);
    this.collider.setGroup(this.collisionGroup);
    this.collider.setMask(this.collisionMask);
  }
  
  /**
   * 初始化物理
   */
  private initPhysics(): void {
    // 获取物理引擎实例
    const engine = Engine.getInstance();
    const physics = engine?.physics;
    
    // 如果有物理引擎并且启用了物理，添加碰撞体
    if (physics && this.physicsEnabled && this.collider) {
      physics.addCollider(this.collider);
    }
  }
  
  /**
   * 清理物理
   */
  private cleanupPhysics(): void {
    // 获取物理引擎实例
    const engine = Engine.getInstance();
    const physics = engine?.physics;
    
    // 如果有物理引擎并且有碰撞体，移除碰撞体
    if (physics && this.collider) {
      physics.removeCollider(this.collider);
    }
    
    // 移除碰撞体可视化
    this.removeColliderVisual();
  }
  
  /**
   * 设置碰撞体可视化选项
   * @param options 可视化选项
   */
  @editable({
    displayName: '设置碰撞体可视化',
    description: '配置碰撞体可视化选项',
    type: 'function',
    group: '可视化'
  })
  public setColliderVisualOptions(options: Partial<ColliderVisualOptions>): void {
    let needsUpdate = false;
    
    if (options.visible !== undefined && options.visible !== this.showCollider) {
      this.showCollider = options.visible;
      needsUpdate = true;
    }
    
    if (options.color !== undefined && options.color !== this.colliderColor) {
      this.colliderColor = options.color;
      needsUpdate = true;
    }
    
    if (options.opacity !== undefined && options.opacity !== this.colliderOpacity) {
      this.colliderOpacity = options.opacity;
      needsUpdate = true;
    }
    
    if (options.wireframe !== undefined && options.wireframe !== this.colliderWireframe) {
      this.colliderWireframe = options.wireframe;
      needsUpdate = true;
    }
    
    // 如果有修改，更新碰撞体可视化
    if (needsUpdate) {
      if (this.showCollider) {
        this.createColliderVisual();
      } else {
        this.removeColliderVisual();
      }
    }
  }
  
  /**
   * 获取碰撞体可视化选项
   * @returns 当前的可视化选项
   */
  @editable({
    displayName: '获取碰撞体可视化',
    description: '获取当前碰撞体可视化选项',
    type: 'function',
    group: '可视化'
  })
  public getColliderVisualOptions(): ColliderVisualOptions {
    return {
      visible: this.showCollider,
      color: this.colliderColor,
      opacity: this.colliderOpacity,
      wireframe: this.colliderWireframe
    };
  }
  
  /**
   * 创建碰撞体可视化
   */
  private createColliderVisual(): void {
    // 如果已有可视化，先移除
    this.removeColliderVisual();
    
    if (!this.collider) return;
    
    let visualMesh: THREE.Mesh | null = null;
    
    // 创建材质
    const material = new THREE.MeshBasicMaterial({ 
      color: this.colliderColor, 
      wireframe: this.colliderWireframe,
      transparent: this.colliderOpacity < 1,
      opacity: this.colliderOpacity,
      side: THREE.DoubleSide
    });
    
    // 基于碰撞体类型创建可视化
    switch (this.colliderType) {
      case CannonColliderType.BOX:
        // 创建盒体可视化
        const boxBody = this.collider.getBody();
        if (boxBody.shapes[0].type === CANNON.Shape.types.BOX) {
          const boxShape = boxBody.shapes[0] as CANNON.Box;
          const geometry = new THREE.BoxGeometry(
            boxShape.halfExtents.x * 2,
            boxShape.halfExtents.y * 2,
            boxShape.halfExtents.z * 2
          );
          visualMesh = new THREE.Mesh(geometry, material);
        }
        break;
        
      case CannonColliderType.SPHERE:
        // 创建球体可视化
        const sphereBody = this.collider.getBody();
        if (sphereBody.shapes[0].type === CANNON.Shape.types.SPHERE) {
          const sphereShape = sphereBody.shapes[0] as CANNON.Sphere;
          const geometry = new THREE.SphereGeometry(sphereShape.radius, 16, 16);
          visualMesh = new THREE.Mesh(geometry, material);
        }
        break;
        
      case CannonColliderType.CYLINDER:
        // 创建圆柱体可视化
        const cylinderBody = this.collider.getBody();
        if (cylinderBody.shapes[0].type === CANNON.Shape.types.CYLINDER) {
          const cylinderShape = cylinderBody.shapes[0] as CANNON.Cylinder;
          const geometry = new THREE.CylinderGeometry(
            cylinderShape.radiusTop,
            cylinderShape.radiusBottom,
            cylinderShape.height,
            16
          );
          visualMesh = new THREE.Mesh(geometry, material);
          
          // 旋转以匹配CANNON的圆柱体方向
          visualMesh.rotation.x = Math.PI / 2;
        }
        break;
        
      case CannonColliderType.PLANE:
        // 创建平面可视化
        const planeGeometry = new THREE.PlaneGeometry(10, 10);
        visualMesh = new THREE.Mesh(planeGeometry, material);
        break;
        
      case CannonColliderType.TRIMESH:
        // 对于三角网格，使用边界盒可视化
        const body = this.collider.getBody();
        const aabb = new CANNON.AABB();
        body.computeAABB(aabb);
        
        const size = new THREE.Vector3(
          aabb.upperBound.x - aabb.lowerBound.x,
          aabb.upperBound.y - aabb.lowerBound.y,
          aabb.upperBound.z - aabb.lowerBound.z
        );
        
        const center = new THREE.Vector3(
          (aabb.upperBound.x + aabb.lowerBound.x) / 2,
          (aabb.upperBound.y + aabb.lowerBound.y) / 2,
          (aabb.upperBound.z + aabb.lowerBound.z) / 2
        );
        
        const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        visualMesh = new THREE.Mesh(boxGeometry, material);
        
        visualMesh.position.copy(center);
        break;
    }
    
    if (visualMesh) {
      this.colliderVisual = visualMesh;
      this.add(visualMesh);
    }
  }
  
  /**
   * 移除碰撞体可视化
   */
  private removeColliderVisual(): void {
    if (this.colliderVisual) {
      this.remove(this.colliderVisual);
      if (this.colliderVisual instanceof THREE.Mesh) {
        this.colliderVisual.geometry.dispose();
        if (this.colliderVisual.material instanceof THREE.Material) {
          this.colliderVisual.material.dispose();
        } else if (Array.isArray(this.colliderVisual.material)) {
          this.colliderVisual.material.forEach(m => m.dispose());
        }
      }
      this.colliderVisual = null;
    }
  }
  
  /**
   * 更新节点
   * @param deltaTime 时间间隔
   */
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // 更新碰撞体
    if (this.physicsEnabled && this.collider) {
      this.collider.update();
      
      // 更新碰撞体可视化位置
      if (this.showCollider && this.colliderVisual) {
        // 对于某些特殊碰撞体，需要额外处理
        if (this.colliderType !== CannonColliderType.TRIMESH) {
          this.colliderVisual.position.set(0, 0, 0);
          this.colliderVisual.quaternion.set(0, 0, 0, 1);
        }
      }
    }
  }
  
  /**
   * 设置碰撞体类型
   * @param type 碰撞体类型
   */
  public setColliderType(type: CannonColliderType): void {
    this.colliderType = type;
    
    // 重新初始化碰撞体
    this.cleanupPhysics();
    this.initCollider();
    this.initPhysics();
    
    // 更新可视化
    if (this.showCollider) {
      this.createColliderVisual();
    }
  }
  
  /**
   * 设置是否启用物理
   * @param enabled 是否启用
   */
  public setPhysicsEnabled(enabled: boolean): void {
    if (this.physicsEnabled === enabled) return;
    
    this.physicsEnabled = enabled;
    
    if (enabled) {
      // 启用物理
      this.initCollider();
      this.initPhysics();
      
      // 如果需要，创建碰撞体可视化
      if (this.showCollider) {
        this.createColliderVisual();
      }
    } else {
      // 禁用物理
      this.cleanupPhysics();
    }
  }
  
  /**
   * 设置质量
   * @param mass 质量
   */
  public setMass(mass: number): void {
    this.mass = mass;
    if (this.collider) {
      this.collider.setMass(mass);
    }
  }
  
  /**
   * 设置是否为运动学物体
   * @param isKinematic 是否为运动学物体
   */
  public setKinematic(isKinematic: boolean): void {
    this.isKinematic = isKinematic;
    if (this.collider) {
      this.collider.setKinematic(isKinematic);
    }
  }
  
  /**
   * 设置摩擦系数
   * @param friction 摩擦系数
   */
  public setFriction(friction: number): void {
    this.friction = friction;
    if (this.collider) {
      this.collider.setFriction(friction);
    }
  }
  
  /**
   * 设置恢复系数
   * @param restitution 恢复系数
   */
  public setRestitution(restitution: number): void {
    this.restitution = restitution;
    if (this.collider) {
      this.collider.setRestitution(restitution);
    }
  }
  
  /**
   * 获取碰撞体
   * @returns 碰撞体
   */
  public getCollider(): CannonCollider | null {
    return this.collider;
  }
  
  /**
   * 应用力
   * @param force 力向量
   * @param worldPoint 应用点（世界坐标）
   */
  public applyForce(force: THREE.Vector3, worldPoint?: THREE.Vector3): void {
    if (this.collider) {
      this.collider.applyForce(force, worldPoint);
    }
  }
  
  /**
   * 应用冲量
   * @param impulse 冲量向量
   * @param worldPoint 应用点（世界坐标）
   */
  public applyImpulse(impulse: THREE.Vector3, worldPoint?: THREE.Vector3): void {
    if (this.collider) {
      this.collider.applyImpulse(impulse, worldPoint);
    }
  }
  
  /**
   * 设置线性速度
   * @param velocity 速度向量
   */
  public setLinearVelocity(velocity: THREE.Vector3): void {
    if (this.collider) {
      this.collider.setLinearVelocity(velocity);
    }
  }
  
  /**
   * 设置角速度
   * @param velocity 角速度向量
   */
  public setAngularVelocity(velocity: THREE.Vector3): void {
    if (this.collider) {
      this.collider.setAngularVelocity(velocity);
    }
  }
  
  /**
   * 销毁节点
   */
  destroy(): void {
    // 清理物理
    this.cleanupPhysics();
    
    // 清理碰撞体可视化
    this.removeColliderVisual();
    
    // 调用父类销毁方法
    super.destroy();
  }
} 