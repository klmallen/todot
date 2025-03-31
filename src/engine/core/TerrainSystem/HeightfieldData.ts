import * as THREE from 'three';
import { TerrainUtils } from './utils/TerrainUtils';

export class HeightfieldData {
  private heightData: Float32Array;
  private resolution: number;
  private size: THREE.Vector2;
  private dirtyRect: { minX: number, minZ: number, maxX: number, maxZ: number } | null = null;
  private maxHeight: number;

  constructor(resolution: number, width: number, length: number, maxHeight: number = 100) {
    this.resolution = resolution;
    this.size = new THREE.Vector2(width, length);
    this.maxHeight = maxHeight;
    this.heightData = new Float32Array(resolution * resolution);
  }

  /**
   * 获取特定位置的高度
   */
  getHeight(x: number, z: number): number {
    const gridX = Math.floor((x / this.size.x + 0.5) * (this.resolution - 1));
    const gridZ = Math.floor((z / this.size.y + 0.5) * (this.resolution - 1));
    
    // 使用夹紧(clamp)方法处理边界情况，而不是直接返回0
    const clampedX = Math.max(0, Math.min(this.resolution - 1, gridX));
    const clampedZ = Math.max(0, Math.min(this.resolution - 1, gridZ));
    
    const index = clampedZ * this.resolution + clampedX;
    return this.heightData[index];
  }

  /**
   * 设置特定位置的高度
   */
  setHeight(x: number, z: number, height: number): void {
    const gridX = Math.floor((x / this.size.x + 0.5) * (this.resolution - 1));
    const gridZ = Math.floor((z / this.size.y + 0.5) * (this.resolution - 1));
    
    // 使用夹紧方法处理边界情况
    const clampedX = Math.max(0, Math.min(this.resolution - 1, gridX));
    const clampedZ = Math.max(0, Math.min(this.resolution - 1, gridZ));
    
    // 限制高度范围
    height = Math.max(0, Math.min(this.maxHeight, height));
    
    const index = clampedZ * this.resolution + clampedX;
    this.heightData[index] = height;
    
    // 标记为脏区域，需要更新
    this.markDirty(clampedX, clampedZ);
  }

  /**
   * 批量修改区域高度
   */
  modifyArea(
    centerX: number, 
    centerZ: number, 
    radius: number,
    operation: (oldHeight: number, strength: number, params: any) => number,
    strength: number, 
    params?: any
  ): void {
    // 将世界坐标转换为网格坐标
    const centerGridX = Math.floor((centerX / this.size.x + 0.5) * (this.resolution - 1));
    const centerGridZ = Math.floor((centerZ / this.size.y + 0.5) * (this.resolution - 1));
    
    // 计算网格空间中的半径
    const gridRadius = Math.ceil(radius / Math.max(this.size.x, this.size.y) * this.resolution);
    
    // 定义矩形范围
    const minX = Math.max(0, centerGridX - gridRadius);
    const maxX = Math.min(this.resolution - 1, centerGridX + gridRadius);
    const minZ = Math.max(0, centerGridZ - gridRadius);
    const maxZ = Math.min(this.resolution - 1, centerGridZ + gridRadius);
    
    // 遍历矩形中的所有点
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        // 计算到中心的距离
        const dx = x - centerGridX;
        const dz = z - centerGridZ;
        const distSq = dx * dx + dz * dz;
        
        // 如果在半径内
        if (distSq <= gridRadius * gridRadius) {
          // 计算强度衰减
          const dist = Math.sqrt(distSq);
          const falloff = 1 - Math.min(1, dist / gridRadius);
          
          // 获取当前高度
          const index = z * this.resolution + x;
          const currentHeight = this.heightData[index];
          
          // 应用操作
          const newHeight = operation(currentHeight, strength * falloff, params);
          
          // 更新高度并限制范围
          this.heightData[index] = Math.max(0, Math.min(this.maxHeight, newHeight));
        }
      }
    }
    
    // 标记修改区域为脏区域
    this.markDirty(minX, minZ, maxX, maxZ);
  }

  /**
   * 标记脏区域
   */
  private markDirty(minX: number, minZ: number, maxX?: number, maxZ?: number): void {
    maxX = maxX ?? minX;
    maxZ = maxZ ?? minZ;
    
    if (!this.dirtyRect) {
      this.dirtyRect = { minX, minZ, maxX, maxZ };
    } else {
      this.dirtyRect.minX = Math.min(this.dirtyRect.minX, minX);
      this.dirtyRect.minZ = Math.min(this.dirtyRect.minZ, minZ);
      this.dirtyRect.maxX = Math.max(this.dirtyRect.maxX, maxX);
      this.dirtyRect.maxZ = Math.max(this.dirtyRect.maxZ, maxZ);
    }
  }

  /**
   * 获取并清除脏区域
   */
  getDirtyRect(): { minX: number, minZ: number, maxX: number, maxZ: number } | null {
    const rect = this.dirtyRect;
    this.dirtyRect = null;
    return rect;
  }

  /**
   * 计算法线
   */
  calculateNormals(): Float32Array {
    const normals = new Float32Array(this.resolution * this.resolution * 3);
    
    for (let z = 0; z < this.resolution; z++) {
      for (let x = 0; x < this.resolution; x++) {
        const idx = (z * this.resolution + x) * 3;
        
        // 获取相邻点
        const left = x > 0 ? this.heightData[z * this.resolution + (x - 1)] : this.heightData[z * this.resolution + x];
        const right = x < this.resolution - 1 ? this.heightData[z * this.resolution + (x + 1)] : this.heightData[z * this.resolution + x];
        const top = z > 0 ? this.heightData[(z - 1) * this.resolution + x] : this.heightData[z * this.resolution + x];
        const bottom = z < this.resolution - 1 ? this.heightData[(z + 1) * this.resolution + x] : this.heightData[z * this.resolution + x];
        
        // 计算法线向量
        const normal = new THREE.Vector3(
          (left - right) * 2.0, 
          2.0, 
          (top - bottom) * 2.0
        ).normalize();
        
        // 存储法线
        normals[idx] = normal.x;
        normals[idx + 1] = normal.y;
        normals[idx + 2] = normal.z;
      }
    }
    
    return normals;
  }

  /**
   * 获取特定位置的法线
   */
  getNormalAt(x: number, z: number): THREE.Vector3 {
    const gridX = Math.floor((x / this.size.x + 0.5) * (this.resolution - 1));
    const gridZ = Math.floor((z / this.size.y + 0.5) * (this.resolution - 1));
    
    if (gridX < 0 || gridX >= this.resolution || gridZ < 0 || gridZ >= this.resolution) {
      return new THREE.Vector3(0, 1, 0);
    }
    
    // 简化版法线计算
    const left = gridX > 0 ? this.heightData[gridZ * this.resolution + (gridX - 1)] : this.heightData[gridZ * this.resolution + gridX];
    const right = gridX < this.resolution - 1 ? this.heightData[gridZ * this.resolution + (gridX + 1)] : this.heightData[gridZ * this.resolution + gridX];
    const top = gridZ > 0 ? this.heightData[(gridZ - 1) * this.resolution + gridX] : this.heightData[gridZ * this.resolution + gridX];
    const bottom = gridZ < this.resolution - 1 ? this.heightData[(gridZ + 1) * this.resolution + gridX] : this.heightData[gridZ * this.resolution + gridX];
    
    return new THREE.Vector3(
      (left - right) * 2.0,
      2.0,
      (top - bottom) * 2.0
    ).normalize();
  }

  /**
   * 从高度图生成高度数据
   */
  loadFromHeightmap(imageData: ImageData): void {
    const { width, height, data } = imageData;
    
    // 确保图像与分辨率匹配
    if (width !== this.resolution || height !== this.resolution) {
      console.warn('Heightmap dimensions do not match terrain resolution. Resampling...');
      // 这里应该实现重采样逻辑
    }
    
    for (let z = 0; z < this.resolution; z++) {
      for (let x = 0; x < this.resolution; x++) {
        const imgIdx = (z * width + x) * 4;
        // 使用红色通道作为高度值 (0-255)
        this.heightData[z * this.resolution + x] = (data[imgIdx] / 255) * this.maxHeight;
      }
    }
    
    // 标记整个地形为脏
    this.markDirty(0, 0, this.resolution - 1, this.resolution - 1);
  }

  /**
   * 导出为高度图
   */
  exportToHeightmap(): ImageData {
    const data = new Uint8ClampedArray(this.resolution * this.resolution * 4);
    
    for (let z = 0; z < this.resolution; z++) {
      for (let x = 0; x < this.resolution; x++) {
        const idx = (z * this.resolution + x) * 4;
        const height = this.heightData[z * this.resolution + x];
        const value = Math.floor((height / this.maxHeight) * 255);
        
        data[idx] = value;     // R
        data[idx + 1] = value; // G
        data[idx + 2] = value; // B
        data[idx + 3] = 255;   // A
      }
    }
    
    return new ImageData(data, this.resolution, this.resolution);
  }

  /**
   * 创建平坦地形
   */
  createFlat(height: number = 0): void {
    for (let i = 0; i < this.heightData.length; i++) {
      this.heightData[i] = height;
    }
    
    // 标记整个地形为脏
    this.markDirty(0, 0, this.resolution - 1, this.resolution - 1);
  }

  /**
   * 使用噪声生成地形
   */
  generateNoise(seed: number, scale: number, octaves: number, persistence: number, lacunarity: number): void {
    const noise = TerrainUtils.generateNoise(this.resolution, this.resolution, seed, scale, octaves, persistence, lacunarity);
    
    for (let i = 0; i < this.heightData.length; i++) {
      this.heightData[i] = noise[i] * this.maxHeight;
    }
    
    // 标记整个地形为脏
    this.markDirty(0, 0, this.resolution - 1, this.resolution - 1);
  }

  /**
   * 获取原始高度数据
   */
  getHeightData(): Float32Array {
    return this.heightData;
  }

  /**
   * 获取地形尺寸
   */
  getSize(): THREE.Vector2 {
    return this.size.clone();
  }

  /**
   * 获取分辨率
   */
  getResolution(): number {
    return this.resolution;
  }

  /**
   * 获取最大高度
   */
  getMaxHeight(): number {
    return this.maxHeight;
  }

  /**
   * 设置最大高度
   */
  setMaxHeight(height: number): void {
    this.maxHeight = height;
  }

  /**
   * 序列化高度场数据
   * @returns 可序列化的高度场数据对象
   */
  serialize(): any {
    return {
      size: {
        x: this.size.x,
        y: this.size.y
      },
      resolution: this.resolution,
      maxHeight: this.maxHeight,
      // 使用 Float32Array 保存高度数据
      heights: Array.from(this.heightData),
      // 计算数据边界以便压缩
      bounds: {
        min: Math.min(...this.heightData),
        max: Math.max(...this.heightData)
      }
    };
  }

  /**
   * 从序列化数据恢复高度场
   * @param data 序列化的高度场数据
   */
  deserialize(data: any): void {
    this.size.copy(new THREE.Vector2(data.size.x, data.size.y));
    this.resolution = data.resolution;
    this.maxHeight = data.maxHeight;
    
    // 恢复高度数据
    if (data.heights && data.heights.length === this.heightData.length) {
      for (let i = 0; i < data.heights.length; i++) {
        this.heightData[i] = data.heights[i];
      }
      this.updateNormals();
    }
  }
}