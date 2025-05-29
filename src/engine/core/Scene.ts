import * as THREE from 'three';
import { Node3d } from './Node3d';
import { EventEmitter } from '../utils/EventEmitter';
import { Alert } from '@mui/material';
import { Camera } from './Camera';
import { getIsSceneChanged, setIsSceneChanged } from '../states/useEditorMode';

/**
 * 场景类 - 管理节点树，提供节点管理和更新功能
 */
export class Scene {
  private name: string;
  private active: boolean = false;
  private threeScene: THREE.Scene;
  private rootNode: Node3d;
  private nodesMap: Map<string, Node3d> = new Map();
  private nodesList: Node3d[] = [];
  private events: EventEmitter = new EventEmitter();
  private camera: Camera;

  /**
   * 构造函数
   * @param name 场景名称
   */
  constructor(name: string = '默认场景') {
    this.name = name;
    this.threeScene = new THREE.Scene();
    this.rootNode = new Node3d('根节点');
    this.camera = new Camera();
    this.threeScene.add(this.rootNode.getThreeObject());
    
    // 注册根节点
    this.registerNode(this.rootNode);
  }

  /**
   * 获取场景名称
   */
  getName(): string {
    return this.name;
  }

  /**
   * 设置场景名称
   * @param name 新名称
   */
  setName(name: string): void {
    this.name = name;
    this.events.emit('nameChanged', this.name);
  }

  /**
   * 获取场景的THREE对象
   */
  getThreeScene(): THREE.Scene {
    return this.threeScene;
  }

  /**
   * 获取根节点
   */
  getRootNode(): Node3d {
    return this.rootNode;
  }

  /**
   * 获取场景的相机
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * 添加节点到场景
   * @param node 要添加的节点
   */
  addNode(node: Node3d): void {
    this.rootNode.addChild(node);
    if (node.getThreeObject()) {
      this.threeScene.add(node.getThreeObject()!);
    }
    this.registerNode(node);
    
    // 调用节点的 onReady 生命周期方法
    node.onReady();
    
    // 如果场景已经活跃，触发节点的进入场景生命周期事件
    if (this.active) {
      node.onEnterScene();
    }

    //触发场景更新
    setIsSceneChanged(getIsSceneChanged() + 1)
  }

  /**
   * 从场景移除节点
   * @param node 要移除的节点
   */
  removeNode(node: Node3d): void {
    if (node === this.rootNode) {
      console.warn('不能移除场景根节点');
      return;
    }

    const parent = node.getParent();
    if (parent) {
      // 触发节点的退出场景生命周期事件
      if (this.active && typeof node.onExitScene === 'function') {
        node.onExitScene();
      }
      
      parent.removeChild(node);
      this.unregisterNode(node);
      this.events.emit('nodeRemoved', node);
    }

    if (node.getThreeObject()) {
      this.threeScene.remove(node.getThreeObject()!);
    }

    setIsSceneChanged(getIsSceneChanged() + 1)
  }

  /**
   * 根据ID获取节点
   * @param id 节点ID
   */
  getNodeById(id: string): Node3d | undefined {
    return this.nodesMap.get(id);
  }

  /**
   * 获取所有节点的列表
   */
  getAllNodes(): Node3d[] {
    return [...this.nodesList];
  }

  /**
   * 根据节点名称获取节点
   * @param name 节点名称
   */
  getNodesByName(name: string): Node3d[] {
    return this.nodesList.filter(node => node.getName() === name);
  }

  /**
   * 根据节点类型获取节点
   * @param type 节点类型
   */
  getNodesByType<T extends Node3d>(type: new (...args: any[]) => T): T[] {
    return this.nodesList.filter(node => node instanceof type) as T[];
  }

  /**
   * 更新场景及其所有节点
   * @param deltaTime 时间间隔（秒）
   * @param skipScripts 是否跳过脚本更新
   */
  update(deltaTime: number, skipScripts: boolean = false): void {
    if (!this.active) return;
    
    // 从根节点开始递归更新
    this.rootNode.update(deltaTime, skipScripts);
  }

  /**
   * 启动场景中的所有脚本
   */
  startScripts(): void {
    if (!this.active) return;
    
    // 遍历所有节点，触发脚本的onStart方法
    this.nodesList.forEach(node => {
      // 获取节点上的所有脚本
      const scripts = node.getScripts();
      scripts.forEach(script => {
        if (script.isEnabled()) {
          script.onStart();
        }
      });
    });
  }

  /**
   * 停止场景中的所有脚本
   */
  stopScripts(): void {
    if (!this.active) return;
    
    // 遍历所有节点，可以添加自定义的停止逻辑
    // 这里不直接调用脚本的onDestroy，因为那通常是用于完全销毁脚本
    // 而这里只是暂时停止执行
    this.nodesList.forEach(node => {
      // 获取节点上的所有脚本
      const scripts = node.getScripts();
      // 这里可以添加自定义的停止逻辑
      // 例如触发一个自定义的onPause方法等
    });
  }

  /**
   * 激活场景
   */
  activate(): void {
    
    if (this.active) return; // 避免重复激活
    
    this.active = true;
    // 确保所有已准备好但未启动的节点调用onStart
    this.nodesList.forEach(node => {
      if (node.getIsReady() && !node.getHasStarted()) {
        node.onStart();
      }
    });
    
    // 触发所有节点的进入场景生命周期事件
    this.rootNode.onEnterScene();
    setIsSceneChanged(getIsSceneChanged() + 1)
  }

  /**
   * 停用场景
   */
  deactivate(): void {
    // 触发所有节点的退出场景生命周期事件
    if (typeof this.rootNode.onExitScene === 'function') {
      this.rootNode.onExitScene();
    }
    
    this.active = false;
    this.events.emit('deactivated', this);
  }

  /**
   * 检查场景是否激活
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * 注册节点（递归注册所有子节点）
   * @param node 要注册的节点
   * @private
   */
  private registerNode(node: Node3d): void {
    this.nodesMap.set(node.getId(), node);
    this.nodesList.push(node);
    
    // 递归注册子节点
    node.getChildren().forEach(child => {
      this.registerNode(child);
    });
  }

  /**
   * 取消注册节点（递归取消所有子节点）
   * @param node 要取消注册的节点
   * @private
   */
  private unregisterNode(node: Node3d): void {
    this.nodesMap.delete(node.getId());
    const index = this.nodesList.indexOf(node);
    if (index !== -1) {
      this.nodesList.splice(index, 1);
    }
    
    // 递归取消子节点注册
    node.getChildren().forEach(child => {
      this.unregisterNode(child);
    });
  }

  /**
   * 注册事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: Function): void {
    this.events.on(event, callback);
  }

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  off(event: string, callback: Function): void {
    this.events.off(event, callback);
  }

  /**
   * 为保持兼容性，支持添加游戏对象到场景（实际上就是添加节点）
   * @param gameObject 游戏对象（其实就是Node3d）
   * @deprecated 使用 addNode 替代
   */
  addGameObject(gameObject: Node3d): void {
    this.addNode(gameObject);
  }

  /**
   * 为保持兼容性，支持从场景移除游戏对象（实际上就是移除节点）
   * @param gameObject 游戏对象（其实就是Node3d）
   * @deprecated 使用 removeNode 替代
   */
  removeGameObject(gameObject: Node3d): void {
    this.removeNode(gameObject);
  }

  /**
   * 序列化场景为JSON
   */
  public toJSON(): any {
    return {
      name: this.name,
      active: this.active,
      rootNode: this.rootNode.toJSON(),
      
    };
  }

  /**
   * 添加对象到场景
   * @param threeObject THREE对象
   */
  public add(threeObject: THREE.Object3D): void {
    this.threeScene.add(threeObject);
  }

  /**
   * 从场景移除对象
   * @param threeObject THREE对象
   */
  public remove(threeObject: THREE.Object3D): void {
    this.threeScene.remove(threeObject);
  }

  /**
   * 清理场景
   */
  public dispose(): void {
    // 清理场景中的所有对象
    while (this.threeScene.children.length > 0) {
      const object = this.threeScene.children[0];
      this.threeScene.remove(object);
      
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    }
    
    // 清理根节点
    this.rootNode.dispose();
  }

  /**
   * 在场景中查找符合条件的节点
   * @param predicate 节点筛选条件
   * @returns 符合条件的节点数组
   */
  findNodes(predicate: (node: Node3d) => boolean): Node3d[] {
    const result: Node3d[] = [];
    const searchNodes = (node: Node3d) => {
      if (predicate(node)) {
        result.push(node);
      }
      node.getChildren().forEach(child => {
        if (child instanceof Node3d) {
          searchNodes(child);
        }
      });
    };
    
    // 从根节点开始搜索
    if (this.rootNode) {
      searchNodes(this.rootNode);
    }
    
    return result;
  }
}
