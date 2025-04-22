import * as THREE from 'three/webgpu';
import { pass, uniform } from 'three/tsl';
import { PostProcessingEffect } from './PostProcessingEffect';
import { PresetType, PostProcessingPreset } from './PostProcessingPreset';

/**
 * 后处理管理器 - 管理整个后处理流程
 */
export class PostProcessingManager {
    private renderer: THREE.WebGPURenderer;
    private postProcessing: THREE.PostProcessing;
    private passes: Map<string, {pass: any, enabled: boolean}> = new Map();
    private enabled: boolean = true;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private scenePass: any;
    private scenePassColor: any;
    private outputNode: any;
    private originalRenderFunction: Function;
    
    constructor(renderer: THREE.WebGPURenderer) {
        this.renderer = renderer;
        this.postProcessing = new THREE.PostProcessing(renderer);
        
        // 保存原始渲染函数，以便在禁用后处理时恢复
        this.originalRenderFunction = renderer.render;
    }
    
    /**
     * 初始化后处理管理器
     * @param scene 场景
     * @param camera 相机
     */
    public init(scene: THREE.Scene, camera: THREE.Camera): void {
        this.scene = scene;
        this.camera = camera;
        
        // 创建基础场景通道
        this.scenePass = pass(scene, camera);
        this.scenePassColor = this.scenePass.getTextureNode('output');
        
        // 初始输出只是场景本身
        this.outputNode = this.scenePassColor;
        this.postProcessing.outputNode = this.outputNode;
    }
    
    /**
     * 添加一个后处理效果
     * @param effect 后处理效果
     * @param enabled 是否启用
     */
    public addEffect(effect: PostProcessingEffect, enabled: boolean = true): void {
        const effectNode = effect.getEffectNode(this.scenePassColor);
        this.passes.set(effect.getName(), { pass: effectNode, enabled });
        this.rebuildPipeline();
    }
    
    /**
     * 移除一个后处理效果
     * @param name 效果名称
     */
    public removeEffect(name: string): void {
        if (this.passes.has(name)) {
            this.passes.delete(name);
            this.rebuildPipeline();
        }
    }
    
    /**
     * 启用/禁用一个后处理效果
     * @param name 效果名称
     * @param enabled 是否启用
     */
    public setEffectEnabled(name: string, enabled: boolean): void {
        const pass = this.passes.get(name);
        if (pass) {
            pass.enabled = enabled;
            this.rebuildPipeline();
        }
    }
    
    /**
     * 获取一个后处理效果
     * @param name 效果名称
     */
    public getEffectNode(name: string): any {
        return this.passes.get(name)?.pass;
    }
    
    /**
     * 获取所有效果名称
     */
    public getEffectNames(): string[] {
        return Array.from(this.passes.keys());
    }
    
    /**
     * 效果是否启用
     * @param name 效果名称
     */
    public isEffectEnabled(name: string): boolean {
        return this.passes.get(name)?.enabled || false;
    }
    
    /**
     * 启用/禁用整个后处理系统
     * @param enabled 是否启用
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }
    
    /**
     * 后处理系统是否启用
     */
    public isEnabled(): boolean {
        return this.enabled;
    }
    
    /**
     * 应用预设
     * @param presetType 预设类型
     */
    public applyPreset(presetType: PresetType): void {
        // 清除所有现有效果
        this.passes.clear();
        
        // 获取预设效果
        const effects = PostProcessingPreset.createPreset(presetType);
        
        // 应用新效果
        for (const effect of effects) {
            this.addEffect(effect);
        }
    }
    
    /**
     * 重建后处理管线
     */
    private rebuildPipeline(): void {
        // 从场景通道开始
        let output = this.scenePassColor;
        
        // 按添加顺序应用所有启用的通道
        for (const [name, passData] of this.passes.entries()) {
            if (passData.enabled) {
                output = passData.pass;
            }
        }
        
        // 设置最终输出
        this.outputNode = output;
        this.postProcessing.outputNode = this.outputNode;
    }
    
    /**
     * 渲染后处理效果
     */
    public render(): void {
        if (this.enabled) {
            this.postProcessing.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    /**
     * 更新后处理管理器
     * @param deltaTime 帧间隔时间
     */
    public update(deltaTime: number): void {
        // 目前没有动态更新的需求
    }
    
    /**
     * 处理窗口大小变化
     * @param width 新宽度
     * @param height 新高度
     */
    public resize(width: number, height: number): void {
        // 目前不需要特殊处理
    }
}