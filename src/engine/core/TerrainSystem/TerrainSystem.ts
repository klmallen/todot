import * as THREE from 'three';
import { Node3d } from '../Node3d';
import { HeightfieldData } from './HeightfieldData';
import { TerrainChunk } from './TerrainChunk';
import { TerrainMaterial } from './TerrainMaterial';
import { TerrainEditor } from './TerrainEditor';
import { TerrainOptions, TerrainLayerInfo } from './TerrainOptions';
import { editable,editableComponent } from '../decorators';


@editableComponent({
  displayName: '地形系统',
  description: '可编辑的地形系统，支持刷子工具、高程编辑等',
  icon: 'mountain',
  category: 'Environment'
})
export class TerrainSystem extends Node3d {
  private heightfield: HeightfieldData;
  private chunks: TerrainChunk[] = []; // 改为数组存储多个区块
  public material: TerrainMaterial;
  private editor: TerrainEditor;
  private initialized: boolean = false;
  
  @editable({
    displayName: '地形大小',
    description: '地形的实际尺寸（米）',
    type: 'vector2',
    group: '基础设置'
  })
  terrainSize: THREE.Vector2 = new THREE.Vector2(10, 10);
  
  @editable({
    displayName: '分辨率',
    description: '每个地形块的分辨率',
    type: 'number',
    min: 32,
    max: 4096,
    group: '基础设置'
  })
  resolution: number = 128;
  
  @editable({
    displayName: '最大高度',
    description: '地形的最大高度',
    type: 'number',
    min: 1,
    max: 1000,
    group: '基础设置'
  })
  maxHeight: number = 100;
  
  @editable({
    displayName: '区块数量 X',
    description: 'X轴方向的地形区块数量',
    type: 'number',
    min: 1,
    max: 16,
    group: '区块设置'
  })
  chunksX: number = 1;
  
  @editable({
    displayName: '区块数量 Y',
    description: 'Y轴方向的地形区块数量',
    type: 'number',
    min: 1,
    max: 16,
    group: '区块设置'
  })
  chunksY: number = 1;
  
  @editable({
    displayName: '单个区块大小',
    description: '单个地形区块的尺寸（米）',
    type: 'vector2',
    group: '区块设置'
  })
  chunkSize: THREE.Vector2 = new THREE.Vector2(100, 100);
  
  @editable({
    displayName: '材质设置',
    description: '设置地形材质属性',
    type: 'group',
    group: '材质设置'
  })
  materialSettings: boolean = true;
  
  @editable({
    displayName: '启用材质绘制',
    description: '允许在地形上绘制材质',
    type: 'boolean',
    group: '材质设置'
  })
  enableMaterialPainting: boolean = true;
  
  constructor() {
    super();
    this.editor = new TerrainEditor(this);
  }
  
  /**
   * 初始化地形系统
   */
  initialize(options?: Partial<TerrainOptions>): void {
    if (this.initialized) {
      this.dispose();
    }
    
    // 合并默认选项和提供的选项
    const opts: TerrainOptions = {
      width: options?.width || this.terrainSize.x,      // 地形宽度，单位为米，如果未提供则使用当前设置
      length: options?.length || this.terrainSize.y,    // 地形长度，单位为米，如果未提供则使用当前设置
      maxHeight: options?.maxHeight || this.maxHeight,  // 地形最大高度，如果未提供则使用当前设置
      resolution: options?.resolution || this.resolution, // 地形分辨率，决定网格精细度，如果未提供则使用当前设置
      enableLOD: options?.enableLOD || true,            // 是否启用LOD（细节层次）系统，默认启用
      enablePhysics: options?.enablePhysics || false,   // 是否启用物理系统，默认不启用
      textures: options?.textures || undefined,         // 地形纹理配置，包括漫反射和法线贴图
      lodLevels: options?.lodLevels || 3,               // LOD级别数量，默认为3级
      lodDistances: options?.lodDistances || [100, 300, 500], // 各LOD级别的切换距离阈值
      chunksX: options?.chunksX || this.chunksX,        // X轴方向的地形区块数量
      chunksY: options?.chunksY || this.chunksY,        // Y轴方向的地形区块数量
      chunkSize: options?.chunkSize || this.chunkSize   // 单个地形区块的尺寸
    };
    
    // 更新实例变量
    this.terrainSize.set(opts.width, opts.length);
    this.resolution = opts.resolution;
    this.maxHeight = opts.maxHeight;
    this.chunksX = opts.chunksX || 1;
    this.chunksY = opts.chunksY || 1;
    this.chunkSize.copy(opts.chunkSize || this.chunkSize);
    // 计算整个地形的总尺寸
    this.terrainSize.set(
      this.chunkSize.x * this.chunksX,
      this.chunkSize.y * this.chunksY
    );
    
    // 创建高度场数据（整个地形共用一个高度场）
    this.heightfield = new HeightfieldData(
      opts.resolution * Math.max(this.chunksX, this.chunksY),
      this.terrainSize.x,
      this.terrainSize.y,
      opts.maxHeight
    );
    
    // 创建平坦地形
    this.heightfield.createFlat(0);
    
    // 创建材质
    if (!this.material) {
      this.material = new TerrainMaterial();
    }
    
    // 如果提供了纹理，添加到材质
    if (opts.textures?.diffuse) {
      opts.textures.diffuse.forEach((texture, index) => {
        const normalMap = opts.textures?.normal?.[index];
        
        this.material.addLayer({
          texture: texture,
          normalMap: normalMap,
          tiling: 20,  // 默认纹理平铺值
          minHeight: index * (opts.maxHeight / opts.textures!.diffuse!.length),
          maxHeight: (index + 1) * (opts.maxHeight / opts.textures!.diffuse!.length),
          minSlope: 0,
          maxSlope: 1
        });
      });
    } else {
      // 添加默认材质
      const defaultTexture = new THREE.TextureLoader().load('/textures/terrain/grass.jpg');
      this.material.addLayer({
        texture: defaultTexture,
        tiling: 20,
        minHeight: 0,
        maxHeight: opts.maxHeight,
        minSlope: 0,
        maxSlope: 1
      });
    }
    
    // 创建地形区块网格
    this.createTerrainChunks();
    
    // 创建编辑器
    this.editor = new TerrainEditor(this);
    
    this.initialized = true;
  }
  
  /**
   * 创建地形区块网格
   */
  private createTerrainChunks(): void {
    // 清除现有区块
    for (const chunk of this.chunks) {
      chunk.dispose();
    }
    this.chunks = [];
    
    // 计算每个区块的实际尺寸
    const chunkWidth = this.chunkSize.x;
    const chunkLength = this.chunkSize.y;
    
    // 创建网格
    for (let y = 0; y < this.chunksY; y++) {
      for (let x = 0; x < this.chunksX; x++) {
        // 计算区块位置（相对于地形中心）
        const posX = (x - (this.chunksX - 1) / 2) * chunkWidth;
        const posZ = (y - (this.chunksY - 1) / 2) * chunkLength;
        
        // 创建区块
        const chunk = new TerrainChunk(
          this.heightfield,
          this.material,
          new THREE.Vector2(posX, posZ),
          new THREE.Vector2(chunkWidth, chunkLength),
          this.resolution
        );
        
        // 添加到场景和区块数组
        this.getThreeObject().add(chunk.getMesh());
        this.chunks.push(chunk);
      }

      console.log( this.chunks,' this.chunks')
    }
  }
  
  /**
   * 获取编辑器
   */
  getEditor(): TerrainEditor {
    return this.editor;
  }
  
  /**
   * 获取高度场数据
   */
  getHeightfield(): HeightfieldData {
    return this.heightfield;
  }
  
  /**
   * 获取所有地形区块
   */
  getChunks(): TerrainChunk[] {
    return this.chunks;
  }
  
  /**
   * 获取特定位置的地形区块
   */
  getChunkAt(worldX: number, worldZ: number): TerrainChunk | null {
    for (const chunk of this.chunks) {
      const mesh = chunk.getMesh();
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      const point = new THREE.Vector3(worldX, 0, worldZ);
      
      if (boundingBox.containsPoint(point)) {
        return chunk;
      }
    }
    return null;
  }
  
  /**
   * 更新地形
   */
  update(): void {
    if (!this.initialized) return;
    
    // 更新所有区块的几何体
    for (const chunk of this.chunks) {
      chunk.updateGeometry();
    }
  }
  
  /**
   * 使用噪声创建地形
   */
  generateNoiseTerrain(
    seed: number = Math.random() * 10000,
    scale: number = 100,
    octaves: number = 6,
    persistence: number = 0.5,
    lacunarity: number = 2.0
  ): void {
    if (!this.initialized) {
      this.initialize();
    }
    
    this.heightfield.generateNoise(seed, scale, octaves, persistence, lacunarity);
    this.update();
  }
  
  /**
   * 从高度图加载地形
   */
  loadFromHeightmap(imageData: ImageData): void {
    if (!this.initialized) {
      this.initialize();
    }
    
    this.heightfield.loadFromHeightmap(imageData);
    this.update();
  }
  
  /**
   * 创建平坦地形
   */
  createFlatTerrain(height: number = 0): void {
    if (!this.initialized) {
      this.initialize();
    }
    
    this.heightfield.createFlat(height);
    this.update();
  }
  
  /**
   * 添加材质层
   */
  addMaterialLayer(layer: TerrainLayerInfo): number {
    if (!this.initialized) {
      this.initialize();
    }
    
    return this.material.addLayer(layer);
  }
  
  /**
   * 更新LOD
   */
  updateLOD(cameraPosition: THREE.Vector3): void {
    if (!this.initialized) return;
    
    // 为每个区块更新LOD级别
    for (const chunk of this.chunks) {
      // 计算到相机的距离
      const distance = chunk.getCenter().distanceTo(cameraPosition);
      
      // 设置LOD级别
      if (distance > 500) {
        chunk.setLODLevel(3);
      } else if (distance > 300) {
        chunk.setLODLevel(2);
      } else if (distance > 100) {
        chunk.setLODLevel(1);
      } else {
        chunk.setLODLevel(0);
      }
    }
  }
  
  /**
   * 射线投射
   */
  raycast(raycaster: THREE.Raycaster): THREE.Intersection[] {
    if (!this.initialized) return [];
    
    // 对所有区块进行射线测试
    let intersections: THREE.Intersection[] = [];
    
    for (const chunk of this.chunks) {
      const chunkIntersections = chunk.raycast(raycaster);
      intersections = intersections.concat(chunkIntersections);
    }
    
    // 按距离排序
    intersections.sort((a, b) => a.distance - b.distance);
    
    return intersections;
  }
  
  /**
   * 资源清理
   */
  dispose(): void {
    for (const chunk of this.chunks) {
      chunk.dispose();
    }
    this.chunks = [];
    
    this.initialized = false;
  }
  
  /**
   * 设置地形材质层
   * @param index 材质层索引（0-3）
   * @param layerInfo 材质层信息
   */
  setMaterialLayer(index: number, layerInfo: TerrainLayerInfo): void {
    if (!this.initialized) {
      this.initialize();
    }
    
    // 删除现有层（如果存在）
    if (index < this.material.getLayers().length) {
      this.material.removeLayer(index);
    }
    // 添加新层到指定位置
    this.material.addLayerAt(index, layerInfo);
    
    // 更新所有区块的材质
    for (const chunk of this.chunks) {
      chunk.updateMaterial();
    }
  }
  
  /**
   * 获取所有材质层
   */
  getMaterialLayers(): TerrainLayerInfo[] {
    if (!this.initialized) {
      this.initialize();
    }
    
    return this.material.getLayers();
  }
  
  /**
   * 在地形上绘制材质
   * @param worldPosition 世界坐标位置
   * @param radius 绘制半径
   * @param layerIndex 要绘制的材质层索引
   * @param strength 绘制强度
   */
  paintMaterial(worldPosition: THREE.Vector3, radius: number, layerIndex: number, strength: number = 1.0): void {
    if (!this.initialized || !this.enableMaterialPainting) return;
    
    this.material.paintTexture(worldPosition.x, worldPosition.z, radius, layerIndex, strength);
  }
  
  /**
   * 在材质层上绘制
   * @param position 世界坐标位置
   * @param radius 笔刷半径
   * @param layerIndex 目标材质层索引
   * @param strength 绘制强度
   */
  paintMaterialLayer(position: THREE.Vector3, radius: number, layerIndex: number, strength: number): void {
    if (!this.material) {
      console.warn('没有材质无法绘制');
      return;
    }
    
    // 将世界坐标转换为局部坐标
    const localPosition = new THREE.Vector3().copy(position);
    if (this.transform) {
      // 如果有变换，应用逆变换
      const worldMatrix = this.transform.matrixWorld;
      const inverseMatrix = new THREE.Matrix4().copy(worldMatrix).invert();
      localPosition.applyMatrix4(inverseMatrix);
    }
    
    // 获取X和Z坐标
    const x = localPosition.x;
    const z = localPosition.z;
    
    // 委托给TerrainMaterial的paintTexture方法
    this.material.paintTexture(x, z, radius, layerIndex, strength);
    
    // 通知更新
    this.needsUpdate = true;
  }
  
  /**
   * 根据高度自动设置材质分布
   * @param layers 要分配的材质层及其高度范围
   */
  assignMaterialsByHeight(layers: {index: number, minHeight: number, maxHeight: number}[]): void {
    if (!this.initialized) return;
    
    // 排序层，确保从低到高
    layers.sort((a, b) => a.minHeight - b.minHeight);
    
    // 更新材质层的高度范围
    for (const layer of layers) {
      const layerInfo = this.material.getLayerAt(layer.index);
      if (layerInfo) {
        layerInfo.minHeight = layer.minHeight;
        layerInfo.maxHeight = layer.maxHeight;
      }
    }
    
    // 更新材质
    this.material.updateMaterialLayers();
  }
  
  /**
   * 根据坡度自动设置材质分布
   * @param layers 要分配的材质层及其坡度范围
   */
  assignMaterialsBySlope(layers: {index: number, minSlope: number, maxSlope: number}[]): void {
    if (!this.initialized) return;
    
    // 排序层，确保从平坦到陡峭
    layers.sort((a, b) => a.minSlope - b.minSlope);
    
    // 更新材质层的坡度范围
    for (const layer of layers) {
      const layerInfo = this.material.getLayerAt(layer.index);
      if (layerInfo) {
        layerInfo.minSlope = layer.minSlope;
        layerInfo.maxSlope = layer.maxSlope;
      }
    }
    
    // 更新材质
    this.material.updateMaterialLayers();
  }

  // 添加到TerrainSystem类中

/**
 * 获取指定世界坐标处的材质权重
 */
public getMaterialWeightAt(worldX: number, worldZ: number, layerIndex: number): number {
    // 将世界坐标转换为贴花贴图坐标
    const material = this.getMaterial();
    const splatMapData = material.getSplatmapData();
    if (!splatMapData) return 0;
    
    const mapResolution = material.getSplatmapResolution();
    const terrainWidth = this.getWidth();
    const terrainLength = this.getLength();
    
    // 计算采样点
    const u = ((worldX + terrainWidth/2) / terrainWidth) * mapResolution;
    const v = ((worldZ + terrainLength/2) / terrainLength) * mapResolution;
    
    // 边界检查
    if (u < 0 || u >= mapResolution || v < 0 || v >= mapResolution) {
      return 0;
    }
    
    // 获取像素索引
    const x = Math.floor(u);
    const z = Math.floor(v);
    const pixelIdx = (z * mapResolution + x) * 4;
    
    // 获取对应通道的权重
    if (layerIndex >= 0 && layerIndex < 4) {
      return splatMapData[pixelIdx + layerIndex] / 255;
    }
    
    return 0;
  }
  
  /**
   * 获取指定世界坐标处的高度
   */
  public getHeightAt(worldX: number, worldZ: number): number {
    // 将世界坐标转换为高度图坐标
    const heightfield = this.getHeightfield();
    if (!heightfield) return 0;
    
    const resolution = this.getResolution();
    const terrainWidth = this.getWidth();
    const terrainLength = this.getLength();
    
    // 计算采样点
    const x = Math.floor(((worldX + terrainWidth/2) / terrainWidth) * (resolution - 1));
    const z = Math.floor(((worldZ + terrainLength/2) / terrainLength) * (resolution - 1));
    
    // 边界检查
    if (x < 0 || x >= resolution || z < 0 || z >= resolution) {
      return 0;
    }
    
    // 获取高度
    return heightfield[z * resolution + x];
  }
  
  /**
   * 获取指定世界坐标处的法线
   */
  public getNormalAt(worldX: number, worldZ: number): THREE.Vector3 | undefined {
    // 计算该点的法线
    const heightfield = this.getHeightfield();
    if (!heightfield) return undefined;
    
    const resolution = this.getResolution();
    const terrainWidth = this.getWidth();
    const terrainLength = this.getLength();
    
    // 计算采样点
    const x = Math.floor(((worldX + terrainWidth/2) / terrainWidth) * (resolution - 1));
    const z = Math.floor(((worldZ + terrainLength/2) / terrainLength) * (resolution - 1));
    
    // 边界检查
    if (x < 0 || x >= resolution - 1 || z < 0 || z >= resolution - 1) {
      return new THREE.Vector3(0, 1, 0);
    }
    
    // 获取相邻点高度
    const h = heightfield[z * resolution + x];
    const hL = x > 0 ? heightfield[z * resolution + (x - 1)] : h;
    const hR = x < resolution - 1 ? heightfield[z * resolution + (x + 1)] : h;
    const hD = z > 0 ? heightfield[(z - 1) * resolution + x] : h;
    const hU = z < resolution - 1 ? heightfield[(z + 1) * resolution + x] : h;
    
    // 计算法线
    const normal = new THREE.Vector3(
      (hL - hR) * 0.5,
      1.0,
      (hD - hU) * 0.5
    ).normalize();
    
    return normal;
  }

  /**
   * 获取地形网格
   * 注意：由于地形由多个区块组成，此方法返回包含所有区块的父对象
   */
  public getTerrainMesh(): THREE.Object3D {
    return this.getThreeObject();
  }
  
  /**
   * 获取地形材质
   */
  public getMaterial(): TerrainMaterial {
    return this.material;
  }
  
  /**
   * 获取地形宽度
   */
  public getWidth(): number {
    return this.terrainSize.x;
  }
  
  /**
   * 获取地形长度
   */
  public getLength(): number {
    return this.terrainSize.y;
  }
  
  /**
   * 获取地形分辨率
   */
  public getResolution(): number {
    return this.resolution;
  }
  
  /**
   * 获取所有地形网格的合并顶点信息
   * 用于植被放置等需要访问所有顶点的操作
   */
  public getAllVertices(): { positions: THREE.Vector3[], normals: THREE.Vector3[] } {
    const positions: THREE.Vector3[] = [];
    const normals: THREE.Vector3[] = [];
    
    for (const chunk of this.chunks) {
      const mesh = chunk.getMesh();
      const geometry = mesh.geometry as THREE.BufferGeometry;
      
      if (!geometry || !geometry.attributes.position || !geometry.attributes.normal) {
        continue;
      }
      
      const posAttr = geometry.attributes.position;
      const normAttr = geometry.attributes.normal;
      
      // 临时向量
      const pos = new THREE.Vector3();
      const norm = new THREE.Vector3();
      
      // 遍历所有顶点
      for (let i = 0; i < posAttr.count; i++) {
        // 获取局部坐标位置和法线
        pos.fromBufferAttribute(posAttr, i);
        norm.fromBufferAttribute(normAttr, i);
        
        // 转换到世界坐标
        pos.applyMatrix4(mesh.matrixWorld);
        
        // 将法线转换到世界空间 (仅方向，不考虑平移)
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
        norm.applyMatrix3(normalMatrix).normalize();
        
        // 添加到结果数组
        positions.push(pos.clone());
        normals.push(norm.clone());
      }
    }
    
    return { positions, normals };
  }

  /**
   * 序列化为JSON
   */
  public override toJSON(): any {
    const json = super.toJSON();
    
    // 添加地形系统特定数据
    json.terrainData = {
      // 基本设置
      terrainSize: {
        x: this.terrainSize.x,
        y: this.terrainSize.y
      },
      resolution: this.resolution,
      maxHeight: this.maxHeight,
      
      // 区块设置
      chunksX: this.chunksX,
      chunksY: this.chunksY,
      chunkSize: {
        x: this.chunkSize.x,
        y: this.chunkSize.y
      },
      
      // 高度数据 - 使用压缩格式保存
      heightData: this.heightfield.serialize(),
      
      // 材质层信息
      materialLayers: this.material ? this.material.getLayers().map(layer => ({
        // 保存材质层的路径引用而不是整个纹理对象
        texturePath: (layer.texture as any)._sourcePath || '',
        normalMapPath: layer.normalMap ? (layer.normalMap as any)._sourcePath || '' : '',
        tiling: layer.tiling,
        minHeight: layer.minHeight,
        maxHeight: layer.maxHeight,
        minSlope: layer.minSlope,
        maxSlope: layer.maxSlope
      })) : []
    };
    
    return json;
  }
} 