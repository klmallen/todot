import { HeightfieldData } from '../HeightfieldData';
import { TerrainSystem } from '../TerrainSystem';

/**
 * 表示一个地形编辑操作，支持撤销和重做
 */
export abstract class TerrainEditOperation {
  protected centerX: number;
  protected centerZ: number;
  
  constructor(centerX: number, centerZ: number) {
    this.centerX = centerX;
    this.centerZ = centerZ;
  }
  
  /**
   * 应用操作
   */
  abstract apply(terrain: TerrainSystem): void;
  
  /**
   * 撤销操作
   */
  abstract revert(terrain: TerrainSystem): void;
}

/**
 * 区域修改操作
 */
export class AreaModifyOperation extends TerrainEditOperation {
  private radius: number;
  private operation: (oldHeight: number, strength: number, params: any) => number;
  private strength: number;
  private params: any;
  private originalHeights: { x: number, z: number, height: number }[] = [];
  
  constructor(
    centerX: number,
    centerZ: number,
    radius: number,
    operation: (oldHeight: number, strength: number, params: any) => number,
    strength: number,
    params?: any
  ) {
    super(centerX, centerZ);
    this.radius = radius;
    this.operation = operation;
    this.strength = strength;
    this.params = params;
  }
  
  /**
   * 存储原始高度
   */
  storeOriginalHeights(heightfield: HeightfieldData): void {
    // 将世界坐标转换为网格坐标
    const size = heightfield.getSize();
    const resolution = heightfield.getResolution();
    
    const centerGridX = Math.floor((this.centerX / size.x + 0.5) * (resolution - 1));
    const centerGridZ = Math.floor((this.centerZ / size.y + 0.5) * (resolution - 1));
    
    // 计算网格空间中的半径
    const gridRadius = Math.ceil(this.radius / Math.max(size.x, size.y) * resolution);
    
    // 定义矩形范围
    const minX = Math.max(0, centerGridX - gridRadius);
    const maxX = Math.min(resolution - 1, centerGridX + gridRadius);
    const minZ = Math.max(0, centerGridZ - gridRadius);
    const maxZ = Math.min(resolution - 1, centerGridZ + gridRadius);
    
    // 存储区域内的原始高度
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        // 计算到中心的距离
        const dx = x - centerGridX;
        const dz = z - centerGridZ;
        const distSq = dx * dx + dz * dz;
        
        // 如果在半径内
        if (distSq <= gridRadius * gridRadius) {
          // 转换为世界坐标
          const worldX = ((x / (resolution - 1)) - 0.5) * size.x;
          const worldZ = ((z / (resolution - 1)) - 0.5) * size.y;
          
          // 存储原始高度
          this.originalHeights.push({
            x: worldX,
            z: worldZ,
            height: heightfield.getHeight(worldX, worldZ)
          });
        }
      }
    }
  }
  
  apply(terrain: TerrainSystem): void {
    const heightfield = terrain.getHeightfield();
    
    // 首次应用时存储原始高度
    if (this.originalHeights.length === 0) {
      this.storeOriginalHeights(heightfield);
    }
    
    // 应用修改
    heightfield.modifyArea(
      this.centerX,
      this.centerZ,
      this.radius,
      this.operation,
      this.strength,
      this.params
    );
    
    // 更新地形
    terrain.update();
  }
  
  revert(terrain: TerrainSystem): void {
    const heightfield = terrain.getHeightfield();
    
    // 恢复原始高度
    for (const point of this.originalHeights) {
      heightfield.setHeight(point.x, point.z, point.height);
    }
    
    // 更新地形
    terrain.update();
  }
} 