import { GameObject } from '../core/GameObject';

/**
 * 脚本接口
 * 所有游戏脚本必须实现此接口
 */
export interface IScript {
  // 脚本名称
  name: string;
  
  // 脚本初始化
  init?(gameObject: GameObject): void;
  
  // 脚本更新，每帧调用
  update?(deltaTime: number): void;
  
  // 当游戏对象被销毁时调用
  onDestroy?(): void;
  
  // 自定义属性和方法
  [key: string]: any;
} 