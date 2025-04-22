import * as THREE from 'three';
import { BaseEffectNode } from './BaseEffectNode';
import { EffectNodeRegistry, EffectNodeType } from './EffectNodeRegistry';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { Node } from 'three/tsl';

/**
 * 组合特效节点配置
 */
export interface EffectNodeConfig {
    type: EffectNodeType;
    name: string;
    params: any;
    enabled?: boolean;
}

/**
 * 组合特效节点类
 */
export class CompositeEffectNode extends BaseEffectNode {
    private effectConfigs: EffectNodeConfig[] = [];
    private effectNodes: BaseEffectNode[] = [];
    private registry: EffectNodeRegistry;
    
    constructor(name: string) {
        super(name);
        this.registry = EffectNodeRegistry.getInstance();
    }
    
    /**
     * 添加特效节点
     */
    public addEffect(config: EffectNodeConfig): void {
        this.effectConfigs.push(config);
        this.rebuildEffectNodes();
    }
    
    /**
     * 移除特效节点
     */
    public removeEffect(name: string): void {
        this.effectConfigs = this.effectConfigs.filter(config => config.name !== name);
        this.rebuildEffectNodes();
    }
    
    /**
     * 启用/禁用特效节点
     */
    public setEffectEnabled(name: string, enabled: boolean): void {
        const config = this.effectConfigs.find(c => c.name === name);
        if (config) {
            config.enabled = enabled;
            this.rebuildEffectNodes();
        }
    }
    
    /**
     * 更新特效节点参数
     */
    public updateEffectParams(name: string, params: any): void {
        const config = this.effectConfigs.find(c => c.name === name);
        if (config) {
            config.params = { ...config.params, ...params };
            this.rebuildEffectNodes();
        }
    }
    
    /**
     * 重建特效节点
     */
    private rebuildEffectNodes(): void {
        this.effectNodes = [];
        
        // 创建所有启用的特效节点
        for (const config of this.effectConfigs) {
            if (config.enabled !== false) {
                const node = this.registry.createEffectNode(
                    config.type,
                    config.name,
                    config.params
                );
                this.effectNodes.push(node);
            }
        }
    }
    
    /**
     * 构建效果节点
     */
    protected buildEffectNodes(): void {
        if (!this.nodeMaterial) return;
        
        // 初始化所有特效节点
        for (const node of this.effectNodes) {
            node.initEffect();
        }
        
        // 组合所有特效节点的材质
        let finalColor: Node | null = null;
        for (const node of this.effectNodes) {
            const material = node.getNodeMaterial();
            if (material && material.colorNode) {
                if (!finalColor) {
                    finalColor = material.colorNode;
                } else {
                    // 这里可以根据需要实现不同的混合方式
                    finalColor = finalColor.add(material.colorNode);
                }
            }
        }
        
        // 设置最终材质
        if (finalColor) {
            this.nodeMaterial.colorNode = finalColor;
        }
    }
    
    /**
     * 更新特效参数
     */
    public updateEffectParams(params: any): void {
        // 更新所有特效节点的参数
        for (const node of this.effectNodes) {
            node.updateEffectParams(params);
        }
    }
} 