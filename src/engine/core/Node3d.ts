import * as THREE from "three";
import { Script } from "./Script/Script";
import { v4 as uuidv4 } from "uuid";
import { editable, editableAccessor } from "./decorators";
import { IEngine, ICamera, IEditorNode, IPropertyPanel } from "./interfaces";
import { ScriptRegistry } from "./Script/ScriptRegistry";
import EventLoopItem from "../utils/EventLoopItem";
import { getIsSceneChanged,setIsSceneChanged  } from "../states/useEditorMode";

export class Node3d extends EventLoopItem {
  private static engineInstance: IEngine | null = null;
  
  public static setEngineInstance(engine: IEngine): void {
    Node3d.engineInstance = engine;
  }

  private _id: string;
  private _name: string;
  private threeObject: THREE.Object3D;
  @editable({
    displayName: "脚本",
    description: "节点的脚本",
    type: "Script[]",
    group: "General",
  })
  private _scripts: Script[] = [];
  private _children: Node3d[] = [];
  private parent: Node3d | null = null;
  private type: string = "Node3d";
  @editable({
    displayName: "标签",
    description: "节点的标签",
    type: "string[]",
    group: "General",
  })
  private _tags: Set<string> = new Set();
  private events: Map<string, Function[]> = new Map();
  private isInScene: boolean = false; // 标记节点是否在场景中
  private isReady: boolean = false; // 标记节点是否已经准备好了
  private hasStarted: boolean = false; // 标记节点是否已经启动


    // @editable({
    //   displayName: '位置',
    //   description: '节点的位置',
    //   type: 'vector3',
    //   group: 'Transform'
    // })
    // private position: THREE.Vector3 = new THREE.Vector3();

    // @editable({
    //   displayName: '旋转',
    //   description: '节点的旋转',
    //   type: 'euler',
    //   group: 'Transform'
    // })
    // private rotation: THREE.Euler = new THREE.Euler();

    // @editable({
    //   displayName: '缩放',
    //   description: '节点的缩放',
    //   type: 'vector3',
    //   group: 'Transform'
    // })
    // private scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  constructor(
    name: string,
    options?: { position?: THREE.Vector3; rotation?: THREE.Euler }
  ) {
    super()
    this._id = uuidv4();
    this._name = name;
    this.threeObject = new THREE.Object3D();
    this.threeObject.name = name;
    if (options) {
      if (options.position) {
        this.getThreeObject().position.copy(options.position);
      }
      if (options.rotation) {
        this.getThreeObject().rotation.copy(options.rotation);
      }
    }
  }

  @editableAccessor({
    displayName: "位置",
    description: "节点的位置",
    type: "vector3",
    group: "Transform",
  })
  public get position(): THREE.Vector3 {
    return this.threeObject.position;
  }

  public set position(value: THREE.Vector3) {
    this.threeObject.position.copy(value);
  }

  // 旋转
  @editableAccessor({
    displayName: "旋转",
    description: "节点的旋转",
    type: "euler",
    group: "Transform",
  })
  public get rotation(): THREE.Euler {
    return this.threeObject.rotation;
  }

  public set rotation(value: THREE.Euler) {
    this.threeObject.rotation.copy(value);
  }

  // 缩放
  @editableAccessor({
    displayName: "缩放",
    description: "节点的缩放",
    type: "vector3",
    group: "Transform",
  })
  public get scale(): THREE.Vector3 {
    return this.threeObject.scale;
  }

  public set scale(value: THREE.Vector3) {
    this.threeObject.scale.copy(value);
  }

  // 四元数
  public get quaternion(): THREE.Quaternion {
    return this.threeObject.quaternion;
  }

  public set quaternion(value: THREE.Quaternion) {
    this.threeObject.quaternion.copy(value);
  }

  // 设置四元数
  public setQuaternion(x: number, y: number, z: number, w: number): void {
    this.threeObject.quaternion.set(x, y, z, w);
  }

  // 设置节点类型
  public setType(type: string): void {
    this.type = type;
  }

  // 获取节点类型
  public getType(): string {
    return this.type;
  }

  // 添加标签
  public addTag(tag: string): void {
    this._tags.add(tag);
  }

  // 移除标签
  public removeTag(tag: string): void {
    this._tags.delete(tag);
  }

  // 检查是否包含标签
  public hasTag(tag: string): boolean {
    return this._tags.has(tag);
  }

  // 获取所有标签
  public getTags(): string[] {
    return Array.from(this._tags);
  }

  public getThreeObject(): THREE.Object3D {
    return this.threeObject;
  }

  public addChild(node: Node3d): void {
    if (node.parent) {
      node.parent.removeChild(node);
    }
    this._children.push(node);
    node.parent = this;
    this.threeObject.add(node.threeObject);

    setIsSceneChanged(getIsSceneChanged() + 1)
  }

  public removeChild(node: Node3d): void {
    const index = this._children.indexOf(node);
    if (index !== -1) {
      this._children.splice(index, 1);
      node.parent = null;
      this.threeObject.remove(node.threeObject);
    }
    setIsSceneChanged(getIsSceneChanged() + 1)
  }

  public update(deltaTime: number, skipScripts: boolean = false): void {
    // 更新该节点上的所有脚本，如果skipScripts为true则跳过
    if (!skipScripts) {
      this._scripts.forEach((script) => {
        if (script.isEnabled()) {
          script.update(deltaTime);
        }
      });
    }

    // 递归更新子节点
    this._children.forEach((child) => {
      child.update(deltaTime, skipScripts);
    });

    // 更新所有动画任务，动画任务不受skipScripts影响
    for (let i = this.animationTasks.length - 1; i >= 0; i--) {
      const isCompleted = this.animationTasks[i](deltaTime);
      if (isCompleted) {
        this.animationTasks.splice(i, 1);
      }
    }
  }

  public getId(): string {
    return this._id;
  }

  public getName(): string {
    return this._name;
  }

  public setName(name: string): void {
    this._name = name;
    this.threeObject.name = name;
  }

  public getParent(): Node3d | null {
    return this.parent;
  }

  public getChildren(): Node3d[] {
    return [...this._children];
  }

  /**
   * 获取节点上的所有脚本
   */
  public getScripts(): Script[] {
    return [...this._scripts];
  }

  // 提供位置、旋转和缩放的快捷方法
  public setPosition(x: number, y: number, z: number): void {
    this.threeObject.position.set(x, y, z);
  }

  public setRotation(x: number, y: number, z: number): void {
    this.threeObject.rotation.set(x, y, z);
  }

  public setScale(x: number, y: number, z: number): void {
    this.threeObject.scale.set(x, y, z);
  }

  // 添加脚本专用方法
  public addScript<T extends Script>(
    scriptClass: new (...args: any[]) => T,
    params?: any
  ): T {
    const script = new scriptClass(params);
    this._scripts.push(script);
    script.onAttach(this);
    
    // 如果节点已在场景中且场景已激活,则调用脚本的onStart
    if (this.isInScene && this.hasStarted && script.isEnabled()) {
      // alert(1)
      script.onStart();
    }
    
    return script;
  }

  /**
   * 添加已实例化的脚本对象
   * @param script 已经实例化的脚本对象
   * @returns 添加的脚本对象
   */
  public addScriptInstance<T extends Script>(script: T): T {
    this._scripts.push(script);
    script.onAttach(this);
    
    // 如果节点已在场景中且场景已激活,则调用脚本的onStart
    if (this.isInScene && this.hasStarted && script.isEnabled()) {
      script.onStart();
    }
    
    return script;
  }

  // 通过脚本类型获取脚本
  public getScript<T extends Script>(
    scriptClass: new (...args: any[]) => T
  ): T | undefined {
    return this._scripts.find((script) => script instanceof scriptClass) as
      | T
      | undefined;
  }

  // 通过脚本ID获取脚本
  public getScriptById(id: string): Script | undefined {
    return this._scripts.find((script) => script.getId() === id);
  }

  // 获取特定类型的所有脚本
  public getScriptsByType<T extends Script>(type: {
    new (...args: any[]): T;
  }): T[] {
    return this._scripts.filter((script) => script instanceof type) as T[];
  }

  // 移除脚本
  public removeScript(script: Script): void {
    const index = this._scripts.indexOf(script);
    if (index !== -1) {
      script.onDetach();
      this._scripts.splice(index, 1);
    }
  }

  // 通过脚本ID移除脚本
  public removeScriptById(scriptId: string): boolean {
    const script = this.getScriptById(scriptId);
    if (script) {
      this.removeScript(script);
      return true;
    }
    return false;
  }

  // 获取所有脚本
  public getAllScripts(): Script[] {
    return [...this._scripts];
  }

  /**
   * 获取节点在编辑器中的元数据
   */
  public getEditorMetadata(): any {
    const constructor = this.constructor as any;
    return (
      constructor.prototype._editorMetadata || {
        displayName: this.constructor.name,
        description: "",
        icon: "cube",
        category: "General",
      }
    );
  }

  /**
   * 获取可编辑属性元数据
   */
  public getEditableProperties(): Record<string, any> {
    const constructor = this.constructor as any;
    const editableProps = constructor._editableProps || {};
    const result: Record<string, any> = {};

    // 需要排除的属性
    const excludedProps = ['_scripts', '_tags'];

    // 收集所有可编辑属性的当前值
    for (const propKey in editableProps) {
      // 跳过被排除的属性
      if (excludedProps.includes(propKey)) continue;

      const propMetadata = editableProps[propKey];
      
      if (propMetadata.isAccessor) {
        // 如果是访问器属性，使用getter获取值
        result[propKey] = {
          value: propMetadata.get.call(this),
          metadata: {
            ...propMetadata,
            // 移除getter和setter函数，避免序列化问题
            get: undefined,
            set: undefined
          }
        };
      } else {
        // 如果是普通属性，直接获取值
        if (Object.prototype.hasOwnProperty.call(this, propKey)) {
          result[propKey] = {
            value: (this as any)[propKey],
            metadata: propMetadata
          };
        }
      }
    }

    return result;
  }

  /**
   * 从编辑器更新属性值
   */
  public updateFromEditor(props: Record<string, any>): void {
    const constructor = this.constructor as any;
    const editableProps = constructor._editableProps || {};

    for (const propKey in props) {
      const propMetadata = editableProps[propKey];
      if (propMetadata) {
        if (propMetadata.isAccessor) {
          // 如果是访问器属性，使用setter设置值
          propMetadata.set.call(this, props[propKey]);
        } else {
          // 如果是普通属性，直接设置值
          if (Object.prototype.hasOwnProperty.call(this, propKey)) {
            (this as any)[propKey] = props[propKey];
          }
        }
      }
    }

    // 触发更新事件（如果需要的话）
    // this.emit('propertyChanged');
  }

  /**
   * 转换为编辑器节点数据
   */
  public toEditorNode(): IEditorNode {
    const metadata = this.getEditorMetadata();
    const editableProps = this.getEditableProperties();
    
    // 转换子节点为EditorNode格式
    const childrenNodes: IEditorNode[] = this._children.map(child => child.toEditorNode());

    return {
      id: this._id,
      name: this._name,
      type: this.type,
        position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
        },
        rotation: {
        x: this.rotation.x,
        y: this.rotation.y,
        z: this.rotation.z
        },
        scale: {
        x: this.scale.x,
        y: this.scale.y,
        z: this.scale.z
      },
      tags: Array.from(this._tags),
      visible: this.threeObject.visible,
      scripts: this._scripts.map((script) => ({
        id: script.getId(),
        type: script.constructor.name,
        enabled: script.isEnabled()
      })),
      children: childrenNodes,
      metadata: metadata
    };
  }

  // 根据名称查找子节点（直接子节点）
  public getChildByName(name: string): Node3d | undefined {
    return this._children.find((child) => child.getName() === name);
  }

  // 根据ID查找子节点（直接子节点）
  public getChildById(id: string): Node3d | undefined {
    return this._children.find((child) => child.getId() === id);
  }

  // 根据索引获取子节点
  public getChildAt(index: number): Node3d | undefined {
    if (index >= 0 && index < this._children.length) {
      return this._children[index];
    }
    return undefined;
  }

  // 根据名称查找同级节点
  public getSiblingByName(name: string): Node3d | undefined {
    if (!this.parent) return undefined;
    return this.parent.getChildByName(name);
  }

  // 根据ID查找同级节点
  public getSiblingById(id: string): Node3d | undefined {
    if (!this.parent) return undefined;
    return this.parent.getChildById(id);
  }

  // 递归查找指定名称的节点（搜索整个子树）
  public findNodeByName(name: string): Node3d | undefined {
    // 先检查当前节点
    if (this.getName() === name) {
      return this;
    }

    // 检查直接子节点
    const directChild = this.getChildByName(name);
    if (directChild) {
      return directChild;
    }

    // 递归检查子树
    for (const child of this._children) {
      const found = child.findNodeByName(name);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  // 递归查找指定ID的节点（搜索整个子树）
  public findNodeById(id: string): Node3d | undefined {
    // 先检查当前节点
    if (this.getId() === id) {
      return this;
    }

    // 检查直接子节点
    const directChild = this.getChildById(id);
    if (directChild) {
      return directChild;
    }

    // 递归检查子树
    for (const child of this._children) {
      const found = child.findNodeById(id);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  // 根据路径查找节点（类似文件路径，使用/分隔）
  public findNodeByPath(path: string): Node3d | undefined {
    if (!path) return undefined;

    const parts = path.split("/").filter((p) => p.length > 0);
    let current: Node3d = this;

    for (const part of parts) {
      const found = current.getChildByName(part);
      if (!found) return undefined;
      current = found;
    }

    return current;
  }

  // 查找具有特定标签的所有子节点
  public findNodesByTag(tag: string): Node3d[] {
    const result: Node3d[] = [];

    // 检查当前节点
    if (this.hasTag(tag)) {
      result.push(this);
    }

    // 递归检查所有子节点
    for (const child of this._children) {
      result.push(...child.findNodesByTag(tag));
    }

    return result;
  }

  // 生命周期方法

  // 当节点首次在活跃场景中激活时调用（只调用一次）
  public onStart(): void {
    // alert(`${this.getName()} onStart`)
    // 避免重复调用
    if (this.hasStarted) return;
    this.hasStarted = true;

    // 执行所有脚本的 onStart 方法
    this._scripts.forEach((script) => {
        console.log(script,'script')
      if (script.isEnabled() && typeof script.onStart === "function") {
        script.onStart();
      }
    });

    // 递归通知所有子节点
    this._children.forEach((child) => {
      child.onStart();
    });
  }

  // 当节点被添加到场景时调用
  public onEnterScene(): void {
    // 避免重复调用
    if (this.isInScene) return;
    this.isInScene = true;

    // 如果节点已经准备好且未启动，调用onStart
    if (this.isReady && !this.hasStarted) {
      this.onStart();
    }

    // 执行所有脚本的 onEnterScene 方法
    this._scripts.forEach((script) => {
      if (script.isEnabled() && typeof script.onEnterScene === "function") {
        script.onEnterScene();
      }
    });

    // 递归通知所有子节点
    this._children.forEach((child) => {
      child.onEnterScene();
    });
  }

  // 当节点被从场景移除时调用
  public onExitScene(): void {
    // 避免重复调用
    if (!this.isInScene) return;
    this.isInScene = false;

    // 执行所有脚本的 onExitScene 方法
    this._scripts.forEach((script) => {
      if (script.isEnabled() && typeof script.onExitScene === "function") {
        script?.onExitScene();
      }
    });

    // 递归通知所有子节点
    this._children.forEach((child) => {
      child.onExitScene();
    });
  }

  // 当节点刚被创建且初始化完成时调用
  public onReady(): void {
    // 避免重复调用
    if (this.isReady) return;
    this.isReady = true;

    // 执行所有脚本的 onReady 方法
    this._scripts.forEach((script) => {
      if (script.isEnabled() && typeof script.onReady === "function") {
        script.onReady();
      }
    });

    // 递归通知所有子节点
    this._children.forEach((child) => {
      child.onReady();
    });
  }

  // 检查节点是否在场景中
  public isInSceneTree(): boolean {
    return this.isInScene;
  }

  // 获取节点是否已准备好
  public getIsReady(): boolean {
    return this.isReady;
  }

  // 获取节点是否已启动
  public getHasStarted(): boolean {
    return this.hasStarted;
  }

  // 重置启动状态（场景重新加载时可能需要）
  public resetStarted(): void {
    this.hasStarted = false;
    this._children.forEach((child) => {
      child.resetStarted();
    });
  }
  public getEngine(): IEngine {
    try {
      if (!Node3d.engineInstance) {
        throw new Error("引擎实例尚未设置，请先调用Node3d.setEngineInstance()");
      }
      return Node3d.engineInstance;
    } catch (error) {
      console.error("获取引擎失败:", error);
      throw new Error("无法获取引擎");
    }
  }
  public getEngineCamera(): ICamera {
    try {
      const engine = this.getEngine();
      console.log(engine.getCamera(),'engine');
      return engine.getCamera();
    } catch (error) {
      console.error("获取引擎相机失败:", error);
      throw new Error("无法获取引擎相机");
    }
  }
   public getEngineDom(): HTMLElement {
    try {
      const engine = this.getEngine();
      return engine.getELementRender();
    } catch (error) {
      console.error("获取引擎DOM失败:", error);
      throw new Error("无法获取引擎DOM");
    }
  }

  /**
   * 让物体朝向某个点
   * @param target 目标位置或目标Node3d对象
   */
  lookAt(target: THREE.Vector3 | Node3d): void {
    const targetPosition =
      target instanceof Node3d
        ? new THREE.Vector3().setFromMatrixPosition(
            target.getThreeObject().matrixWorld
          )
        : target;

    this.getThreeObject().lookAt(targetPosition);
  }

  /**
   * 平滑朝向某个目标
   * @param target 目标位置或目标Node3d对象
   * @param speed 旋转速度系数（越大越快）
   * @param deltaTime 帧时间间隔
   * @returns 是否已完成朝向（接近目标）
   */
  smoothLookAt(
    target: THREE.Vector3 | Node3d,
    speed: number = 2.0,
    deltaTime: number
  ): boolean {
    const obj = this.getThreeObject();

    // 获取目标世界位置
    const targetPosition =
      target instanceof Node3d
        ? new THREE.Vector3().setFromMatrixPosition(
            target.getThreeObject().matrixWorld
          )
        : target.clone();

    // 计算目标方向
    const currentPosition = new THREE.Vector3();
    obj.getWorldPosition(currentPosition);
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, currentPosition)
      .normalize();

    // 创建一个临时的目标四元数
    const targetQuaternion = new THREE.Quaternion();
    const m = new THREE.Matrix4();
    m.lookAt(currentPosition, targetPosition, obj.up);
    targetQuaternion.setFromRotationMatrix(m);

    // 平滑插值到目标朝向
    obj.quaternion.slerp(targetQuaternion, Math.min(speed * deltaTime, 1));

    // 检查是否接近目标朝向
    return obj.quaternion.angleTo(targetQuaternion) < 0.01;
  }

  /**
   * 匀速移动到目标位置
   * @param targetPosition 目标位置
   * @param speed 移动速度（单位：单位/秒）
   * @param deltaTime 帧时间间隔
   * @returns 是否已到达目标位置
   */
  moveTowards(
    targetPosition: THREE.Vector3,
    speed: number,
    deltaTime: number
  ): boolean {
    const obj = this.getThreeObject();
    const currentPos = obj.position.clone();

    // 计算方向和距离
    const direction = new THREE.Vector3().subVectors(
      targetPosition,
      currentPos
    );
    const distance = direction.length();

    // 如果已经非常接近目标，直接设置到目标位置
    if (distance < 0.01) {
      obj.position.copy(targetPosition);
      return true;
    }

    // 计算这一帧应该移动的距离
    const moveDistance = Math.min(speed * deltaTime, distance);

    // 更新位置
    obj.position.add(direction.normalize().multiplyScalar(moveDistance));

    return false;
  }

  /**
   * 使用平滑过渡移动到目标位置
   * @param targetPosition 目标位置
   * @param duration 过渡持续时间（秒）
   * @param easing 缓动系数 (0-1之间，0为线性，1为最大缓动)
   */
  smoothMoveTo(
    targetPosition: THREE.Vector3,
    duration: number = 1.0,
    easing: number = 0.2
  ): void {
    // 创建一个过渡动画
    const startPosition = this.getThreeObject().position.clone();
    const startTime = Date.now() / 1000;

    // 创建动画任务并添加到更新循环中
    const animationTask = (deltaTime: number): boolean => {
      const currentTime = Date.now() / 1000;
      const elapsedTime = currentTime - startTime;

      if (elapsedTime >= duration) {
        // 动画结束，设置到最终位置
        this.getThreeObject().position.copy(targetPosition);
        return true; // 返回true表示动画完成，可以从更新列表中移除
      }

      // 计算进度 (0-1)
      let t = elapsedTime / duration;

      // 应用缓动函数 (简单的缓入缓出)
      if (easing > 0) {
        t =
          t < 0.5
            ? Math.pow(2 * t, 1 + easing) / 2
            : 1 - Math.pow(2 * (1 - t), 1 + easing) / 2;
      }

      // 插值计算新位置
      const newPosition = new THREE.Vector3().lerpVectors(
        startPosition,
        targetPosition,
        t
      );
      this.getThreeObject().position.copy(newPosition);

      return false; // 动画未完成
    };

    // 这里你需要将animationTask添加到你的动画系统中
    // 例如：this.scene.addAnimationTask(animationTask);
    // 或者在Node3d中维护一个动画任务列表
    this.addAnimationTask(animationTask);
  }

  /**
   * 添加动画任务 (这个方法需要在Node3d类中实现)
   * @param task 动画任务函数
   */
  private animationTasks: ((deltaTime: number) => boolean)[] = [];

  addAnimationTask(task: (deltaTime: number) => boolean): void {
    this.animationTasks.push(task);
  }

  /**
   * 批量添加子节点
   * @param nodes 要添加的子节点数组
   */
  public addChildren(nodes: Node3d[]): void {
    nodes.forEach((node) => this.addChild(node));
  }

  /**
   * 分离所有子节点
   * @returns 分离的子节点数组
   */
  public detachChildren(): Node3d[] {
    const detachedChildren = [...this._children];
    detachedChildren.forEach((child) => this.removeChild(child));
    return detachedChildren;
  }

  /**
   * 替换子节点
   * @param oldChild 要替换的子节点
   * @param newChild 新的子节点
   * @returns 是否替换成功
   */
  public replaceChild(oldChild: Node3d, newChild: Node3d): boolean {
    const index = this._children.indexOf(oldChild);
    if (index !== -1) {
      // 移除旧节点
      this.removeChild(oldChild);

      // 如果新节点已经有父节点，从原父节点中分离
      if (newChild.parent) {
        newChild.parent.removeChild(newChild);
      }

      // 在相同的索引位置插入新节点
      this._children.splice(index, 0, newChild);
      newChild.parent = this;
      this.threeObject.add(newChild.threeObject);
      return true;
    }
    return false;
  }

  /**
   * 复制节点（浅复制，不包括子节点）
   * @returns 新创建的节点副本
   */
  public clone(): Node3d {
    const clone = new Node3d(this._name);

    // 复制变换
    clone.position = this.position.clone();
    clone.rotation.copy(this.rotation);
    clone.scale.copy(this.scale);

    // 复制标签
    this.getTags().forEach((tag) => clone.addTag(tag));

    // 复制类型
    clone.setType(this.type);

    return clone;
  }

  /**
   * 深度复制节点（包括所有子节点）
   * @returns 新创建的节点树
   */
  public deepClone(): Node3d {
    const clone = this.clone();

    // 递归复制所有子节点
    this._children.forEach((child) => {
      const childClone = child.deepClone();
      clone.addChild(childClone);
    });

    return clone;
  }

  /**
   * 按深度优先顺序遍历节点树
   * @param callback 对每个节点执行的回调函数
   * @param includeThis 是否包含当前节点
   */
  public traverse(
    callback: (node: Node3d) => void,
    includeThis: boolean = true
  ): void {
    if (includeThis) {
      callback(this);
    }

    this._children.forEach((child) => {
      child.traverse(callback, true);
    });
  }

  /**
   * 按广度优先顺序遍历节点树
   * @param callback 对每个节点执行的回调函数
   * @param includeThis 是否包含当前节点
   */
  public traverseBreadthFirst(
    callback: (node: Node3d) => void,
    includeThis: boolean = true
  ): void {
    const queue: Node3d[] = includeThis ? [this] : [...this._children];

    while (queue.length > 0) {
      const node = queue.shift()!;
      callback(node);

      // 将子节点添加到队列末尾
      queue.push(...node._children);
    }
  }

  /**
   * 获取该节点的完整路径（格式：root/parent/child）
   * @returns 节点路径字符串
   */
  public getPath(): string {
    if (!this.parent) {
      return this._name;
    }

    return `${this.parent.getPath()}/${this._name}`;
  }

  /**
   * 是否为指定节点的祖先
   * @param node 要检查的节点
   * @returns 如果是祖先节点则返回true
   */
  public isAncestorOf(node: Node3d): boolean {
    let parent = node.parent;
    while (parent) {
      if (parent === this) return true;
      parent = parent.parent;
    }
    return false;
  }
  /**
   * 获取可见性状态
   */
  public get isVisible(): boolean {
    return this.threeObject.visible;
  }
  /**
   * 是否为指定节点的后代
   * @param node 要检查的节点
   * @returns 如果是后代节点则返回true
   */
  public isDescendantOf(node: Node3d): boolean {
    return node.isAncestorOf(this);
  }

  /**
   * 获取根节点
   * @returns 层次结构的根节点
   */
  public getRoot(): Node3d {
    let current: Node3d = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  /**
   * 查找最近的共同祖先
   * @param node 要比较的另一个节点
   * @returns 共同祖先，如果不存在则返回null
   */
  public findCommonAncestor(node: Node3d): Node3d | null {
    // 首先检查一个节点是否是另一个的祖先
    if (this.isAncestorOf(node)) return this;
    if (node.isAncestorOf(this)) return node;

    // 收集this的所有祖先
    const thisAncestors: Set<Node3d> = new Set();
    let parent = this.parent;
    while (parent) {
      thisAncestors.add(parent);
      parent = parent.parent;
    }

    // 检查另一个节点的祖先是否在this的祖先集合中
    parent = node.parent;
    while (parent) {
      if (thisAncestors.has(parent)) return parent;
      parent = parent.parent;
    }

    return null;
  }
// src/engine/core/Node3d.ts

/**
 * 序列化为JSON
 */
public toJSON(): any {
  return {
    id: this._id,
    name: this._name,
    type: this.type,
    position: {
      x: this.threeObject.position.x,
      y: this.threeObject.position.y,
      z: this.threeObject.position.z
    },
    rotation: {
      x: this.threeObject.rotation.x,
      y: this.threeObject.rotation.y,
      z: this.threeObject.rotation.z
    },
    scale: {
      x: this.threeObject.scale.x,
      y: this.threeObject.scale.y,
      z: this.threeObject.scale.z
    },
    visible: this.threeObject.visible,
    tags: Array.from(this._tags),
    children: this._children.map(child => child.toJSON()),
    scripts: this._scripts.map(script => ({
      type: script.constructor.name,
      path: this.getScriptPath(script),
      id: script.getId(),
      enabled: script.isEnabled(),
      properties: script.getEditableProperties ? script.getEditableProperties() : {}
    }))
  };
}

/**
 * 获取脚本的引用路径
 * @param script 脚本实例
 * @returns 脚本的引用路径
 * @private
 */
private getScriptPath(script: Script): string {
  // 获取脚本的构造函数名称
  const scriptName = script.constructor.name;
  
  // 首先尝试从ScriptRegistry获取路径
  const registeredPath = ScriptRegistry.getScriptPath(scriptName);
  if (registeredPath) {
    return registeredPath;
  }
  
  // 如果没有注册路径，生成一个默认路径
  // 在实际应用中，建议始终使用ScriptRegistry注册脚本及其路径
  return `${script.path}${scriptName}`;
}
  /**
   * 获取节点所在的场景
   * @returns 节点所在的场景，如果不在任何场景中则返回undefined
   */
  public getScene(): any {
    try {
      const engine = this.getEngine();
      const scene = engine.getScene();
      
      // 检查当前节点是否在场景树中
      if (!this.isInSceneTree()) {
        return undefined;
      }
      
      // 获取根节点
      const root = this.getRoot();
      
      // 检查根节点是否是场景的直接子节点或场景本身
      if (scene === root || scene.findNodeById(root.getId())) {
        return scene;
      }
      
      return undefined;
    } catch (error) {
      console.error("获取场景失败:", error);
      return undefined;
    }
  }

  // 添加 getter/setter 方法
  get id(): string {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get tags(): string[] {
    return Array.from(this._tags);
  }

  get children(): Node3d[] {
    return this._children;
  }

  get scripts(): Script[] {
    return this._scripts;
  }

  set isVisible(value: boolean) {
    this.threeObject.visible = value;
  }

  /**
   * 为节点创建属性面板
   * @param container 属性面板的容器元素
   * @returns 创建的属性面板实例
   */
  public createPropertyPanel(container: HTMLElement): IPropertyPanel {
    // 直接返回一个简单的IPropertyPanel实现
    return {
      container,
      targetNode: this,
      render() {
        // 简化的实现
        console.log("渲染属性面板", this.targetNode.getName());
      },
      destroy() {
        // 简化的实现
        console.log("销毁属性面板");
      }
    };
  }
}
