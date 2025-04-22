import { PostProcessingEffect } from '../PostProcessingEffect';
import { Fn, vec2, texture, uv, vec4 } from 'three/tsl';

/**
 * 色差后处理效果
 */
export class ChromaticAberrationEffect extends PostProcessingEffect {
    constructor(strength: number = 0.005) {
        super('chromaticAberration');
        
        // 创建统一变量
        this.createUniform('strength', strength);
    }
    
    /**
     * 获取色差效果节点
     * @param inputNode 输入节点
     */
    public getEffectNode(inputNode: any): any {
        const strengthUniform = this.getUniform('strength');
        
        return Fn((inputTexture = inputNode) => {
            const baseUV = uv();
            
            // 红色通道 - 偏移到一个方向
            const redUV = baseUV.add(vec2(strengthUniform.negate(), 0));
            const redChannel = texture(inputTexture, redUV).r;
            
            // 绿色通道 - 无偏移
            const greenChannel = texture(inputTexture, baseUV).g;
            
            // 蓝色通道 - 偏移到另一个方向
            const blueUV = baseUV.add(vec2(strengthUniform, 0));
            const blueChannel = texture(inputTexture, blueUV).b;
            
            // 合并通道
            return vec4(redChannel, greenChannel, blueChannel, 1.0);
        });
    }
}