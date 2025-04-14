import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Node3d } from '../core/Node3d';
import { Collider } from './Collider';
import { editable } from '../core/decorators';

/**
 * CANNON碰撞体类型
 */
export enum CannonColliderType {
  BOX = 'box',
  SPHERE = 'sphere',
  PLANE = 'plane',
  CYLINDER = 'cylinder',
  CONVEX = 'convex',
  HEIGHTFIELD = 'heightfield',
  TRIMESH = 'trimesh'
}

/**
 * 基于CANNON-ES的碰撞体实现
 */
export class CannonCollider extends Collider {
  /** CANNON刚体 */
  protected body: CANNON.Body;
  
  /** 碰撞体类型 */
  protected type: CannonColliderType;
  
  /** 质量 */
  @editable({
    displayName: '质量',
    description: '物体的质量 (kg)，0表示静态物体',
    type: 'number',
    min: 0,
    max: 1000,
    group: 'Physics'
  })
  protected mass: number = 1;
  
  /** 是否是运动学物体 */
  @editable({
    displayName: '运动学',
    description: '是否为运动学物体，运动学物体可以移动但不受力的影响',
    type: 'boolean',
    group: 'Physics'
  })
  protected isKinematic: boolean = false;
  
  /** 线性阻尼 */
  @editable({
    displayName: '线性阻尼',
    description: '线性运动阻尼系数',
    type: 'number',
    min: 0,
    max: 1,
    group: 'Physics'
  })
  protected linearDamping: number = 0.01;
  
  /** 角阻尼 */
  @editable({
    displayName: '角阻尼',
    description: '角运动阻尼系数',
    type: 'number',
    min: 0,
    max: 1,
    group: 'Physics'
  })
  protected angularDamping: number = 0.01;
  
  /** 碰撞体构造函数 */
  constructor(node: Node3d, type: CannonColliderType = CannonColliderType.BOX) {
    super(node);
    this.type = type;
    this.initBody();
  }
  
  /**
   * 初始化物理刚体
   */
  protected initBody(): void {
    // 创建形状
    const shape = this.createShape();
    
    // 确定物体类型
    let bodyType = CANNON.Body.DYNAMIC;
    if (this.mass === 0) {
      bodyType = CANNON.Body.STATIC;
    } else if (this.isKinematic) {
      bodyType = CANNON.Body.KINEMATIC;
    }
    
    // 创建刚体
    this.body = new CANNON.Body({
      mass: this.mass,
      type: bodyType,
      shape: shape,
      material: new CANNON.Material({
        friction: this.friction,
        restitution: this.restitution
      }),
      linearDamping: this.linearDamping,
      angularDamping: this.angularDamping
    });
    
    // 设置碰撞过滤
    this.body.collisionFilterGroup = this.group;
    this.body.collisionFilterMask = this.mask;
    // 同步初始变换
    this.syncNodeToBody();
  }
  
  /**
   * 基于节点类型创建CANNON形状
   */
  protected createShape(): CANNON.Shape {
    const worldScale = new THREE.Vector3();
    const obj = this.node.getThreeObject();
    obj.getWorldScale(worldScale);
    
    switch (this.type) {
      case CannonColliderType.BOX:
        // 使用节点的包围盒创建盒体形状
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        return new CANNON.Box(new CANNON.Vec3(
          size.x * 0.5 * worldScale.x,
          size.y * 0.5 * worldScale.y,
          size.z * 0.5 * worldScale.z
        ));
        
      case CannonColliderType.SPHERE:
        // 通过包围球半径创建球体形状
        const sphere = new THREE.Sphere();
        const boundingSphere = new THREE.Box3().setFromObject(obj).getBoundingSphere(sphere);
        return new CANNON.Sphere(boundingSphere.radius * Math.max(worldScale.x, worldScale.y, worldScale.z));
        
      case CannonColliderType.PLANE:
        // 创建无限平面
        return new CANNON.Plane();
        
      case CannonColliderType.CYLINDER:
        // 通过包围盒创建圆柱体
        const cylinderBox = new THREE.Box3().setFromObject(obj);
        const cylinderSize = cylinderBox.getSize(new THREE.Vector3());
        const radiusTop = Math.max(cylinderSize.x, cylinderSize.z) * 0.5 * Math.max(worldScale.x, worldScale.z);
        const radiusBottom = radiusTop;
        const height = cylinderSize.y * worldScale.y;
        return new CANNON.Cylinder(radiusTop, radiusBottom, height, 16);
        
      case CannonColliderType.TRIMESH:
        // 从网格创建三角网格
        const geometry = this.extractGeometry(obj);
        if (geometry) {
          const vertices: number[] = [];
          const indices: number[] = [];
          
          // 获取顶点和索引
          if (geometry.index) {
            // 索引几何体
            for (let i = 0; i < geometry.index.count; i++) {
              indices.push(geometry.index.getX(i));
            }
          } else {
            // 非索引几何体
            for (let i = 0; i < geometry.attributes.position.count; i++) {
              indices.push(i);
            }
          }
          
          // 获取顶点
          const positions = geometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            vertices.push(
              positions.getX(i) * worldScale.x,
              positions.getY(i) * worldScale.y,
              positions.getZ(i) * worldScale.z
            );
          }
          
          return new CANNON.Trimesh(vertices, indices);
        }
        // 如果无法提取几何体，回退到盒体
        console.warn('无法提取网格几何体，使用盒体代替');
        return this.createShape();
        
      default:
        // 默认使用盒体
        console.warn(`不支持的碰撞体类型: ${this.type}，使用盒体代替`);
        this.type = CannonColliderType.BOX;
        return this.createShape();
    }
  }
  
  /**
   * 从Three.js对象提取几何体
   */
  private extractGeometry(object: THREE.Object3D): THREE.BufferGeometry | null {
    if (object instanceof THREE.Mesh) {
      return object.geometry;
    }
    
    // 递归查找第一个网格
    let geometry = null;
    object.traverse((child) => {
      if (!geometry && child instanceof THREE.Mesh) {
        geometry = child.geometry;
      }
    });
    
    return geometry;
  }
  
  /**
   * 将节点变换同步到物理体
   */
  private syncNodeToBody(): void {
    const obj = this.node.getThreeObject();
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    
    obj.getWorldPosition(worldPos);
    obj.getWorldQuaternion(worldQuat);
    
    // 设置位置
    this.body.position.set(worldPos.x, worldPos.y, worldPos.z);
    
    // 设置旋转
    this.body.quaternion.set(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w);
  }
  
  /**
   * 将物理体变换同步到节点
   */
  private syncBodyToNode(): void {
    const position = this.body.position;
    const quaternion = this.body.quaternion;
    
    this.node.position.set(position.x, position.y, position.z);
    this.node.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }
  
  /**
   * 获取CANNON刚体
   */
  public getBody(): CANNON.Body {
    return this.body;
  }
  
  /**
   * 设置质量
   * @param mass 质量，0表示静态物体
   */
  public setMass(mass: number): void {
    this.mass = mass;
    if (this.body) {
      this.body.mass = mass;
      this.body.updateMassProperties();
      
      // 更新物体类型
      if (mass === 0) {
        this.body.type = CANNON.Body.STATIC;
      } else if (this.isKinematic) {
        this.body.type = CANNON.Body.KINEMATIC;
      } else {
        this.body.type = CANNON.Body.DYNAMIC;
      }
    }
  }
  
  /**
   * 设置是否为运动学物体
   * @param isKinematic 是否为运动学物体
   */
  public setKinematic(isKinematic: boolean): void {
    this.isKinematic = isKinematic;
    if (this.body) {
      if (isKinematic && this.mass > 0) {
        this.body.type = CANNON.Body.KINEMATIC;
      } else if (this.mass === 0) {
        this.body.type = CANNON.Body.STATIC;
      } else {
        this.body.type = CANNON.Body.DYNAMIC;
      }
    }
  }
  
  /**
   * 设置线性阻尼
   * @param damping 阻尼系数
   */
  public setLinearDamping(damping: number): void {
    this.linearDamping = damping;
    if (this.body) {
      this.body.linearDamping = damping;
    }
  }
  
  /**
   * 设置角阻尼
   * @param damping 阻尼系数
   */
  public setAngularDamping(damping: number): void {
    this.angularDamping = damping;
    if (this.body) {
      this.body.angularDamping = damping;
    }
  }
  
  /**
   * 应用力
   * @param force 力向量
   * @param worldPoint 应用点（世界坐标）
   */
  public applyForce(force: THREE.Vector3, worldPoint?: THREE.Vector3): void {
    if (!this.body || this.body.type !== CANNON.Body.DYNAMIC) return;
    
    const cannonForce = new CANNON.Vec3(force.x, force.y, force.z);
    
    if (worldPoint) {
      const cannonPoint = new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z);
      this.body.applyForce(cannonForce, cannonPoint);
    } else {
      this.body.applyForce(cannonForce, this.body.position);
    }
  }
  
  /**
   * 应用冲量
   * @param impulse 冲量向量
   * @param worldPoint 应用点（世界坐标）
   */
  public applyImpulse(impulse: THREE.Vector3, worldPoint?: THREE.Vector3): void {
    if (!this.body || this.body.type !== CANNON.Body.DYNAMIC) return;
    
    const cannonImpulse = new CANNON.Vec3(impulse.x, impulse.y, impulse.z);
    
    if (worldPoint) {
      const cannonPoint = new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z);
      this.body.applyImpulse(cannonImpulse, cannonPoint);
    } else {
      this.body.applyImpulse(cannonImpulse, this.body.position);
    }
  }
  
  /**
   * 设置线性速度
   * @param velocity 速度向量
   */
  public setLinearVelocity(velocity: THREE.Vector3): void {
    if (!this.body) return;
    
    this.body.velocity.set(velocity.x, velocity.y, velocity.z);
  }
  
  /**
   * 设置角速度
   * @param velocity 角速度向量
   */
  public setAngularVelocity(velocity: THREE.Vector3): void {
    if (!this.body) return;
    
    this.body.angularVelocity.set(velocity.x, velocity.y, velocity.z);
  }
  
  /**
   * 睡眠刚体（暂停模拟）
   */
  public sleep(): void {
    if (this.body) {
      this.body.sleep();
    }
  }
  
  /**
   * 唤醒刚体
   */
  public wakeUp(): void {
    if (this.body) {
      this.body.wakeUp();
    }
  }
  
  /**
   * 更新碰撞体
   * 同步节点的转换到碰撞体
   */
  public update(): void {
    if (!this.enabled || !this.body) return;
    
    // 对于运动学物体和静态物体，从节点同步到物理体
    if (this.body.type === CANNON.Body.KINEMATIC || this.body.type === CANNON.Body.STATIC) {
      this.syncNodeToBody();
    }
  }
  
  /**
   * 释放资源
   */
  public dispose(): void {
    // 清理此碰撞体特有的资源
    this.body = null;
  }
} 