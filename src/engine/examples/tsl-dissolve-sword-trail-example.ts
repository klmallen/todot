import * as THREE from 'three';
import Engine from '../core/Engine';
import { Scene } from '../core/Scene';
import { Node3d } from '../core/Node3d';
import { CameraNode3D } from '../core/CameraNode3D';
import { ParticleSystem } from '../core/ParticleSystem/ParticleSystem';
import { ParticleSystemSettings } from '../core/ParticleSystem/ParticleSystemSettings';
import { MinMaxCurve } from '../core/ParticleSystem/Curves/MinMaxCurve';
import { ColorCurve } from '../core/ParticleSystem/Curves/ColorCurve';
import { GradientCurve } from '../core/ParticleSystem/Curves/GradientCurve';
import { Script } from '../core/Script/Script';
import { TSLFunctionLibrary } from '../core/materials/TSLFunctionLibrary';

// 导入WebGPU材质
import { MeshStandardNodeMaterial } from 'three/webgpu';

// 导入TSL相关模块
import {
  uniform, texture, uv, mix, step, smoothstep, color, float, vec3, sin, time
} from 'three/tsl';
import { ModelLoader3D } from '../core/ModelLoader3D';

/**
 * TSL函数库溶解刀光示例
 * 展示如何使用TSLFunctionLibrary创建溶解刀光效果
 */
export async function runTSLDissolveSwordTrailExample(): Promise<Engine> {
  console.log('开始运行TSL函数库溶解刀光示例');

  // 创建引擎实例
  const engine = await new Engine().init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: true
  });

  // 创建场景 - 使用唯一的场景名称，包含时间戳避免冲突
  const sceneName = `TSL溶解刀光示例_${Date.now()}`;
  const scene = new Scene(sceneName);
  engine.addScene(scene);
  engine.activateScene(sceneName);

  // 创建相机
  const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
    position: new THREE.Vector3(0, 5, 10),
    rotation: new THREE.Euler(-0.2, 0, 0)
  });
  scene.addNode(camera);

  // 创建地面
  const ground = new Node3d('地面');
  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  ground.getThreeObject().add(groundMesh);
  scene.addNode(ground);

  // 创建刀光网格
  const trailGeometry = createSwordTrailMesh();
  
  // 创建溶解刀光效果
  createDissolveSwordTrail(scene, trailGeometry);
  loadSwordTrailModel(scene);
  // 启动引擎
  engine.start();

  return engine;
}

/**
 * 创建刀光网格
 */
function createSwordTrailMesh(): THREE.BufferGeometry {
  // 创建一个弯曲的平面作为刀光
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.0, 0.0, 0.0),
    new THREE.Vector3(-0.5, 0.0, 0.3),
    new THREE.Vector3(0.0, 0.0, 0.0),
    new THREE.Vector3(0.5, 0.0, -0.3),
    new THREE.Vector3(1.0, 0.0, 0.0)
  ]);

  // 创建一个沿曲线的平面
  const geometry = new THREE.BufferGeometry();
  const points = curve.getPoints(50);
  const positions = [];
  const indices = [];
  const uvs = [];

  // 创建一个带状网格
  const width = 0.2; // 刀光宽度

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const t = i / (points.length - 1);

    // 计算垂直于曲线的向量
    const tangent = curve.getTangent(t);
    const normal = new THREE.Vector3(0, 1, 0);
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    // 创建带状的两个顶点
    const v1 = new THREE.Vector3().copy(point).add(binormal.clone().multiplyScalar(width / 2));
    const v2 = new THREE.Vector3().copy(point).add(binormal.clone().multiplyScalar(-width / 2));

    positions.push(v1.x, v1.y, v1.z);
    positions.push(v2.x, v2.y, v2.z);

    // UV坐标
    uvs.push(t, 0);
    uvs.push(t, 1);

    // 创建三角形索引
    if (i < points.length - 1) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * 创建渐变纹理
 */
function createGradientTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;

  const ctx = canvas.getContext('2d')!;

  // 创建水平渐变
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.1, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.9, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}

/**
 * 创建噪声纹理
 */
function createNoiseTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d')!;

  // 填充黑色背景
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 256, 256);

  // 生成噪声
  const imageData = ctx.getImageData(0, 0, 256, 256);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // 生成随机噪声
    const value = Math.floor(Math.random() * 256);
    data[i] = value;     // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
    data[i + 3] = 255;   // A
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}


/**
 * 加载刀光模型并创建粒子系统
 */
function loadSwordTrailModel(scene: Scene): void {
  
    // 尝试加载FBX模型（如果有的话）
    // 注意：这里的路径需要根据实际情况调整
    const modelPath = '../../../public/models/daoguang/SM_VFX_Slash_Radial_Half_1.FBX';
  
    // 创建模型加载器
    const modelLoader = new ModelLoader3D('刀光模型', modelPath);
  
    // 设置模型加载完成后的回调
    modelLoader.setOnLoaded((loadedModel: THREE.Group) => {
      console.log('刀光模型加载成功，正在提取几何体...');
  
      // 提取模型中的几何体
      let trailGeometry: THREE.BufferGeometry | null = null;
  
      loadedModel.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && !trailGeometry) {
          // 克隆几何体，避免引用问题
          trailGeometry = child.geometry.clone();
          console.log('找到刀光网格:', child.name);
  
          // 可能需要调整几何体的缩放
          const scale = 0.1; // 根据需要调整
          const matrix = new THREE.Matrix4().makeScale(scale, scale, scale);
          trailGeometry.applyMatrix4(matrix);
  
          // 使用提取的几何体创建粒子系统
          createDissolveSwordTrail(scene, trailGeometry,);
        }
      });
  
      // 隐藏原始模型（我们只需要它的几何体）
      loadedModel.visible = false;
    });
  
    // 将模型加载器添加到场景，但位置设置在视野外
    scene.addNode(modelLoader);
  }
  
/**
 * 创建溶解刀光效果
 * @param scene 场景
 * @param trailGeometry 刀光几何体
 */
function createDissolveSwordTrail(scene: Scene, trailGeometry: THREE.BufferGeometry): ParticleSystem {
  // 创建刀光粒子系统
  const particleSystem = new ParticleSystem('TSL溶解刀光');

  // 设置位置
  particleSystem.position.set(0, 1, 0);
  particleSystem.rotation.set(Math.PI / 2, 0, 0);

  // 创建纹理
  const gradientTexture = createGradientTexture();
  const noiseTexture = createNoiseTexture();

  // 创建TSL溶解效果材质
  const dissolveMaterial = new MeshStandardNodeMaterial();
  dissolveMaterial.side = THREE.DoubleSide;
  dissolveMaterial.transparent = true;
  dissolveMaterial.depthWrite = false;
  dissolveMaterial.blending = THREE.AdditiveBlending;

  // 创建基础uniform变量 - 这些将在脚本中更新
  const dissolveAmount = uniform(0.5);
  const edgeWidth = uniform(0.1);
  const baseColorUniform = uniform(new THREE.Color(0xff5500));
  const edgeColorUniform = uniform(new THREE.Color(0xffffff));

  // 将uniform变量保存到材质的userData中，以便后续更新
  dissolveMaterial.userData = {
    dissolveAmount,
    edgeWidth,
    baseColor: baseColorUniform,
    edgeColor: edgeColorUniform
  };

  // 获取TSL函数库实例
  const tslFunctions = TSLFunctionLibrary.getInstance();

  // 使用TSL函数库创建基础颜色节点
  const baseTextureNode = texture(gradientTexture, uv());
  const baseColorNode = baseTextureNode.mul(baseColorUniform);

  // 使用TSL函数库创建溶解效果
  const dissolveEffect = tslFunctions.createDissolveEffect(
    baseColorNode,
    noiseTexture,
    edgeColorUniform,
    dissolveAmount,
    edgeWidth
  );

  // 添加时间动画效果
  const timeEffect = sin(time.mul(5.0)).mul(0.1);
  const finalColor = dissolveEffect.color.add(vec3(timeEffect));

  // 设置材质节点
  dissolveMaterial.colorNode = finalColor;
  dissolveMaterial.opacityNode = dissolveEffect.opacity;
  dissolveMaterial.roughnessNode = float(0.2);
  dissolveMaterial.metalnessNode = float(0.8);

  // 配置粒子系统设置
  const settings: Partial<ParticleSystemSettings> = {
    loop: true,
    startLifetime: new MinMaxCurve(1200, 1200),  // 2-3秒生命周期
    startSpeed: new MinMaxCurve(0, 0),
    startSize: new MinMaxCurve(1.0, 1.0),
    startRotation: new MinMaxCurve(0, 0),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 0.5, 0.5),
      new THREE.Color(1.0, 0.5, 0.5)
    ),
    emission: {
      rateOverTime: 0.2  // 增加发射率
    },
    maxParticles: 5,  // 允许更多粒子同时存在
    shape: {
      type: 'Point',
      params: {},
      randomizeDirection: true,
      directionScale: 1.0
    },
    // 固定大小
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 1.0 },
      { time: 1.0, value: 1.0 }
    ]),
    // 固定颜色
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 0.5, 0.2),
      new THREE.Color(1.0, 0.5, 0.2)
    ),
    // 持续旋转
    // rotationOverLifetime: new MinMaxCurve(0.5, 0.5),
    renderer: {
      renderMode: 'Mesh',
      mesh: trailGeometry,
      material: dissolveMaterial,
      blending: true,
      blendMode: THREE.AdditiveBlending as THREE.BlendingDstFactor,
      enableLighting: false,
      castShadows: false,
      receiveShadows: false,
      sortMode: 'None',
      maxStretchFactor: 3.0,
      speedScale: 0.5,
      alignToDirection: false
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 设置自定义网格和材质
  particleSystem.setCustomMesh(trailGeometry);

  // 添加到场景
  scene.addNode(particleSystem);

  /**
   * 溶解效果脚本 - 控制粒子系统的溶解效果
   * 基于TSLFunctionLibrary的溶解效果函数动态更新参数
   */
  class TSLDissolveEffectScript extends Script {
    private isLoop: boolean = true;
    private _startTime: number = 0;
    private _elapsedTime: number = 0;
    // 溶解动画模式 - 'pulse', 'cycle', 'linear'
    private dissolveMode: string = 'pulse';
    // 溶解参数
    private dissolveSpeed: number = 0.5;
    private edgeWidthMin: number = 0.05;
    private edgeWidthMax: number = 0.15;
    // 颜色参数
    private colorCycleSpeed: number = 0.1;
    private baseColorHue: number = 0.05; // 橙色
    private edgeColorHueOffset: number = 0.1; // 相对于基础色的偏移

    constructor(dissolveMode: string = 'pulse') {
      super();
      this.dissolveMode = dissolveMode;
    }

    // 实现抽象方法onStart
    override onStart(): void {
      console.log('溶解效果脚本启动');
      // 初始化工作可以放在这里
    }

    override onReady(): void {
      // 记录开始时间
      this._startTime = Date.now() * 0.01;
    }

    public override update(deltaTime: number): void {
      // 更新经过的时间
      this._elapsedTime += deltaTime;
      const currentTime = Date.now() * 0.001;
      
      // 获取粒子系统
      const particleSystem = this.getNode() as ParticleSystem;
      
      // 获取材质
      const renderer = particleSystem.getSettings().renderer;
      if (!renderer.material) return;
      
      // 获取保存的uniform变量
      const { dissolveAmount, edgeWidth, baseColor, edgeColor } = renderer.material.userData;
      
      // 根据不同模式更新溶解量
      let dissolveValue = 0.5; // 默认值
      
      switch (this.dissolveMode) {
        case 'pulse':
          // 脉冲模式 - 来回变化
        //   dissolveValue = Math.sin(currentTime * this.dissolveSpeed) * 0.5 + 0.5;
          break;
        case 'cycle':
          // 循环模式 - 从0到1循环
        //   dissolveValue = (currentTime * this.dissolveSpeed) % 1.0;
          break;
        case 'linear':
          // 线性模式 - 从0到1只执行一次
        //   dissolveValue = Math.min((currentTime - this._startTime) * this.dissolveSpeed, 1.0);
          break;
        default:
        //   dissolveValue = 0.5;
      }
      
      // 更新溶解量
      dissolveAmount.value = (currentTime * this.dissolveSpeed) % 1.0;;
      
    //   // 更新边缘宽度 - 随时间呼吸效果
    //   const edgeWidthValue = this.edgeWidthMin + 
    //     (Math.sin(currentTime * 2.0) * 0.5 + 0.5) * (this.edgeWidthMax - this.edgeWidthMin);
    //   edgeWidth.value = edgeWidthValue;
      
      // 旋转粒子系统
    //   particleSystem.rotation.z += deltaTime * 0.5;
      
      // 简单的位置动画
    //   particleSystem.position.y = 1 + Math.sin(currentTime) * 0.2;
      
      // 更新颜色 - 基础颜色和边缘颜色随时间变化
    //   const baseHue = (this.baseColorHue + currentTime * this.colorCycleSpeed) % 1.0;
    //   const edgeHue = (baseHue + this.edgeColorHueOffset) % 1.0;
      
    //   baseColor.value.setHSL(baseHue, 0.8, 0.5);
    //   edgeColor.value.setHSL(edgeHue, 1.0, 0.7);
      
      // 更新调试UI
    //   this.updateDebugUI(dissolveValue, edgeWidthValue, baseColor.value, edgeColor.value);
    }
    
    // 更新调试UI
    private updateDebugUI(dissolveValue: number, edgeWidth: number, baseColor: THREE.Color, edgeColor: THREE.Color): void {
      const debugElement = document.getElementById('tsl-dissolve-debug');
      if (!debugElement) return;
      
      debugElement.innerHTML = `
        <div>TSL溶解刀光</div>
        <div>模式: ${this.dissolveMode}</div>
        <div>溶解量: ${dissolveValue.toFixed(2)}</div>
        <div>边缘宽度: ${edgeWidth.toFixed(2)}</div>
        <div>基础颜色: #${baseColor.getHexString()}</div>
        <div>边缘颜色: #${edgeColor.getHexString()}</div>
      `;
    }
    
    // 设置溶解模式
    public setDissolveMode(mode: string): void {
      this.dissolveMode = mode;
      // 重置开始时间
      if (mode === 'linear') {
        this._startTime = Date.now() * 0.001;
      }
    }
    
    // 设置溶解速度
    public setDissolveSpeed(speed: number): void {
      this.dissolveSpeed = speed;
      console.log('溶解速度设置为:', this.dissolveSpeed);
    }
  }

  // 创建脚本实例
  const dissolveScript = new TSLDissolveEffectScript('pulse');
  
  // 添加脚本到粒子系统 - 使用addScriptInstance方法
  particleSystem.addScriptInstance(dissolveScript);
  
  // 创建调试UI
  createDebugUI(dissolveScript);

  // 播放粒子系统
  particleSystem.play();

  console.log('TSL溶解刀光粒子系统已创建并播放');

  return particleSystem;
}

/**
 * 创建调试UI
 */
function createDebugUI(dissolveScript: any): void {
  // 创建调试面板
  const debugPanel = document.createElement('div');
  debugPanel.style.position = 'absolute';
  debugPanel.style.top = '10px';
  debugPanel.style.left = '10px';
  debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  debugPanel.style.color = 'orange';
  debugPanel.style.padding = '10px';
  debugPanel.style.fontFamily = 'monospace';
  debugPanel.style.zIndex = '1000';
  debugPanel.style.borderRadius = '5px';
  debugPanel.id = 'tsl-dissolve-debug';
  document.body.appendChild(debugPanel);
  
  // 创建控制面板
  const controlPanel = document.createElement('div');
  controlPanel.style.position = 'absolute';
  controlPanel.style.top = '10px';
  controlPanel.style.right = '10px';
  controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  controlPanel.style.color = 'white';
  controlPanel.style.padding = '10px';
  controlPanel.style.fontFamily = 'monospace';
  controlPanel.style.zIndex = '1000';
  controlPanel.style.borderRadius = '5px';
  controlPanel.style.width = '200px';
  document.body.appendChild(controlPanel);
  
  // 添加标题
  const title = document.createElement('h3');
  title.textContent = '溶解效果控制';
  title.style.margin = '0 0 10px 0';
  title.style.color = 'orange';
  controlPanel.appendChild(title);
  
  // 添加模式选择
  const modeLabel = document.createElement('div');
  modeLabel.textContent = '溶解模式:';
  controlPanel.appendChild(modeLabel);
  
  const modeSelect = document.createElement('select');
  modeSelect.style.width = '100%';
  modeSelect.style.marginBottom = '10px';
  modeSelect.style.backgroundColor = '#333';
  modeSelect.style.color = 'white';
  modeSelect.style.border = '1px solid #555';
  modeSelect.style.padding = '5px';
  
  const modes = ['pulse', 'cycle', 'linear'];
  modes.forEach(mode => {
    const option = document.createElement('option');
    option.value = mode;
    option.textContent = mode;
    modeSelect.appendChild(option);
  });
  
  modeSelect.addEventListener('change', () => {
    dissolveScript.setDissolveMode(modeSelect.value);
  });
  
  controlPanel.appendChild(modeSelect);
  
  // 添加速度滑块
  const speedLabel = document.createElement('div');
  speedLabel.textContent = '溶解速度:';
  controlPanel.appendChild(speedLabel);
  
  const speedSlider = document.createElement('input');
  speedSlider.type = 'range';
  speedSlider.min = '0.1';
  speedSlider.max = '2.0';
  speedSlider.step = '0.1';
  speedSlider.value = '0.5';
  speedSlider.style.width = '100%';
  speedSlider.style.marginBottom = '15px';
  
  speedSlider.addEventListener('input', () => {
    dissolveScript.setDissolveSpeed(parseFloat(speedSlider.value));
    speedValue.textContent = speedSlider.value;
  });
  
  const speedValue = document.createElement('span');
  speedValue.textContent = '0.5';
  speedValue.style.float = 'right';
  speedLabel.appendChild(speedValue);
  
  controlPanel.appendChild(speedSlider);
  
  // 添加说明文本
  const info = document.createElement('div');
  info.style.fontSize = '12px';
  info.style.color = '#aaa';
  info.style.marginTop = '15px';
  info.innerHTML = `
    <p>溶解模式说明:</p>
    <ul style="padding-left: 20px; margin-top: 5px;">
      <li>pulse: 循环脉冲</li>
      <li>cycle: 0到1循环</li>
      <li>linear: 一次性动画</li>
    </ul>
  `;
  controlPanel.appendChild(info);
}

// 运行示例
runTSLDissolveSwordTrailExample(); 