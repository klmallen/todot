// src/engine/ui/EditorEngineIntegration.ts

import Engine from '../core/Engine';
import { Scene } from '../core/Scene';
import { Node3d } from '../core/Node3d';
import { SceneNode } from './components/SceneTreeView';
import { PropertyCategory } from './components/PropertyPanel';
import { Asset } from './components/AssetBrowser';

export class EditorEngineIntegration {
  private engine: Engine;
  private activeSceneName: string | null = null;
  
  constructor(engine: Engine) {
    this.engine = engine;
  }
  
  // 获取场景树数据
  public getSceneTreeData(): SceneNode[] {
    if (!this.activeSceneName) return [];
    
    const scene = this.engine.getScene(this.activeSceneName);
    if (!scene) return [];
    
    const rootNode = scene.getRootNode();
    return [this.buildSceneTreeNode(rootNode)];
  }
  
  // 构建场景树节点
  private buildSceneTreeNode(node: Node3d): SceneNode {
    return {
      id: node.getId(),
      name: node.getName(),
      type: this.getNodeType(node),
      visible: node.getThreeObject().visible,
      children: node.getChildren().map(child => this.buildSceneTreeNode(child))
    };
  }
  
  // 获取节点类型
  private getNodeType(node: Node3d): 'mesh' | 'light' | 'camera' | 'text' | 'group' | 'empty' {
    // 根据节点类型返回对应类别
    const threeObject = node.getThreeObject();
    
    if (threeObject.isLight) return 'light';
    if (threeObject.isCamera) return 'camera';
    if (threeObject.isMesh) return 'mesh';
    if (threeObject.isGroup) return 'group';
    // 添加其他类型判断
    
    return 'empty';
  }
  
  // 获取节点属性
  public getNodeProperties(nodeId: string): PropertyCategory[] {
    const node = this.engine.getNodeById(nodeId);
    if (!node) return [];
    
    const threeObject = node.getThreeObject();
    const categories: PropertyCategory[] = [];
    
    // 添加变换属性
    categories.push({
      id: 'transform',
      name: '变换',
      properties: [
        {
          id: 'position',
          name: '位置',
          type: 'vector3',
          value: { 
            x: threeObject.position.x,
            y: threeObject.position.y,
            z: threeObject.position.z
          }
        },
        {
          id: 'rotation',
          name: '旋转',
          type: 'vector3',
          value: {
            x: threeObject.rotation.x,
            y: threeObject.rotation.y,
            z: threeObject.rotation.z
          }
        },
        {
          id: 'scale',
          name: '缩放',
          type: 'vector3',
          value: {
            x: threeObject.scale.x,
            y: threeObject.scale.y,
            z: threeObject.scale.z
          }
        }
      ]
    });
    
    // 添加可见性属性
    categories.push({
      id: 'appearance',
      name: '外观',
      properties: [
        {
          id: 'visible',
          name: '可见',
          type: 'boolean',
          value: threeObject.visible
        },
        {
          id: 'castShadow',
          name: '产生阴影',
          type: 'boolean',
          value: threeObject.castShadow || false
        },
        {
          id: 'receiveShadow',
          name: '接收阴影',
          type: 'boolean',
          value: threeObject.receiveShadow || false
        }
      ]
    });
    
    // 根据对象类型添加特定属性
    if (threeObject.isMesh) {
      this.addMeshProperties(threeObject, categories);
    } else if (threeObject.isLight) {
      this.addLightProperties(threeObject, categories);
    } else if (threeObject.isCamera) {
      this.addCameraProperties(threeObject, categories);
    }
    
    return categories;
  }
  
  // 添加网格特定属性
  private addMeshProperties(mesh: THREE.Mesh, categories: PropertyCategory[]): void {
    // 添加材质属性
    // ...
  }
  
  // 添加灯光特定属性
  private addLightProperties(light: THREE.Light, categories: PropertyCategory[]): void {
    // 添加灯光属性
    // ...
  }
  
  // 添加相机特定属性
  private addCameraProperties(camera: THREE.Camera, categories: PropertyCategory[]): void {
    // 添加相机属性
    // ...
  }
  
  // 更新节点属性
  public updateNodeProperty(nodeId: string, propertyId: string, value: any): boolean {
    const node = this.engine.getNodeById(nodeId);
    if (!node) return false;
    
    const threeObject = node.getThreeObject();
    
    // 根据属性ID更新对象
    switch (propertyId) {
      case 'position':
        threeObject.position.set(value.x, value.y, value.z);
        return true;
      case 'rotation':
        threeObject.rotation.set(value.x, value.y, value.z);
        return true;
      case 'scale':
        threeObject.scale.set(value.x, value.y, value.z);
        return true;
      case 'visible':
        threeObject.visible = value;
        return true;
      case 'castShadow':
        if (typeof threeObject.castShadow !== 'undefined') {
          threeObject.castShadow = value;
          return true;
        }
        return false;
      case 'receiveShadow':
        if (typeof threeObject.receiveShadow !== 'undefined') {
          threeObject.receiveShadow = value;
          return true;
        }
        return false;
      // 处理其他属性...
    }
    
    return false;
  }
  
  // 获取项目资源
  public getProjectAssets(path: string = '/'): Asset[] {
    // 实际应用中应该从项目文件系统中读取资源
    // 这里返回示例数据
    return [];
  }
  
  // 加载资源
  public async loadAsset(asset: Asset): Promise<boolean> {
    // 根据资源类型加载
    try {
      switch (asset.type) {
        case 'model':
          // 加载模型
          return true;
        case 'texture':
          // 加载纹理
          return true;
        // 处理其他资源类型...
      }
    } catch (error) {
      console.error(`加载资源失败: ${asset.name}`, error);
      return false;
    }
    
    return false;
  }
  
  // 设置活动场景
  public setActiveScene(sceneName: string): boolean {
    if (!this.engine.getScene(sceneName)) return false;
    
    this.activeSceneName = sceneName;
    this.engine.activateScene(sceneName);
    return true;
  }
  
  // 获取活动场景名称
  public getActiveSceneName(): string | null {
    return this.activeSceneName;
  }
  
  // 创建新场景
  public createNewScene(sceneName: string): boolean {
    if (this.engine.getScene(sceneName)) return false;
    
    const scene = new Scene(sceneName);
    this.engine.addScene(scene);
    return true;
  }
}