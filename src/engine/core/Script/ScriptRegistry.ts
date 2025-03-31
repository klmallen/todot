// src/engine/script/ScriptRegistry.ts

import { Script } from '../Script/Script';

/**
 * 脚本注册表，用于序列化和反序列化脚本
 */
export class ScriptRegistry {
  private static scripts: Map<string, new (...args: any[]) => Script> = new Map();
  
  /**
   * 注册脚本类
   * @param name 脚本名称
   * @param scriptClass 脚本类构造函数
   */
  public static registerScript(name: string, scriptClass: new (...args: any[]) => Script): void {
    this.scripts.set(name, scriptClass);
  }
  
  /**
   * 获取脚本类
   * @param name 脚本名称
   * @returns 脚本类构造函数
   */
  public static getScript(name: string): (new (...args: any[]) => Script) | undefined {
    return this.scripts.get(name);
  }
  
  /**
   * 获取所有已注册的脚本
   * @returns 脚本映射表
   */
  public static getAllScripts(): Map<string, new (...args: any[]) => Script> {
    return new Map(this.scripts);
  }
}