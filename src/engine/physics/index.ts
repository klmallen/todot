/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-13 15:01:56
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-04-14 11:11:18
 * @FilePath: \todot\src\engine\physics\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 导出基础碰撞体
export { Collider } from './Collider';

// 导出CANNON物理实现
export { CannonPhysics } from './CannonPhysics';
export { CannonCollider, CannonColliderType } from './CannonCollider';

// 导出物理节点
export { PhysicsNode } from './PhysicsNode';

// 导出物理增强器和接口
export { PhysicsEnhancer } from './PhysicsEnhancer';
// 使用export type导出接口类型
export type { IPhysicsCapable, PhysicsOptions } from './PhysicsEnhancer';

// 导出物理工厂
export { PhysicsFactory } from './PhysicsFactory';

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