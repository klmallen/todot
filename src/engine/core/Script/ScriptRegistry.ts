// src/engine/script/ScriptRegistry.ts

import { Script } from '../Script/Script';

/**
 * 脚本注册表，用于序列化和反序列化脚本
 */
export class ScriptRegistry {
  private static scripts: Map<string, new (...args: any[]) => Script> = new Map();
  private static scriptPaths: Map<string, string> = new Map(); // 存储脚本类名到路径的映射
  
  /**
   * 注册脚本类
   * @param name 脚本名称
   * @param scriptClass 脚本类构造函数
   * @param path 脚本文件路径（可选）
   */
  public static registerScript(name: string, scriptClass: new (...args: any[]) => Script, path?: string): void {
    this.scripts.set(name, scriptClass);
    
    // 如果提供了路径，记录下来
    if (path) {
      this.scriptPaths.set(name, path);
    }
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
   * 获取脚本路径
   * @param name 脚本名称
   * @returns 脚本路径
   */
  public static getScriptPath(name: string): string | undefined {
    return this.scriptPaths.get(name);
  }
  
  /**
   * 设置脚本路径
   * @param name 脚本名称
   * @param path 脚本路径
   */
  public static setScriptPath(name: string, path: string): void {
    this.scriptPaths.set(name, path);
  }

  /**
   * 获取所有已注册的脚本
   * @returns 脚本映射表
   */
  public static getAllScripts(): Map<string, new (...args: any[]) => Script> {
    return new Map(this.scripts);
  }

  /**
   * 获取所有脚本路径
   * @returns 脚本路径映射表
   */
  public static getAllScriptPaths(): Map<string, string> {
    return new Map(this.scriptPaths);
  }
}