/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-22 15:52:34
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-04-22 15:53:14
 * @FilePath: \todot\src\engine\core\postprocessing\PostProcessingEffect.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { uniform } from 'three/tsl';

/**
 * 后处理效果基类
 */
export abstract class PostProcessingEffect {
    protected name: string;
    protected uniforms: Map<string, any> = new Map();
    
    constructor(name: string) {
        this.name = name;
    }
    
    /**
     * 创建效果节点
     * @param inputNode 输入节点 - 通常是场景颜色
     */
    public abstract getEffectNode(inputNode: any): any;
    
    /**
     * 设置统一变量的值
     * @param name 变量名称
     * @param value 变量值
     */
    public setUniform(name: string, value: any): void {
        const uniformVar = this.uniforms.get(name);
        if (uniformVar) {
            uniformVar.value = value;
        }
    }
    
    /**
     * 获取统一变量
     * @param name 变量名称
     */
    public getUniform(name: string): any {
        return this.uniforms.get(name);
    }
    
    /**
     * 创建一个统一变量
     * @param name 变量名称
     * @param defaultValue 默认值
     */
    protected createUniform(name: string, defaultValue: any): any {
        const uniformVar = uniform(defaultValue);
        this.uniforms.set(name, uniformVar);
        return uniformVar;
    }
    
    /**
     * 获取效果的名称
     */
    public getName(): string {
        return this.name;
    }
}