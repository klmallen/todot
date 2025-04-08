import * as THREE from 'three';
import { Node3d } from './Node3d';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { editable, editableComponent } from './decorators';

/**
 * ModelLoader3D 类 - 用于加载和渲染GLB/GLTF模型
 * 继承自 Node3d
 */
@editableComponent({
  displayName: '模型加载器',
  description: '用于加载和渲染GLB/GLTF模型',
  icon: 'model',
  category: 'Renderable'
})
export class ModelLoader3D extends Node3d {
    
  private model: THREE.Group | null = null;
  private loader: GLTFLoader;
  private onLoadedCallback: ((model: THREE.Group) => void) | null = null;

  @editable({
    displayName: '模型路径',
    description: 'GLB/GLTF模型文件的路径',
    type: 'string',
    group: '资源'
  })
  private modelPath: string = '';

  // DOM元素引用
  private domElement: HTMLElement | null = null;

  constructor(name: string = '模型加载器', modelPath?: string, options?: { position?: THREE.Vector3, rotation?: THREE.Euler }) {
    super(name, options);
    this.loader = new GLTFLoader();
    if (modelPath) {
      this.loadModel(modelPath);
      this.setModelPath(modelPath);
    }
  }

  /**
   * 加载模型
   * @param path 模型文件路径
   */
  public loadModel(path: string): void {
    this.loader.load(
      path,
      (gltf) => {
        this.model = gltf.scene;
        this.getThreeObject().add(this.model);
        this.setType('ModelLoader3D');
        this.addTag('model');
        this.addTag('renderable');
        
        // 调用加载完成回调
        if (this.onLoadedCallback && this.model) {
          this.onLoadedCallback(this.model);
        }
      },
      undefined,
      (error) => {
        console.error('模型加载失败:', error);
      }
    );
  }

  /**
   * 设置模型加载完成后的回调函数
   * @param callback 加载完成后的回调函数
   */
  setOnLoaded(callback: (model: THREE.Group) => void): void {
    this.onLoadedCallback = callback;
    // 如果模型已经加载，立即调用回调
    if (this.model && this.onLoadedCallback) {
      this.onLoadedCallback(this.model);
    }
  }

  /**
   * 设置关联的DOM元素
   * @param element DOM元素
   */
  setDomElement(element: HTMLElement): void {
    this.domElement = element;
  }

  /**
   * 获取关联的DOM元素
   */
  getDomElement(): HTMLElement | null {
    return this.domElement;
  }

  /**
   * 获取模型对象
   */
  getModel(): THREE.Group | null {
    return this.model;
  }

  /**
   * 设置模型路径并加载
   * @param path 新的模型路径
   */
  setModelPath(path: string): void {
    this.modelPath = path;
    this.loadModel(path);
  }

  /**
   * 覆盖销毁方法
   */
  destroy(): void {
    if (this.model) {
      this.getThreeObject().remove(this.model);
    }
    super.destroy();
  }

  /**
   * 覆盖更新方法
   */
  update(deltaTime: number): void {
    super.update(deltaTime);
    // 在这里可以添加特定于模型的更新逻辑
  }

  /**
   * 序列化为JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.modelPath = this.modelPath;
    return json;
  }
}