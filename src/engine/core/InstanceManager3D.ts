import * as THREE from 'three';
import { Node3d } from './Node3d';
import { editable, editableComponent } from './decorators';

/**
 * 实例管理器 - 用于实例化和管理大量相同的3D对象
 * 继承自 Node3d
 */
@editableComponent({
  displayName: '实例管理器',
  description: '将一个3D模型实例化为多个独立可控的对象',
  icon: 'copy',
  category: 'Performance'
})
export class InstanceManager3D extends Node3d {
  // 源模型
  private sourceObject: THREE.Object3D | null = null;
  
  // 实例数组，存储每个实例的信息
  private instances: Array<{
    id: number;
    matrix: THREE.Matrix4;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    visible: boolean;
    object: THREE.Object3D;
  }> = [];
  
  // 保存创建的控制器引用
  private controllers: Map<number, InstanceController> = new Map();
  
  // 实例化网格映射表
  private instancedMeshes: Map<THREE.Mesh, THREE.InstancedMesh> = new Map();
  
  // 当前实例ID计数
  private nextInstanceId: number = 0;

  @editable({
    displayName: '实例数量',
    description: '要创建的实例数量',
    type: 'number',
    min: 0,
    max: 10000,
    group: '实例化'
  })
  private instanceCount: number = 0;

  @editable({
    displayName: '使用GPU实例化',
    description: '是否使用GPU实例化技术来提高性能',
    type: 'boolean',
    group: '性能'
  })
  private useGPUInstancing: boolean = true;

  constructor(name: string = '实例管理器') {
    super(name);
    this.setType('InstanceManager3D');
    this.addTag('instancer');
  }

  /**
   * 设置源对象，将用于实例化
   * @param object 要实例化的源对象
   */
  setSourceObject(object: THREE.Object3D): void {
    // 清除现有实例
    this.clearInstances();
    
    // 复制源对象
    this.sourceObject = object.clone();
    
    // 创建请求的实例数量
    this.updateInstanceCount(this.instanceCount);
  }

  /**
   * 更新实例数量
   * @param count 新的实例数量
   */
  updateInstanceCount(count: number): void {
    if (!this.sourceObject) return;
    
    this.instanceCount = count;
    
    // 如果实例数量减少，移除多余实例
    while (this.instances.length > count) {
      this.removeInstance(this.instances.length - 1);
    }
    
    // 如果实例数量增加，添加新实例
    while (this.instances.length < count) {
      this.createInstance();
    }
    
    // 更新GPU实例化
    if (this.useGPUInstancing) {
      this.updateGPUInstancing();
    }
  }

  /**
   * 创建单个实例
   * @param options 可选的实例初始化参数
   * @returns 实例控制器对象
   */
  createInstance(options?: {
    position?: THREE.Vector3,
    rotation?: THREE.Euler,
    scale?: THREE.Vector3,
    visible?: boolean
  }): InstanceController {
    if (!this.sourceObject) {
      const controller = new InstanceController(-1, null, this);
      return controller;
    }
    
    const id = this.nextInstanceId++;
    
    // 创建实例对象
    const instanceObject = this.sourceObject.clone();
    
    // 初始化实例属性，允许自定义初始值
    const position = options?.position ? options.position.clone() : new THREE.Vector3();
    const rotation = options?.rotation ? options.rotation.clone() : new THREE.Euler();
    const defaultScale = new THREE.Vector3(1, 1, 1);
    if (this.sourceObject.scale) {
      defaultScale.copy(this.sourceObject.scale);
    }
    const scale = options?.scale ? options.scale.clone() : defaultScale;
    const visible = options?.visible !== undefined ? options.visible : true;
    const matrix = new THREE.Matrix4();
    
    // 应用位置、旋转和缩放到实例对象
    instanceObject.position.copy(position);
    instanceObject.rotation.copy(rotation);
    instanceObject.scale.copy(scale);
    instanceObject.visible = visible;
    
    // 计算矩阵
    matrix.compose(
      position,
      new THREE.Quaternion().setFromEuler(rotation),
      visible ? scale : new THREE.Vector3(0.00001, 0.00001, 0.00001)
    );
    
    // 存储实例信息
    const instance = {
      id,
      matrix,
      position,
      rotation,
      scale,
      visible,
      object: instanceObject
    };
    
    this.instances.push(instance);
    
    // 更新实例计数
    this.instanceCount = this.instances.length;
    
    // 如果不使用GPU实例化，直接添加到场景
    if (!this.useGPUInstancing) {
      this.getThreeObject().add(instanceObject);
    } else {
      // 关键修改：每次创建实例后，确保整个GPU实例化是最新的
      
      // 如果首次创建或者容量不足，需要重建所有GPU资源
      if (this.instancedMeshes.size === 0 || 
          [...this.instancedMeshes.values()][0].count < this.instanceCount) {
        this.updateGPUInstancing();
      } else {
        // 否则只需要更新最新实例的矩阵
        const index = this.instances.length - 1;
        this.instancedMeshes.forEach((instancedMesh) => {
          // 确保在设置矩阵前检查容量
          if (index < instancedMesh.count) {
            instancedMesh.setMatrixAt(index, matrix);
            // 强制更新GPU数据
            instancedMesh.instanceMatrix.needsUpdate = true;
          }
        });
      }
    }
    
    // 创建并存储控制器
    const controller = new InstanceController(id, instance, this);
    this.controllers.set(id, controller);
    
    // 返回实例控制器
    return controller;
  }

  /**
   * 更新GPU实例化
   */
  private updateGPUInstancing(): void {
    if (!this.sourceObject) return;
    
    // 清除现有的实例化网格
    this.instancedMeshes.forEach((instancedMesh) => {
      this.getThreeObject().remove(instancedMesh);
      instancedMesh.dispose();
    });
    this.instancedMeshes.clear();
    
    // 收集所有网格
    const meshes: THREE.Mesh[] = [];
    this.sourceObject.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        meshes.push(node);
      }
    });
    
    // 为每个网格创建实例化网格
    for (const mesh of meshes) {
      const instancedMesh = new THREE.InstancedMesh(
        mesh.geometry.clone(),
        Array.isArray(mesh.material) 
          ? mesh.material.map(m => m.clone()) 
          : mesh.material.clone(),
        this.instanceCount
      );
      
      instancedMesh.instanceMatrix.needsUpdate = true;
      this.instancedMeshes.set(mesh, instancedMesh);
      this.getThreeObject().add(instancedMesh);
    }
    
    // 更新所有实例的矩阵
    this.updateAllInstanceMatrices();
  }

  /**
   * 更新所有实例的矩阵
   */
  private updateAllInstanceMatrices(): void {
    if (!this.useGPUInstancing) return;
    
    // 更新每个实例的矩阵
    for (let i = 0; i < this.instances.length; i++) {
      const instance = this.instances[i];
      
      // 计算矩阵
      instance.matrix.compose(
        instance.position,
        new THREE.Quaternion().setFromEuler(instance.rotation),
        instance.scale
      );
      
      // 更新所有实例化网格
      this.instancedMeshes.forEach((instancedMesh) => {
        if (i < instancedMesh.count) {
          instancedMesh.setMatrixAt(i, instance.matrix);
          instancedMesh.instanceMatrix.needsUpdate = true;
        }
      });
    }
  }

  /**
   * 移除特定索引的实例
   * @param index 要移除的实例索引
   */
  private removeInstance(index: number): void {
    if (index < 0 || index >= this.instances.length) return;
    
    const instance = this.instances[index];
    
    // 如果不使用GPU实例化，从场景中移除
    if (!this.useGPUInstancing) {
      this.getThreeObject().remove(instance.object);
    }
    
    // 从数组中移除
    this.instances.splice(index, 1);
  }

  /**
   * 通过ID获取实例
   * @param id 实例ID
   * @returns 实例对象或undefined
   */
  getInstance(id: number): { 
    position: THREE.Vector3, 
    rotation: THREE.Euler, 
    scale: THREE.Vector3,
    setVisible: (visible: boolean) => void,
    isVisible: () => boolean,
    updateMatrix: () => void
  } | undefined {
    const instance = this.instances.find(inst => inst.id === id);
    
    if (!instance) return undefined;
    
    // 返回增强的实例对象，包含更新矩阵的方法
    const self = this;
    const instanceIndex = this.instances.indexOf(instance);
    
    // 创建自动更新的向量和欧拉对象
    const position = this.createAutoUpdateVector3(instance.position, instanceIndex);
    const rotation = this.createAutoUpdateEuler(instance.rotation, instanceIndex);
    const scale = this.createAutoUpdateVector3(instance.scale, instanceIndex);
    
    return {
      position,
      rotation,
      scale,
      setVisible: function(visible: boolean) {
        instance.visible = visible;
        if (!self.useGPUInstancing) {
          instance.object.visible = visible;
        } else {
          self.updateInstanceMatrix(instanceIndex);
        }
      },
      isVisible: function() {
        return instance.visible;
      },
      updateMatrix: function() {
        // 更新实例矩阵
        if (self.useGPUInstancing) {
          self.updateInstanceMatrix(instanceIndex);
        }
      }
    };
  }

  /**
   * 创建自动更新的Vector3对象
   * @private
   */
  private createAutoUpdateVector3(vector: THREE.Vector3, instanceIndex: number): THREE.Vector3 {
    const self = this;
    const originalSet = vector.set;
    const originalCopy = vector.copy;
    
    vector.set = function(x: number, y: number, z: number) {
      const result = originalSet.call(this, x, y, z);
      self.updateInstanceMatrix(instanceIndex);
      return result;
    };
    
    vector.copy = function(v: THREE.Vector3) {
      const result = originalCopy.call(this, v);
      self.updateInstanceMatrix(instanceIndex);
      return result;
    };
    
    // 可以添加更多需要重写的方法...
    
    return vector;
  }

  /**
   * 创建自动更新的Euler对象
   * @private
   */
  private createAutoUpdateEuler(euler: THREE.Euler, instanceIndex: number): THREE.Euler {
    const self = this;
    const originalSet = euler.set;
    const originalCopy = euler.copy;
    
    euler.set = function(x: number, y: number, z: number, order?: string) {
      const result = originalSet.call(this, x, y, z, order);
      self.updateInstanceMatrix(instanceIndex);
      return result;
    };
    
    euler.copy = function(e: THREE.Euler) {
      const result = originalCopy.call(this, e);
      self.updateInstanceMatrix(instanceIndex);
      return result;
    };
    
    return euler;
  }

  /**
   * 获取实例控制器
   * @param id 实例ID
   * @returns 实例控制器对象
   */
  getInstanceController(id: number): InstanceController | null {
    // 如果已存在控制器，直接返回
    if (this.controllers.has(id)) {
      return this.controllers.get(id) || null;
    }
    
    // 查找实例
    const instance = this.instances.find(inst => inst.id === id);
    if (!instance) return null;
    
    // 创建新控制器
    const controller = new InstanceController(id, instance, this);
    this.controllers.set(id, controller);
    
    return controller;
  }

  /**
   * 获取所有实例控制器
   * @returns 所有实例控制器数组
   */
  getAllInstanceControllers(): InstanceController[] {
    return this.instances.map(instance => {
      if (!this.controllers.has(instance.id)) {
        const controller = new InstanceController(instance.id, instance, this);
        this.controllers.set(instance.id, controller);
      }
      return this.controllers.get(instance.id)!;
    });
  }

  /**
   * 获取所有实例ID
   * @returns 所有实例ID数组
   */
  getAllInstanceIds(): number[] {
    return this.instances.map(inst => inst.id);
  }

  /**
   * 根据索引获取实例控制器
   * @param index 实例索引
   * @returns 实例控制器
   */
  getInstanceControllerByIndex(index: number): InstanceController | null {
    if (index < 0 || index >= this.instances.length) return null;
    
    const instance = this.instances[index];
    return this.getInstanceController(instance.id);
  }

  /**
   * 获取实例的位置
   * @param index 实例索引
   */
  getInstancePosition(index: number): THREE.Vector3 | null {
    if (index < 0 || index >= this.instances.length) return null;
    return this.instances[index].position.clone();
  }

  /**
   * 设置实例的位置
   * @param index 实例索引
   * @param position 新位置
   */
  setInstancePosition(index: number, position: THREE.Vector3): void {
    if (index < 0 || index >= this.instances.length) return;
    
    this.instances[index].position.copy(position);
    
    // 更新实例矩阵
    if (!this.useGPUInstancing) {
      this.instances[index].object.position.copy(position);
    } else {
      this.updateInstanceMatrix(index);
    }
  }

  /**
   * 设置实例的旋转
   * @param index 实例索引
   * @param rotation 新旋转
   */
  setInstanceRotation(index: number, rotation: THREE.Euler): void {
    if (index < 0 || index >= this.instances.length) return;
    
    this.instances[index].rotation.copy(rotation);
    
    // 更新实例
    if (!this.useGPUInstancing) {
      this.instances[index].object.rotation.copy(rotation);
    } else {
      this.updateInstanceMatrix(index);
    }
  }

  /**
   * 设置实例的缩放
   * @param index 实例索引
   * @param scale 新缩放
   */
  setInstanceScale(index: number, scale: THREE.Vector3): void {
    if (index < 0 || index >= this.instances.length) return;
    
    this.instances[index].scale.copy(scale);
    
    // 更新实例
    if (!this.useGPUInstancing) {
      this.instances[index].object.scale.copy(scale);
    } else {
      this.updateInstanceMatrix(index);
    }
  }

  /**
   * 更新特定实例的矩阵
   * @param index 实例索引
   */
  private updateInstanceMatrix(index: number): void {
    if (index < 0 || index >= this.instances.length) return;
    
    const instance = this.instances[index];
    
    // 更新矩阵
    instance.matrix.compose(
      instance.position,
      new THREE.Quaternion().setFromEuler(instance.rotation),
      instance.scale
    );
    
    // 更新所有实例化网格
    this.instancedMeshes.forEach((instancedMesh) => {
      instancedMesh.setMatrixAt(index, instance.matrix);
      instancedMesh.instanceMatrix.needsUpdate = true;
    });
  }

  /**
   * 清除所有实例
   */
  clearInstances(): void {
    // 移除所有非GPU实例化的对象
    if (!this.useGPUInstancing) {
      this.instances.forEach(instance => {
        this.getThreeObject().remove(instance.object);
      });
    }
    
    // 清除实例化网格
    this.instancedMeshes.forEach(instancedMesh => {
      this.getThreeObject().remove(instancedMesh);
      instancedMesh.dispose();
    });
    this.instancedMeshes.clear();
    
    // 清除实例数组
    this.instances = [];
  }

  /**
   * 随机分布实例在一个区域内
   * @param min 区域最小坐标
   * @param max 区域最大坐标
   */
  distributeRandomly(min: THREE.Vector3, max: THREE.Vector3): void {
    for (let i = 0; i < this.instances.length; i++) {
      const x = min.x + Math.random() * (max.x - min.x);
      const y = min.y + Math.random() * (max.y - min.y);
      const z = min.z + Math.random() * (max.z - min.z);
      
      this.setInstancePosition(i, new THREE.Vector3(x, y, z));
      
      // 随机旋转
      const rx = Math.random() * Math.PI * 2;
      const ry = Math.random() * Math.PI * 2;
      const rz = Math.random() * Math.PI * 2;
      this.setInstanceRotation(i, new THREE.Euler(rx, ry, rz));
    }
  }

  /**
   * 按网格布局分布实例
   * @param dimensions 网格尺寸 [x, y, z]
   * @param spacing 网格间距
   * @param center 是否居中
   */
  distributeGrid(dimensions: [number, number, number], spacing: number, center: boolean = true): void {
    const [xCount, yCount, zCount] = dimensions;
    let index = 0;
    
    // 计算偏移以使网格居中
    let xOffset = 0;
    let yOffset = 0;
    let zOffset = 0;
    
    if (center) {
      xOffset = -((xCount - 1) * spacing) / 2;
      yOffset = -((yCount - 1) * spacing) / 2;
      zOffset = -((zCount - 1) * spacing) / 2;
    }
    
    // 生成网格
    for (let z = 0; z < zCount; z++) {
      for (let y = 0; y < yCount; y++) {
        for (let x = 0; x < xCount; x++) {
          if (index >= this.instances.length) break;
          
          const position = new THREE.Vector3(
            x * spacing + xOffset,
            y * spacing + yOffset,
            z * spacing + zOffset
          );
          
          this.setInstancePosition(index, position);
          index++;
        }
      }
    }
  }

  /**
   * 在运行时切换GPU实例化
   * @param useGPU 是否使用GPU实例化
   */
  setUseGPUInstancing(useGPU: boolean): void {
    if (this.useGPUInstancing === useGPU) return;
    
    this.useGPUInstancing = useGPU;
    
    // 如果源对象存在，重新创建实例
    if (this.sourceObject) {
      const count = this.instanceCount;
      this.clearInstances();
      this.updateInstanceCount(count);
    }
  }

  /**
   * 覆盖更新方法
   */
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // 这里可以实现自定义更新逻辑，例如实例动画
  }

  /**
   * 覆盖销毁方法
   */
  destroy(): void {
    this.clearInstances();
    this.sourceObject = null;
    this.controllers.clear();
    super.destroy();
  }

  /**
   * 序列化为JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.instanceCount = this.instanceCount;
    json.useGPUInstancing = this.useGPUInstancing;
    return json;
  }

  /**
   * 获取当前场景
   */
  getScene(): any {
    // 假设Node3d有getScene方法，或者通过向上遍历节点树找到场景
    return this.getRoot ? this.getRoot() : null;
  }
}

/**
 * 实例控制器类 - 提供对实例的控制和与场景的交互
 */
class InstanceController {
  private id: number;
  private manager: InstanceManager3D;
  private bindedNodes: Map<string, any> = new Map();
  
  constructor(id: number, instance: any, manager: InstanceManager3D) {
    this.id = id;
    this.manager = manager;
  }
  
  /**
   * 获取实例ID
   */
  getId(): number {
    return this.id;
  }
  
  /**
   * 获取当前实例对象
   * @private
   */
  private getInstance(): any {
    return this.manager.getInstance(this.id);
  }
  
  /**
   * 获取位置引用 - 修改此向量会直接影响实例
   */
  get position(): THREE.Vector3 | null {
    const instance = this.getInstance();
    return instance?.position || null;
  }
  
  /**
   * 获取旋转引用 - 修改此欧拉角会直接影响实例
   */
  get rotation(): THREE.Euler | null {
    const instance = this.getInstance();
    return instance?.rotation || null;
  }
  
  /**
   * 获取缩放引用 - 修改此向量会直接影响实例
   */
  get scale(): THREE.Vector3 | null {
    const instance = this.getInstance();
    return instance?.scale || null;
  }
  
  /**
   * 设置位置
   */
  setPosition(position: THREE.Vector3): this {
    const instance = this.getInstance();
    if (instance) {
      instance.position.copy(position);
      instance.updateMatrix();
    }
    return this;
  }
  
  /**
   * 设置旋转
   */
  setRotation(rotation: THREE.Euler): this {
    const instance = this.getInstance();
    if (instance) {
      instance.rotation.copy(rotation);
      instance.updateMatrix();
    }
    return this;
  }
  
  /**
   * 设置缩放
   */
  setScale(scale: THREE.Vector3): this {
    const instance = this.getInstance();
    if (instance) {
      instance.scale.copy(scale);
      instance.updateMatrix();
    }
    return this;
  }
  
  /**
   * 设置可见性
   */
  setVisible(visible: boolean): this {
    const instance = this.getInstance();
    if (instance) {
      instance.setVisible(visible);
    }
    return this;
  }
  
  /**
   * 获取可见性
   */
  isVisible(): boolean {
    const instance = this.getInstance();
    return instance ? instance.isVisible() : false;
  }
  
  /**
   * 获取原始THREE对象 (仅非GPU实例化时可用)
   */
  getObject(): THREE.Object3D | null {
    // 此方法需要通过manager获取，因为getInstance返回的是增强对象
    const instance = this.manager['instances'].find(inst => inst.id === this.id);
    if (!instance || this.manager['useGPUInstancing']) return null;
    return instance.object;
  }
  
  /**
   * 获取实例管理器
   */
  getManager(): InstanceManager3D {
    return this.manager;
  }
  
  /**
   * 获取当前场景
   */
  getScene(): any {
    return this.manager.getScene();
  }
  
  /**
   * 根据查询条件查找场景节点
   * @param query 节点查询条件
   */
  getNode(query: string | { type?: string, tag?: string } | Function): any | null {
    const scene = this.getScene();
    if (!scene) return null;
    
    if (typeof query === 'string') {
      // 按名称查询
      return scene.getNodeByName(query);
    } else if (typeof query === 'function') {
      // 自定义查询函数
      return scene.findNode(query);
    } else if (query && typeof query === 'object') {
      // 按类型或标签查询
      if (query.type) {
        return scene.getNodesByType(query.type)[0] || null;
      }
      if (query.tag) {
        return scene.getNodesByTag(query.tag)[0] || null;
      }
    }
    
    return null;
  }
  
  /**
   * 根据查询条件查找多个场景节点
   * @param query 节点查询条件
   */
  getNodes(query: { type?: string, tag?: string } | Function): any[] {
    const scene = this.getScene();
    if (!scene) return [];
    
    if (typeof query === 'function') {
      // 自定义查询函数
      return scene.findNodes(query);
    } else if (query && typeof query === 'object') {
      // 按类型或标签查询
      if (query.type) {
        return scene.getNodesByType(query.type);
      }
      if (query.tag) {
        return scene.getNodesByTag(query.tag);
      }
    }
    
    return [];
  }
  
  /**
   * 绑定场景节点到此控制器
   * @param alias 节点别名
   * @param query 节点查询条件
   */
  bindNode(alias: string, query: string | { type?: string, tag?: string } | Function): this {
    const node = this.getNode(query);
    if (node) {
      this.bindedNodes.set(alias, node);
    }
    return this;
  }
  
  /**
   * 绑定多个场景节点
   * @param bindings 节点绑定配置
   */
  bindNodes(bindings: Record<string, string | { type?: string, tag?: string } | Function>): this {
    Object.entries(bindings).forEach(([alias, query]) => {
      this.bindNode(alias, query);
    });
    return this;
  }
  
  /**
   * 解除节点绑定
   * @param alias 要解除绑定的节点别名
   */
  unbindNode(alias: string): this {
    this.bindedNodes.delete(alias);
    return this;
  }
  
  /**
   * 获取绑定的节点
   * @param alias 节点别名
   */
  getBoundNode(alias: string): any | null {
    return this.bindedNodes.get(alias) || null;
  }
  
  /**
   * 检查是否有指定别名的绑定节点
   * @param alias 节点别名
   */
  hasBoundNode(alias: string): boolean {
    return this.bindedNodes.has(alias);
  }
  
  /**
   * 与绑定节点交互
   * @param alias 节点别名
   * @param callback 回调函数
   */
  with<T>(alias: string, callback: (node: any) => T): T | null {
    const node = this.getBoundNode(alias);
    if (!node) return null;
    return callback(node);
  }
  
  /**
   * 向绑定节点发送消息
   * @param alias 节点别名
   * @param message 消息名称
   * @param data 消息数据
   */
  send(alias: string, message: string, data?: any): this {
    const node = this.getBoundNode(alias);
    if (node && typeof node.receiveMessage === 'function') {
      node.receiveMessage(message, {
        sender: this,
        id: this.id,
        data
      });
    }
    return this;
  }
  
  /**
   * 向所有绑定节点广播消息
   * @param message 消息名称
   * @param data 消息数据
   */
  broadcast(message: string, data?: any): this {
    this.bindedNodes.forEach(node => {
      if (node && typeof node.receiveMessage === 'function') {
        node.receiveMessage(message, {
          sender: this,
          id: this.id,
          data
        });
      }
    });
    return this;
  }
  
  /**
   * 创建跟随行为
   * @param targetAlias 目标节点别名
   * @param options 跟随选项
   */
  follow(targetAlias: string, options?: { speed?: number, minDistance?: number }): this {
    const target = this.getBoundNode(targetAlias);
    if (!target) return this;
    
    const speed = options?.speed || 1.0;
    const minDistance = options?.minDistance || 0.1;
    
    this.setupUpdateCallback((deltaTime) => {
      if (!target.position) return;
      
      const instance = this.getInstance();
      if (!instance) return;
      
      const dir = new THREE.Vector3().subVectors(target.position, instance.position);
      
      if (dir.length() > minDistance) {
        dir.normalize().multiplyScalar(speed * deltaTime);
        instance.position.add(dir);
        instance.updateMatrix();
      }
    });
    
    return this;
  }
  
  /**
   * 创建注视行为
   * @param targetAlias 目标节点别名
   */
  lookAt(targetAlias: string): this {
    const target = this.getBoundNode(targetAlias);
    if (!target) return this;
    
    this.setupUpdateCallback((deltaTime) => {
      if (!target.position) return;
      
      const instance = this.getInstance();
      if (!instance) return;
      
      // 计算朝向目标的方向
      const direction = new THREE.Vector3().subVectors(target.position, instance.position);
      if (direction.length() > 0.001) {
        // 创建lookAt矩阵
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(
          instance.position,
          target.position,
          new THREE.Vector3(0, 1, 0)
        );
        
        // 从矩阵中提取旋转
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
        const rotation = new THREE.Euler().setFromQuaternion(quaternion);
        
        // 更新旋转
        instance.rotation.copy(rotation);
        instance.updateMatrix();
      }
    });
    
    return this;
  }
  
  /**
   * 设置实例更新回调
   * @param callback 更新回调函数
   * @param id 回调ID，用于移除
   */
  private setupUpdateCallback(callback: (deltaTime: number) => void, id?: string): void {
    const callbackId = id || `callback_${Date.now()}_${Math.random()}`;
    
    // 确保manager的update方法会调用这些回调
    if (!this.manager['_updateCallbacksInitialized']) {
      this.manager['_updateCallbacksInitialized'] = true;
      
      // 扩展manager的update方法
      const originalUpdate = this.manager.update;
      this.manager.update = function(deltaTime: number) {
        originalUpdate.call(this, deltaTime);
        
        // 调用每个控制器的回调
        if (!this._controllerCallbacks) this._controllerCallbacks = new Map();
        this._controllerCallbacks.forEach((callbacks, instanceId) => {
          callbacks.forEach((cb: any) => {
            cb.callback(deltaTime);
          });
        });
      };
    }
    
    // 初始化回调Map
    if (!this.manager['_controllerCallbacks']) {
      this.manager['_controllerCallbacks'] = new Map();
    }
    
    // 获取此实例的回调数组
    if (!this.manager['_controllerCallbacks'].has(this.id)) {
      this.manager['_controllerCallbacks'].set(this.id, []);
    }
    
    // 添加回调
    this.manager['_controllerCallbacks'].get(this.id).push({
      id: callbackId,
      callback
    });
  }
  
  /**
   * 移除实例更新回调
   * @param id 回调ID
   */
  removeUpdateCallback(id: string): this {
    if (!this.manager['_controllerCallbacks'] || 
        !this.manager['_controllerCallbacks'].has(this.id)) {
      return this;
    }
    
    const callbacks = this.manager['_controllerCallbacks'].get(this.id);
    this.manager['_controllerCallbacks'].set(
      this.id,
      callbacks.filter((cb: any) => cb.id !== id)
    );
    
    return this;
  }
  
  /**
   * 自定义函数 - 允许对实例执行任意操作
   * @param callback 回调函数
   */
  custom(callback: (instance: any, controller: this) => void): this {
    const instance = this.getInstance();
    if (instance) {
      callback(instance, this);
    }
    return this;
  }
} 