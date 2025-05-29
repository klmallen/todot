import * as THREE from 'three';
import Engine from '../core/Engine';
import { setSelectedObject, getSelectedObject, getEditorActive, getIsDragging ,setSelectedNode,getSelectedNode} from '../states/useEditorMode';
import { Node3d } from '../core/Node3d';

/**
 * 物体选择器类，用于通过鼠标点击选择场景中的对象
 */
export class ObjectSelector {
  private static instance: ObjectSelector | null = null;
  
  private engine: Engine;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera | null = null;
  private renderer: THREE.WebGLRenderer | any;
  private enabled: boolean = false;
  
  // 节点映射：THREE.Object3D -> Node3d
  private objectNodeMap: Map<THREE.Object3D, Node3d> = new Map();
  
  /**
   * 构造函数
   */
  private constructor() {
    this.engine = Engine.getInstance();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // 获取相机和渲染器
    this.camera = this.engine.getCamera().getThreeCamera();
    this.renderer = this.engine.getRenderer();
    
    // 绑定事件处理
    this.bindEvents();
  }
  
  /**
   * 获取实例（单例模式）
   */
  public static getInstance(): ObjectSelector {
    if (!ObjectSelector.instance) {
      ObjectSelector.instance = new ObjectSelector();
    }
    return ObjectSelector.instance;
  }
  
  /**
   * 绑定事件
   */
  private bindEvents(): void {
    const domElement = this.getDomElement();
    if (!domElement) {
      console.error('无法获取DOM元素，无法绑定物体选择事件');
      return;
    }
    
    // 鼠标点击事件
    domElement.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    
    // 监听编辑器状态
    getEditorActive((active) => {
      this.enabled = active;
    });
  }
  
  /**
   * 处理鼠标点击
   */
  private handlePointerDown(event: PointerEvent): void {
    if (!this.enabled || !this.camera) return;
    
    // 只处理左键点击
    if (event.button !== 0) return;
    
    // 使用 setTimeout 延迟处理，确保在 TransformControls 事件之后执行
    setTimeout(() => {
      // 如果正在拖动，不进行选择
      if (getIsDragging()) {
        console.log('正在拖动，跳过选择');
        return;
      }
      
      // 计算鼠标在归一化设备坐标中的位置
      const domElement = this.getDomElement();
      if (!domElement) return;
      
      const rect = domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // 执行射线投射
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // 获取场景中的所有物体
      const scenes = this.engine.getAllScenes();
      let objects: THREE.Object3D[] = [];
      
      // 收集所有可选中物体
      scenes.forEach(scene => {
        if (scene.isActive()) {
          const sceneObjects = this.getSelectableObjects(scene.getRootNode());
          objects = objects.concat(sceneObjects);
        }
      });
      
      // 检测射线与物体的交点
      const intersects = this.raycaster.intersectObjects(objects, true);
      
      if (intersects.length > 0) {
        // 找到最近的交点
        const intersection = intersects[0];
        // 从相交对象开始向上查找，直到找到objects中的对象
        let targetObject = intersection.object;
        while (targetObject && !objects.includes(targetObject)) {
          targetObject = targetObject.parent;
        }
        
        if (targetObject) {
          setSelectedObject(targetObject);
          const node = this.objectNodeMap.get(targetObject);
          if (node) {
            setSelectedNode(node);
            console.log('选中节点:', Object.keys(node));
          }
        }
      } else {
        // 点击空白处，取消选择
        setSelectedObject(null);
        setSelectedNode(null);
      }
    }, 0);
  }
  
  /**
   * 找到可选择的父对象
   */
  private findSelectableParent(object: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = object;
    
    // 向上遍历层级，找到第一个可选中的对象
    while (current) {
      // 检查是否为可选中对象
      if (this.isSelectableObject(current)) {
        return current;
      }
      
      current = current.parent;
    }
    
    return null;
  }
  
  /**
   * 检查对象是否可选中
   */
  private isSelectableObject(object: THREE.Object3D): boolean {
    // 可以根据需要添加更多条件，例如检查用户自定义属性
    return object.userData.selectable !== false;
  }
  
  /**
   * 获取可选中对象列表
   */
  private getSelectableObjects(node: Node3d): THREE.Object3D[] {
    const objects: THREE.Object3D[] = [];
    const threeObject = node.getThreeObject();
    
    // 存储Node3d到THREE.Object3D的映射
    this.objectNodeMap.set(threeObject, node);
    
    if (this.isSelectableObject(threeObject)) {
      objects.push(threeObject);
    }
    
    // 递归处理子节点
    node.getChildren().forEach(child => {
      objects.push(...this.getSelectableObjects(child));
    });
    
    return objects;
  }
  
  /**
   * 获取DOM元素
   */
  private getDomElement(): HTMLElement | null {
    if (this.renderer instanceof THREE.WebGLRenderer) {
      return this.renderer.domElement;
    } else {
      const nativeRenderer = this.renderer?.getNativeRenderer?.();
      if (nativeRenderer?.domElement) {
        return nativeRenderer.domElement;
      }
    }
    return null;
  }
  
  /**
   * 获取选中对象对应的节点
   */
  public getSelectedNode(): Node3d | null {
    const selectedObject = getSelectedObject();
    if (!selectedObject) return null;
    
    return this.objectNodeMap.get(selectedObject) || null;
  }
  
  /**
   * 根据 THREE.Object3D 的 uuid 查找对应的 Node3d
   * @param uuid THREE.Object3D 的 uuid
   * @returns 找到的 Node3d 或 null
   */
  public getNodeByUuid(uuid: string): Node3d | null {
    for (const [object, node] of this.objectNodeMap.entries()) {
      if (object?.uuid === uuid) {
       
        return node;
      }
    }
    return null;
  }
  
  /**
   * 启用选择器
   */
  public enable(): void {
    this.enabled = true;
  }
  
  /**
   * 禁用选择器
   */
  public disable(): void {
    this.enabled = false;
  }
} 