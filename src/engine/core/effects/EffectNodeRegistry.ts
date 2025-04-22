import * as THREE from 'three';
import { BaseEffectNode } from './BaseEffectNode';
import { DissolveEffectNode } from './DissolveEffectNode';
import { GlowEffectNode } from './GlowEffectNode';
import { DistortionEffectNode } from './DistortionEffectNode';

/**
 * 特效节点类型
 */
export enum EffectNodeType {
    DISSOLVE = 'dissolve',
    GLOW = 'glow',
    DISTORTION = 'distortion'
}

/**
 * 特效节点工厂函数类型
 */
type EffectNodeFactory = (name: string, params: any) => BaseEffectNode;

/**
 * 特效节点注册表
 */
export class EffectNodeRegistry {
    private static instance: EffectNodeRegistry;
    private factories: Map<EffectNodeType, EffectNodeFactory> = new Map();
    
    private constructor() {
        this.registerDefaultFactories();
    }
    
    /**
     * 获取单例实例
     */
    public static getInstance(): EffectNodeRegistry {
        if (!EffectNodeRegistry.instance) {
            EffectNodeRegistry.instance = new EffectNodeRegistry();
        }
        return EffectNodeRegistry.instance;
    }
    
    /**
     * 注册默认工厂函数
     */
    private registerDefaultFactories(): void {
        // 溶解效果
        this.registerFactory(EffectNodeType.DISSOLVE, (name, params) => {
            return new DissolveEffectNode(name, {
                textureMap: params.textureMap,
                noiseMap: params.noiseMap,
                dissolveEdgeColor: params.dissolveEdgeColor,
                dissolveAmount: params.dissolveAmount,
                edgeWidth: params.edgeWidth
            });
        });
        
        // 发光效果
        this.registerFactory(EffectNodeType.GLOW, (name, params) => {
            return new GlowEffectNode(name, {
                baseColor: params.baseColor,
                glowColor: params.glowColor,
                glowIntensity: params.glowIntensity,
                pulseSpeed: params.pulseSpeed
            });
        });
        
        // 扭曲效果
        this.registerFactory(EffectNodeType.DISTORTION, (name, params) => {
            return new DistortionEffectNode(name, {
                textureMap: params.textureMap,
                distortionMap: params.distortionMap,
                distortionStrength: params.distortionStrength,
                distortionSpeed: params.distortionSpeed
            });
        });
    }
    
    /**
     * 注册新的工厂函数
     */
    public registerFactory(type: EffectNodeType, factory: EffectNodeFactory): void {
        this.factories.set(type, factory);
    }
    
    /**
     * 创建特效节点
     */
    public createEffectNode(type: EffectNodeType, name: string, params: any): BaseEffectNode {
        const factory = this.factories.get(type);
        if (!factory) {
            throw new Error(`Effect node type ${type} not found`);
        }
        return factory(name, params);
    }
    
    /**
     * 获取所有可用的特效节点类型
     */
    public getAvailableTypes(): EffectNodeType[] {
        return Array.from(this.factories.keys());
    }
}