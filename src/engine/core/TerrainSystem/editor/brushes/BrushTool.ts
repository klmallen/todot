import * as THREE from 'three';
import { TerrainEditor } from '../../TerrainEditor';
import { TerrainSystem } from '../../TerrainSystem';
import { HeightfieldData } from '../../HeightfieldData';
import { AreaModifyOperation } from '../TerrainEditOperation';

/**
 * 地形刷子工具基类
 */
export abstract class BrushTool {
  protected editor: TerrainEditor;
  protected terrain: TerrainSystem;
  protected size: number;
  protected strength: number;
  protected falloff: number;
  protected preview: THREE.Mesh | null = null;
  
  constructor(editor: TerrainEditor, terrain: TerrainSystem) {
    this.editor = editor;
    this.terrain = terrain;
    this.size = 10;
    this.strength = 0.5;
    this.falloff = 0.5;
  }
  
  /**
   * 设置刷子大小
   */
  setSize(size: number): void {
    this.size = size;
    this.updatePreviewSize();
  }
  
  /**
   * 设置刷子强度
   */
  setStrength(strength: number): void {
    this.strength = strength;
  }
  
  /**
   * 设置刷子衰减
   */
  setFalloff(falloff: number): void {
    this.falloff = falloff;
  }
  
  /**
   * 应用刷子效果的抽象方法
   */
  abstract apply(position: THREE.Vector3): AreaModifyOperation;
  
  /**
   * 创建预览
   */
  createPreview(): THREE.Mesh {
    // 创建圆形平面作为预览
    const geometry = new THREE.CircleGeometry(1, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthTest: false
    });
    
    this.preview = new THREE.Mesh(geometry, material);
    this.preview.rotation.x = -Math.PI / 2; // 水平放置
    this.preview.scale.set(this.size, this.size, 1);
    
    return this.preview;
  }
  
  /**
   * 更新预览位置
   */
  updatePreviewPosition(position: THREE.Vector3): void {
    if (this.preview) {
      this.preview.position.copy(position);
      
      // 使预览贴合地形
      if (this.terrain) {
        const height = this.terrain.getHeightfield().getHeight(position.x, position.z);
        this.preview.position.y = height + 0.1; // 稍微抬高一点，避免z-fighting
      }
    }
  }
  
  /**
   * 更新预览大小
   */
  protected updatePreviewSize(): void {
    if (this.preview) {
      this.preview.scale.set(this.size, this.size, 1);
    }
  }
  
  /**
   * 显示预览
   */
  showPreview(): void {
    if (this.preview && !this.preview.parent) {
      this.terrain.add(this.preview);
    }
  }
  
  /**
   * 隐藏预览
   */
  hidePreview(): void {
    if (this.preview && this.preview.parent) {
      this.preview.removeFromParent();
    }
  }
  
  /**
   * 销毁资源
   */
  dispose(): void {
    this.hidePreview();
    if (this.preview) {
      (this.preview.geometry as THREE.BufferGeometry).dispose();
      (this.preview.material as THREE.Material).dispose();
      this.preview = null;
    }
  }
} 