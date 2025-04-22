import * as THREE from 'three';
import { Node3d } from './Node3d';
import { TSLEffects } from './ParticleSystem/TSLEffects';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { texture, uv, time, vec4 } from 'three/tsl';

/**
 * 特效节点类型
 */
export enum EffectType {
    NONE = 'none',
    DISSOLVE = 'dissolve',
    GLOW = 'glow',
    DISTORTION = 'distortion',
    CUSTOM = 'custom'
}

/**
 * 特效参数接口
 */
export interface EffectParams {
    // 通用参数
    effectType: EffectType;
    textureMap?: THREE.Texture;
    
    // 溶解效果参数
    noiseMap?: THREE.Texture;
    dissolveEdgeColor?: THREE.Color;
    dissolveAmount?: number;
    edgeWidth?: number;
    
    // 发光效果参数
    baseColor?: THREE.Color;
    glowColor?: THREE.Color;
    glowIntensity?: number;
    pulseSpeed?: number;
    
    // 扭曲效果参数
    distortionMap?: THREE.Texture;
    distortionStrength?: number;
    distortionSpeed?: number;
    
    // 自定义效果参数
    customColorNode?: any;
    customOpacityNode?: any;
}

/**
 * 特效节点类
 * 继承自Node3d，用于实现各种特效
 */
export class EffectNode extends Node3d {
    private effectParams: EffectParams;
    private nodeMaterial: MeshStandardNodeMaterial | null = null;
    private originalMaterial: THREE.Material | null = null;
    
    constructor(name: string, effectParams: EffectParams) {
        super(name);
        this.effectParams = effectParams;
    }
    
    /**
     * 初始化特效
     */
    public initEffect(): void {
        // 保存原始材质
        const mesh = this.getThreeObject().children[0] as THREE.Mesh;
        if (mesh && mesh.material) {
            this.originalMaterial = mesh.material;
        }
        
        // 创建节点材质
        this.nodeMaterial = new MeshStandardNodeMaterial();
        this.nodeMaterial.side = THREE.DoubleSide;
        this.nodeMaterial.transparent = true;
        
        // 应用特效
        this.applyEffect();
        
        // 设置材质
        if (mesh) {
            mesh.material = this.nodeMaterial;
        }
    }
    
    /**
     * 应用特效
     */
    private applyEffect(): void {
        if (!this.nodeMaterial) return;
        
        switch (this.effectParams.effectType) {
            case EffectType.DISSOLVE:
                this.applyDissolveEffect();
                break;
            case EffectType.GLOW:
                this.applyGlowEffect();
                break;
            case EffectType.DISTORTION:
                this.applyDistortionEffect();
                break;
            case EffectType.CUSTOM:
                this.applyCustomEffect();
                break;
            default:
                this.applyDefaultEffect();
                break;
        }
    }
    
    /**
     * 应用溶解效果
     */
    private applyDissolveEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap || !this.effectParams.noiseMap) return;
        
        const { 
            textureMap,
            noiseMap,
            dissolveEdgeColor = new THREE.Color(0xff0000),
            dissolveAmount = 0.5,
            edgeWidth = 0.1
        } = this.effectParams;
        
        // 创建溶解效果
        const resultNode = TSLEffects.createDissolveEffect(
            textureMap, 
            noiseMap, 
            dissolveEdgeColor, 
            dissolveAmount, 
            edgeWidth
        );
        
        // 应用到材质
        this.nodeMaterial.colorNode = resultNode.rgb;
        this.nodeMaterial.opacityNode = resultNode.a;
    }
    
    /**
     * 应用发光效果
     */
    private applyGlowEffect(): void {
        if (!this.nodeMaterial) return;
        
        const {
            baseColor = new THREE.Color(0xffffff),
            glowColor = new THREE.Color(0x00ffff),
            glowIntensity = 1.0,
            pulseSpeed = 0.0
        } = this.effectParams;
        
        // 创建发光效果
        const resultNode = TSLEffects.createGlowEffect(
            baseColor,
            glowColor,
            glowIntensity,
            pulseSpeed
        );
        
        // 应用到材质
        this.nodeMaterial.colorNode = resultNode;
    }
    
    /**
     * 应用扭曲效果
     */
    private applyDistortionEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap || !this.effectParams.distortionMap) return;
        
        const {
            textureMap,
            distortionMap,
            distortionStrength = 0.1,
            distortionSpeed = 1.0
        } = this.effectParams;
        
        // 创建扭曲效果
        const resultNode = TSLEffects.createDistortionEffect(
            textureMap,
            distortionMap,
            distortionStrength,
            distortionSpeed
        );
        
        // 应用到材质
        this.nodeMaterial.colorNode = resultNode;
    }
    
    /**
     * 应用自定义效果
     */
    private applyCustomEffect(): void {
        if (!this.nodeMaterial) return;
        
        const { customColorNode, customOpacityNode } = this.effectParams;
        
        if (customColorNode) {
            this.nodeMaterial.colorNode = customColorNode;
        }
        
        if (customOpacityNode) {
            this.nodeMaterial.opacityNode = customOpacityNode;
        }
    }
    
    /**
     * 应用默认效果
     */
    private applyDefaultEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap) return;
        
        // 使用基础纹理
        const resultNode = texture(this.effectParams.textureMap, uv());
        this.nodeMaterial.colorNode = resultNode;
    }
    
    /**
     * 更新特效参数
     * @param params 新的特效参数
     */
    public updateEffectParams(params: Partial<EffectParams>): void {
        this.effectParams = { ...this.effectParams, ...params };
        this.applyEffect();
    }
    
    /**
     * 重置为原始材质
     */
    public resetToOriginalMaterial(): void {
        const mesh = this.getThreeObject().children[0] as THREE.Mesh;
        if (mesh && this.originalMaterial) {
            mesh.material = this.originalMaterial;
        }
    }
    
    /**
     * 设置溶解量
     * @param amount 溶解量 (0-1)
     */
    public setDissolveAmount(amount: number): void {
        this.updateEffectParams({ dissolveAmount: amount });
    }
    
    /**
     * 设置发光强度
     * @param intensity 发光强度
     */
    public setGlowIntensity(intensity: number): void {
        this.updateEffectParams({ glowIntensity: intensity });
    }
    
    /**
     * 设置扭曲强度
     * @param strength 扭曲强度
     */
    public setDistortionStrength(strength: number): void {
        this.updateEffectParams({ distortionStrength: strength });
    }
} 