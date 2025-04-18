import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { TSLEffects } from './TSLEffects';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { texture, uv, time, vec4 } from 'three/tsl';

/**
 * 粒子系统TSL效果类型
 */
export enum ParticleTSLEffectType {
    NONE = 'none',
    UV_ANIMATION = 'uv_animation',
    FLOW = 'flow',
    GLOW = 'glow',
    EXPLOSION = 'explosion',
    CONVERGENCE = 'convergence',
    ROTATING_UV = 'rotating_uv',
    DISTORTION = 'distortion',
    DISSOLVE = 'dissolve',
    ENERGY_WAVE = 'energy_wave',
    SWORD_TRAIL = 'sword_trail',
    CUSTOM = 'custom'
}

/**
 * 粒子系统TSL效果参数
 */
export interface ParticleTSLEffectParams {
    // 通用参数
    effectType: ParticleTSLEffectType;
    textureMap?: THREE.Texture;
    
    // UV动画参数
    speedX?: number;
    speedY?: number;
    scale?: number;
    
    // 流动效果参数
    flowSpeed?: number;
    flowDirection?: number; // 0: X方向, 1: Y方向
    
    // 发光效果参数
    baseColor?: THREE.Color;
    glowColor?: THREE.Color;
    glowIntensity?: number;
    pulseSpeed?: number;
    
    // 爆炸效果参数
    centerColor?: THREE.Color;
    edgeColor?: THREE.Color;
    explosionSpeed?: number;
    
    // 内聚效果参数
    convergenceSpeed?: number;
    
    // 旋转UV效果参数
    rotationSpeed?: number;
    
    // 扭曲效果参数
    distortionMap?: THREE.Texture;
    distortionStrength?: number;
    distortionSpeed?: number;
    
    // 溶解效果参数
    noiseMap?: THREE.Texture;
    dissolveEdgeColor?: THREE.Color;
    dissolveAmount?: number;
    edgeWidth?: number;
    
    // 能量波纹效果参数
    waveColor?: THREE.Color;
    waveSpeed?: number;
    waveFrequency?: number;
    waveAmplitude?: number;
    
    // 刀光拖尾效果参数
    trailColor?: THREE.Color;
    trailLength?: number;
    trailSpeed?: number;
    
    // 自定义效果参数
    customColorNode?: any;
    customOpacityNode?: any;
}

/**
 * 粒子系统TSL扩展
 * 为粒子系统添加TSL着色器支持
 */
export class ParticleSystemTSL {
    private particleSystem: ParticleSystem;
    private effectParams: ParticleTSLEffectParams;
    private nodeMaterial: MeshStandardNodeMaterial | MeshBasicNodeMaterial | null = null;
    
    /**
     * 构造函数
     * @param particleSystem 粒子系统实例
     */
    constructor(particleSystem: ParticleSystem) {
        this.particleSystem = particleSystem;
        this.effectParams = {
            effectType: ParticleTSLEffectType.NONE
        };
    }
    
    /**
     * 设置TSL效果
     * @param params 效果参数
     */
    setEffect(params: ParticleTSLEffectParams): void {
        this.effectParams = { ...this.effectParams, ...params };
        this.applyEffect();
    }
    
    /**
     * 应用TSL效果
     */
    private applyEffect(): void {
        // 创建节点材质
        if (!this.nodeMaterial) {
            // 根据粒子系统的渲染模式选择合适的节点材质
            const renderMode = this.particleSystem.getSettings().renderer.renderMode;
            if (renderMode === 'Mesh') {
                this.nodeMaterial = new MeshStandardNodeMaterial();
                this.nodeMaterial.roughness = 1.0;
                this.nodeMaterial.metalness = 0.0;
            } else {
                this.nodeMaterial = new MeshBasicNodeMaterial();
            }
            
            // 设置基本属性
            this.nodeMaterial.transparent = true;
            this.nodeMaterial.side = THREE.DoubleSide;
            this.nodeMaterial.depthWrite = false;
            this.nodeMaterial.blending = THREE.AdditiveBlending;
        }
        
        // 根据效果类型应用不同的TSL效果
        switch (this.effectParams.effectType) {
            case ParticleTSLEffectType.UV_ANIMATION:
                this.applyUVAnimationEffect();
                break;
            case ParticleTSLEffectType.FLOW:
                this.applyFlowEffect();
                break;
            case ParticleTSLEffectType.GLOW:
                this.applyGlowEffect();
                break;
            case ParticleTSLEffectType.EXPLOSION:
                this.applyExplosionEffect();
                break;
            case ParticleTSLEffectType.CONVERGENCE:
                this.applyConvergenceEffect();
                break;
            case ParticleTSLEffectType.ROTATING_UV:
                this.applyRotatingUVEffect();
                break;
            case ParticleTSLEffectType.DISTORTION:
                this.applyDistortionEffect();
                break;
            case ParticleTSLEffectType.DISSOLVE:
                this.applyDissolveEffect();
                break;
            case ParticleTSLEffectType.ENERGY_WAVE:
                this.applyEnergyWaveEffect();
                break;
            case ParticleTSLEffectType.SWORD_TRAIL:
                this.applySwordTrailEffect();
                break;
            case ParticleTSLEffectType.CUSTOM:
                this.applyCustomEffect();
                break;
            default:
                this.applyDefaultEffect();
                break;
        }
        
        // 将节点材质应用到粒子系统
        this.particleSystem.setCustomMaterial(this.nodeMaterial);
    }
    
    /**
     * 应用UV动画效果
     */
    private applyUVAnimationEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap) return;
        
        const { textureMap, speedX = 0.5, speedY = 0.0, scale = 1.0 } = this.effectParams;
        
        // 创建UV动画效果
        const colorNode = TSLEffects.createUVAnimation(textureMap, speedX, speedY, scale);
        
        // 应用到材质
        this.nodeMaterial.colorNode = colorNode;
        this.nodeMaterial.opacityNode = colorNode.a;
    }
    
    /**
     * 应用流动效果
     */
    private applyFlowEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap) return;
        
        const { textureMap, flowSpeed = 1.0, flowDirection = 0, scale = 1.0 } = this.effectParams;
        
        // 创建流动效果
        const colorNode = TSLEffects.createFlowEffect(textureMap, flowSpeed, flowDirection, scale);
        
        // 应用到材质
        this.nodeMaterial.colorNode = colorNode;
        this.nodeMaterial.opacityNode = colorNode.a;
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
            pulseSpeed = 0.5
        } = this.effectParams;
        
        // 创建发光效果
        const colorNode = TSLEffects.createGlowEffect(baseColor, glowColor, glowIntensity, pulseSpeed);
        
        // 应用到材质
        this.nodeMaterial.colorNode = colorNode;
        this.nodeMaterial.opacityNode = this.effectParams.textureMap ? 
            texture(this.effectParams.textureMap, uv()).a : 
            time.sin().mul(0.5).add(0.5);
    }
    
    /**
     * 应用爆炸效果
     */
    private applyExplosionEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap) return;
        
        const { 
            textureMap,
            centerColor = new THREE.Color(0xffff00),
            edgeColor = new THREE.Color(0xff0000),
            explosionSpeed = 1.0
        } = this.effectParams;
        
        // 创建爆炸效果
        const colorNode = TSLEffects.createExplosionEffect(textureMap, centerColor, edgeColor, explosionSpeed);
        
        // 应用到材质
        this.nodeMaterial.colorNode = colorNode;
        this.nodeMaterial.opacityNode = texture(textureMap, uv()).a;
    }
    
    /**
     * 应用内聚效果
     */
    private applyConvergenceEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap) return;
        
        const { 
            textureMap,
            centerColor = new THREE.Color(0x00ffff),
            edgeColor = new THREE.Color(0x0000ff),
            convergenceSpeed = 1.0
        } = this.effectParams;
        
        // 创建内聚效果
        const colorNode = TSLEffects.createConvergenceEffect(textureMap, centerColor, edgeColor, convergenceSpeed);
        
        // 应用到材质
        this.nodeMaterial.colorNode = colorNode;
        this.nodeMaterial.opacityNode = texture(textureMap, uv()).a;
    }
    
    /**
     * 应用旋转UV效果
     */
    private applyRotatingUVEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap) return;
        
        const { 
            textureMap,
            rotationSpeed = 1.0,
            scale = 1.0
        } = this.effectParams;
        
        // 创建旋转UV效果
        const colorNode = TSLEffects.createRotatingUVEffect(textureMap, rotationSpeed, scale);
        
        // 应用到材质
        this.nodeMaterial.colorNode = colorNode;
        this.nodeMaterial.opacityNode = colorNode.a;
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
        const colorNode = TSLEffects.createDistortionEffect(textureMap, distortionMap, distortionStrength, distortionSpeed);
        
        // 应用到材质
        this.nodeMaterial.colorNode = colorNode;
        this.nodeMaterial.opacityNode = colorNode.a;
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
        const resultNode = TSLEffects.createDissolveEffect(textureMap, noiseMap, dissolveEdgeColor, dissolveAmount, edgeWidth);
        
        // 应用到材质
        this.nodeMaterial.colorNode = resultNode.rgb;
        this.nodeMaterial.opacityNode = resultNode.a;
    }
    
    /**
     * 应用能量波纹效果
     */
    private applyEnergyWaveEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap) return;
        
        const { 
            textureMap,
            waveColor = new THREE.Color(0x00ffff),
            waveSpeed = 1.0,
            waveFrequency = 5.0,
            waveAmplitude = 0.1
        } = this.effectParams;
        
        // 创建能量波纹效果
        const colorNode = TSLEffects.createEnergyWaveEffect(textureMap, waveColor, waveSpeed, waveFrequency, waveAmplitude);
        
        // 应用到材质
        this.nodeMaterial.colorNode = colorNode;
        this.nodeMaterial.opacityNode = texture(textureMap, uv()).a;
    }
    
    /**
     * 应用刀光拖尾效果
     */
    private applySwordTrailEffect(): void {
        if (!this.nodeMaterial || !this.effectParams.textureMap) return;
        
        const { 
            textureMap,
            trailColor = new THREE.Color(0x00ffff),
            trailLength = 0.5,
            trailSpeed = 1.0
        } = this.effectParams;
        
        // 创建刀光拖尾效果
        const colorNode = TSLEffects.createSwordTrailEffect(textureMap, trailColor, trailLength, trailSpeed);
        
        // 应用到材质
        this.nodeMaterial.colorNode = colorNode;
        this.nodeMaterial.opacityNode = texture(textureMap, uv()).a;
    }
    
    /**
     * 应用自定义效果
     */
    private applyCustomEffect(): void {
        if (!this.nodeMaterial) return;
        
        const { customColorNode, customOpacityNode } = this.effectParams;
        
        // 应用自定义节点
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
        if (!this.nodeMaterial) return;
        
        // 如果有纹理，使用纹理
        if (this.effectParams.textureMap) {
            const textureNode = texture(this.effectParams.textureMap, uv());
            this.nodeMaterial.colorNode = textureNode;
            this.nodeMaterial.opacityNode = textureNode.a;
        } else {
            // 否则使用白色
            this.nodeMaterial.colorNode = vec4(1, 1, 1, 1);
            this.nodeMaterial.opacityNode = time.sin().mul(0.5).add(0.5);
        }
    }
    
    /**
     * 获取当前效果参数
     */
    getEffectParams(): ParticleTSLEffectParams {
        return this.effectParams;
    }
    
    /**
     * 获取节点材质
     */
    getNodeMaterial(): MeshStandardNodeMaterial | MeshBasicNodeMaterial | null {
        return this.nodeMaterial;
    }
    
    /**
     * 更新效果
     * 在粒子系统更新时调用
     */
    update(deltaTime: number): void {
        // 这里可以添加一些动态更新逻辑
        // 例如，根据粒子生命周期调整效果参数
    }
}
