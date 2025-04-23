import * as THREE from 'three';
import { TSLFunctionExample } from './TSLFunctionExample';
import { TslMaterialExample } from './TslMaterialExample';
import { ParticleLifecycleDemo } from './ParticleLifecycleDemo';

export {
    TslMaterialExample,
    TSLFunctionExample,
    ParticleLifecycleDemo
};

/**
 * 粒子系统生命周期演示入口
 */
class Main {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particleDemo: ParticleLifecycleDemo;

  constructor() {
    // 初始化THREE基础组件
    this.initThree();
    
    // 创建粒子演示
    this.particleDemo = new ParticleLifecycleDemo(this.scene);
    
    // 开始渲染循环
    this.animate();
  }

  /**
   * 初始化THREE.js场景、相机和渲染器
   */
  private initThree(): void {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.z = 5;
    
    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // 添加方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
    
    // 添加网格地面（可选）
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);
    
    // 窗口大小变化处理
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * 动画循环
   */
  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }
}

// 启动应用
window.onload = () => {
  new Main();
}; 