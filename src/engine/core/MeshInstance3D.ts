import * as THREE from 'three';
import { Node3d } from './Node3d';
import { editable, editableComponent } from './decorators';
import Stats from 'three/examples/jsm/libs/stats.module.js'

/**
 * 材质编辑选项
 */
export interface MaterialEditOptions {
  wireframe?: boolean;          // 线框模式
  flatShading?: boolean;        // 平面着色
  vertexColors?: boolean;       // 顶点颜色
  transparency?: number;        // 透明度
  color?: number;               // 颜色
  metalness?: number;           // 金属度
  roughness?: number;           // 粗糙度
  emissive?: number;            // 自发光颜色
  emissiveIntensity?: number;   // 自发光强度
}

/**
 * MeshInstance3D 类 - 表示可渲染的3D网格实例
 * 继承自 Node3d，添加了网格、几何体和材质支持
 */
@editableComponent({
  displayName: '网格实例',
  description: '可渲染的3D网格对象',
  icon: 'cube',
  category: 'Renderable'
})
export class MeshInstance3D extends Node3d {
  // THREE.js 网格对象
  private mesh: THREE.Mesh | THREE.InstancedMesh;
  
  // 性能监控实例
  private static stats: Stats;
  
  // 实例化渲染相关属性
  private _isInstanced: boolean = false;
  private _instanceCount: number = 1;
  private _instanceMatrix: THREE.InstancedBufferAttribute;
  
  @editable({
    displayName: '使用实例化',
    description: '启用实例化渲染以提高性能',
    type: 'boolean',
    group: '性能'
  })
  private _useInstancing: boolean = false;
  
  @editable({
    displayName: '实例数量',
    description: '实例化渲染时的实例数量',
    type: 'number',
    min: 1,
    max: 10000,
    step: 1,
    group: '性能',
    showIf: '_useInstancing'
  })
  private _maxInstances: number = 100;
  
  // 几何体引用
  private geometry: THREE.BufferGeometry;
  @editable({
    displayName: '材质类型',
    description: '网格的材质类型',
    type: 'string',
    group: '材质'
  })
  // 材质引用
  private material: THREE.Material;
  
  // 可编辑属性
  @editable({
    displayName: '投射阴影',
    description: '此对象是否投射阴影',
    type: 'boolean',
    group: '渲染'
  })
  private _castShadow: boolean = false;
  
  @editable({
    displayName: '接收阴影',
    description: '此对象是否接收阴影',
    type: 'boolean',
    group: '渲染'
  })
  private _receiveShadow: boolean = false;
  
  @editable({
    displayName: '透明度',
    description: '对象的透明度',
    type: 'slider',
    min: 0,
    max: 1,
    step: 0.01,
    group: '外观'
  })
  private _transparency: number = 0;
  
 
  private _materialType: string;
  
  private customUniforms: { [uniform: string]: THREE.IUniform } = {};
  
  /**
   * 构造函数
   * @param name 节点名称
   * @param geometry 几何体（可选）
   * @param material 材质（可选）
   */
  constructor(
    name: string = '网格实例', 
    geometry?: THREE.BufferGeometry, 
    material?: THREE.Material | ShaderMaterialOptions
  ) {
    super(name);
    
    // 设置默认几何体
    this.geometry = geometry || new THREE.BoxGeometry(1, 1, 1);
    
    // 处理材质
    if (material instanceof THREE.Material) {
      this.material = material;
    } else if (material) {
      // 如果提供了shader选项，创建自定义shader材质
      this.material = this.createShaderMaterial(material);
    } else {
      // 默认材质
      this.material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    }
    
    // 创建网格并添加到THREE对象
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.getThreeObject().add(this.mesh);
    
    // 初始化性能监控（如果还没有初始化）
    if (!MeshInstance3D.stats) {
      this.initPerformanceMonitoring();
    }
    
    // 设置类型标识
    this.setType('MeshInstance3D');
    
    // 添加标签以便于查询
    this.addTag('mesh');
    this.addTag('renderable');
    
    // 设置材质类型
    this._materialType = this.material.type;
  }
  
  /**
   * 初始化性能监控
   */
  private initPerformanceMonitoring(): void {
    MeshInstance3D.stats = new Stats();
    MeshInstance3D.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
    
    // 添加到DOM
    MeshInstance3D.stats.dom.style.position = 'absolute';
    MeshInstance3D.stats.dom.style.top = '0px';
    MeshInstance3D.stats.dom.style.left = '0px';
    document.body.appendChild(MeshInstance3D.stats.dom);
  }
  
  /**
   * 更新性能监控
   */
  public static updateStats(): void {
    if (MeshInstance3D.stats) {
      MeshInstance3D.stats.update();
    }
  }
  
  /**
   * 启用/禁用实例化渲染
   */
  public setUseInstancing(useInstancing: boolean, count?: number): void {
    if (this._useInstancing === useInstancing) return;
    
    this._useInstancing = useInstancing;
    
    if (useInstancing) {
      // 创建实例化网格
      this.convertToInstancedMesh(count || this._maxInstances);
    } else {
      // 返回到普通网格
      this.convertToRegularMesh();
    }
  }
  
  /**
   * 转换为实例化网格
   */
  private convertToInstancedMesh(count: number): void {
    // 从场景中移除当前网格
    this.getThreeObject().remove(this.mesh);
    
    // 保存实例数量
    this._instanceCount = count;
    
    // 创建实例化网格
    const instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      count
    );
    
    // 设置实例化网格的属性
    instancedMesh.castShadow = this._castShadow;
    instancedMesh.receiveShadow = this._receiveShadow;
    instancedMesh.visible = this.isVisible();
    
    // 初始化实例矩阵
    for (let i = 0; i < count; i++) {
      const matrix = new THREE.Matrix4();
      // 默认分布在立方体区域内
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      matrix.setPosition(position);
      instancedMesh.setMatrixAt(i, matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    
    // 更新网格引用
    this.mesh = instancedMesh;
    this.getThreeObject().add(this.mesh);
    this._isInstanced = true;
  }
  
  /**
   * 转换为普通网格
   */
  private convertToRegularMesh(): void {
    // 从场景中移除当前网格
    this.getThreeObject().remove(this.mesh);
    
    // 创建普通网格
    const regularMesh = new THREE.Mesh(this.geometry, this.material);
    
    // 设置网格属性
    regularMesh.castShadow = this._castShadow;
    regularMesh.receiveShadow = this._receiveShadow;
    regularMesh.visible = this.isVisible();
    
    // 更新网格引用
    this.mesh = regularMesh;
    this.getThreeObject().add(this.mesh);
    this._isInstanced = false;
  }
  
  /**
   * 更新实例矩阵
   * @param index 实例索引
   * @param matrix 变换矩阵
   */
  public updateInstanceMatrix(index: number, matrix: THREE.Matrix4): void {
    if (!this._isInstanced || !(this.mesh instanceof THREE.InstancedMesh)) return;
    
    if (index >= 0 && index < this._instanceCount) {
      this.mesh.setMatrixAt(index, matrix);
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  
  /**
   * 设置实例颜色
   * @param index 实例索引
   * @param color 颜色
   */
  public setInstanceColor(index: number, color: THREE.Color): void {
    if (!this._isInstanced || !(this.mesh instanceof THREE.InstancedMesh)) return;
    
    if (index >= 0 && index < this._instanceCount) {
      this.mesh.setColorAt(index, color);
      if (this.mesh.instanceColor) {
        this.mesh.instanceColor.needsUpdate = true;
      }
    }
  }
  
  /**
   * 创建自定义shader材质
   */
  private createShaderMaterial(options: ShaderMaterialOptions): THREE.ShaderMaterial {
    const defaultVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const defaultFragmentShader = `
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(vUv, 0.0, 1.0);
      }
    `;

    // 合并默认uniforms和自定义uniforms
    this.customUniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2() },
      ...options.uniforms
    };

    return new THREE.ShaderMaterial({
      vertexShader: options.vertexShader || defaultVertexShader,
      fragmentShader: options.fragmentShader || defaultFragmentShader,
      uniforms: this.customUniforms,
      transparent: options.transparent ?? false,
      side: options.side ?? THREE.FrontSide,
      blending: options.blending ?? THREE.NormalBlending,
      depthWrite: options.depthWrite ?? true,
      depthTest: options.depthTest ?? true
    });
  }
  
  /**
   * 更新shader uniforms
   */
  public updateUniforms(uniforms: { [uniform: string]: any }): void {
    if (this.material instanceof THREE.ShaderMaterial) {
      Object.entries(uniforms).forEach(([key, value]) => {
        if (this.material.uniforms[key]) {
          this.material.uniforms[key].value = value;
        }
      });
    }
  }
  
  /**
   * 设置新的shader
   */
  public setShader(options: ShaderMaterialOptions): void {
    const newMaterial = this.createShaderMaterial(options);
    this.material.dispose(); // 清理旧材质
    this.material = newMaterial;
    this.mesh.material = newMaterial;
  }
  
  /**
   * 获取网格对象
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }
  
  /**
   * 设置网格
   * @param mesh 新的网格对象
   */
  setMesh(mesh: THREE.Mesh): void {
    // 移除旧的网格
    this.getThreeObject().remove(this.mesh);
    
    // 添加新的网格
    this.mesh = mesh;
    this.getThreeObject().add(this.mesh);
    
    // 更新几何体和材质引用
    this.geometry = mesh.geometry;
    this.material = mesh.material;
    
    // 更新材质类型
    this._materialType = this.material.type;
    
    // 发出更改事件
  }
  
  /**
   * 获取几何体
   */
  getGeometry(): THREE.BufferGeometry {
    return this.geometry;
  }
  
  /**
   * 设置几何体
   * @param geometry 新的几何体
   */
  setGeometry(geometry: THREE.BufferGeometry): void {
    this.geometry.dispose(); // 清理旧几何体
    this.geometry = geometry;
    this.mesh.geometry = geometry;
    
    // 发出更改事件
  }
  
  /**
   * 获取材质
   */
  getMaterial(): THREE.Material {
    return this.material;
  }
  
  /**
   * 设置材质
   * @param material 新的材质
   */
  setMaterial(material: THREE.Material | ShaderMaterialOptions): void {
    if (material instanceof THREE.Material) {
      this.material.dispose(); // 清理旧材质
      this.material = material;
    } else {
      this.setShader(material);
    }
    this.mesh.material = this.material;
    
    // 更新材质类型
    this._materialType = this.material.type;
    
    // 发出更改事件
  }
  
  /**
   * 设置阴影投射
   * @param castShadow 是否投射阴影
   */
  setCastShadow(castShadow: boolean): void {
    this._castShadow = castShadow;
    this.mesh.castShadow = castShadow;
  }
  
  /**
   * 获取阴影投射状态
   */
  getCastShadow(): boolean {
    return this._castShadow;
  }
  
  /**
   * 设置阴影接收
   * @param receiveShadow 是否接收阴影
   */
  setReceiveShadow(receiveShadow: boolean): void {
    this._receiveShadow = receiveShadow;
    this.mesh.receiveShadow = receiveShadow;
  }
  
  /**
   * 获取阴影接收状态
   */
  getReceiveShadow(): boolean {
    return this._receiveShadow;
  }
  
  /**
   * 设置可见性
   * @param visible 是否可见
   */
  setVisible(visible: boolean): void {
    super.setVisible(visible);
    this.mesh.visible = visible;
  }
  
  /**
   * 设置透明度
   * @param value 透明度值（0-1）
   */
  setTransparency(value: number): void {
    this._transparency = value;
    
    if ((this.material as any).transparent !== undefined) {
      (this.material as any).transparent = value > 0;
      (this.material as any).opacity = 1 - value;
    }
  }
  
  /**
   * 获取透明度
   */
  getTransparency(): number {
    return this._transparency;
  }
  
  /**
   * 设置自定义边界盒
   * @param min 最小点坐标
   * @param max 最大点坐标
   */
  setCustomBoundingBox(min: THREE.Vector3, max: THREE.Vector3): void {
    if (!this.geometry.boundingBox) {
      this.geometry.boundingBox = new THREE.Box3();
    }
    this.geometry.boundingBox.set(min, max);
    this.geometry.boundingSphere = null;
    this.geometry.computeBoundingSphere();
  }
  
  /**
   * 重写克隆方法
   */
  clone(): MeshInstance3D {
    const geometry = this.geometry.clone();
    
    const clone = new MeshInstance3D(this.getName() + ' (克隆)', geometry, this.material);
    
    // 复制变换
    clone.setPosition(this.getPosition().clone());
    clone.setRotation(this.getRotation().clone());
    clone.setScale(this.getScale().clone());
    
    // 复制阴影设置
    clone.setCastShadow(this.getCastShadow());
    clone.setReceiveShadow(this.getReceiveShadow());
    
    // 复制可见性
    clone.setVisible(this.isVisible());
    
    // 复制标签
    this.getTags().forEach(tag => clone.addTag(tag));
    
    return clone;
  }
  
  /**
   * 覆盖销毁方法
   */
  destroy(): void {
    // 释放几何体
    if (this.geometry) {
      this.geometry.dispose();
    }
    
    // 释放材质
    if (this.material) {
      this.material.dispose();
    }
    
    // 从父对象移除网格
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    
    // 调用父类的销毁方法
    super.destroy();
  }
  
  /**
   * 覆盖更新方法
   */
  update(deltaTime: number): void {
    // 更新性能统计
    MeshInstance3D.updateStats();
    
    // 首先调用父类的更新方法
    super.update(deltaTime);
    
    // 在这里可以添加特定于网格的更新逻辑
    // 例如：动画更新、材质更新等
    
    // 更新shader中的time uniform
    if (
      this.material instanceof THREE.ShaderMaterial &&
      this.material.uniforms.time
    ) {
      this.material.uniforms.time.value += deltaTime;
    }
  }
  
  /**
   * 序列化为JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    
    // 添加网格特定数据
    json.geometry = {
      type: this.geometry.type,
      parse:this.geometry.toJSON()
    };
    
    // 添加材质信息
    json.material = {
      type: this.material.type,
      parse:this.material.toJSON()
      // 可以添加更多材质属性
    };
    
    // 添加实例化信息
    json.instancing = {
      enabled: this._useInstancing,
      count: this._instanceCount
    };
    
    return json;
  }

  /**
   * 设置材质选项
   * @param options 材质选项
   */
  @editable({
    displayName: '设置材质选项',
    description: '配置材质渲染选项',
    type: 'function',
    group: '材质'
  })
  public setMaterialOptions(options: MaterialEditOptions): void {
    if (!this.material) return;

    const material = this.material;
    
    // 通用属性检查和设置
    if (options.wireframe !== undefined && 'wireframe' in material) {
      (material as THREE.MeshBasicMaterial).wireframe = options.wireframe;
    }
    
    if (options.flatShading !== undefined && 'flatShading' in material) {
      (material as THREE.MeshStandardMaterial).flatShading = options.flatShading;
      material.needsUpdate = true;
    }
    
    if (options.vertexColors !== undefined && 'vertexColors' in material) {
      (material as THREE.MeshStandardMaterial).vertexColors = options.vertexColors;
      material.needsUpdate = true;
    }
    
    if (options.transparency !== undefined) {
      material.transparent = options.transparency > 0;
      material.opacity = 1 - options.transparency;
    }
    
    if (options.color !== undefined && 'color' in material) {
      (material as THREE.MeshStandardMaterial).color.setHex(options.color);
    }
    
    if (options.metalness !== undefined && 'metalness' in material) {
      (material as THREE.MeshStandardMaterial).metalness = options.metalness;
    }
    
    if (options.roughness !== undefined && 'roughness' in material) {
      (material as THREE.MeshStandardMaterial).roughness = options.roughness;
    }
    
    if (options.emissive !== undefined && 'emissive' in material) {
      (material as THREE.MeshStandardMaterial).emissive.setHex(options.emissive);
    }
    
    if (options.emissiveIntensity !== undefined && 'emissiveIntensity' in material) {
      (material as THREE.MeshStandardMaterial).emissiveIntensity = options.emissiveIntensity;
    }
    
    // 确保更新
    material.needsUpdate = true;
  }

  /**
   * 获取材质选项
   * @returns 当前材质选项
   */
  @editable({
    displayName: '获取材质选项',
    description: '获取当前材质渲染选项',
    type: 'function',
    group: '材质'
  })
  public getMaterialOptions(): MaterialEditOptions {
    if (!this.material) {
      return {};
    }

    const options: MaterialEditOptions = {};
    const material = this.material;
    
    // 收集通用属性
    if ('wireframe' in material) {
      options.wireframe = (material as THREE.MeshBasicMaterial).wireframe;
    }
    
    if ('flatShading' in material) {
      options.flatShading = (material as THREE.MeshStandardMaterial).flatShading;
    }
    
    if ('vertexColors' in material) {
      options.vertexColors = (material as THREE.MeshStandardMaterial).vertexColors;
    }
    
    options.transparency = material.transparent ? 1 - material.opacity : 0;
    
    if ('color' in material) {
      options.color = (material as THREE.MeshStandardMaterial).color.getHex();
    }
    
    if ('metalness' in material) {
      options.metalness = (material as THREE.MeshStandardMaterial).metalness;
    }
    
    if ('roughness' in material) {
      options.roughness = (material as THREE.MeshStandardMaterial).roughness;
    }
    
    if ('emissive' in material) {
      options.emissive = (material as THREE.MeshStandardMaterial).emissive.getHex();
    }
    
    if ('emissiveIntensity' in material) {
      options.emissiveIntensity = (material as THREE.MeshStandardMaterial).emissiveIntensity;
    }
    
    return options;
  }

  /**
   * 设置线框模式
   * @param enabled 是否启用线框模式
   */
  @editable({
    displayName: '线框模式',
    description: '设置是否显示为线框模式',
    type: 'boolean',
    group: '材质'
  })
  public setWireframe(enabled: boolean): void {
    if (!this.material || !('wireframe' in this.material)) return;
    
    (this.material as THREE.MeshBasicMaterial).wireframe = enabled;
    this.material.needsUpdate = true;
  }
  
  /**
   * 设置平面着色
   * @param enabled 是否启用平面着色
   */
  @editable({
    displayName: '平面着色',
    description: '设置是否使用平面着色（不平滑）',
    type: 'boolean',
    group: '材质'
  })
  public setFlatShading(enabled: boolean): void {
    if (!this.material || !('flatShading' in this.material)) return;
    
    (this.material as THREE.MeshStandardMaterial).flatShading = enabled;
    this.material.needsUpdate = true;
  }
  
  /**
   * 设置材质颜色
   * @param color 颜色（十六进制）
   */
  @editable({
    displayName: '材质颜色',
    description: '设置材质的基础颜色',
    type: 'color',
    group: '材质'
  })
  public setColor(color: number): void {
    if (!this.material || !('color' in this.material)) return;
    
    (this.material as THREE.MeshStandardMaterial).color.setHex(color);
  }
  
  /**
   * 设置透明度
   * @param transparency 透明度值（0-1）
   */
  @editable({
    displayName: '透明度',
    description: '设置材质的透明度（0=不透明，1=完全透明）',
    type: 'slider',
    min: 0,
    max: 1,
    step: 0.01,
    group: '材质'
  })
  public setTransparencyValue(transparency: number): void {
    if (!this.material) return;
    
    this.material.transparent = transparency > 0;
    this.material.opacity = 1 - transparency;
  }
} 