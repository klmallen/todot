// 导出基础碰撞体
export { Collider } from './Collider';

// 导出CANNON物理实现
export { CannonPhysics } from './CannonPhysics';
export { CannonCollider, CannonColliderType } from './CannonCollider';

// 导出物理节点
export { PhysicsNode } from './PhysicsNode';

// 工厂函数：创建物理引擎实例
import { CannonPhysics } from './CannonPhysics';
import { IPhysics } from '../core/IPhysics';

/**
 * 创建物理引擎实例
 * @param type 物理引擎类型
 * @param gravity 重力加速度
 * @returns 物理引擎实例
 */
export function createPhysicsEngine(type: 'cannon' = 'cannon', gravity: number = 9.82): IPhysics {
  switch (type) {
    case 'cannon':
      return new CannonPhysics(gravity);
    default:
      console.warn(`不支持的物理引擎类型: ${type}，使用CANNON物理引擎代替`);
      return new CannonPhysics(gravity);
  }
} 