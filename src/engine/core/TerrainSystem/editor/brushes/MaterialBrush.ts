import * as THREE from 'three';
import { BrushTool } from './BrushTool';
import { TerrainEditor } from '../../TerrainEditor';
import { TerrainSystem } from '../../TerrainSystem';
import { AreaModifyOperation } from '../TerrainEditOperation';

export class MaterialBrush extends BrushTool {
    private layerIndex: number = 0;
    
    constructor(terrainEditor: TerrainEditor) {
        super(terrainEditor);
        this.name = "材质笔刷";
    }
    
    setLayerIndex(index: number): void {
        this.layerIndex = index;
    }
    
    apply(position: THREE.Vector3): void {
        // 在掩码贴图上应用笔刷效果
        const terrainSystem = this.terrainEditor.getTerrainSystem();
        terrainSystem.paintMaterialLayer(position, this.size, this.layerIndex, this.strength);
        
        // 创建操作记录用于撤销/重做
        // 注意：这里简化处理，实际应该保存修改前的状态
        const operation = new AreaModifyOperation(
            position, 
            this.size,
            "材质修改",
            terrainSystem
        );
        
        this.terrainEditor.recordOperation(operation);
    }
}