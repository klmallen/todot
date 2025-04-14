import { Collider } from '../physics/Collider';

/**
 * 物理系统接口
 * 定义了引擎物理系统需要实现的基本功能
 */
export interface IPhysics {
  /**
   * 更新物理系统
   * @param deltaTime 时间增量（秒）
   */
  update(deltaTime: number): void;
  
  /**
   * 添加碰撞体到物理系统
   * @param collider 要添加的碰撞体
   */
  addCollider(collider: Collider): void;
  
  /**
   * 从物理系统移除碰撞体
   * @param collider 要移除的碰撞体
   */
  removeCollider(collider: Collider): void;
  
  /**
   * 检测两个碰撞体之间是否发生碰撞
   * @param a 第一个碰撞体
   * @param b 第二个碰撞体
   */
  testCollision(a: Collider, b: Collider): boolean;
  
  /**
   * 重置物理系统
   */
  reset(): void;
  
  /**
   * 销毁物理系统，释放资源
   */
  destroy(): void;
} 