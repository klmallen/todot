/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:48:40
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 13:41:47
 * @FilePath: \todot\src\engine\editor\logic\EngineManager.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Engine from "../../core/Engine";
import { 
    setEngineInstance, 
    getEngineInstance,
    setEngineInitialized,
    getEngineInitialized,
    getCanvasContainer
} from '../states/useEditorState';
import { refreshScenes } from './SceneManager';
import * as THREE from 'three';

/**
 * 初始化引擎实例
 * @returns 初始化是否成功
 */
export async function initEngine(): Promise<boolean> {
    // 如果已经初始化，直接返回
    if (getEngineInitialized()) return true;
    
    try {
        // 获取画布容器
        const canvasContainer = getCanvasContainer();
        if (!canvasContainer) {
            console.error('未找到画布容器');
            return false;
        }
        console.log(canvasContainer, "getCanvasContainer");
        // 创建画布
        const canvas = document.createElement('canvas');
        // 使用容器尺寸而非窗口尺寸
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvasContainer.appendChild(canvas);
        
        console.log(canvas, "getCanvasContainer");
        // 创建引擎实例
        const engine = new Engine(canvas);
        
        // 使用空选项初始化引擎，但不创建默认场景
        await engine.init({
            showDefaultUI: false,
            showHelpers: true,
            addDefaultLights: false,
            useWebGPU: true,
            showBoundingBoxes: false,
        });
        
        // 启用编辑器模式
        engine.initEditorMode();
        
        // 保存引擎实例
        setEngineInstance(engine);
        setEngineInitialized(true);
        
        // 刷新场景列表
        refreshScenes();
        
        // 立即强制调整一次尺寸
        updateEngineSize();
        engine.start();
        // // 延迟执行一次尺寸更新，确保在DOM完全渲染后canvas大小正确
        // setTimeout(updateEngineSize, 100);
        
        return true;
    } catch (error) {
        console.error('引擎初始化失败:', error);
        return false;
    }
}

/**
 * 更新引擎尺寸
 * 根据容器尺寸调整画布和渲染器
 */
export function updateEngineSize(): void {
    const engine = getEngineInstance();
    const container = getCanvasContainer();
    
    if (!engine || !container) return;
    
    // 获取容器尺寸
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if (width <= 0 || height <= 0) {
        console.warn('容器尺寸无效，无法调整引擎尺寸');
        return;
    }
    
    console.log(`调整引擎尺寸: ${width}x${height}`);
    
    // 确保canvas元素本身也正确设置尺寸
    const canvas = engine.getELementRender();
    if (canvas && canvas instanceof HTMLCanvasElement) {
        // 设置canvas元素的像素尺寸（内部分辨率）
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        
        // 设置CSS尺寸（显示尺寸）
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    }
    
    // 获取渲染器
    const renderer = engine.getRenderer();
    
    // 根据渲染器类型调整大小
    if (renderer instanceof THREE.WebGLRenderer) {
        // 使用false参数避免自动设置canvas的CSS尺寸，我们已经手动设置了
        renderer.setSize(width, height, false);
    } else {
        // 尝试作为WebGPU渲染器访问
        const webgpuRenderer = renderer as any;
        if (typeof webgpuRenderer.setSize === "function") {
            webgpuRenderer.setSize(width, height, false);
        }
    }
    
    // 更新相机纵横比
    const camera = engine.getCamera();
    if (camera) {
        const threeCamera = camera.getThreeCamera() as THREE.PerspectiveCamera;
        threeCamera.aspect = width / height;
        threeCamera.updateProjectionMatrix();
    }
}

/**
 * 销毁引擎实例
 */
export function destroyEngine(): void {
    const engine = getEngineInstance();
    if (!engine) return;
    
    try {
        // 退出编辑器模式
        engine.exitEditorMode();
        
        // 停止引擎
        engine.stop();
        
        // 清理引擎资源
        engine.dispose();
        
        // 清除引擎实例
        setEngineInstance(null);
        setEngineInitialized(false);
    } catch (error) {
        console.error('引擎销毁失败:', error);
    }
} 