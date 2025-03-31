import * as THREE from 'three';
import { BrushTool } from './BrushTool';
import { TerrainEditor } from '../TerrainEditor';
import { TerrainSystem } from '../../TerrainSystem';
import { AreaModifyOperation } from '../TerrainEditOperation';

/**
 * 平滑地形刷子
 */
export class SmoothBrush extends BrushTool {
  private kernelSize: number = 3;
  
  constructor(editor: TerrainEditor, terrain: TerrainSystem) {
    super(editor, terrain);
  }
  
  /**
   * 设置内核大小
   */
  setKernelSize(size: number): void {
    this.kernelSize = Math.max(1, Math.min(7, size));
  }
  
  /**
   * 创建预览
   */
  createPreview(): THREE.Mesh {
    const preview = super.createPreview();
    (preview.material as THREE.MeshBasicMaterial).color.set(0xffcc00);
    return preview;
  }
  
  /**
   * 应用平滑效果
   */
  apply(position: THREE.Vector3): AreaModifyOperation {
    // 创建操作函数
    const smoothOperation = (oldHeight: number, strength: number, params: any) => {
      const heightfield = this.terrain.getHeightfield();
      const size = heightfield.getSize();
      const resolution = heightfield.getResolution();
      
      // 将世界坐标转换为网格坐标
      const gridX = Math.floor((position.x / size.x + 0.5) * (resolution - 1));
      const gridZ = Math.floor((position.z / size.y + 0.5) * (resolution - 1));
      
      // 计算周围点的平均高度
      let totalHeight = 0;
      let count = 0;
      
      const halfKernel = Math.floor(this.kernelSize / 2);
      
      for (let dz = -halfKernel; dz <= halfKernel; dz++) {
        for (let dx = -halfKernel; dx <= halfKernel; dx++) {
          const nx = gridX + dx;
          const nz = gridZ + dz;
          
          if (nx >= 0 && nx < resolution && nz >= 0 && nz < resolution) {
            // 转换回世界坐标
            const worldX = ((nx / (resolution - 1)) - 0.5) * size.x;
            const worldZ = ((nz / (resolution - 1)) - 0.5) * size.y;
            
            totalHeight += heightfield.getHeight(worldX, worldZ);
            count++;
          }
        }
      }
      
      // 计算平均高度
      const avgHeight = count > 0 ? totalHeight / count : oldHeight;
      
      // 向平均值移动，使用强度作为插值因子
      return oldHeight + (avgHeight - oldHeight) * strength;
    };
    
    // 创建编辑操作
    const editOp = new AreaModifyOperation(
      position.x,
      position.z,
      this.size,
      smoothOperation,
      this.strength
    );
    
    return editOp;
  }
} 