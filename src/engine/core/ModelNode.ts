import * as THREE from 'three';
import { ModelLoader3D } from './ModelLoader3D';
import { editable, editableComponent } from './decorators';

/**
 * ModelNode类 - 用于加载和渲染3D模型
 * 继承自ModelLoader3D，但默认无路径，在设置路径时才加载模型
 */
@editableComponent({
  displayName: '模型节点',
  description: '用于加载和渲染3D模型',
  icon: 'model',
  category: 'Renderable'
})
export class ModelNode extends ModelLoader3D {
  /**
   * 模型路径属性，重写父类的属性，添加setter以在设置时触发加载
   */
  @editable({
    displayName: '模型路径',
    description: 'GLB/GLTF/FBX模型文件的路径',
    type: 'string',
    group: '资源'
  })
  private _modelPath: string = '';

  /**
   * 构造函数
   * @param name 节点名称，默认为"模型节点"
   */
  constructor(name: string = '模型节点') {
    // 调用父类构造函数，但不传入modelPath
    super(name);
    
    // 设置类型标识
    this.setType('ModelNode');
    
    // 添加标签以便于查询
    this.addTag('model');
  }

  /**
   * 获取模型路径
   */
  public override getModelPath(): string {
    return this._modelPath;
  }

  /**
   * 设置模型路径并加载模型
   * 这个setter会在属性面板中设置路径时被调用
   */
  @editable({
    displayName: '设置模型路径',
    description: '设置模型路径并加载模型',
    type: 'function',
    group: '资源'
  })
  public override setModelPath(path: string): void {
    // 如果路径没有变化，不重新加载
    if (this._modelPath === path) {
      return;
    }
    
    // 更新路径
    this._modelPath = path;
    
    // 如果路径为空，不加载模型
    if (!path) {
      return;
    }
    
    // 调用父类方法加载模型
    super.loadModel(path);
    
    console.log(`正在加载模型: ${path}`);
  }

  /**
   * 序列化为JSON
   */
  override toJSON(): any {
    const json = super.toJSON();
    json.modelPath = this._modelPath;
    return json;
  }
} 