import * as CANNON from 'cannon-es';
import { IPhysics } from '../core/IPhysics';
import { Collider } from './Collider';
import { CannonCollider } from './CannonCollider';
import { Node3d } from '../core/Node3d';
import { editable, editableComponent } from '../core/decorators';

/**
 * CANNON-ES物理引擎实现
 * 提供基于CANNON-ES的物理模拟功能
 */
@editableComponent({
  displayName: 'CANNON物理引擎',
  description: '基于CANNON-ES的物理引擎',
  icon: 'sports_soccer',
  category: 'Physics'
})
export class CannonPhysics implements IPhysics {
  /** CANNON物理世界 */
  private world: CANNON.World;
  
  /** 碰撞体映射 */
  private colliders: Map<Collider, CANNON.Body> = new Map();
  
  /** 是否启用物理模拟 */
  @editable({
    displayName: '启用物理',
    description: '是否启用物理模拟',
    type: 'boolean',
    group: 'Physics'
  })
  private enabled: boolean = true;
  
  /** 重力大小 */
  @editable({
    displayName: '重力',
    description: '重力加速度 (m/s²)',
    type: 'number',
    min: -20,
    max: 20,
    group: 'Physics'
  })
  private gravity: number = 9.82;
  
  /** 物理更新频率 */
  @editable({
    displayName: '更新频率',
    description: '物理模拟的更新频率 (Hz)',
    type: 'number',
    min: 30,
    max: 240,
    group: 'Physics'
  })
  private updateFrequency: number = 60;
  
  /** 上次更新时间 */
  private lastUpdateTime: number = 0;
  
  /**
   * 创建CANNON物理引擎
   * @param gravity 重力加速度，默认为9.82 m/s²
   */
  constructor(gravity: number = 9.82) {
    this.gravity = gravity;
    this.initWorld();
  }
  
  /**
   * 初始化物理世界
   */
  private initWorld(): void {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -this.gravity, 0) // 地球重力
    });
    
    // 配置默认的接触材质
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.3,
        restitution: 0.3
      }
    );
    this.world.defaultContactMaterial = defaultContactMaterial;
    
    // 配置求解器
    this.world.solver.iterations = 10;
    this.world.solver.tolerance = 0.001;
  }
  
  /**
   * 更新物理系统
   * @param deltaTime 时间增量（秒）
   */
  public update(deltaTime: number): void {
    if (!this.enabled) return;
    
    // 使用固定时间步长更新物理
    this.world.fixedStep(1 / this.updateFrequency);
    
    // 同步物理世界到场景
    this.syncBodiesToNodes();
  }
  
  /**
   * 将物理体的位置和旋转同步到对应的节点
   */
  private syncBodiesToNodes(): void {
    for (const [collider, body] of this.colliders.entries()) {
      const node = collider.getNode();
      console.log(body,'body')
      // // 同步位置
      node.position.set(
        body.position.x,
        body.position.y,
        body.position.z
      );
      
      // 同步旋转
      node.quaternion.set(
        body.quaternion.x,
        body.quaternion.y,
        body.quaternion.z,
        body.quaternion.w
      );
    }
  }
  
  /**
   * 添加碰撞体到物理系统
   * @param collider 要添加的碰撞体
   */
  public addCollider(collider: Collider): void {
    // 只处理Cannon碰撞体
    if (!(collider instanceof CannonCollider)) {
      console.warn('CannonPhysics只支持CannonCollider类型的碰撞体');
      return;
    }
    
    const cannonCollider = collider as CannonCollider;
    const body = cannonCollider.getBody();
    
    // 添加到世界
    this.world.addBody(body);
    this.colliders.set(collider, body);
  }
  
  /**
   * 从物理系统移除碰撞体
   * @param collider 要移除的碰撞体
   */
  public removeCollider(collider: Collider): void {
    const body = this.colliders.get(collider);
    if (body) {
      this.world.removeBody(body);
      this.colliders.delete(collider);
    }
  }
  
  /**
   * 检测两个碰撞体之间是否发生碰撞
   * @param a 第一个碰撞体
   * @param b 第二个碰撞体
   */
  public testCollision(a: Collider, b: Collider): boolean {
    const bodyA = this.colliders.get(a);
    const bodyB = this.colliders.get(b);
    
    if (!bodyA || !bodyB) return false;
    
    // 使用AABB碰撞检测
    const aBox = new CANNON.AABB();
    const bBox = new CANNON.AABB();
    
    bodyA.computeAABB(aBox);
    bodyB.computeAABB(bBox);
    
    return aBox.overlaps(bBox);
  }
  
  /**
   * 重置物理系统
   */
  public reset(): void {
    // 清除所有物理体
    this.colliders.forEach((body) => {
      this.world.removeBody(body);
    });
    this.colliders.clear();
    
    // 重新初始化世界
    this.initWorld();
  }
  
  /**
   * 销毁物理系统
   */
  public destroy(): void {
    this.reset();
    this.world = null;
  }
  
  /**
   * 设置重力
   * @param gravity 重力加速度 (m/s²)
   */
  public setGravity(gravity: number): void {
    this.gravity = gravity;
    if (this.world) {
      this.world.gravity.set(0, -gravity, 0);
    }
  }
  
  /**
   * 获取重力
   * @returns 重力加速度 (m/s²)
   */
  public getGravity(): number {
    return this.gravity;
  }
  
  /**
   * 设置是否启用物理
   * @param enabled 是否启用
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * 获取是否启用物理
   * @returns 是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * 获取CANNON物理世界
   * @returns CANNON世界实例
   */
  public getWorld(): CANNON.World {
    return this.world;
  }
} 