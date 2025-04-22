import * as THREE from 'three';
import { BaseEffectNode } from '../BaseEffectNode';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { 
    Node, float, color, vec3, sin, time, normalize, dot, abs, pow, mix,
    positionWorld, normalWorld, viewPosition
} from 'three/tsl';

/**
 * 发光效果参数接口
 */
export interface GlowEffectParams {
    baseColor?: THREE.Color | string;
    glowColor?: THREE.Color | string;
    glowIntensity?: number;
    pulseSpeed?: number;
}

/**
 * 发光效果节点
 * 为3D对象添加发光效果
 */
export class GlowEffectNode extends BaseEffectNode {
    private nodeMaterial: MeshStandardNodeMaterial | null = null;
    private baseColor: THREE.Color;
    private glowColor: THREE.Color;
    private glowIntensity: number;
    private pulseSpeed: number;
    private startTime: number;

    /**
     * 构造函数
     * @param mesh 要应用效果的网格
     * @param params 发光效果参数
     */
    constructor(mesh: THREE.Mesh, params?: GlowEffectParams) {
        super(mesh);
        
        this.baseColor = params?.baseColor ? 
            (typeof params.baseColor === 'string' ? new THREE.Color(params.baseColor) : params.baseColor) : 
            new THREE.Color(0x444444);
            
        this.glowColor = params?.glowColor ? 
            (typeof params.glowColor === 'string' ? new THREE.Color(params.glowColor) : params.glowColor) : 
            new THREE.Color(0x00ff00);
            
        this.glowIntensity = params?.glowIntensity ?? 1.0;
        this.pulseSpeed = params?.pulseSpeed ?? 1.0;
        this.startTime = Date.now();
    }

    /**
     * 初始化发光效果
     */
    protected initEffect(): void {
        this.saveOriginalMaterial();
        this.nodeMaterial = this.createGlowMaterial();
        this.applyEffectMaterial(this.nodeMaterial);
    }

    /**
     * 更新效果参数
     * @param params 效果参数
     */
    public updateEffectParams(params: Partial<GlowEffectParams>): void {
        if (params.baseColor) {
            this.baseColor = typeof params.baseColor === 'string' ? 
                new THREE.Color(params.baseColor) : params.baseColor;
        }
        
        if (params.glowColor) {
            this.glowColor = typeof params.glowColor === 'string' ? 
                new THREE.Color(params.glowColor) : params.glowColor;
        }
        
        if (params.glowIntensity !== undefined) {
            this.glowIntensity = params.glowIntensity;
        }
        
        if (params.pulseSpeed !== undefined) {
            this.pulseSpeed = params.pulseSpeed;
        }

        // 更新材质的节点
        if (this.nodeMaterial) {
            this.nodeMaterial = this.createGlowMaterial();
            this.applyEffectMaterial(this.nodeMaterial);
        }
    }

    /**
     * 创建发光材质
     * @returns 发光材质
     */
    private createGlowMaterial(): MeshStandardNodeMaterial {
        const material = new MeshStandardNodeMaterial();
        material.side = THREE.DoubleSide;
        material.transparent = true;
        
        // 创建基本颜色节点
        const baseColorNode = color(this.baseColor.r, this.baseColor.g, this.baseColor.b);
        
        // 创建发光颜色节点
        const glowColorNode = color(this.glowColor.r, this.glowColor.g, this.glowColor.b);
        
        // 创建发光强度节点
        const glowIntensityNode = float(this.glowIntensity);
        
        // 创建脉冲速度节点
        const pulseSpeedNode = float(this.pulseSpeed);
        
        // 创建时间节点
        const timeNode = time.mul(pulseSpeedNode);
        
        // 计算脉冲因子
        const pulseFactor = sin(timeNode).mul(0.5).add(0.5);
        
        // 计算视角方向
        const viewDir = normalize(viewPosition.sub(positionWorld));
        const normalDir = normalize(normalWorld);
        
        // 计算边缘效果（菲涅尔）
        const edgeFactor = float(1.0).sub(abs(dot(viewDir, normalDir))).pow(float(2.0));
        
        // 组合边缘效果和脉冲效果
        const glowFactor = edgeFactor.mul(pulseFactor).mul(glowIntensityNode);
        
        // 混合基础颜色和发光颜色
        const finalColor = mix(baseColorNode, glowColorNode, glowFactor);

        // 设置材质的颜色
        material.colorNode = finalColor;
        
        return material;
    }

    /**
     * 设置发光强度
     * @param intensity 发光强度
     */
    public setGlowIntensity(intensity: number): void {
        this.updateEffectParams({ glowIntensity: intensity });
    }

    /**
     * 设置脉冲速度
     * @param speed 脉冲速度
     */
    public setPulseSpeed(speed: number): void {
        this.updateEffectParams({ pulseSpeed: speed });
    }

    /**
     * 更新方法，每帧调用
     * @param delta 时间增量
     */
    public update(delta: number): void {
        // 可以在这里添加动画更新逻辑
    }
} 