import * as THREE from 'three';

export interface TerrainOptions {
  // 基础设置
  width: number;           // 地形宽度 (X方向)
  length: number;          // 地形长度 (Z方向)
  maxHeight: number;       // 最大高度
  resolution: number;      // 分辨率，每边的顶点数
  
  // 区块设置
  chunksX?: number;        // X方向区块数量
  chunksY?: number;        // Y方向区块数量
  chunkSize?: THREE.Vector2; // 单个区块大小
  
  // 材质设置
  textures?: {
    diffuse?: THREE.Texture[];
    normal?: THREE.Texture[];
    displacement?: THREE.Texture[];
  };
  
  // 物理设置
  enablePhysics?: boolean;
  physicsStep?: number;    // 物理碰撞检测的精度
  
  // LOD设置
  enableLOD?: boolean;
  lodLevels?: number;
  lodDistances?: number[];
}

export interface TerrainLayerInfo {
  texture: THREE.Texture;
  normalMap?: THREE.Texture;
  tiling: number;
  minHeight: number;
  maxHeight: number;
  minSlope: number;
  maxSlope: number;
}

export interface BrushOptions {
  size: number;
  strength: number;
  falloff: number;
}

