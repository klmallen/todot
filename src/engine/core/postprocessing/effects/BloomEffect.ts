import { PostProcessingEffect } from '../PostProcessingEffect';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import * as THREE from 'three';

/**
 * Bloom后处理效果
 */
export class BloomEffect extends PostProcessingEffect {
    constructor(
        strength: number = 1.0,
        radius: number = 0.4,
        threshold: number = 0.6
    ) {
        super('bloom');
        
        // 创建统一变量
        this.createUniform('strength', strength);
        this.createUniform('radius', radius);
        this.createUniform('threshold', threshold);
    }
    
    /**
     * 获取Bloom效果节点
     * @param inputNode 输入节点
     */
    public getEffectNode(inputNode: any): any {
        const strengthUniform = this.getUniform('strength');
        const radiusUniform = this.getUniform('radius');
        const thresholdUniform = this.getUniform('threshold');
        
        return bloom(inputNode, strengthUniform, radiusUniform, thresholdUniform);
    }
}