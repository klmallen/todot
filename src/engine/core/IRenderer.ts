import * as THREE from 'three';

/**
 * 渲染器接口
 * 定义了引擎渲染器需要实现的基本功能
 */
export interface IRenderer {
  /**
   * 渲染场景
   * @param scene THREE场景
   * @param camera THREE相机
   */
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  
  /**
   * 获取初始化状态
   * @returns 是否已初始化
   */
  isInitialized(): boolean;
  
  /**
   * 销毁渲染器，释放资源
   */
  dispose(): void;
  
  /**
   * 获取原生渲染器实例
   * @returns 原生渲染器实例
   */
  getNativeRenderer(): THREE.WebGLRenderer | any;
}
