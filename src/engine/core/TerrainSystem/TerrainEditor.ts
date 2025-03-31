import * as THREE from 'three';
import { TerrainSystem } from './TerrainSystem';
import { BrushTool } from './editor/brushes/BrushTool';
import { RaiseLowerBrush } from './editor/brushes/RaiseLowerBrush';
import { SmoothBrush } from './editor/brushes/SmoothBrush';
import { FlattenBrush } from './editor/brushes/FlattenBrush';
import { NoiseBrush } from './editor/brushes/NoiseBrush';
import { TerrainEditOperation, AreaModifyOperation } from './editor/TerrainEditOperation';
import { MaterialBrush } from './editor/brushes/MaterialBrush';

/**
 * 地形编辑器类，管理地形的编辑操作
 */
export class TerrainEditor {
  private terrain: TerrainSystem;
  private activeBrush: BrushTool | null = null;
  private brushSize: number = 10;
  private brushStrength: number = 0.5;
  private isEditing: boolean = false;
  
  // 射线投射器，用于检测鼠标位置
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  
  // 历史记录
  private history: TerrainEditOperation[] = [];
  private historyIndex: number = -1;
  private maxHistoryLength: number = 50;
  
  // 可用的刷子类型
  private brushes: Map<string, BrushTool> = new Map();
  
  // 上次编辑位置，用于避免重复编辑
  private lastEditPosition: THREE.Vector3 | null = null;
  private minEditDistance: number = 0.5;
  
  private materialBrush: MaterialBrush;
  private currentMaterialLayer: number = 0;
  
  constructor(terrain: TerrainSystem) {
    this.terrain = terrain;
    this.initialize();
  }
  
  /**
   * 初始化编辑器
   */
  initialize(): void {
    // 创建刷子工具
    this.brushes.set('raiseLower', new RaiseLowerBrush(this, this.terrain));
    this.brushes.set('smooth', new SmoothBrush(this, this.terrain));
    this.brushes.set('flatten', new FlattenBrush(this, this.terrain));
    this.brushes.set('noise', new NoiseBrush(this, this.terrain));
    
    // 默认选择升降刷
    this.setBrushType('raiseLower');
    
    this.materialBrush = new MaterialBrush(this);
  }
  
  /**
   * 设置刷子类型
   */
  setBrushType(type: string): void {
    // 隐藏当前刷子的预览
    if (this.activeBrush) {
      this.activeBrush.hidePreview();
    }
    
    // 选择新刷子
    const brush = this.brushes.get(type);
    if (brush) {
      this.activeBrush = brush;
      
      // 应用当前的大小和强度
      brush.setSize(this.brushSize);
      brush.setStrength(this.brushStrength);
      
      // 如果正在编辑，显示预览
      if (this.isEditing) {
        brush.showPreview();
      }
    } else {
      console.warn(`未知的刷子类型: ${type}`);
    }
    
    if (type === 'material') {
      this.currentBrush = this.materialBrush;
      this.materialBrush.setLayerIndex(this.currentMaterialLayer);
    }
  }
  
  /**
   * 设置刷子大小
   */
  setBrushSize(size: number): void {
    this.brushSize = size;
    if (this.activeBrush) {
      this.activeBrush.setSize(size);
    }
  }
  
  /**
   * 设置刷子强度
   */
  setBrushStrength(strength: number): void {
    this.brushStrength = strength;
    if (this.activeBrush) {
      this.activeBrush.setStrength(strength);
    }
  }
  
  /**
   * 开始编辑操作
   */
  startEditing(mousePosition: THREE.Vector2, camera: THREE.Camera): boolean {
    if (!this.activeBrush) return false;
    
    this.isEditing = true;
    
    // 设置射线
    this.raycaster.setFromCamera(mousePosition, camera);
    
    // 检测与地形的相交
    const intersects = this.terrain.raycast(this.raycaster);
    
    if (intersects.length > 0) {
      // 获取击中点
      const point = intersects[0].point;
      
      // 显示并更新刷子预览
      this.activeBrush.showPreview();
      this.activeBrush.updatePreviewPosition(point);
      
      // 应用刷子操作
      this.applyBrush(point);
      
      // 记录最后编辑位置
      this.lastEditPosition = point.clone();
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 继续编辑操作（拖动时）
   */
  continueEditing(mousePosition: THREE.Vector2, camera: THREE.Camera): boolean {
    if (!this.isEditing || !this.activeBrush) return false;
    
    // 设置射线
    this.raycaster.setFromCamera(mousePosition, camera);
    
    // 检测与地形的相交
    const intersects = this.terrain.raycast(this.raycaster);
    
    if (intersects.length > 0) {
      // 获取击中点
      const point = intersects[0].point;
      
      // 更新刷子预览位置
      this.activeBrush.updatePreviewPosition(point);
      
      // 检查与上次编辑位置的距离，避免过于频繁的编辑
      if (this.lastEditPosition && 
          this.lastEditPosition.distanceTo(point) < this.minEditDistance) {
        return true;
      }
      
      // 应用刷子操作
      this.applyBrush(point);
      
      // 更新最后编辑位置
      this.lastEditPosition = point.clone();
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 结束编辑操作
   */
  endEditing(): void {
    this.isEditing = false;
    this.lastEditPosition = null;
    
    // 隐藏刷子预览
    if (this.activeBrush) {
      this.activeBrush.hidePreview();
    }
  }
  
  /**
   * 更新预览位置（悬停时）
   */
  updatePreview(mousePosition: THREE.Vector2, camera: THREE.Camera): boolean {
    if (this.isEditing || !this.activeBrush) return false;
    
    // 设置射线
    this.raycaster.setFromCamera(mousePosition, camera);
    
    // 检测与地形的相交
    const intersects = this.terrain.raycast(this.raycaster);
    
    if (intersects.length > 0) {
      // 获取击中点
      const point = intersects[0].point;
      
      // 显示并更新刷子预览
      this.activeBrush.showPreview();
      this.activeBrush.updatePreviewPosition(point);
      
      return true;
    } else {
      // 如果没有击中，隐藏预览
      this.activeBrush.hidePreview();
      return false;
    }
  }
  
  /**
   * 应用刷子操作
   */
  private applyBrush(position: THREE.Vector3): void {
    if (!this.activeBrush) return;
    
    // 获取刷子操作
    const operation = this.activeBrush.apply(position);
    
    // 应用操作
    this.applyEdit(operation);
  }
  
  /**
   * 应用编辑操作
   */
  applyEdit(operation: TerrainEditOperation): void {
    // 应用操作
    operation.apply(this.terrain);
    
    // 记录历史
    if (this.historyIndex < this.history.length - 1) {
      // 如果在历史中间进行了编辑，丢弃后面的历史
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // 添加到历史记录
    this.history.push(operation);
    this.historyIndex++;
    
    // 限制历史记录长度
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
      this.historyIndex--;
    }
  }
  
  /**
   * 撤销操作
   */
  undo(): boolean {
    if (this.historyIndex >= 0) {
      this.history[this.historyIndex].revert(this.terrain);
      this.historyIndex--;
      return true;
    }
    return false;
  }
  
  /**
   * 重做操作
   */
  redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.history[this.historyIndex].apply(this.terrain);
      return true;
    }
    return false;
  }
  
  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
  }
  
  /**
   * 获取可用的刷子类型
   */
  getBrushTypes(): string[] {
    return Array.from(this.brushes.keys());
  }
  
  /**
   * 获取当前活动的刷子
   */
  getActiveBrush(): BrushTool | null {
    return this.activeBrush;
  }
  
  /**
   * 设置升高/降低模式（仅对RaiseLowerBrush有效）
   */
  setRaisingMode(raising: boolean): void {
    const brush = this.brushes.get('raiseLower') as RaiseLowerBrush;
    if (brush) {
      brush.setRaisingMode(raising);
    }
  }
  
  /**
   * 设置平坦化目标高度（仅对FlattenBrush有效）
   */
  setFlattenTargetHeight(height: number): void {
    const brush = this.brushes.get('flatten') as FlattenBrush;
    if (brush) {
      brush.setTargetHeight(height);
    }
  }
  
  /**
   * 使用当前位置高度作为平坦化目标（仅对FlattenBrush有效）
   */
  useCurrentHeightForFlatten(): void {
    const brush = this.brushes.get('flatten') as FlattenBrush;
    if (brush) {
      brush.useCurrentPositionHeight();
    }
  }
  
  /**
   * 设置噪声参数（仅对NoiseBrush有效）
   */
  setNoiseParams(seed: number, scale: number, octaves: number): void {
    const brush = this.brushes.get('noise') as NoiseBrush;
    if (brush) {
      brush.setNoiseParams(seed, scale, octaves);
    }
  }
  
  /**
   * 设置材质笔刷的目标层
   */
  setMaterialLayer(layerIndex: number): void {
    this.currentMaterialLayer = layerIndex;
    if (this.materialBrush) {
      this.materialBrush.setLayerIndex(layerIndex);
    }
  }
  
  /**
   * 销毁资源
   */
  dispose(): void {
    // 清理所有刷子
    for (const brush of this.brushes.values()) {
      brush.dispose();
    }
    
    this.brushes.clear();
    this.activeBrush = null;
    this.history = [];
  }
}