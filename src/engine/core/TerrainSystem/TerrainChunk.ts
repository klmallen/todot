import * as THREE from 'three';
import { HeightfieldData } from './HeightfieldData';
import { TerrainMaterial } from './TerrainMaterial';

export class TerrainChunk {
  private mesh: THREE.Mesh;
  private geometry: THREE.BufferGeometry;
  private heightfield: HeightfieldData;
  private material: TerrainMaterial;
  private position: THREE.Vector2;
  private size: THREE.Vector2;
  private resolution: number;
  private currentLOD: number = 0;
  
  constructor(
    heightfield: HeightfieldData, 
    material: TerrainMaterial,
    position: THREE.Vector2 = new THREE.Vector2(0, 0),
    size: THREE.Vector2 = heightfield.getSize(),
    resolution: number = heightfield.getResolution()
  ) {
    this.heightfield = heightfield;
    this.material = material;
    this.position = position;
    this.size = size;
    this.resolution = resolution;
    
    // 创建几何体和网格
    this.geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geometry, material.getMaterial());
    
    // 设置网格的位置
    this.mesh.position.set(position.x, 0, position.y);
    
    // 构建初始网格
    this.buildMesh();
  }
  
  /**
   * 构建地形网格
   */
  buildMesh(): void {
    const res = this.resolution;
    const size = this.size;
    
    // 创建顶点数据
    const vertices = new Float32Array(res * res * 3);
    const normals = new Float32Array(res * res * 3);
    const uvs = new Float32Array(res * res * 2);
    
    // 添加小边缘偏移，确保块之间正确连接
    const edgeOffset = 0.001; // 微小偏移以确保网格连接
    
    // 设置顶点坐标、UV和初始法线
    for (let z = 0; z < res; z++) {
      for (let x = 0; x < res; x++) {
        const i = z * res + x;
        const vertexIdx = i * 3;
        const uvIdx = i * 2;
        
        // 计算世界空间位置，边缘处略微内缩以保证连接
        let xPos = (x / (res - 1) - 0.5) * size.x;
        let zPos = (z / (res - 1) - 0.5) * size.y;
        
        // 使用实际世界坐标获取高度
        const yPos = this.heightfield.getHeight(
          this.position.x + xPos, 
          this.position.y + zPos
        );
        
        // 设置顶点位置
        vertices[vertexIdx] = xPos;
        vertices[vertexIdx + 1] = yPos;
        vertices[vertexIdx + 2] = zPos;
        
        // 设置UV坐标
        uvs[uvIdx] = x / (res - 1);
        uvs[uvIdx + 1] = z / (res - 1);
      }
    }
    
    // 计算法线
    const normalData = this.heightfield.calculateNormals();
    for (let i = 0; i < normals.length; i++) {
      normals[i] = normalData[i];
    }
    
    // 创建索引
    const indices = [];
    
    for (let z = 0; z < res - 1; z++) {
      for (let x = 0; x < res - 1; x++) {
        const a = z * res + x;
        const b = z * res + x + 1;
        const c = (z + 1) * res + x;
        const d = (z + 1) * res + x + 1;
        
        // 第一个三角形
        indices.push(a, c, b);
        
        // 第二个三角形
        indices.push(b, c, d);
      }
    }
    
    // 设置几何体属性
    this.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.geometry.setIndex(indices);
    
    // 更新包围盒
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();
  }
  
  /**
   * 更新地形几何体
   */
  updateGeometry(): void {
    // 获取脏矩形（已修改的区域）
    const dirtyRect = this.heightfield.getDirtyRect();
    if (!dirtyRect) return;
    
    const positions = this.geometry.getAttribute('position');
    const positionsArray = positions.array as Float32Array;
    
    // 更新脏区域中的顶点高度
    for (let z = dirtyRect.minZ; z <= dirtyRect.maxZ; z++) {
      for (let x = dirtyRect.minX; x <= dirtyRect.maxX; x++) {
        const i = z * this.resolution + x;
        const vertexIdx = i * 3;
        
        // 获取x和z世界坐标
        const xPos = positionsArray[vertexIdx];
        const zPos = positionsArray[vertexIdx + 2];
        
        // 更新高度
        positionsArray[vertexIdx + 1] = this.heightfield.getHeight(xPos, zPos);
      }
    }
    
    // 标记位置属性需要更新
    positions.needsUpdate = true;
    
    // 更新法线
    const normalData = this.heightfield.calculateNormals();
    const normals = this.geometry.getAttribute('normal');
    const normalsArray = normals.array as Float32Array;
    
    for (let i = 0; i < normalsArray.length; i++) {
      normalsArray[i] = normalData[i];
    }
    
    normals.needsUpdate = true;
    
    // 更新包围盒
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();
  }
  
  /**
   * 设置LOD级别
   */
  setLODLevel(level: number): void {
    if (this.currentLOD === level) return;
    this.currentLOD = level;
    
    // 根据LOD级别调整分辨率
    // 这里可以使用更复杂的LOD策略，例如四叉树或几何细分
    // 简单起见，这里只是降低索引的采样率
    
    const baseRes = this.resolution;
    const indices = [];
    const skipFactor = Math.pow(2, level); // 每个LOD级别以2的幂次方跳过点
    
    for (let z = 0; z < baseRes - skipFactor; z += skipFactor) {
      for (let x = 0; x < baseRes - skipFactor; x += skipFactor) {
        const a = z * baseRes + x;
        const b = z * baseRes + (x + skipFactor);
        const c = (z + skipFactor) * baseRes + x;
        const d = (z + skipFactor) * baseRes + (x + skipFactor);
        
        // 第一个三角形
        indices.push(a, c, b);
        
        // 第二个三角形
        indices.push(b, c, d);
      }
    }
    
    // 更新索引
    this.geometry.setIndex(indices);
  }
  
  /**
   * 射线投射检测
   */
  raycast(raycaster: THREE.Raycaster): THREE.Intersection[] {
    return raycaster.intersectObject(this.mesh);
  }
  
  /**
   * 获取网格对象
   */
  getMesh(): THREE.Mesh {
    return this.mesh;
  }
  
  /**
   * 获取中心位置
   */
  getCenter(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, 0, this.position.y);
  }
  
  /**
   * 销毁资源
   */
  dispose(): void {
    this.geometry.dispose();
    this.mesh.removeFromParent();
  }
  
  /**
   * 更新材质
   */
  updateMaterial(): void {
    // 重新应用材质到网格
    this.mesh.material = this.material.getMaterial();
  }
}