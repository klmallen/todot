import * as THREE from 'three';
import { BrushTool } from './BrushTool';
import { TerrainEditor } from '../TerrainEditor';
import { TerrainSystem } from '../../TerrainSystem';
import { AreaModifyOperation } from '../TerrainEditOperation';
import { TerrainUtils } from '../../utils/TerrainUtils';

/**
 * 噪声地形刷子
 */
export class NoiseBrush extends BrushTool {
  private seed: number = Math.random() * 10000;
  private scale: number = 30;
  private octaves: number = 3;
  
  constructor(editor: TerrainEditor, terrain: TerrainSystem) {
    super(editor, terrain);
  }
  
  /**
   * 设置噪声参数
   */
  setNoiseParams(seed: number, scale: number, octaves: number): void {
    this.seed = seed;
    this.scale = scale;
    this.octaves = octaves;
  }
  
  /**
   * 创建预览
   */
  createPreview(): THREE.Mesh {
    const preview = super.createPreview();
    (preview.material as THREE.MeshBasicMaterial).color.set(0x33cccc);
    return preview;
  }
  
  /**
   * 应用噪声效果
   */
  apply(position: THREE.Vector3): AreaModifyOperation {
    // 创建操作函数
    const noiseOperation = (oldHeight: number, strength: number, params: any) => {
      // 生成-1到1之间的噪声值
      const noise = TerrainUtils.getSimplexNoise(
        position.x + params.offsetX,
        position.z + params.offsetZ,
        this.seed,
        this.scale,
        this.octaves,
        0.5,  // 持续度
        2.0   // 振幅
      );
      
      // 将噪声值缩放到所需范围并应用
      const noiseHeight = noise * strength * 10;
      return oldHeight + noiseHeight;
    };
    
    // 使用随机偏移，确保每次应用都是唯一的
    const params = {
      offsetX: Math.random() * 1000,
      offsetZ: Math.random() * 1000
    };
    
    // 创建编辑操作
    const editOp = new AreaModifyOperation(
      position.x,
      position.z,
      this.size,
      noiseOperation,
      this.strength,
      params
    );
    
    return editOp;
  }
} 