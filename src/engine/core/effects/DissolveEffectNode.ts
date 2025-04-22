import * as THREE from 'three';
import { BaseEffectNode } from './BaseEffectNode';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
    texture, uv, mix, step, smoothstep, color, float, vec3
} from 'three/tsl';

/**
 * 溶解特效参数接口
 */
export interface DissolveEffectParams {
    textureMap?: THREE.Texture;
    noiseMap?: THREE.Texture;
    dissolveEdgeColor?: THREE.Color;
    dissolveAmount?: number;
    edgeWidth?: number;
}

/**
 * 溶解特效节点类
 */
export class DissolveEffectNode extends BaseEffectNode {
    private params: DissolveEffectParams;
    private nodeMaterial: MeshStandardNodeMaterial | null = null;
    
    constructor(name: string, params: DissolveEffectParams) {
        super(name);
        this.params = {
            textureMap: params.textureMap,
            noiseMap: params.noiseMap,
            dissolveEdgeColor: params.dissolveEdgeColor || new THREE.Color(0xff0000),
            dissolveAmount: params.dissolveAmount || 0.5,
            edgeWidth: params.edgeWidth || 0.1
        };
    }
    
    /**
     * 初始化溶解特效
     */
    public initEffect(): void {
        this.saveOriginalMaterial();
        this.createDissolveMaterial();
        this.applyEffectMaterial();
    }
    
    /**
     * 更新溶解特效参数
     */
    public updateEffectParams(params: Partial<DissolveEffectParams>): void {
        this.params = { ...this.params, ...params };
        this.createDissolveMaterial();
        this.applyEffectMaterial();
    }
    
    /**
     * 创建溶解材质
     */
    private createDissolveMaterial(): void {
        if (!this.params.textureMap || !this.params.noiseMap) {
            console.warn('Missing required textures for dissolve effect');
            return;
        }
        
        // 创建节点材质
        this.nodeMaterial = new MeshStandardNodeMaterial();
        this.nodeMaterial.side = THREE.DoubleSide;
        this.nodeMaterial.transparent = true;
        
        // 使用TSL创建溶解效果
        const texColor = texture(this.params.textureMap, uv());
        const noiseValue = texture(this.params.noiseMap, uv()).r;
        const edgeColor = color(this.params.dissolveEdgeColor);
        const dissolveAmount = float(this.params.dissolveAmount);
        const edgeWidth = float(this.params.edgeWidth);
        
        // 计算溶解边缘
        const edge = smoothstep(
            dissolveAmount.sub(edgeWidth),
            dissolveAmount.add(edgeWidth),
            noiseValue
        );
        
        // 混合颜色
        const finalColor = mix(texColor.rgb, edgeColor, edge);
        
        // 计算透明度
        const opacity = texColor.a.mul(noiseValue.gt(dissolveAmount).not());
        
        // 设置材质节点
        this.nodeMaterial.colorNode = finalColor;
        this.nodeMaterial.opacityNode = opacity;
        
        this.effectMaterial = this.nodeMaterial;
    }
    
    /**
     * 设置溶解量
     */
    public setDissolveAmount(amount: number): void {
        this.updateEffectParams({ dissolveAmount: amount });
    }
    
    /**
     * 设置边缘宽度
     */
    public setEdgeWidth(width: number): void {
        this.updateEffectParams({ edgeWidth: width });
    }
} 