import * as THREE from 'three';
import { BrushTool } from './BrushTool';
import { TerrainEditor } from '../../TerrainEditor';
import { TerrainSystem } from '../../TerrainSystem';
import { AreaModifyOperation } from '../TerrainEditOperation';

/**
 * 升降地形刷子
 */
export class RaiseLowerBrush extends BrushTool {
  private raisingMode: boolean = true;
  
  constructor(editor: TerrainEditor, terrain: TerrainSystem) {
    super(editor, terrain);
    
    // 创建蓝色预览（升高）或红色预览（降低）
    this.updatePreviewColor();
  }
  
  /**
   * 设置模式（升高或降低）
   */
  setRaisingMode(raising: boolean): void {
    this.raisingMode = raising;
    this.updatePreviewColor();
  }
  
  /**
   * 更新预览颜色
   */
  private updatePreviewColor(): void {
    if (this.preview) {
      (this.preview.material as THREE.MeshBasicMaterial).color.set(
        this.raisingMode ? 0x0066ff : 0xff3300
      );
    }
  }
  
  /**
   * 创建预览（覆盖父类方法以设置颜色）
   */
  createPreview(): THREE.Mesh {
    const preview = super.createPreview();
    this.updatePreviewColor();
    return preview;
  }
  
  /**
   * 应用升降效果
   */
  apply(position: THREE.Vector3): AreaModifyOperation {
    // 创建操作函数
    const operation = (oldHeight: number, strength: number, raising: boolean) => {
      return raising ? oldHeight + strength : oldHeight - strength;
    };
    
    // 创建编辑操作
    const editOp = new AreaModifyOperation(
      position.x,
      position.z,
      this.size,
      operation,
      this.strength,
      this.raisingMode
    );
    
    return editOp;
  }
} 