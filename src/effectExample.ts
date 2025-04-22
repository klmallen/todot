import * as THREE from 'three';
import { Engine } from './engine/core/Engine';
import { Node3d } from './engine/core/Node3d';
import {
    DissolveEffectNode,
    GlowEffectNode,
    DistortionEffectNode
} from './engine/core/effects';

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 创建引擎实例
    const engine = new Engine();
    engine.init();
    
    // 创建场景
    const scene = engine.getScene();
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    engine.setCamera(camera);
    
    // 创建地面
    const floor = new Node3d('floor');
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floor.add(floorMesh);
    scene.add(floor.getThreeObject());
    
    // 创建纹理加载器
    const textureLoader = new THREE.TextureLoader();
    
    // 加载纹理
    const textureMap = textureLoader.load('textures/checker.png');
    const noiseMap = textureLoader.load('textures/noise.png');
    const distortionMap = textureLoader.load('textures/distortion.png');
    
    // 创建基础几何体
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMesh = new THREE.Mesh(boxGeometry);
    
    // 创建溶解效果
    const dissolveEffect = new DissolveEffectNode('dissolveEffect', {
        textureMap: textureMap,
        noiseMap: noiseMap,
        dissolveEdgeColor: new THREE.Color(0xff0000),
        dissolveAmount: 0.5,
        edgeWidth: 0.1
    });
    dissolveEffect.add(boxMesh.clone());
    dissolveEffect.position.set(-2, 1, 0);
    scene.add(dissolveEffect.getThreeObject());
    dissolveEffect.initEffect();
    
    // 创建发光效果
    const glowEffect = new GlowEffectNode('glowEffect', {
        baseColor: new THREE.Color(0xffffff),
        glowColor: new THREE.Color(0x00ffff),
        glowIntensity: 1.0,
        pulseSpeed: 1.0
    });
    glowEffect.add(boxMesh.clone());
    glowEffect.position.set(0, 1, 0);
    scene.add(glowEffect.getThreeObject());
    glowEffect.initEffect();
    
    // 创建扭曲效果
    const distortionEffect = new DistortionEffectNode('distortionEffect', {
        textureMap: textureMap,
        distortionMap: distortionMap,
        distortionStrength: 0.1,
        distortionSpeed: 1.0
    });
    distortionEffect.add(boxMesh.clone());
    distortionEffect.position.set(2, 1, 0);
    scene.add(distortionEffect.getThreeObject());
    distortionEffect.initEffect();
    
    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // 添加控制面板
    const controls = document.createElement('div');
    controls.style.position = 'absolute';
    controls.style.top = '10px';
    controls.style.left = '10px';
    controls.style.backgroundColor = 'rgba(0,0,0,0.5)';
    controls.style.padding = '10px';
    controls.style.color = 'white';
    controls.style.fontFamily = 'Arial';
    document.body.appendChild(controls);
    
    // 溶解效果控制
    const dissolveControl = document.createElement('div');
    dissolveControl.innerHTML = `
        <h3>溶解效果</h3>
        <label>溶解量: <input type="range" min="0" max="1" step="0.01" value="0.5"></label>
        <label>边缘宽度: <input type="range" min="0" max="0.5" step="0.01" value="0.1"></label>
    `;
    controls.appendChild(dissolveControl);
    
    // 发光效果控制
    const glowControl = document.createElement('div');
    glowControl.innerHTML = `
        <h3>发光效果</h3>
        <label>发光强度: <input type="range" min="0" max="2" step="0.1" value="1.0"></label>
        <label>脉冲速度: <input type="range" min="0" max="2" step="0.1" value="1.0"></label>
    `;
    controls.appendChild(glowControl);
    
    // 扭曲效果控制
    const distortionControl = document.createElement('div');
    distortionControl.innerHTML = `
        <h3>扭曲效果</h3>
        <label>扭曲强度: <input type="range" min="0" max="0.5" step="0.01" value="0.1"></label>
        <label>扭曲速度: <input type="range" min="0" max="2" step="0.1" value="1.0"></label>
    `;
    controls.appendChild(distortionControl);
    
    // 添加事件监听器
    dissolveControl.querySelector('input[type="range"]')?.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        dissolveEffect.setDissolveAmount(value);
    });
    
    glowControl.querySelector('input[type="range"]')?.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        glowEffect.setGlowIntensity(value);
    });
    
    distortionControl.querySelector('input[type="range"]')?.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        distortionEffect.setDistortionStrength(value);
    });
    
    // 添加说明文字
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.bottom = '10px';
    instructions.style.left = '10px';
    instructions.style.backgroundColor = 'rgba(0,0,0,0.5)';
    instructions.style.padding = '10px';
    instructions.style.color = 'white';
    instructions.style.fontFamily = 'Arial';
    instructions.innerHTML = `
        <h3>特效演示</h3>
        <p>左侧：溶解效果 - 使用噪声贴图实现溶解效果</p>
        <p>中间：发光效果 - 使用基础颜色和发光颜色实现发光效果</p>
        <p>右侧：扭曲效果 - 使用扭曲贴图实现扭曲效果</p>
        <p>使用控制面板可以调整各种参数</p>
    `;
    document.body.appendChild(instructions);
    
    // 处理窗口大小变化
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        engine.getRenderer().setSize(width, height);
    });
    
    // 动画循环
    const animate = () => {
        requestAnimationFrame(animate);
        
        const deltaTime = engine.getClock().getDelta();
        
        // 更新特效
        glowEffect.update(deltaTime);
        distortionEffect.update(deltaTime);
        
        // 渲染场景
        engine.getRenderer().render(scene, camera);
    };
    
    animate();
}); 