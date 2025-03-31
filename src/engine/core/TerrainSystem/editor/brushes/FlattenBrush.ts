import * as THREE from 'three';
import { BrushTool } from './BrushTool';
import { TerrainEditor } from '../TerrainEditor';
import { TerrainSystem } from '../../TerrainSystem';
import { AreaModifyOperation } from '../TerrainEditOperation';

/**
 * 平坦化地形刷子
 */
export class FlattenBrush extends BrushTool {
  private targetHeight: number = 0;
  private useCurrentHeight: boolean = true;
  
  constructor(editor: TerrainEditor, terrain: TerrainSystem) {
    super(editor, terrain);
  }
  
  /**
   * 设置目标高度
   */
  setTargetHeight(height: number): void {
    this.targetHeight = height;
    this.useCurrentHeight = false;
  }
  
  /**
   * 使用当前高度作为目标
   */
  useCurrentPositionHeight(): void {
    this.useCurrentHeight = true;
  }
  
  /**
   * 创建预览
   */
  createPreview(): THREE.Mesh {
    const preview = super.createPreview();
    (preview.material as THREE.MeshBasicMaterial).color.set(0x9966ff);
    return preview;
  }
  
  /**
   * 应用平坦化效果
   */
  apply(position: THREE.Vector3): AreaModifyOperation {
    // 如果使用当前位置高度，更新目标高度
    if (this.useCurrentHeight) {
      this.targetHeight = this.terrain.getHeightfield().getHeight(position.x, position.z);
    }
    
    // 创建操作函数
    const flattenOperation = (oldHeight: number, strength: number, targetHeight: number) => {
      return oldHeight + (targetHeight - oldHeight) * strength;
    };
    
    // 创建编辑操作
    const editOp = new AreaModifyOperation(
      position.x,
      position.z,
      this.size,
      flattenOperation,
      this.strength,
      this.targetHeight
    );
    
    return editOp;
  }
} 