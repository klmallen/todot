import { IRenderer } from './IRenderer';
import * as THREE from 'three';
import { WebGPURenderer as ThreeWebGPURendere } from 'three/webgpu';
export class WebGPURenderer implements IRenderer {
    private renderer: ThreeWebGPURenderer;
    private initialized: boolean = false;

    constructor(options: {
        canvas?: HTMLCanvasElement,
        alpha?: boolean
    } = {}) {
        this.renderer = new ThreeWebGPURenderer({
            canvas: options.canvas,
            alpha: options.alpha ?? true
        });

        this.init();
    }

    private async init(): Promise<void> {
        try {
            await this.renderer.init();
            
            // 基础设置
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            // 如果没有提供canvas，自动添加到文档中
            if (!this.renderer.domElement.parentElement) {
                document.body.appendChild(this.renderer.domElement);
            }

            // 添加窗口大小改变的监听器
            window.addEventListener('resize', this.handleResize.bind(this));
            
            this.initialized = true;
            console.log('WebGPU 渲染器初始化成功');
        } catch (error) {
            console.error('WebGPU 渲染器初始化失败:', error);
            throw new Error('WebGPU 不受支持或初始化失败');
        }
    }

    render(scene: THREE.Scene, camera: THREE.Camera): void {
        if (!this.initialized) {
            console.warn('渲染器尚未初始化完成');
            return;
        }
        this.renderer.render(scene, camera);
    }

    private handleResize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
    }

    getNativeRenderer(): ThreeWebGPURenderer {
        return this.renderer;
    }

    // 获取初始化状态
    isInitialized(): boolean {
        return this.initialized;
    }

    // 销毁渲染器
    dispose(): void {
        this.renderer.dispose();
        window.removeEventListener('resize', this.handleResize.bind(this));
    }
} 