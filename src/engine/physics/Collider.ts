import { Node3d } from '../core/Node3d';
import * as THREE from 'three';
import { editable } from '../core/decorators';

/**
 * 碰撞体基类
 * 提供基本的碰撞检测功能
 */
export class Collider {
  /** 关联的3D节点 */
  protected node: Node3d;
  
  /** 是否启用碰撞 */
  protected enabled: boolean = true;
  
  /** 碰撞体类型 */
  protected type: string = 'base';
  
  /** 碰撞组 - 用于过滤碰撞 */
  protected group: number = 1;
  
  /** 碰撞掩码 - 用于过滤碰撞 */
  protected mask: number = -1;
  
  /** 摩擦系数 */
  protected friction: number = 0.3;
  
  /** 恢复系数 (弹性) */
  protected restitution: number = 0.3;
  
  /**
   * 创建碰撞体
   * @param node 关联的3D节点
   */
  constructor(node: Node3d) {
    this.node = node;
  }
  
  /**
   * 启用或禁用碰撞体
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * 获取碰撞体是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * 设置碰撞组
   * @param group 碰撞组
   */
  public setGroup(group: number): void {
    this.group = group;
  }
  
  /**
   * 获取碰撞组
   */
  public getGroup(): number {
    return this.group;
  }
  
  /**
   * 设置碰撞掩码
   * @param mask 碰撞掩码
   */
  public setMask(mask: number): void {
    this.mask = mask;
  }
  
  /**
   * 获取碰撞掩码
   */
  public getMask(): number {
    return this.mask;
  }
  
  /**
   * 设置摩擦系数
   * @param friction 摩擦系数
   */
  public setFriction(friction: number): void {
    this.friction = friction;
  }
  
  /**
   * 获取摩擦系数
   */
  public getFriction(): number {
    return this.friction;
  }
  
  /**
   * 设置恢复系数
   * @param restitution 恢复系数
   */
  public setRestitution(restitution: number): void {
    this.restitution = restitution;
  }
  
  /**
   * 获取恢复系数
   */
  public getRestitution(): number {
    return this.restitution;
  }
  
  /**
   * 获取关联的节点
   */
  public getNode(): Node3d {
    return this.node;
  }
  
  /**
   * 获取碰撞体类型
   */
  public getType(): string {
    return this.type;
  }
  
  /**
   * 检查是否与另一个碰撞体碰撞
   * @param other 另一个碰撞体
   */
  public collidesWith(other: Collider): boolean {
    // 检查碰撞组和掩码
    if ((this.group & other.getMask()) === 0 || (other.getGroup() & this.mask) === 0) {
      return false;
    }
    
    // 基类不实现具体碰撞检测逻辑
    return false;
  }
  
  /**
   * 更新碰撞体
   * 同步节点的转换到碰撞体
   */
  public update(): void {
    // 基类不实现具体更新逻辑
  }
} 