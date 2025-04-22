import * as THREE from 'three';
import { BaseEffectNode } from './BaseEffectNode';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
    texture, uv, color, float, vec3, sin, time, dot, normalize, abs, pow,
    mix, step, smoothstep
} from 'three/tsl';

/**
 * 示例特效参数接口
 */
export interface ExampleEffectParams {
    textureMap?: THREE.Texture;
    noiseMap?: THREE.Texture;
    baseColor?: THREE.Color;
    glowColor?: THREE.Color;
    glowIntensity?: number;
    pulseSpeed?: number;
    dissolveAmount?: number;
    edgeWidth?: number;
}

/**
 * 示例特效节点类
 * 展示如何组合多个效果
 */
export class ExampleEffectNode extends BaseEffectNode {
    private params: ExampleEffectParams;
    
    constructor(name: string, params: ExampleEffectParams) {
        super(name);
        this.params = {
            textureMap: params.textureMap,
            noiseMap: params.noiseMap,
            baseColor: params.baseColor || new THREE.Color(0xffffff),
            glowColor: params.glowColor || new THREE.Color(0x00ffff),
            glowIntensity: params.glowIntensity || 1.0,
            pulseSpeed: params.pulseSpeed || 1.0,
            dissolveAmount: params.dissolveAmount || 0.5,
            edgeWidth: params.edgeWidth || 0.1
        };
    }
    
    /**
     * 构建效果节点
     */
    protected buildEffectNodes(): void {
        if (!this.nodeMaterial) return;
        
        // 1. 基础纹理
        const texColor = this.params.textureMap ? 
            texture(this.params.textureMap, uv()) : 
            color(this.params.baseColor);
        
        // 2. 溶解效果
        let finalColor = texColor;
        if (this.params.noiseMap) {
            const noiseValue = texture(this.params.noiseMap, uv()).r;
            const edge = smoothstep(
                float(this.params.dissolveAmount).sub(float(this.params.edgeWidth)),
                float(this.params.dissolveAmount).add(float(this.params.edgeWidth)),
                noiseValue
            );
            finalColor = mix(texColor, color(this.params.glowColor), edge);
        }
        
        // 3. 发光效果
        const normal = normalize(vec3(0, 0, 1));
        const viewDir = normalize(vec3(0, 0, -1));
        const fresnel = pow(float(1.0).sub(abs(dot(normal, viewDir))), float(2.0));
        const pulse = sin(time().mul(float(this.params.pulseSpeed))).mul(0.5).add(0.5);
        const glow = color(this.params.glowColor)
            .mul(float(this.params.glowIntensity))
            .mul(pulse)
            .mul(fresnel);
        
        // 4. 组合效果
        finalColor = finalColor.add(glow);
        
        // 设置材质节点
        this.nodeMaterial.colorNode = finalColor;
    }
    
    /**
     * 更新特效参数
     */
    public updateEffectParams(params: Partial<ExampleEffectParams>): void {
        this.params = { ...this.params, ...params };
        this.buildEffectNodes();
    }
    
    /**
     * 添加自定义效果
     * 示例：添加UV动画效果
     */
    public addUVAnimation(speed: number): void {
        if (!this.nodeMaterial) return;
        
        const animatedUV = uv().add(
            vec3(
                sin(time().mul(float(speed))),
                cos(time().mul(float(speed))),
                0
            )
        );
        
        this.addCustomNode('animatedUV', animatedUV);
        
        // 更新纹理UV
        if (this.params.textureMap) {
            const texColor = texture(this.params.textureMap, animatedUV);
            this.nodeMaterial.colorNode = texColor;
        }
    }
} 