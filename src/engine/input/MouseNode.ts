import * as THREE from 'three';
import { Node3d } from '../core/Node3d';
import { EventEmitter } from '../utils/EventEmitter';
import { editable, editableComponent } from '../core/decorators';
import Engine from '../core/Engine';

/**
 * 鼠标点击结果接口
 */
export interface MouseClickResult {
  /** 点击的节点 */
  node: Node3d | null;
  /** 点击坐标（世界空间） */
  point: THREE.Vector3;
  /** 点击法线 */
  normal: THREE.Vector3;
  /** 点击的距离 */
  distance: number;
  /** 交点在物体上的UV坐标 */
  uv?: THREE.Vector2;
  /** 原始鼠标事件 */
  event: MouseEvent;
}

/**
 * 鼠标节点类
 * 用于处理鼠标输入和识别世界中被点击的对象
 */
@editableComponent({
  displayName: '鼠标输入节点',
  description: '处理鼠标输入和3D对象交互',
  icon: 'mouse',
  category: 'Input'
})
export class MouseNode extends Node3d {
  // 用于射线投射的临时变量
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  
  // 事件发射器
  private events: EventEmitter = new EventEmitter();
  
  // 绑定的事件处理函数
  private boundMouseDown: (event: MouseEvent) => void;
  private boundMouseUp: (event: MouseEvent) => void;
  private boundMouseMove: (event: MouseEvent) => void;
  private boundClick: (event: MouseEvent) => void;
  private boundDblClick: (event: MouseEvent) => void;
  
  // 是否已注册事件
  private eventsRegistered: boolean = false;

  // 鼠标按钮状态
  private buttonStates: Record<number, boolean> = {
    0: false, // 左键
    1: false, // 中键
    2: false  // 右键
  };
  
  // 上一次点击时间（用于检测双击）
  private lastClickTime: number = 0;
  private clickPosition: THREE.Vector2 = new THREE.Vector2();
  
  // 是否启用鼠标事件处理
  @editable({
    displayName: '启用鼠标输入',
    description: '是否处理鼠标事件',
    type: 'boolean',
    group: 'Input'
  })
  private enabled: boolean = true;
  
  // 是否检测双击
  @editable({
    displayName: '检测双击',
    description: '是否区分单击和双击事件',
    type: 'boolean',
    group: 'Input'
  })
  private detectDoubleClick: boolean = true;
  
  // 双击时间阈值（毫秒）
  @editable({
    displayName: '双击时间阈值',
    description: '检测双击的最大时间间隔（毫秒）',
    type: 'number',
    min: 100,
    max: 1000,
    step: 10,
    group: 'Input'
  })
  private doubleClickTime: number = 300;
  
  // 双击距离阈值（像素）
  @editable({
    displayName: '双击距离阈值',
    description: '检测双击的最大位置偏移（像素）',
    type: 'number',
    min: 1,
    max: 50,
    group: 'Input'
  })
  private doubleClickDistance: number = 10;
  
  // 当前鼠标位置
  private currentPosition: THREE.Vector2 = new THREE.Vector2();
  
  // 当前悬停的节点
  private hoveredNode: Node3d | null = null;
  
  // 上一次检测到的点击结果
  private lastClickResult: MouseClickResult | null = null;

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = '鼠标节点') {
    super(name);
    
    // 预绑定事件处理函数
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundClick = this.handleClick.bind(this);
    this.boundDblClick = this.handleDblClick.bind(this);
  }

  /**
   * 节点进入场景时调用
   * 注册鼠标事件监听器
   */
  onEnterScene(): void {
    if (!this.eventsRegistered && this.enabled) {
      this.registerEvents();
    }
  }

  /**
   * 节点退出场景时调用
   * 移除鼠标事件监听器
   */
  onExitScene(): void {
    this.unregisterEvents();
  }

  /**
   * 注册鼠标事件监听器
   */
  private registerEvents(): void {
    if (this.eventsRegistered) return;
    
    try {
      const engine = Engine.getInstance();
      const canvas = engine.getELementRender();
      
      // 注册事件监听
      canvas.addEventListener('mousedown', this.boundMouseDown);
      canvas.addEventListener('mouseup', this.boundMouseUp);
      canvas.addEventListener('mousemove', this.boundMouseMove);
      canvas.addEventListener('click', this.boundClick);
      
      if (this.detectDoubleClick) {
        canvas.addEventListener('dblclick', this.boundDblClick);
      }
      
      this.eventsRegistered = true;
    } catch (error) {
      console.error('注册鼠标事件失败:', error);
    }
  }

  /**
   * 移除鼠标事件监听器
   */
  private unregisterEvents(): void {
    if (!this.eventsRegistered) return;
    
    try {
      const engine = Engine.getInstance();
      const canvas = engine.getELementRender();
      
      // 移除事件监听
      canvas.removeEventListener('mousedown', this.boundMouseDown);
      canvas.removeEventListener('mouseup', this.boundMouseUp);
      canvas.removeEventListener('mousemove', this.boundMouseMove);
      canvas.removeEventListener('click', this.boundClick);
      
      if (this.detectDoubleClick) {
        canvas.removeEventListener('dblclick', this.boundDblClick);
      }
      
      this.eventsRegistered = false;
    } catch (error) {
      console.error('移除鼠标事件失败:', error);
    }
  }

  /**
   * 处理鼠标按下事件
   * @param event 鼠标事件
   */
  private handleMouseDown(event: MouseEvent): void {
    if (!this.enabled) return;
    
    // 更新按钮状态
    this.buttonStates[event.button] = true;
    
    // 计算归一化设备坐标
    this.updateMouseCoordinates(event);
    
    // 执行射线投射检测
    const result = this.performRaycast(event);
    
    // 发送事件
    if (result) {
      this.events.emit('mousedown', result);
      this.events.emit(`mousedown:${event.button}`, result);
    } else {
      this.events.emit('mousedown:miss', { event, point: new THREE.Vector3() });
    }
  }

  /**
   * 处理鼠标释放事件
   * @param event 鼠标事件
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.enabled) return;
    
    // 更新按钮状态
    this.buttonStates[event.button] = false;
    
    // 计算归一化设备坐标
    this.updateMouseCoordinates(event);
    
    // 执行射线投射检测
    const result = this.performRaycast(event);
    
    // 发送事件
    if (result) {
      this.events.emit('mouseup', result);
      this.events.emit(`mouseup:${event.button}`, result);
    } else {
      this.events.emit('mouseup:miss', { event, point: new THREE.Vector3() });
    }
  }

  /**
   * 处理鼠标移动事件
   * @param event 鼠标事件
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.enabled) return;
    
    // 更新当前位置
    this.currentPosition.set(event.clientX, event.clientY);
    
    // 计算归一化设备坐标
    this.updateMouseCoordinates(event);
    
    // 执行射线投射检测
    const result = this.performRaycast(event);
    
    // 处理悬停状态
    if (result && result.node) {
      if (this.hoveredNode !== result.node) {
        // 如果悬停节点改变，触发悬停退出和进入事件
        if (this.hoveredNode) {
          this.events.emit('hoverout', { 
            node: this.hoveredNode, 
            event, 
            point: result.point 
          });
        }
        
        this.hoveredNode = result.node;
        this.events.emit('hoverin', result);
      }
      
      // 在悬停中
      this.events.emit('hover', result);
    } else if (this.hoveredNode) {
      // 不再悬停在任何节点上
      this.events.emit('hoverout', { 
        node: this.hoveredNode, 
        event, 
        point: new THREE.Vector3() 
      });
      this.hoveredNode = null;
    }
    
    // 发送移动事件
    this.events.emit('mousemove', result || { 
      node: null, 
      point: new THREE.Vector3(), 
      normal: new THREE.Vector3(), 
      distance: 0, 
      event 
    });
  }

  /**
   * 处理单击事件
   * @param event 鼠标事件
   */
  private handleClick(event: MouseEvent): void {
    if (!this.enabled) return;
    
    // 如果启用双击检测，需要延迟处理单击
    if (this.detectDoubleClick) {
      const now = Date.now();
      const timeDiff = now - this.lastClickTime;
      
      // 计算与上次点击的距离
      const clickDist = Math.sqrt(
        Math.pow(event.clientX - this.clickPosition.x, 2) +
        Math.pow(event.clientY - this.clickPosition.y, 2)
      );
      
      // 如果时间短且距离近，可能是双击的第一次，不触发单击
      if (timeDiff < this.doubleClickTime && clickDist < this.doubleClickDistance) {
        return;
      }
      
      // 保存当前点击信息，用于下一次比较
      this.lastClickTime = now;
      this.clickPosition.set(event.clientX, event.clientY);
      
      // 延迟触发单击，给双击一个机会
      setTimeout(() => {
        // 如果没有双击发生，触发单击
        const now = Date.now();
        if (now - this.lastClickTime >= this.doubleClickTime) {
          this.triggerClick(event);
        }
      }, this.doubleClickTime + 10);
    } else {
      // 直接触发单击
      this.triggerClick(event);
    }
  }

  /**
   * 实际触发单击事件
   * @param event 鼠标事件
   */
  private triggerClick(event: MouseEvent): void {
    // 更新鼠标坐标
    this.updateMouseCoordinates(event);
    
    // 执行射线投射检测
    const result = this.performRaycast(event);
    this.lastClickResult = result;
    
    // 发送事件
    if (result && result.node) {
      this.events.emit('click', result);
      this.events.emit(`click:${event.button}`, result);
    } else {
      this.events.emit('click:miss', { event, point: new THREE.Vector3() });
    }
  }

  /**
   * 处理双击事件
   * @param event 鼠标事件
   */
  private handleDblClick(event: MouseEvent): void {
    if (!this.enabled || !this.detectDoubleClick) return;
    
    // 更新鼠标坐标
    this.updateMouseCoordinates(event);
    
    // 执行射线投射检测
    const result = this.performRaycast(event);
    
    // 重置点击时间，避免触发单击
    this.lastClickTime = 0;
    
    // 发送事件
    if (result && result.node) {
      this.events.emit('dblclick', result);
      this.events.emit(`dblclick:${event.button}`, result);
    } else {
      this.events.emit('dblclick:miss', { event, point: new THREE.Vector3() });
    }
  }

  /**
   * 更新鼠标的归一化设备坐标
   * @param event 鼠标事件
   */
  private updateMouseCoordinates(event: MouseEvent): void {
    try {
      const engine = Engine.getInstance();
      const canvas = engine.getELementRender();
      const rect = canvas.getBoundingClientRect();
      
      // 计算归一化设备坐标 (-1 到 +1)
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    } catch (error) {
      console.error('更新鼠标坐标失败:', error);
    }
  }

  /**
   * 执行射线投射并返回结果
   * @param event 原始鼠标事件
   * @returns 射线投射结果，如果没有碰撞则返回null
   */
  private performRaycast(event: MouseEvent): MouseClickResult | null {
    try {
      const engine = Engine.getInstance();
      const camera = engine.getCamera().getThreeCamera();
      
      // 更新射线投射器
      this.raycaster.setFromCamera(this.mouse, camera);
      
      // 获取所有场景中的可见对象
      const objects: THREE.Object3D[] = [];
      engine.getAllScenes().forEach(scene => {
        scene.getAllNodes().forEach(node => {
          const obj = node.getThreeObject();
          if (obj && obj.visible) {
            objects.push(obj);
          }
        });
      });
      
      // 执行射线投射
      const intersects = this.raycaster.intersectObjects(objects, true);
      
      // 如果有交点
      if (intersects.length > 0) {
        const intersection = intersects[0];
        let node = this.findNodeFromObject(intersection.object);
        
        // 创建结果对象
        return {
          node,
          point: intersection.point.clone(),
          normal: intersection.face ? intersection.face.normal.clone() : new THREE.Vector3(0, 1, 0),
          distance: intersection.distance,
          uv: intersection.uv ? intersection.uv.clone() : undefined,
          event
        };
      }
      
      return null;
    } catch (error) {
      console.error('射线投射失败:', error);
      return null;
    }
  }

  /**
   * 从Three.js对象查找对应的Node3d
   * @param object Three.js对象
   * @returns 找到的Node3d或null
   */
  private findNodeFromObject(object: THREE.Object3D): Node3d | null {
    try {
      // 遍历对象及其父级，寻找对应的节点
      let current: THREE.Object3D | null = object;
      
      while (current) {
        // 在所有场景中搜索
        const engine = Engine.getInstance();
        for (const scene of engine.getAllScenes()) {
          // 遍历场景中的所有节点
          for (const node of scene.getAllNodes()) {
            if (node.getThreeObject() === current) {
              return node;
            }
          }
        }
        
        // 向上查找父对象
        current = current.parent;
      }
      
      return null;
    } catch (error) {
      console.error('查找节点失败:', error);
      return null;
    }
  }

  /**
   * 添加事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: (result: MouseClickResult) => void): void {
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
   * 设置启用状态
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (enabled && !this.eventsRegistered) {
      this.registerEvents();
    } else if (!enabled && this.eventsRegistered) {
      this.unregisterEvents();
    }
  }

  /**
   * 获取当前鼠标位置
   * @returns 鼠标坐标（归一化设备坐标）
   */
  getMousePosition(): THREE.Vector2 {
    return this.mouse.clone();
  }

  /**
   * 获取当前鼠标悬停的节点
   * @returns 悬停的节点或null
   */
  getHoveredNode(): Node3d | null {
    return this.hoveredNode;
  }

  /**
   * 获取最后一次点击的结果
   * @returns 点击结果或null
   */
  getLastClickResult(): MouseClickResult | null {
    return this.lastClickResult ? { ...this.lastClickResult } : null;
  }

  /**
   * 获取指定鼠标按钮的状态
   * @param button 按钮索引（0=左键, 1=中键, 2=右键）
   * @returns 是否按下
   */
  isButtonPressed(button: number): boolean {
    return this.buttonStates[button] || false;
  }

  /**
   * 在指定位置执行射线投射
   * @param x 屏幕X坐标
   * @param y 屏幕Y坐标
   * @returns 射线投射结果或null
   */
  raycastAtPosition(x: number, y: number): MouseClickResult | null {
    try {
      const engine = Engine.getInstance();
      const canvas = engine.getELementRender();
      const rect = canvas.getBoundingClientRect();
      
      // 计算归一化设备坐标
      const mouseX = ((x - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((y - rect.top) / rect.height) * 2 + 1;
      
      const tempMouse = new THREE.Vector2(mouseX, mouseY);
      const camera = engine.getCamera().getThreeCamera();
      
      // 创建临时射线投射器
      const tempRaycaster = new THREE.Raycaster();
      tempRaycaster.setFromCamera(tempMouse, camera);
      
      // 获取所有场景中的可见对象
      const objects: THREE.Object3D[] = [];
      engine.getAllScenes().forEach(scene => {
        scene.getAllNodes().forEach(node => {
          const obj = node.getThreeObject();
          if (obj && obj.visible) {
            objects.push(obj);
          }
        });
      });
      
      // 执行射线投射
      const intersects = tempRaycaster.intersectObjects(objects, true);
      
      // 如果有交点
      if (intersects.length > 0) {
        const intersection = intersects[0];
        let node = this.findNodeFromObject(intersection.object);
        
        // 创建结果对象
        return {
          node,
          point: intersection.point.clone(),
          normal: intersection.face ? intersection.face.normal.clone() : new THREE.Vector3(0, 1, 0),
          distance: intersection.distance,
          uv: intersection.uv ? intersection.uv.clone() : undefined,
          event: new MouseEvent('raycast')
        };
      }
      
      return null;
    } catch (error) {
      console.error('自定义位置射线投射失败:', error);
      return null;
    }
  }

  /**
   * 节点销毁时调用
   */
  destroy(): void {
    this.unregisterEvents();
    this.events.clear();
  }
} 