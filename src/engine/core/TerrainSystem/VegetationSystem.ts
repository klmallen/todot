import * as THREE from 'three/webgpu';
import { 
  texture, uniform, mix, add, mul, div, sub, min, max, clamp, 
  positionLocal, normalLocal, uv, color, vec2, vec3, vec4, float,
  sin, cos, time
} from 'three/tsl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import { Node3d } from '../Node3d';
import { TerrainSystem } from '../TerrainSystem/TerrainSystem';
import { InstanceManager3D } from '../InstanceManager3D';
import { editable, editableComponent } from '../decorators';
import { ModelLoader3D } from '../ModelLoader3D';

/**
 * VegetationSystem - 管理地形上的植被分布和动画
 */
@editableComponent({
  displayName: '植被系统',
  description: '管理地形上的植被分布和动画',
  icon: 'grass',
  category: 'Environment'
})
export class VegetationSystem extends Node3d {
  private terrain: TerrainSystem | null = null;
  private vegetationTypes: Map<string, VegetationType> = new Map();
  private instanceManagers: Map<string, InstanceManager3D> = new Map();
  private layerVegetationMap: Map<number, LayerVegetationSettings[]> = new Map();
  
  // 风动画属性
  @editable({
    type: 'number',
    displayName: '风力强度',
    description: '控制植被摆动的强度',
    min: 0,
    max: 1,
    step: 0.01,
    defaultValue: 0.2
  })
  private windStrength: number = 0.2;
  
  @editable({
    type: 'number',
    displayName: '风力频率',
    description: '控制植被摆动的频率',
    min: 0,
    max: 2,
    step: 0.01,
    defaultValue: 0.3
  })
  private windFrequency: number = 0.3;
  
  @editable({
    type: 'vector2',
    displayName: '风向',
    description: '风的方向',
    defaultValue: new THREE.Vector2(1, 0)
  })
  private windDirection: THREE.Vector2 = new THREE.Vector2(1, 0);

  constructor(name:String) {
    super(name);
    this.setType('VegetationSystem');
  }

  /**
   * 设置关联的地形系统
   */
  public setTerrain(terrain: TerrainSystem): void {
    this.terrain = terrain;
    this.getThreeObject().position.copy(terrain.getThreeObject().position);
  }

  /**
   * 添加植被类型
   */
  public addVegetationType(
    id: string, 
    modelPath: string,
    scale: THREE.Vector3 = new THREE.Vector3(0.01, 0.01, 0.01),
    bendFactor: number = 0.8,
    heightOffset: number = 1,
  ): void {
    // 创建新的植被类型
    const vegetationType = new VegetationType(id, modelPath, scale, bendFactor, heightOffset);
    this.vegetationTypes.set(id, vegetationType);
    
    // 创建实例管理器
    const instanceManager = new InstanceManager3D(id + '_instances');
    this.instanceManagers.set(id, instanceManager);
    
    // 加载模型并设置实例
    vegetationType.loadModel().then(model => {
      // 只保存模型引用，不立即设置实例管理器
      vegetationType.setLoadedModel(model.clone());
      
      // 如果地形已经设置，立即生成此植被类型的实例
      // if (this.terrain) {
      //   this.generateInstancesForVegetationType(id);
      // }
    }).catch(error => {
      console.error(`无法加载植被模型 ${id}:`, error);
    });
  }

  /**
   * 为指定植被类型生成实例
   */
  private generateInstancesForVegetationType(vegetationId: string, layerIndex: number = -1): void {
    if (!this.terrain) return;
    
    const vegetationType = this.vegetationTypes.get(vegetationId);
    if (!vegetationType) return;
    
    // 获取实例管理器
    const instanceManager = this.instanceManagers.get(vegetationId);
    if (!instanceManager) return;
    
    // 设置源对象并添加为子节点（如果尚未设置）
    // if (vegetationType.getLoadedModel() && !instanceManager.hasSourceObject()) {
      instanceManager.setSourceObject(vegetationType.getLoadedModel().clone());
      this.addChild(instanceManager);
      
      // 设置风动画
    // }
    
    // 获取地形信息
    const terrainSize = this.terrain.terrainSize;
    if (!terrainSize) return;
    
    const terrainWidth = terrainSize.x;
    const terrainLength = terrainSize.y;
    // 检查是否有材质层信息
    const hasMaterialLayer = layerIndex >= 0 && this.terrain.material;
    
    if (hasMaterialLayer) {
     
      // 材质层特定的植被生成
      this.generateVegetationForMaterialLayer(vegetationId, layerIndex, terrainWidth, terrainLength);
    } else {
      // 随机分布植被（原有逻辑）
      // this.generateRandomVegetation(vegetationId, terrainWidth, terrainLength);
    }
  }

  /**
   * 在材质层区域内生成植被
   */
  private generateVegetationForMaterialLayer(
    vegetationId: string,
    layerIndex: number,
    terrainWidth: number,
    terrainLength: number
  ): void {
    if (!this.terrain || !this.terrain.material) return;
    
    // 获取贴花贴图数据
    const splatMapData = this.terrain.material.getSplatmapData();
    console.log(splatMapData,'splatMapData')
    if (!splatMapData) return;
    
    // 获取贴花贴图分辨率
    const resolution = this.terrain.material.getSplatmapResolution ? 
                       this.terrain.material.getSplatmapResolution() : 
                       this.terrain.resolution || 256;
    
    // 存储所有权重高于阈值的点
    const validPoints: {u: number, v: number, weight: number}[] = [];
    const weightThreshold = 0.3; // 权重阈值
    
    // 扫描贴花贴图找出所有符合条件的点
    for (let v = 0; v < resolution; v++) {
      for (let u = 0; u < resolution; u++) {
        const pixelIdx = (v * resolution + u) * 4;
        const weight = splatMapData[pixelIdx + layerIndex] / 255;
        
        if (weight >= weightThreshold) {
          validPoints.push({u, v, weight});
        }
      }
    }
    
    if (validPoints.length === 0) return;
    
    // 根据材质层覆盖面积计算植被密度
    const density = 0.005; // 基础密度可调整
    const count = Math.max(10, Math.floor(validPoints.length * density));
    
    // 在有效点内随机选择位置生成植被
    for (let i = 0; i < count; i++) {
      // 随机选择一个有效点
      const pointIndex = Math.floor(Math.random() * validPoints.length);
      const {u, v, weight} = validPoints[pointIndex];
      
      // 转换回世界坐标（增加一些局部随机性）
      const randOffsetU = (Math.random() - 0.5) * (terrainWidth / resolution);
      const randOffsetV = (Math.random() - 0.5) * (terrainLength / resolution);
      
      const worldX = ((u / resolution) - 0.5) * terrainWidth + randOffsetU;
      const worldZ = ((v / resolution) - 0.5) * terrainLength + randOffsetV 
      
      // 获取高度和法线
      const worldY = this.getHeightAt(worldX, worldZ);
      const normal = this.getNormalAt(worldX, worldZ);
      
      // 计算坡度
      const slope = normal ? 1 - normal.y : 0;
      const slopeDegrees = Math.acos(1 - slope) * (180 / Math.PI);
      
      // 坡度限制（只在坡度小于30度的地方放置植被）
      // if (slopeDegrees < 30) {
        // 添加植被实例
        this.addVegetationInstance(vegetationId, worldX, worldY, worldZ, normal);
      // }
    }
  }

  /**
   * 随机分布植被（原有逻辑）
   */
  private generateRandomVegetation(
    vegetationId: string,
    terrainWidth: number,
    terrainLength: number
  ): void {
    // 设置分辨率（采样点数量）
    const resolution = Math.min(100, this.terrain!.resolution || 50);
    
    // 在地形上分布植被
    const count = Math.floor(resolution * resolution * 0.05); // 控制密度
    for (let i = 0; i < count; i++) {
      // 随机位置
      const x = (Math.random() - 0.5) * terrainWidth;
      const z = (Math.random() - 0.5) * terrainLength;
      
      // 获取高度和法线
      const y = this.getHeightAt(x, z);
      const normal = this.getNormalAt(x, z);
      
      // 计算坡度（0-1）
      const slope = normal ? 1 - normal.y : 0;
      const slopeDegrees = Math.acos(1 - slope) * (180 / Math.PI);
      
      // 坡度限制（只在坡度小于30度的地方放置植被）
      if (slopeDegrees < 30) {
        // 添加植被实例
        this.addVegetationInstance(vegetationId, x, y, z, normal);
      }
    }
  }

  /**
   * 添加植被到特定材质层
   * @param layerIndex 材质层索引
   * @param vegetationId 植被类型ID
   * @param weight 权重（可选）
   * @param density 密度（可选）
   * @param clustering 聚集度（可选）
   * @param minSlope 最小坡度（可选）
   * @param maxSlope 最大坡度（可选）
   */
  public addVegetationToLayer(
    layerIndex: number, 
    vegetationId: string,
    weight: number = 0.6,
    density: number = 0.8,
    clustering: number = 0.5,
    minSlope: number = 0,
    maxSlope: number = 0.3
  ): void {
    // 确保植被类型存在
    if (!this.vegetationTypes.has(vegetationId)) {
      console.warn(`植被类型 ${vegetationId} 不存在`);
      return;
    }
    
    // 获取或创建图层植被设置数组
    let layerSettings = this.layerVegetationMap.get(layerIndex);
    if (!layerSettings) {
      layerSettings = [];
      this.layerVegetationMap.set(layerIndex, layerSettings);
    }
    
    // 添加植被设置
    layerSettings.push({
      vegetationId,
      weight,
      density,
      clustering,
      minSlope,
      maxSlope
    });
  }

  /**
   * 更新植被分布
   */
  public updateVegetationDistribution(): void {
    if (!this.terrain) {
      console.warn('未设置地形，无法生成植被');
      return;
    }
    
    // 清除现有植被
    this.clearAllVegetation();
    
    // 遍历所有材质层
    this.layerVegetationMap.forEach((settings, layerIndex) => {
      if (settings.length === 0) return;
      
      this.generateVegetationForLayer(layerIndex, settings);
    });
  }

  /**
   * 为指定材质层生成植被
   */
  private generateVegetationForLayer(layerIndex: number, settings: LayerVegetationSettings[]): void {
    if (!this.terrain) return;
    
    // 计算总权重
    const totalWeight = settings.reduce((sum, setting) => sum + setting.weight, 0);
    if (totalWeight <= 0) return;
    
    // 获取地形信息
    const heightfield = this.terrain.getHeightfield();
    if (!heightfield) return;
    
    // 获取地形尺寸
    const terrainSize = this.terrain.terrainSize;
    if (!terrainSize) return;
    
    const terrainWidth = terrainSize.x;
    const terrainLength = terrainSize.y;
    
    // 设置分辨率（采样点数量）
    const resolution = Math.min(200, this.terrain.resolution || 100); // 避免生成过多植被
    
    // 计算步长
    const stepX = terrainWidth / resolution;
    const stepZ = terrainLength / resolution;
    
    // 遍历地形
    for (let z = 0; z < resolution; z++) {
      for (let x = 0; x < resolution; x++) {
        const worldX = (x / resolution - 0.5) * terrainWidth;
        const worldZ = (z / resolution - 0.5) * terrainLength;
        
        // 获取该点的材质权重
        const materialWeight = this.getMaterialWeightAt(worldX, worldZ, layerIndex);
        
        // 如果权重太低，跳过
        if (materialWeight < 0.3) continue;
        
        // 获取该点的高度和法线
        const worldY = this.getHeightAt(worldX, worldZ);
        const normal = this.getNormalAt(worldX, worldZ);
        
        // 计算坡度（0-1）
        const slope = normal ? 1 - normal.y : 0;
        const slopeDegrees = Math.acos(1 - slope) * (180 / Math.PI);
        
        // 随机挑选一种植被类型（基于权重）
        const vegetationType = this.pickVegetationType(settings, totalWeight, slopeDegrees);
        if (!vegetationType) continue;
        
        // 基于密度决定是否放置植被
        const density = vegetationType.density * materialWeight;
        if (Math.random() > density) continue;
        
        // 添加植被实例
        this.addVegetationInstance(
          vegetationType.vegetationId,
          worldX + (Math.random() - 0.5) * stepX * 0.8, // 添加一些随机偏移
          worldY,
          worldZ + (Math.random() - 0.5) * stepZ * 0.8,
          normal
        );
      }
    }
  }

  /**
   * 获取指定位置的材质权重
   */
  private getMaterialWeightAt(worldX: number, worldZ: number, layerIndex: number): number {
    if (!this.terrain || !this.terrain.material) return 0;
    
    // 获取贴花贴图数据
    const material = this.terrain.material;
    if (!material.getSplatmapData) {
      console.warn('TerrainMaterial没有getSplatmapData方法');
      return 0;
    }
    
    const splatMapData = material.getSplatmapData();
    if (!splatMapData) return 0;
    
    // 获取贴花贴图分辨率
    const resolution = material.getSplatmapResolution ? 
                       material.getSplatmapResolution() : 
                       this.terrain.resolution || 256;
    
    // 获取地形尺寸
    const terrainSize = this.terrain.terrainSize;
    if (!terrainSize) return 0;
    
    const terrainWidth = terrainSize.x;
    const terrainLength = terrainSize.y;
    
    // 计算贴花贴图坐标
    const u = ((worldX + terrainWidth/2) / terrainWidth) * resolution;
    const v = ((worldZ + terrainLength/2) / terrainLength) * resolution;
    
    // 边界检查
    if (u < 0 || u >= resolution || v < 0 || v >= resolution) {
      return 0;
    }
    
    // 获取像素索引
    const x = Math.floor(u);
    const z = Math.floor(v);
    const pixelIdx = (z * resolution + x) * 4;
    
    // 获取对应通道的权重
    if (layerIndex >= 0 && layerIndex < 4) {
      return splatMapData[pixelIdx + layerIndex] / 255;
    }
    
    return 0;
  }

  /**
   * 获取指定位置的高度
   */
  private getHeightAt(worldX: number, worldZ: number): number {
    if (!this.terrain) return 0;
    
    // 使用射线检测获取高度
    // 创建一个从高处向下的射线
    const raycaster = new THREE.Raycaster();
    const rayOrigin = new THREE.Vector3(worldX, 1000, worldZ);
    const rayDirection = new THREE.Vector3(0, -1, 0);
    raycaster.set(rayOrigin, rayDirection);
    
    // 对地形网格进行射线检测
    const terrainMeshes = []; // 收集所有地形网格
    this.terrain.getChunks().forEach(chunk => {
      if (chunk.mesh) terrainMeshes.push(chunk.mesh);
    });
    
    const intersects = raycaster.intersectObjects(terrainMeshes);
    if (intersects.length > 0) {
      return intersects[0].point.y;
    }
    
    console.log(`射线检测无法获取位置(${worldX}, ${worldZ})的高度`);
    return 0;
  }

  /**
   * 获取指定位置的法线
   */
  private getNormalAt(worldX: number, worldZ: number): THREE.Vector3 {
    if (!this.terrain) return new THREE.Vector3(0, 1, 0);
    
    const heightfield = this.terrain.getHeightfield();
    if (!heightfield) return new THREE.Vector3(0, 1, 0);
    
    // 获取地形尺寸
    const terrainSize = this.terrain.terrainSize;
    if (!terrainSize) return new THREE.Vector3(0, 1, 0);
    
    const terrainWidth = terrainSize.x;
    const terrainLength = terrainSize.y;
    
    // 获取分辨率
    const resolution = this.terrain.resolution || 256;
    
    // 计算采样点
    const u = ((worldX + terrainWidth/2) / terrainWidth);
    const v = ((worldZ + terrainLength/2) / terrainLength);
    
    // 边界检查
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      return new THREE.Vector3(0, 1, 0);
    }
    
    // 如果heightfield有getNormal方法，使用它
    if (typeof heightfield.getNormal === 'function') {
      return heightfield.getNormal(
        Math.floor(u * (resolution-1) - (resolution-1)/2), 
        Math.floor(v * (resolution-1) - (resolution-1)/2)
      ) || new THREE.Vector3(0, 1, 0);
    }
    
    // 否则，自己计算法线
    // 获取相邻点计算法线
    const x = Math.floor(u * (resolution-1));
    const z = Math.floor(v * (resolution-1));
    
    // 如果没有足够的数据来计算法线，返回默认向上的法线
    return new THREE.Vector3(0, 1, 0);
  }

  /**
   * 根据权重和坡度挑选植被类型
   */
  private pickVegetationType(
    settings: LayerVegetationSettings[],
    totalWeight: number,
    slopeDegrees: number
  ): LayerVegetationSettings | null {
    // 过滤出适合当前坡度的植被类型
    const suitableSettings = settings.filter(
      setting => slopeDegrees >= setting.minSlope && slopeDegrees <= setting.maxSlope
    );
    
    if (suitableSettings.length === 0) return null;
    
    // 计算这些类型的总权重
    const suitableTotalWeight = suitableSettings.reduce((sum, setting) => sum + setting.weight, 0);
    
    // 随机选择一种类型（基于权重）
    const random = Math.random() * suitableTotalWeight;
    let cumulativeWeight = 0;
    
    for (const setting of suitableSettings) {
      cumulativeWeight += setting.weight;
      if (random <= cumulativeWeight) {
        return setting;
      }
    }
    
    return suitableSettings[suitableSettings.length - 1];
  }

  /**
   * 添加植被实例
   */
  private addVegetationInstance(
    vegetationId: string,
    x: number,
    y: number,
    z: number,
    normal?: THREE.Vector3
  ): void {
    const instanceManager = this.instanceManagers.get(vegetationId);
    const vegetationType = this.vegetationTypes.get(vegetationId);
    
    if (!instanceManager || !vegetationType) return;
    
    // 获取精确的地形高度和法线
    y = this.getHeightAt(x, z); // 重新获取高度以确保准确性
    normal = normal || this.getNormalAt(x, z);
    
    if (!normal) {
      
    }
    normal = new THREE.Vector3(1, 1, 0);
    // 创建实例位置和旋转信息
    const position = new THREE.Vector3(x, y, z);
    const rotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
    const scale = vegetationType.scale.clone();
    const randomScale = 0.8 + Math.random() * 0.4; // 80-120% 的随机缩放
    scale.multiplyScalar(randomScale);
    
    // 根据坡度调整植被高度偏移
    const slope = 1 - normal.y; // 0(平坦)到1(垂直)
    console.log(normal,'normal')
    // 设置垂直于地面（基于法线）
    if (normal.y < 0.99) { // 如果不是几乎平坦的地面
      // 创建一个四元数，从上向量(0,1,0)旋转到法线方向
      const upVector = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(upVector, normal.normalize());
      
      // 应用旋转到模型
      const finalRotation = new THREE.Euler().setFromQuaternion(quaternion);
      
      // 保留原始的Y轴随机旋转
      finalRotation.y = rotation.y;
      rotation.copy(finalRotation);
      
      // 对于陡峭的坡度，调整植被位置，确保它"扎根"在地面上
      // 根据坡度调整偏移量，坡度越大，偏移越大
      const normalDir = normal.clone();
      const heightOffsetValue = vegetationType.heightOffset * 3
      
      // 计算最终位置 = 地形位置 + (法线方向 * 根部偏移)
      position.add(normalDir.multiplyScalar(heightOffsetValue));
    } else {
      // 平坦地形上的简单高度偏移
      position.y += 0.5;
    }
    
    // 使用正确的 InstanceManager3D API 创建实例
    instanceManager.createInstance({
      position: position,
      rotation: rotation,
      scale: scale
    });
  }

  /**
   * 清除所有植被
   */
  private clearAllVegetation(): void {
    this.instanceManagers.forEach(manager => {
      manager.clearInstances();
    });
  }

  /**
   * 设置风动画
   */
  private setupWindAnimation(instanceManager: InstanceManager3D, bendFactor: number): void {
    // 删除整个风动画相关代码
    return;
  }

  /**
   * 更新风动画参数
   */
  public updateWindParameters(strength: number, frequency: number, direction: THREE.Vector2): void {
    this.windStrength = strength;
    this.windFrequency = frequency;
    this.windDirection.copy(direction);
    
    // 更新所有实例的风动画参数
    this.vegetationTypes.forEach((vegType, id) => {
      const instanceManager = this.instanceManagers.get(id);
      if (instanceManager) {
        this.setupWindAnimation(instanceManager, vegType.bendFactor);
      }
    });
  }
  
  /**
   * 在特定区域添加植被
   */
  public addVegetationToArea(
    centerX: number,
    centerZ: number,
    radius: number,
    layerIndex: number,
    vegetationId: string,
    density: number = 1.0
  ): void {
    if (!this.terrain || !this.vegetationTypes.has(vegetationId)) return;
    
    const vegetationType = this.vegetationTypes.get(vegetationId)!;
    const instanceManager = this.instanceManagers.get(vegetationId);
    
    if (!instanceManager) return;
    
    // 计算区域内的植被数量
    const area = Math.PI * radius * radius;
    const count = Math.floor(area * 0.01 * density); // 每100平方单位的基础数量
    
    // 创建植被实例
    for (let i = 0; i < count; i++) {
      // 使用极坐标在圆内生成随机点
      const angle = Math.random() * Math.PI * 2;
      const dist = radius * Math.sqrt(Math.random()); // 均匀分布在圆内
      
      const x = centerX + dist * Math.cos(angle);
      const z = centerZ + dist * Math.sin(angle);
      
      // 获取高度和法线
      const y = this.getHeightAt(x, z);
      const normal = this.getNormalAt(x, z);
      
      // 添加植被实例
      this.addVegetationInstance(vegetationId, x, y, z, normal);
    }
  }

  /**
   * 添加简单测试植被（使用圆柱体代替模型）
   * @param id 植被类型ID
   * @param color 植被颜色
   * @param scale 缩放比例
   * @param bendFactor 弯曲系数
   * @param heightOffset 高度偏移
   */
  public addSimpleTestVegetation(
    id: string,
    color?: THREE.Color = new THREE.Color(0x00FF00),
    scale?: THREE.Vector3 = new THREE.Vector3(0.5, 1.5, 0.5),
    bendFactor?: number = 0.8,
    heightOffset: number = 0.5
  ): void {
    // 创建新的植被类型
    const vegetationType = new VegetationType(id, "", scale, bendFactor, heightOffset);
    this.vegetationTypes.set(id, vegetationType);
    
    // 创建实例管理器
    const instanceManager = new InstanceManager3D(id + '_instances');
    this.instanceManagers.set(id, instanceManager);
    
    // 创建简单圆柱体
    const geometry = new THREE.CylinderGeometry(0.2, 0.3, 1, 8);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const cylinder = new THREE.Mesh(geometry, material);
    
    // 调整圆柱体位置，使其底部对齐原点
    cylinder.position.y = 0.5;
    
    // 将圆柱体添加到一个组中
    const model = new THREE.Group();
    model.add(cylinder);
    model.scale.copy(scale);
    
    // 设置为加载的模型
    vegetationType.setLoadedModel(model);
    
    // 设置实例管理器
    instanceManager.setSourceObject(model.clone());
    this.addChild(instanceManager);
  }

  /**
   * 在地形上添加植被
   */
  public addVegetationOnTerrain(
    vegetationId: string, 
    count: number = 100,
    options: {
      minHeight?: number,
      maxHeight?: number,
      minSlope?: number,
      maxSlope?: number,
      avoidOverlap?: boolean,
      minDistance?: number
    } = {}
  ): void {
    if (!this.terrain) {
      console.warn('没有设置地形，无法添加植被');
      return;
    }
    
    // 检查植被类型是否存在
    if (!this.vegetationTypes.has(vegetationId)) {
      console.warn(`植被类型 ${vegetationId} 不存在`);
      return;
    }
    
    const vegetationType = this.vegetationTypes.get(vegetationId);
    const instanceManager = this.instanceManagers.get(vegetationId);
    
    if (!vegetationType || !instanceManager) {
      console.warn(`植被类型 ${vegetationId} 的实例管理器不可用`);
      return;
    }
    
    // 设置源对象并添加为子节点
    instanceManager.setSourceObject(vegetationType.getLoadedModel().clone());
    this.addChild(instanceManager);
    
    console.log(`开始在地形上生成 ${count} 个 ${vegetationId} 植被...`);
    
    // 获取所有地形块的顶点和法线
    const { positions: validPositions, normals: validNormals } = this.terrain.getAllVertices();
    
    if (validPositions.length === 0) {
      console.warn('没有找到可用的地形顶点');
      return;
    }
    
    // 设置默认选项
    const {
      minHeight = -Infinity,
      maxHeight = Infinity,
      minSlope = 0,
      maxSlope = 0.8,
      avoidOverlap = true,
      minDistance = 5
    } = options;
    
    // 过滤符合高度和坡度条件的顶点
    const filteredPositions: THREE.Vector3[] = [];
    const filteredNormals: THREE.Vector3[] = [];
    
    for (let i = 0; i < validPositions.length; i++) {
      const position = validPositions[i];
      const normal = validNormals[i];
      console.log(position,'position')

      // 检查高度条件
      if (position.y < minHeight || position.y > maxHeight) {
        console.log(`位置 ${position.y} 不符合高度条件: ${position.y} 不在 [${minHeight}, ${maxHeight}] 范围内`);
        continue;
      }
      
      // 检查坡度条件 (使用法线的Y分量作为坡度指标，1=平坦，0=垂直)
      const slope = normal.y;
      if (slope < minSlope || slope > maxSlope) {
        console.log(`位置 ${slope} 不符合坡度条件: ${slope} 不在 [${minSlope}, ${maxSlope}] 范围内`);
        continue;
      }
      
      filteredPositions.push(position);
      filteredNormals.push(normal);
    }
    
    console.log(`找到 ${filteredPositions.length} 个符合条件的位置`);
    
    if (filteredPositions.length === 0) {
      console.warn('没有找到符合条件的位置生成植被');
      return;
    }
    
    // 已放置的植被位置 (用于避免重叠)
    const placedPositions: THREE.Vector3[] = [];
    
    // 添加植被
    let successCount = 0;
    let attempts = 0;
    const maxAttempts = count * 10; // 设置最大尝试次数，避免无限循环
    
    while (successCount < count && attempts < maxAttempts) {
      attempts++;
      
      // 随机选择一个位置
      const randomIndex = Math.floor(Math.random() * filteredPositions.length);
      const position = filteredPositions[randomIndex].clone();
      const normal = filteredNormals[randomIndex].clone();
      
      // 检查是否与已放置的植被重叠
      if (avoidOverlap && placedPositions.length > 0) {
        let tooClose = false;
        
        for (const placedPos of placedPositions) {
          if (position.distanceTo(placedPos) < minDistance) {
            tooClose = true;
            break;
          }
        }
        
        if (tooClose) continue; // 如果太近，尝试下一个位置
      }
      
      // 生成植被实例
      this.addVegetationInstance(
        vegetationId,
        position.x,
        position.y,
        position.z,
        normal
      );
      
      successCount++;
      placedPositions.push(position);
      
      // 输出进度
      if (successCount % 10 === 0 || successCount === count) {
        console.log(`已生成 ${successCount}/${count} 个植被`);
      }
    }
    
    console.log(`植被生成完成，成功生成 ${successCount} 个，尝试了 ${attempts} 次`);
  }

  /**
   * 序列化为JSON
   */
  public override toJSON(): any {
    const json = super.toJSON();
    
    // 添加植被系统特定数据
    json.vegetationData = {
      // 风动画参数
      windParameters: {
        strength: this.windStrength,
        frequency: this.windFrequency,
        direction: {
          x: this.windDirection.x,
          y: this.windDirection.y
        }
      },
      
      // 植被类型信息
      vegetationTypes: Array.from(this.vegetationTypes.entries()).map(([id, vegType]) => ({
        id: vegType.id,
        modelPath: vegType.modelPath,
        scale: {
          x: vegType.scale.x,
          y: vegType.scale.y,
          z: vegType.scale.z
        },
        bendFactor: vegType.bendFactor,
        heightOffset: vegType.heightOffset
      })),
      
      // 图层植被映射
      layerVegetationMap: Array.from(this.layerVegetationMap.entries()).map(([layerIndex, settings]) => ({
        layerIndex,
        settings: settings.map(setting => ({
          vegetationId: setting.vegetationId,
          weight: setting.weight,
          density: setting.density,
          clustering: setting.clustering,
          minSlope: setting.minSlope,
          maxSlope: setting.maxSlope
        }))
      }))
    };
    
    return json;
  }
}

/**
 * 植被类型
 */
class VegetationType {
  public id: string;
  public modelPath: string;
  public scale: THREE.Vector3;
  public bendFactor: number;
  public heightOffset: number;
  private model: THREE.Object3D | null = null;
  private modelLoader: ModelLoader3D | null = null;
  
  constructor(
    id: string, 
    modelPath: string,
    scale: THREE.Vector3,
    bendFactor: number,
    heightOffset: number
  ) {
    this.id = id;
    this.modelPath = modelPath;
    this.scale = scale;
    this.bendFactor = bendFactor;
    this.heightOffset = heightOffset;
  }
  
  public async loadModel(): Promise<THREE.Object3D> {
    if (this.model) return this.model;
    
    return new Promise((resolve, reject) => {
      // 使用ModelLoader3D替代直接使用GLTFLoader
      this.modelLoader = new ModelLoader3D(`${this.id}_loader`, this.modelPath);
      
      this.modelLoader.setOnLoaded((loadedModel) => {
        console.log(loadedModel,'loadedModel')
        this.model = loadedModel.clone();
        this.model.scale.copy(this.scale);
        
        resolve(this.model);
      });
      
      // 添加超时处理
      setTimeout(() => {
        if (!this.model) {
          reject(new Error(`加载模型超时: ${this.modelPath}`));
        }
      }, 10000); // 10秒超时
    });
  }
  
  // 设置和获取加载的模型
  public setLoadedModel(model: THREE.Object3D): void {
    this.model = model;
  }
  
  public getLoadedModel(): THREE.Object3D | null {
    return this.model;
  }
}

/**
 * 图层植被设置
 */
interface LayerVegetationSettings {
  vegetationId: string;
  weight: number;
  density: number;
  clustering: number;
  minSlope: number;
  maxSlope: number;
}