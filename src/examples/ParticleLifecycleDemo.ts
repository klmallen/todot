import * as THREE from 'three';
import { ParticleSystem } from '../engine/core/ParticleSystem/ParticleSystem';
import { ParticleSystemSettings } from '../engine/core/ParticleSystem/ParticleSystemSettings';

/**
 * 粒子系统生命周期回调示例
 */
export class ParticleLifecycleDemo {
  private scene: THREE.Scene;
  private particleSystem: ParticleSystem;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 创建粒子系统
    this.setupParticleSystem();
  }

  /**
   * 设置粒子系统
   */
  private setupParticleSystem(): void {
    // 创建粒子系统
    this.particleSystem = new ParticleSystem('生命周期演示');
    
    // 将粒子系统添加到场景
    this.scene.add(this.particleSystem.getThreeObject());
    
    // 配置粒子系统
    this.particleSystem.setSettings({
      // 设置基础属性
      duration: 5.0,
      loop: false,
      playOnAwake: true,
      maxParticles: 500,
      
      // 设置渲染属性
      renderer: {
        renderMode: 'Billboard',
        blending: true,
        texture: new THREE.TextureLoader().load('/assets/textures/particle.png'),
      },
      
      // 设置发射属性
      emission: {
        rateOverTime: 80
      },
      
      // 设置粒子属性
      startLifetime: { min: 1.0, max: 3.0 },
      startSize: { min: 0.2, max: 0.6 },
      startSpeed: { min: 1.0, max: 3.0 },
      
      // 设置形状
      shape: {
        type: 'sphere',
        radius: 1.0
      },
      
      // 设置颜色随生命周期变化
      colorOverLifetime: {
        gradient: [
          { time: 0, color: new THREE.Color(1, 0.5, 0) },
          { time: 0.5, color: new THREE.Color(0.8, 0.2, 0) },
          { time: 1, color: new THREE.Color(0.3, 0, 0) }
        ]
      },
      
      // 设置大小随生命周期变化
      sizeOverLifetime: {
        curve: [
          { time: 0, value: 0 },
          { time: 0.2, value: 1 },
          { time: 0.8, value: 1 },
          { time: 1, value: 0 }
        ]
      },
      
      // 设置生命周期回调
      lifecycle: {
        onProgress: (progress) => {
          console.log(`粒子系统进度: ${(progress * 100).toFixed(1)}%`);
          document.getElementById('progress-value')?.setAttribute('style', `width: ${progress * 100}%`);
        },
        onComplete: () => {
          console.log('粒子系统播放完成!');
          document.getElementById('status')?.innerText = '状态: 已完成';
        },
        onReset: () => {
          console.log('粒子系统已重置');
          document.getElementById('status')?.innerText = '状态: 已重置';
        },
        onDestroyed: () => {
          console.log('粒子系统已销毁');
          document.getElementById('status')?.innerText = '状态: 已销毁';
        }
      }
    });
    
    // 可选：使用单独的方法设置回调
    // this.setupCallbacks();
    
    // 创建UI控制界面
    this.createControls();
  }
  
  /**
   * 使用单独的方法设置回调
   * 这是另一种设置回调的方式
   */
  private setupCallbacks(): void {
    this.particleSystem.onProgress((progress) => {
      console.log(`粒子系统进度: ${(progress * 100).toFixed(1)}%`);
    });
    
    this.particleSystem.onComplete(() => {
      console.log('粒子系统播放完成!');
    });
    
    this.particleSystem.onReset(() => {
      console.log('粒子系统已重置');
    });
    
    this.particleSystem.onDestroyed(() => {
      console.log('粒子系统已销毁');
    });
  }
  
  /**
   * 创建UI控制界面
   */
  private createControls(): void {
    // 创建控制界面容器
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.padding = '10px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    container.style.borderRadius = '5px';
    container.style.color = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '1000';
    
    // 添加标题
    const title = document.createElement('h3');
    title.innerText = '粒子系统生命周期演示';
    title.style.margin = '0 0 10px 0';
    container.appendChild(title);
    
    // 添加状态显示
    const status = document.createElement('div');
    status.id = 'status';
    status.innerText = '状态: 播放中';
    status.style.marginBottom = '10px';
    container.appendChild(status);
    
    // 添加进度条
    const progressContainer = document.createElement('div');
    progressContainer.style.width = '100%';
    progressContainer.style.height = '20px';
    progressContainer.style.backgroundColor = '#333';
    progressContainer.style.borderRadius = '3px';
    progressContainer.style.overflow = 'hidden';
    progressContainer.style.marginBottom = '10px';
    
    const progressValue = document.createElement('div');
    progressValue.id = 'progress-value';
    progressValue.style.width = '0%';
    progressValue.style.height = '100%';
    progressValue.style.backgroundColor = '#4CAF50';
    progressValue.style.transition = 'width 0.1s';
    
    progressContainer.appendChild(progressValue);
    container.appendChild(progressContainer);
    
    // 添加按钮
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '5px';
    
    const playButton = this.createButton('播放', () => {
      this.particleSystem.play();
      status.innerText = '状态: 播放中';
    });
    
    const pauseButton = this.createButton('暂停', () => {
      this.particleSystem.pause();
      status.innerText = '状态: 已暂停';
    });
    
    const stopButton = this.createButton('停止', () => {
      this.particleSystem.stop();
      status.innerText = '状态: 已停止';
      progressValue.style.width = '0%';
    });
    
    const resetButton = this.createButton('重置', () => {
      this.particleSystem.reset();
      progressValue.style.width = '0%';
    });
    
    const destroyButton = this.createButton('销毁', () => {
      this.particleSystem.destroy();
    });
    
    buttonsContainer.appendChild(playButton);
    buttonsContainer.appendChild(pauseButton);
    buttonsContainer.appendChild(stopButton);
    buttonsContainer.appendChild(resetButton);
    buttonsContainer.appendChild(destroyButton);
    
    container.appendChild(buttonsContainer);
    
    // 添加到文档
    document.body.appendChild(container);
  }
  
  /**
   * 创建按钮工具函数
   */
  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerText = text;
    button.style.padding = '5px 10px';
    button.style.backgroundColor = '#4CAF50';
    button.style.border = 'none';
    button.style.borderRadius = '3px';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.addEventListener('click', onClick);
    return button;
  }
} 