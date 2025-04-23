import * as THREE from 'three';
import Engine from '../core/Engine';
import { Scene } from '../core/Scene';
import { SwordTrailParticleSystem, SwordTrailParams } from '../core/ParticleSystem/SwordTrailParticleSystem';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { 
  uniform, texture, uv, mix, step, smoothstep, color, float, vec3, sin, vec2, length, abs, saturate, 
  time
} from 'three/tsl';
import { TSLFunctionLibrary } from '../core/materials/TSLFunctionLibrary';

/**
 * 运行刀光生命周期示例
 */
export async function runSwordTrailLifecycleExample(): Promise<Engine> {
  console.log('运行刀光生命周期示例...');
  
  // 创建引擎
  const engine = new Engine({
    canvas: document.getElementById('canvas') as HTMLCanvasElement,
    enableWebGPU: true,
    renderer: {
      antialias: true,
      clearColor: new THREE.Color(0x111111),
      shadowMap: {
        enabled: true,
        type: THREE.PCFSoftShadowMap
      }
    }
  });
  
  // 创建场景
  const scene = engine.createScene('刀光生命周期示例');
  
  // 创建相机
  scene.createCamera({
    position: new THREE.Vector3(0, 2, 10),
    lookAt: new THREE.Vector3(0, 1, 0)
  });
  
  // 添加环境光
  scene.createAmbientLight({
    intensity: 0.3
  });
  
  // 添加平行光
  scene.createDirectionalLight({
    position: new THREE.Vector3(5, 5, 5),
    intensity: 1,
    castShadow: true
  });
  
  // 创建地面
  const ground = scene.createPlane({
    name: '地面',
    width: 20,
    height: 20,
    rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
    position: new THREE.Vector3(0, -0.5, 0),
    material: new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    }),
    receiveShadow: true
  });
  
  // 开始加载
  await createLifecycleTrails(scene);
  
  // 创建UI控制面板
  createControlPanel();
  
  // 开始引擎循环
  engine.start();
  
  return engine;
}

/**
 * 创建刀光网格
 */
function createSwordTrailMesh(): THREE.BufferGeometry {
  // 创建一个简单的平面作为刀光
  const width = 2.0;
  const height = 0.5;
  const segments = 1;
  
  // 创建平面几何体
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
  
  return geometry;
}

/**
 * 创建刀光材质
 * @param baseColor 基础颜色
 * @param edgeColor 边缘颜色
 * @returns 刀光材质
 */
function createSwordTrailMaterial(baseColor: THREE.Color, edgeColor: THREE.Color): THREE.Material {
  // 创建TSL材质
  const trailMaterial = new MeshStandardNodeMaterial();
  trailMaterial.side = THREE.DoubleSide;
  trailMaterial.transparent = true;
  trailMaterial.depthWrite = false;
  trailMaterial.blending = THREE.AdditiveBlending;

  // 创建基础uniform变量
  const flowPosition = uniform(0.0);     // 流动位置 - 0到1之间
  const trailLength = uniform(0.7);      // 刀光长度 - 值越小刀光越短
  const dissolveAmount = uniform(0.1);   // 溶解程度 - 值越大溶解效果越明显
  const baseColorUniform = uniform(baseColor);  // 基础颜色
  const edgeColorUniform = uniform(edgeColor);  // 边缘颜色
  const edgeWidth = uniform(0.1);        // 边缘宽度
  const noiseScale = uniform(0.3);       // 噪声缩放

  // 将uniform变量保存到材质的userData中，以便后续更新
  trailMaterial.userData = {
    flowPosition,
    trailLength,
    dissolveAmount,
    baseColor: baseColorUniform,
    edgeColor: edgeColorUniform,
    edgeWidth,
    noiseScale
  };

  // 获取TSL函数库实例
  const tslFunctions = TSLFunctionLibrary.getInstance();

  // 创建基于UV的刀光效果
  // 1. 创建UV和噪声
  const uvNode = uv();
  const scaledUV = uv().mul(noiseScale);
  const noiseValue = tslFunctions.createSimpleNoise(scaledUV);
  
  // 2. 计算与流动位置的距离
  // 将UV的X坐标从0-1映射到-1到1
  const adjustedUVx = tslFunctions.remap(uvNode.x, float(0.0), float(1.0), float(-1.0), float(1.0));
  
  // 流动中心点
  const flowCenter = flowPosition.mul(2.0).sub(1.0); // 将0-1映射到-1到1
  
  // 计算到流动中心的距离
  const distanceFromCenter = adjustedUVx.sub(flowCenter).abs();
  
  // 3. 创建刀光区域 - 在流动中心附近可见
  const fadeDistance = trailLength; // 刀光渐变距离
  
  // 使用平滑过渡计算刀光区域
  const trailMask = smoothstep(
    fadeDistance.add(edgeWidth),
    fadeDistance.sub(edgeWidth),
    distanceFromCenter
  );
  
  // 4. 创建溶解效果
  // 使用噪声创建溶解边缘
  const dissolveMask = smoothstep(
    dissolveAmount.sub(0.05),
    dissolveAmount.add(0.05),
    noiseValue
  );
  
  // 5. 边缘特效
  const edgeFactor = smoothstep(
    float(0.3),
    float(0.7),
    noiseValue.add(distanceFromCenter.mul(0.2))
  );
  
  // 6. 混合颜色
  const finalColor = mix(
    baseColorUniform,
    edgeColorUniform,
    edgeFactor
  );
  
  // 7. 设置最终效果
  // 添加时间动画效果
  const timeEffect = sin(time.mul(3.0)).mul(0.07);
  const colorWithEffect = finalColor.add(vec3(timeEffect));
  
  // 应用透明度
  const alpha = trailMask.mul(dissolveMask);
  
  // 设置材质节点
  trailMaterial.colorNode = colorWithEffect;
  trailMaterial.opacityNode = alpha;
  trailMaterial.roughnessNode = float(0.2);
  trailMaterial.metalnessNode = float(0.8);
  trailMaterial.emissiveNode = colorWithEffect;
  
  return trailMaterial;
}

/**
 * 创建不同生命周期的刀光效果
 * @param scene 场景
 */
async function createLifecycleTrails(scene: Scene): Promise<void> {
  // 创建刀光网格
  const trailGeometry = createSwordTrailMesh();
  
  // 创建三种不同颜色的刀光材质
  const redMaterial = createSwordTrailMaterial(new THREE.Color(0xff2200), new THREE.Color(0xffaa22));
  const greenMaterial = createSwordTrailMaterial(new THREE.Color(0x00ff44), new THREE.Color(0xaaff22));
  const blueMaterial = createSwordTrailMaterial(new THREE.Color(0x0088ff), new THREE.Color(0x22ccff));
  
  // 创建三个刀光，有不同的生命周期和行为
  // 1. 红色刀光 - 短生命周期(2秒)，不循环，完成后自动销毁
  window.redTrail = SwordTrailParticleSystem.createSwordTrail(
    scene,
    trailGeometry,
    redMaterial,
    {
      name: '红色刀光',
      position: new THREE.Vector3(-3, 1, 0),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0),
      duration: 2.0,
      loop: false,
      autoDestroy: true,
      dissolveAmount: 0.1,
      baseColor: new THREE.Color(0xff2200),
      edgeColor: new THREE.Color(0xffaa22),
      onStart: () => {
        console.log('红色刀光开始');
        updateStatusText('红色刀光开始');
      },
      onProgress: (progress) => {
        updateRedProgressBar(progress);
      },
      onComplete: () => {
        console.log('红色刀光完成并自动销毁');
        updateStatusText('红色刀光完成并自动销毁');
        // 2秒后重新创建
        setTimeout(() => {
          window.redTrail = SwordTrailParticleSystem.createSwordTrail(
            scene,
            trailGeometry,
            redMaterial,
            {
              name: '红色刀光',
              position: new THREE.Vector3(-3, 1, 0),
              rotation: new THREE.Euler(Math.PI / 2, 0, 0),
              duration: 2.0,
              loop: false,
              autoDestroy: true,
              dissolveAmount: 0.1,
              baseColor: new THREE.Color(0xff2200),
              edgeColor: new THREE.Color(0xffaa22),
              onStart: () => {
                console.log('红色刀光重新创建');
                updateStatusText('红色刀光重新创建');
              },
              onProgress: (progress) => {
                updateRedProgressBar(progress);
              },
              onComplete: () => {
                console.log('红色刀光再次完成');
                updateStatusText('红色刀光再次完成');
              }
            }
          );
          window.redTrail.startSwordTrail();
        }, 2000);
      }
    }
  );
  
  // 2. 绿色刀光 - 中等生命周期(3秒)，循环播放
  window.greenTrail = SwordTrailParticleSystem.createSwordTrail(
    scene,
    trailGeometry,
    greenMaterial,
    {
      name: '绿色刀光',
      position: new THREE.Vector3(0, 1, 0),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0),
      duration: 3.0,
      loop: true,
      dissolveAmount: 0.15,
      baseColor: new THREE.Color(0x00ff44),
      edgeColor: new THREE.Color(0xaaff22),
      onStart: () => {
        console.log('绿色刀光开始');
        updateStatusText('绿色刀光开始');
      },
      onProgress: (progress) => {
        updateGreenProgressBar(progress);
      },
      onLoop: () => {
        console.log('绿色刀光循环');
        updateStatusText('绿色刀光循环');
      }
    }
  );
  
  // 3. 蓝色刀光 - 长生命周期(5秒)，不循环，不自动销毁
  window.blueTrail = SwordTrailParticleSystem.createSwordTrail(
    scene,
    trailGeometry,
    blueMaterial,
    {
      name: '蓝色刀光',
      position: new THREE.Vector3(3, 1, 0),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0),
      duration: 5.0,
      loop: false,
      autoDestroy: false,
      dissolveAmount: 0.2,
      baseColor: new THREE.Color(0x0088ff),
      edgeColor: new THREE.Color(0x22ccff),
      onStart: () => {
        console.log('蓝色刀光开始');
        updateStatusText('蓝色刀光开始');
      },
      onProgress: (progress) => {
        updateBlueProgressBar(progress);
      },
      onComplete: () => {
        console.log('蓝色刀光完成');
        updateStatusText('蓝色刀光完成 (可手动重置)');
      }
    }
  );
  
  // 全局变量，以便控制面板使用
  window.redTrail = window.redTrail;
  window.greenTrail = window.greenTrail;
  window.blueTrail = window.blueTrail;
  
  // 启动所有刀光
  window.redTrail.startSwordTrail();
  window.greenTrail.startSwordTrail();
  window.blueTrail.startSwordTrail();
}

/**
 * 创建控制面板
 */
function createControlPanel(): void {
  // 创建控制面板
  const controlPanel = document.createElement('div');
  controlPanel.style.position = 'absolute';
  controlPanel.style.top = '10px';
  controlPanel.style.right = '10px';
  controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  controlPanel.style.color = 'white';
  controlPanel.style.padding = '15px';
  controlPanel.style.borderRadius = '5px';
  controlPanel.style.fontFamily = 'Arial, sans-serif';
  controlPanel.style.width = '300px';
  controlPanel.style.zIndex = '1000';
  
  // 添加标题
  const title = document.createElement('h2');
  title.textContent = '刀光生命周期控制';
  title.style.margin = '0 0 15px 0';
  title.style.color = 'white';
  controlPanel.appendChild(title);
  
  // 添加状态文本
  const statusText = document.createElement('div');
  statusText.id = 'status-text';
  statusText.textContent = '准备就绪...';
  statusText.style.marginBottom = '15px';
  statusText.style.padding = '5px';
  statusText.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  statusText.style.borderRadius = '3px';
  controlPanel.appendChild(statusText);
  
  // 红色刀光控制
  addProgressBar(controlPanel, 'red-progress', '红色刀光 (2秒, 自动销毁)', 'rgb(255, 50, 50)');
  
  // 绿色刀光控制
  addProgressBar(controlPanel, 'green-progress', '绿色刀光 (3秒, 循环)', 'rgb(50, 255, 50)');
  
  // 蓝色刀光控制
  addProgressBar(controlPanel, 'blue-progress', '蓝色刀光 (5秒, 手动控制)', 'rgb(50, 150, 255)');
  
  // 添加蓝色刀光的控制按钮
  const blueControls = document.createElement('div');
  blueControls.style.marginTop = '10px';
  blueControls.style.marginBottom = '15px';
  
  // 添加重置按钮
  const resetButton = document.createElement('button');
  resetButton.textContent = '重置蓝色刀光';
  resetButton.style.marginRight = '10px';
  resetButton.style.padding = '5px 10px';
  resetButton.style.backgroundColor = '#0066cc';
  resetButton.style.color = 'white';
  resetButton.style.border = 'none';
  resetButton.style.borderRadius = '3px';
  resetButton.style.cursor = 'pointer';
  
  resetButton.addEventListener('click', () => {
    if (window.blueTrail) {
      window.blueTrail.resetAndPlay();
      updateStatusText('蓝色刀光重置');
    }
  });
  
  blueControls.appendChild(resetButton);
  
  // 添加销毁按钮
  const destroyButton = document.createElement('button');
  destroyButton.textContent = '销毁蓝色刀光';
  destroyButton.style.padding = '5px 10px';
  destroyButton.style.backgroundColor = '#cc0033';
  destroyButton.style.color = 'white';
  destroyButton.style.border = 'none';
  destroyButton.style.borderRadius = '3px';
  destroyButton.style.cursor = 'pointer';
  
  destroyButton.addEventListener('click', () => {
    if (window.blueTrail) {
      window.blueTrail.destroySwordTrail();
      updateStatusText('蓝色刀光已销毁');
      updateBlueProgressBar(0);
    }
  });
  
  blueControls.appendChild(destroyButton);
  controlPanel.appendChild(blueControls);
  
  // 添加位置滑块
  const progressContainer = document.createElement('div');
  progressContainer.style.marginBottom = '15px';
  
  const progressLabel = document.createElement('label');
  progressLabel.textContent = '手动设置蓝色刀光进度:';
  progressLabel.style.display = 'block';
  progressLabel.style.marginBottom = '5px';
  progressContainer.appendChild(progressLabel);
  
  const progressSlider = document.createElement('input');
  progressSlider.type = 'range';
  progressSlider.min = '0';
  progressSlider.max = '1';
  progressSlider.step = '0.01';
  progressSlider.value = '0';
  progressSlider.style.width = '100%';
  
  progressSlider.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (window.blueTrail) {
      window.blueTrail.setProgress(value);
      updateBlueProgressBar(value);
    }
  });
  
  progressContainer.appendChild(progressSlider);
  controlPanel.appendChild(progressContainer);
  
  // 添加到页面
  document.body.appendChild(controlPanel);
}

/**
 * 添加进度条
 * @param parent 父元素
 * @param id 进度条ID
 * @param label 标签文本
 * @param color 进度条颜色
 */
function addProgressBar(parent: HTMLElement, id: string, label: string, color: string): void {
  const container = document.createElement('div');
  container.style.marginBottom = '15px';
  
  // 添加标签
  const titleLabel = document.createElement('div');
  titleLabel.textContent = label;
  titleLabel.style.marginBottom = '5px';
  container.appendChild(titleLabel);
  
  // 创建进度条外壳
  const progressOuter = document.createElement('div');
  progressOuter.style.width = '100%';
  progressOuter.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
  progressOuter.style.height = '20px';
  progressOuter.style.borderRadius = '3px';
  progressOuter.style.overflow = 'hidden';
  
  // 创建进度条内部
  const progressInner = document.createElement('div');
  progressInner.id = id;
  progressInner.style.width = '0%';
  progressInner.style.height = '100%';
  progressInner.style.backgroundColor = color;
  progressInner.style.transition = 'width 0.1s ease-in-out';
  
  // 组装进度条
  progressOuter.appendChild(progressInner);
  container.appendChild(progressOuter);
  
  // 添加到父元素
  parent.appendChild(container);
}

/**
 * 更新状态文本
 * @param text 状态文本
 */
function updateStatusText(text: string): void {
  const statusText = document.getElementById('status-text');
  if (statusText) {
    statusText.textContent = text;
  }
}

/**
 * 更新红色进度条
 * @param progress 进度 (0-1)
 */
function updateRedProgressBar(progress: number): void {
  const progressBar = document.getElementById('red-progress');
  if (progressBar) {
    progressBar.style.width = `${progress * 100}%`;
  }
}

/**
 * 更新绿色进度条
 * @param progress 进度 (0-1)
 */
function updateGreenProgressBar(progress: number): void {
  const progressBar = document.getElementById('green-progress');
  if (progressBar) {
    progressBar.style.width = `${progress * 100}%`;
  }
}

/**
 * 更新蓝色进度条
 * @param progress 进度 (0-1)
 */
function updateBlueProgressBar(progress: number): void {
  const progressBar = document.getElementById('blue-progress');
  if (progressBar) {
    progressBar.style.width = `${progress * 100}%`;
  }
}

// 声明全局变量，供UI控制使用
declare global {
  interface Window {
    redTrail: SwordTrailParticleSystem;
    greenTrail: SwordTrailParticleSystem;
    blueTrail: SwordTrailParticleSystem;
  }
}

// 运行示例
if (typeof window !== 'undefined') {
  runSwordTrailLifecycleExample();
} 