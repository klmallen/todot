/**
 * 引擎接口 - 用于避免循环依赖
 */
export interface IEngine {
  /**
   * 获取相机对象
   */
  getCamera(): any;

  /**
   * 获取渲染DOM元素
   */
  getELementRender(): HTMLElement;
  
  /**
   * 获取场景
   */
  getScene(): any;

  /**
   * 检查引擎是否已初始化完成
   */
  isEngineInitialized(): boolean;

  /**
   * 设置游戏相机
   */
  setGameCamera(camera: any): void;
}

/**
 * 相机接口 - 定义相机基本功能
 */
export interface ICamera {
  /**
   * 获取Three.js相机对象
   */
  getThreeCamera(): any;
  
  /**
   * 相机位置
   */
  camera: any;
}

/**
 * 编辑器节点接口
 */
export interface IEditorNode {
  id: string;
  name: string;
  type: string;
  children: IEditorNode[];
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  tags?: string[];
  scripts?: any[];
  [key: string]: any;
}

/**
 * 属性面板接口
 */
export interface IPropertyPanel {
  container: HTMLElement;
  targetNode: any;
  render(): void;
  destroy(): void;
} 