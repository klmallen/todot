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
import { ModelLoader3D } from '../core/ModelLoader3D';
import { Script } from '../core/Script/Script';
import {TSLFunctionLibrary}  from '../core/materials/TSLFunctionLibrary'

// 导入WebGPU材质
import { MeshStandardNodeMaterial } from 'three/webgpu';

// 导入TSL相关模块
import {
  uniform, texture, uv, mix, step, smoothstep, color, float, vec3, sin, Fn
} from 'three/tsl';

// 导入time节点
import { time } from 'three/tsl';

/**
 * 永久刀光粒子示例
 * 展示如何创建一个永久存在的刀光效果
 */
export async function runPermanentSwordTrailExample(): Promise<Engine> {
  console.log('开始运行永久刀光粒子示例');

  // 创建引擎实例
  const engine = await new Engine().init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: true
  });

  // 创建场景 - 使用唯一的场景名称，包含时间戳避免冲突
  const sceneName = `永久刀光粒子示例_${Date.now()}`;
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

  // 创建默认刀光网格
  // 加载刀光模型
  loadSwordTrailModel(scene,'../../../public/models/daoguang/SM_VFX_Volume_Radial_Slash.FBX');
  loadSwordTrailModel(scene,'../../../public/models/daoguang/SM_VFX_Slash_Radial_Half_1.FBX');
  loadSwordTrailModel(scene,'../../../public/models/daoguang/SM_VFX_Slash_Radial_Half_2.FBX');

  // 启动引擎
  engine.start();

  return engine;
}

/**
 * 加载刀光模型并创建粒子系统
 */
function loadSwordTrailModel(scene: Scene,path:string): void {
 
  const modelPath = path;

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
        createRemapXSwordTrail(scene, trailGeometry)
      }
    });

    // 隐藏原始模型（我们只需要它的几何体）
    loadedModel.visible = false;
  });

  // 将模型加载器添加到场景，但位置设置在视野外
  modelLoader.position.set(0, -100, 0);
  scene.addNode(modelLoader);
}

/**
 * 创建默认的刀光网格
 */
function createDefaultSwordTrailMesh(): THREE.BufferGeometry {
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
 * 加载遮罩图片作为纹理
 * 从外部文件加载而非创建Canvas
 */
function loadMaskTexture(): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
        // 使用Three.js的纹理加载器
        const textureLoader = new THREE.TextureLoader();
        
        // 加载外部遮罩图片 - 路径需要根据实际项目结构调整
        textureLoader.load(
            '../../../public/textures/mask/Mask_009.png', // 遮罩图片路径
            (texture) => {
                console.log('遮罩纹理加载成功');
                // 设置纹理参数
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.needsUpdate = true;
                resolve(texture);
            },
            (progress) => {
                console.log(`遮罩纹理加载进度: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
            },
            (error) => {
                console.error('遮罩纹理加载失败:', error);
                // 加载失败时使用备用方案 - 创建一个简单的渐变遮罩
                const fallbackTexture = createFallbackMaskTexture();
                resolve(fallbackTexture);
            }
        );
    });
}

/**
 * 创建备用遮罩纹理（当外部图片加载失败时使用）
 */
function createFallbackMaskTexture(): THREE.Texture {
    console.log('使用备用遮罩纹理');
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;

    const ctx = canvas.getContext('2d')!;

    // 创建从中间白色到两端黑色的渐变
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');      // 左侧黑色
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 1)'); // 中间白色
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 1)'); // 中间白色
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');      // 右侧黑色

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
}

/**
 * 创建永久刀光效果
 * @param scene 场景
 * @param trailGeometry 刀光几何体
 * @param useCustomModel 是否使用自定义模型
 */
function createPermanentSwordTrail(scene: Scene, trailGeometry: THREE.BufferGeometry, useCustomModel: boolean = false): ParticleSystem {
  // 创建刀光粒子系统
  const particleSystem = new ParticleSystem(useCustomModel ? '自定义模型刀光' : '永久刀光');

  // 设置位置
  particleSystem.position.set(useCustomModel ? 2 : 0, 1, 0);
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

  // 创建基础uniform变量
  const dissolveAmount = uniform(0.5);
  const edgeWidth = uniform(1.0);
  const baseColorUniform = uniform(new THREE.Color(0xff5500));
  const edgeColorUniform = uniform(new THREE.Color(0xffffff));

  // 将uniform变量保存到材质的userData中，以便后续更新
  dissolveMaterial.userData = {
    dissolveAmount,
    edgeWidth,
    baseColor: baseColorUniform,
    edgeColor: edgeColorUniform
  };

  // 创建简单的TSL溶解效果
  // 1. 获取基础纹理
  const baseTexture = texture(gradientTexture, uv());

  // 2. 获取噪声纹理 - 使用缩放的UV坐标使噪声更粗糙
  // 较小的缩放值会使噪声更粗糙
  const noiseScale = uniform(0.1); // 可调整此值来控制噪声粗糙程度(值越小越粗糙)
  const scaledUV = uv().mul(noiseScale);
  const noise = texture(noiseTexture, scaledUV).r;

  // 3. 创建溶解边缘效果
  const edge = smoothstep(
    dissolveAmount.sub(edgeWidth),
    dissolveAmount,
    noise
  );

  // 4. 混合颜色
  const finalColor = mix(
    baseTexture.mul(baseColorUniform),
    edgeColorUniform,
    edge
  );

  // 5. 应用透明度裁剪
  const alpha = step(dissolveAmount, noise).mul(baseTexture.a);

  // 6. 添加简单的时间动画效果
  const timeEffect = sin(time.mul(5.0)).mul(0.1);
  const colorWithEffect = finalColor.add(vec3(timeEffect));

  // 7. 设置材质节点
  dissolveMaterial.colorNode = colorWithEffect;
  dissolveMaterial.opacityNode = alpha;
  dissolveMaterial.roughnessNode = float(0.2);
  dissolveMaterial.metalnessNode = float(0.8);
  // 配置粒子系统为永久模式
  const settings: Partial<ParticleSystemSettings> = {
    loop: true,
    startLifetime: new MinMaxCurve(3600, 3600),  // 1小时生命周期
    startSpeed: new MinMaxCurve(0, 0),
    startSize: new MinMaxCurve(1.0, 1.0),
    startRotation: new MinMaxCurve(0, 0),
    startColor: new ColorCurve(
      useCustomModel ? new THREE.Color(0, 1, 1) : new THREE.Color(1.0, 0.5, 0.2),
      useCustomModel ? new THREE.Color(0, 1, 1) : new THREE.Color(1.0, 0.5, 0.2)
    ),
    emission: {
      rateOverTime: 0.01  // 极低的发射率
    },
    maxParticles: 1,  // 最多只有1个粒子
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
      useCustomModel ? new THREE.Color(0, 1, 1) : new THREE.Color(1.0, 0.5, 0.2),
      useCustomModel ? new THREE.Color(0, 1, 1) : new THREE.Color(1.0, 0.5, 0.2)
    ),
    // 持续旋转
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
 * 根据粒子的生命周期自动更新溶解效果
 */
class DissolveEffectScript extends Script {
  // 实现抽象方法
  override onStart(): void {}
  // 是否是循环模式
  private isLoop: boolean = true;
  // 回调函数
  private onCompleteCallback: (() => void) | null = null;
  // 开始时间
  private _startTime: number = 0;

  constructor(isLoop: boolean = true, onComplete: (() => void) | null = null) {
    super();
    this.isLoop = isLoop;
    this.onCompleteCallback = onComplete;
  }

  override onReady(): void {
    // 获取粒子系统
    const particleSystem = this.getNode() as ParticleSystem;

    // 记录开始时间
    this._startTime = Date.now() * 0.001;

    // 设置粒子系统完成回调
    if (!this.isLoop && this.onCompleteCallback) {
      particleSystem.onComplete(() => {
        if (this.onCompleteCallback) this.onCompleteCallback();
      });
    }
  }

  public override update(deltaTime: number): void {
    const particleSystem = this.getNode() as ParticleSystem;

    // 获取材质
    const renderer = particleSystem.getSettings().renderer;
    if (!renderer.material) return;

    // 旋转粒子系统
    particleSystem.rotation.z += deltaTime * 0.5;

    // 简单的位置动画
    const currentTime = Date.now() * 0.001;
    particleSystem.position.y = 1 + Math.sin(currentTime) * 0.2;

    // 获取粒子的生命周期比例
    let lifetimeRatio = 0.5; // 默认值

    if (this.isLoop) {
      // 循环模式 - 使用时间动画
      lifetimeRatio = Math.sin(currentTime * 0.5) * 0.5 + 0.5;
    } else {
      // 非循环模式 - 使用时间比例
      // 由于无法直接获取粒子，使用系统时间作为替代
      const totalDuration = particleSystem.getSettings().duration || 5.0;
      const elapsedTime = Date.now() * 0.001 - this._startTime;
      lifetimeRatio = Math.min(elapsedTime / totalDuration, 1.0);
    }

    // 更新溶解效果
    renderer.material.userData.dissolveAmount.value = this.isLoop ?
      Math.sin(currentTime * 0.5) * 0.5 + 0.5 : // 循环模式
      lifetimeRatio; // 非循环模式 - 随生命周期溶解

    // 更新边缘宽度
    renderer.material.userData.edgeWidth.value = 0.05 + Math.sin(currentTime * 2.0) * 0.05;

    // 更新边缘颜色
    const hue = (currentTime * 0.1) % 1.0;
    renderer.material.userData.edgeColor.value.setHSL(hue, 1.0, 0.5);
  }
}
  // // 创建脚本实例
  // const dissolveScript = new DissolveEffectScript(settings.loop, () => {
  //   console.log('粒子效果完成，可以在这里处理清理工作');
  //   // 如果需要，可以在这里销毁粒子系统
  //   // scene.removeNode(particleSystem);
  // });

  // 添加脚本到粒子系统
  // particleSystem.addScript(DissolveEffectScript);
 

  // 播放粒子系统
  particleSystem.play();

  console.log(`${useCustomModel ? '自定义模型' : '默认'} 永久刀光粒子系统已创建并播放，并应用了溶解效果`);

  // 添加调试信息
  const debugInfo = document.createElement('div');
  debugInfo.style.position = 'absolute';
  debugInfo.style.top = useCustomModel ? '60px' : '10px';
  debugInfo.style.left = '10px';
  debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  debugInfo.style.color = useCustomModel ? 'cyan' : 'orange';
  debugInfo.style.padding = '10px';
  debugInfo.style.fontFamily = 'monospace';
  debugInfo.style.zIndex = '1000';
  debugInfo.textContent = useCustomModel ? '自定义模型刀光' : '默认刀光';
  document.body.appendChild(debugInfo);

  // 更新调试信息
  setInterval(() => {
    const count = particleSystem.getParticleCount();
    const renderer = particleSystem.getRenderer().getMesh();
    const rendererType = renderer ? renderer.constructor.name : 'null';

    debugInfo.innerHTML = `
      <div>${useCustomModel ? '自定义模型刀光' : '默认刀光'}</div>
      <div>粒子数量: ${count}</div>
      <div>渲染器类型: ${rendererType}</div>
      <div>渲染模式: ${particleSystem.getSettings().renderer.renderMode}</div>
      <div>旋转速度: 0.5 rad/s</div>
      <div>溶解效果: 使用TSL节点</div>
      <div>溶解量: ${dissolveMaterial.userData.dissolveAmount.value.toFixed(2)}</div>
      <div>边缘宽度: ${dissolveMaterial.userData.edgeWidth.value.toFixed(2)}</div>
      <div>边缘颜色: #${dissolveMaterial.userData.edgeColor.value.getHexString()}</div>
      <div>循环模式: ${settings.loop ? '是' : '否'}</div>
    `;
  }, 500);

  // 返回粒子系统实例
  return particleSystem;
}

/**
 * 创建方向性溶解刀光效果
 * @param scene 场景
 * @param trailGeometry 刀光几何体
 * @param direction 溶解方向('x+', 'x-', 'y+', 'y-')
 */
function createDirectionalDissolveSwordTrail(
    scene: Scene,
    trailGeometry: THREE.BufferGeometry,
    direction: string = 'x+'
): ParticleSystem {
    // 创建刀光粒子系统
    const particleSystem = new ParticleSystem(`方向性溶解刀光-${direction}`);

    // 设置位置 - 根据方向设置不同位置以便对比
    let xPos = 0;
    switch(direction) {
        case 'x+': xPos = -3; break;
        case 'x-': xPos = -1; break; 
        case 'y+': xPos = 1; break;
        case 'y-': xPos = 3; break;
    }
    particleSystem.position.set(xPos, 1, 0);
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

    // 创建基础uniform变量
    const dissolveProgress = uniform(0.0);
    const edgeWidth = uniform(0.1);
    const baseColorUniform = uniform(new THREE.Color(0xff0000)); // 红色
    const edgeColorUniform = uniform(new THREE.Color(0xffff00)); // 黄色边缘

    // 将uniform变量保存到材质的userData中，以便后续更新
    dissolveMaterial.userData = {
        dissolveProgress,
        edgeWidth,
        baseColor: baseColorUniform,
        edgeColor: edgeColorUniform,
        direction: direction
    };

    // 获取TSL函数库实例
    const tslFunctions = TSLFunctionLibrary.getInstance();

    // 使用基础纹理和颜色
    const baseTextureNode = texture(gradientTexture, uv());
    const baseColorNode = baseTextureNode.mul(baseColorUniform);

    // 使用TSL函数库创建方向性溶解效果
    const dissolveEffect = tslFunctions.createDirectionalDissolveEffect(
        baseColorNode,
        noiseTexture,
        edgeColorUniform,
        dissolveProgress,
        edgeWidth,
        direction,
        0.3 // 噪声缩放因子 - 值越小噪声越粗糙
    );

    console.log(dissolveEffect, 'dissolveEffect');
    // 添加时间动画效果
    const timeEffect = sin(time.mul(5.0)).mul(0.1);
    
    // 检查dissolveEffect是否有效，并处理可能的undefined情况
    let finalColor;
    if (dissolveEffect && dissolveEffect.color) {
        finalColor = dissolveEffect.color.add(vec3(timeEffect));
    } else {
        console.error('dissolveEffect.color 是 undefined，使用默认颜色');
        finalColor = baseColorNode.add(vec3(timeEffect));
    }

    // 设置材质节点
    dissolveMaterial.colorNode = finalColor;
    
    // 检查dissolveEffect.opacity是否存在
    if (dissolveEffect && dissolveEffect.opacity) {
        dissolveMaterial.opacityNode = dissolveEffect.opacity;
    } else {
        console.error('dissolveEffect.opacity 是 undefined，使用默认值1.0');
        dissolveMaterial.opacityNode = float(1.0);
    }
    
    dissolveMaterial.roughnessNode = float(0.2);
    dissolveMaterial.metalnessNode = float(0.8);

    // 配置粒子系统设置
    const settings: Partial<ParticleSystemSettings> = {
        loop: true,
        startLifetime: new MinMaxCurve(3600, 3600), // 1小时生命周期
        startSpeed: new MinMaxCurve(0, 0),
        startSize: new MinMaxCurve(1.0, 1.0),
        startRotation: new MinMaxCurve(0, 0),
        startColor: new ColorCurve(
            new THREE.Color(1.0, 0.0, 0.0),
            new THREE.Color(1.0, 0.0, 0.0)
        ),
        emission: {
            rateOverTime: 0.01 // 极低的发射率
        },
        maxParticles: 1, // 最多只有1个粒子
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
            new THREE.Color(1.0, 0.0, 0.0),
            new THREE.Color(1.0, 0.0, 0.0)
        ),
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
     * 方向性溶解效果脚本 - 控制溶解进度
     */
    class DirectionalDissolveScript extends Script {
        private dissolveSpeed: number = 0.2;
        private cycleMode: boolean = true;
        
        override onStart(): void {
            console.log(`方向性溶解刀光脚本启动 - 方向: ${direction}`);
        }
        
        override onReady(): void {
            console.log(`方向性溶解刀光脚本就绪 - 方向: ${direction}`);
        }
        
        public override update(deltaTime: number): void {
            // 获取粒子系统
            const particleSystem = this.getNode() as ParticleSystem;
            
            // 获取材质
            const renderer = particleSystem.getSettings().renderer;
            if (!renderer.material) return;
            
            // 获取保存的uniform变量
            const { dissolveProgress, edgeWidth } = renderer.material.userData;
            
            // 更新当前时间
            const currentTime = Date.now() * 0.001;
            
            // 更新溶解进度
            if (this.cycleMode) {
                // 循环模式 - 从0到1循环
                dissolveProgress.value = (Math.sin(currentTime * this.dissolveSpeed) * 0.5 + 0.5);
            } else {
                // 线性模式 - 从0到1只执行一次
                dissolveProgress.value = Math.min(currentTime * this.dissolveSpeed % 1.0, 1.0);
            }
            
            // 更新边缘宽度 - 随时间呼吸效果
            edgeWidth.value = 0.05 + Math.sin(currentTime * 2.0) * 0.03;
        }
    }

    // 创建脚本实例
    const dissolveScript = new DirectionalDissolveScript();
    
    // 添加脚本到粒子系统
    particleSystem.addScriptInstance(dissolveScript);

    // 播放粒子系统
    particleSystem.play();

    console.log(`方向性溶解刀光粒子系统已创建 - 方向: ${direction}`);

    // 添加调试信息
    const debugInfo = document.createElement('div');
    debugInfo.style.position = 'absolute';
    debugInfo.style.top = `${70 + (direction === 'x+' ? 0 : direction === 'x-' ? 120 : direction === 'y+' ? 240 : 360)}px`;
    debugInfo.style.left = '10px';
    debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugInfo.style.color = 'red';
    debugInfo.style.padding = '10px';
    debugInfo.style.fontFamily = 'monospace';
    debugInfo.style.zIndex = '1000';
    debugInfo.style.borderRadius = '5px';
    debugInfo.id = `debug-directional-${direction}`;
    document.body.appendChild(debugInfo);
    
    // 更新调试UI
    setInterval(() => {
        debugInfo.innerHTML = `
            <div>方向性溶解刀光 - ${direction}</div>
            <div>溶解进度: ${dissolveProgress.value.toFixed(2)}</div>
            <div>边缘宽度: ${edgeWidth.value.toFixed(2)}</div>
            <div>方向: ${direction}</div>
        `;
    }, 100);

    return particleSystem;
}

/**
 * 创建基于X轴的流动刀光效果
 * @param scene 场景
 * @param trailGeometry 刀光几何体
 */
async function createRemapXSwordTrail(
    scene: Scene,
    trailGeometry: THREE.BufferGeometry
): ParticleSystem {
    // 创建刀光粒子系统
    const particleSystem = new ParticleSystem('流动刀光');
    particleSystem._duration = 1
    // particleSystem.setAutoDestroy(true);
    // 设置进度回调，获取0-1的生命周期进度
    particleSystem.onProgress((progress) => {
        console.log(`粒子系统生命周期进度: ${(progress * 100).toFixed(0)}%`);
        const userData = particleSystem.getSettings().renderer.material.userData;
        let flowTime = 0;
         if (userData.autoFlow) {
                flowTime += progress * userData.flowSpeed.value * 3;
                // 计算流动位置 - 在0和1之间循环
                userData.flowPosition.value = flowTime
                
            }
        
    });
    
    // 设置完成回调
    particleSystem.onComplete(() => {
        console.log('粒子系统完成了一个生命周期');
    });
    
    // 设置销毁回调
    particleSystem.onDestroyed(() => {
        console.log('粒子系统已被销毁');
        
        // 销毁后，可以在3秒后重新创建一个
        setTimeout(() => {
            console.log('重新创建粒子系统');
            createRemapXSwordTrail(scene, trailGeometry);
        }, 3000);
    });
    
    // 设置位置
    particleSystem.position.set(0, 3, 0);
    particleSystem.rotation.set(Math.PI / 2, 0, 0);

    // 创建纹理
    const gradientTexture = createGradientTexture();
    const noiseTexture = createNoiseTexture();
    const maskTexture = await loadMaskTexture();  // 使用异步加载

    // 创建TSL溶解效果材质
    const trailMaterial = new MeshStandardNodeMaterial();
    trailMaterial.side = THREE.DoubleSide;
    trailMaterial.transparent = true;
    trailMaterial.depthWrite = false;
    trailMaterial.blending = THREE.AdditiveBlending;

    // 创建基础uniform变量
    const flowPosition = uniform(0.1);     // 流动位置 - 0到1之间
    const trailLength = uniform(0.7);      // 刀光长度 - 值越小刀光越短
    const dissolveAmount = uniform(0.5);   // 溶解程度 - 值越大溶解效果越明显
    const flowSpeed = uniform(1.0);        // 流动速度 - 控制自动流动的速度
    const baseColorUniform = uniform(new THREE.Color('red'));  // 青绿色
    const edgeColorUniform = uniform(new THREE.Color('#333333'));  // 黄色边缘
    const reverseDirection = uniform(1.0); // 反转方向 - 1.0正向，-1.0反向
    const edgeNoisePower = uniform(0.9);   // 边缘噪声强度 - 控制边缘溶解的不规则程度
    const maskStrength = uniform(1.0);     // 遮罩强度 - 控制遮罩效果的强度
    const glowStrength = uniform(3.0);     // 发光强度
    const glowRadius = uniform(0.5);       // 发光半径

    // 将uniform变量保存到材质的userData中，以便后续更新
    trailMaterial.userData = {
        flowPosition,
        trailLength,
        dissolveAmount,
        flowSpeed,
        baseColor: baseColorUniform,
        edgeColor: edgeColorUniform,
        reverseDirection,
        edgeNoisePower,
        maskStrength,
        autoFlow: true,
        glowStrength,
        glowRadius
    };

    // 获取TSL函数库实例
    const tslFunctions = TSLFunctionLibrary.getInstance();

    // 创建基于UV的X轴流动刀光效果
    // 1. 获取基础纹理和UV
    const baseTextureNode = texture(gradientTexture, uv());
    const baseColorNode = baseTextureNode.mul(baseColorUniform);
    const uvNode = uv();
    
    // 2. 获取噪声纹理 - 使用缩放的UV使噪声更粗糙
    const noiseScale = uniform(0.1);
    const scaledUV = uv().mul(noiseScale);
    const noiseValue = texture(noiseTexture, scaledUV).r;
    
    // 3. 考虑反转方向并计算与流动位置的距离
    // 使用reverseDirection来反转UV方向
    const adjustedUV = tslFunctions.remap(
        uvNode.x,
        float(0.0),
        float(1.0),
        float(-1.0),
        float(1.0)
    ).mul(reverseDirection);
    
    // 判断当前是否为反向模式
    const isReversed = step(float(0.0), reverseDirection.mul(float(-1.0))); // 正向=0，反向=1
    
    // 计算到中心点的距离 - 考虑反向情况
    const flowCenter = flowPosition.mul(2.0).sub(1.0); // 将0-1映射到-1到1
    const distanceFromCenter = adjustedUV.sub(flowCenter);
    const absDistance = distanceFromCenter.abs();
    
    // 区分前端和后端 - 考虑反向情况
    // distanceFromCenter为负值表示在流动中心点前方
    // 但在反向模式下，需要反转前后端判断
    const frontDirectionFactor = mix(
        distanceFromCenter, // 正向模式：负值=前端
        distanceFromCenter.negate(), // 反向模式：正值=前端
        isReversed
    );
    
    // 使用smoothstep而不是step来获得更平滑的过渡
    const isFrontSide = smoothstep(
        float(-0.05), 
        float(0.05), 
        frontDirectionFactor // 前端接近1，后端接近0，中间平滑过渡
    );
    
    // 4. 创建刀光区域 - 在中心附近可见，两端隐藏但使用平滑过渡
    const maxDistance = trailLength; // 刀光最大可见距离
    
    // 获取多层噪声用于边缘
    // 第二层噪声 - 更小尺度，用于边缘细节
    const noiseDetail = texture(
        noiseTexture, 
        uv().mul(uniform(0.8))
    ).r;
    
    // 混合噪声用于不规则边缘
    const edgeNoiseValue = noiseValue.mul(0.7).add(
        noiseDetail.mul(0.3)
    ).add(sin(time.mul(2.0)).mul(0.1));
    
    // 用噪声调整距离，创建不规则边缘
    const noisyDistance = absDistance.sub(
        edgeNoiseValue.mul(edgeNoisePower).mul(maxDistance.mul(0.15))
    );
    
    // 使用smoothstep代替step使边缘更自然
    const trailAreaMask = smoothstep(
        maxDistance.add(0.15), // 外部边界
        maxDistance.sub(0.15), // 内部边界 - 增大平滑区域
        noisyDistance
    );
    
    // 5. 创建溶解效果 - 前端小部分不溶解但更平滑，其余部分溶解
    const frontEdgeSize = uniform(0.15); // 增大前端不溶解区域
    
    // 前端边缘不溶解的部分 - 使用smoothstep使其更加模糊自然
    // 根据流动方向调整边缘检测
    const frontEdgeMask = smoothstep(
        float(-0.02),
        frontEdgeSize,
        frontDirectionFactor // 使用考虑了反向的方向因子
    ).mul(trailAreaMask);
    
    // 基于噪声的溶解效果 - 使用多层噪声让溶解更自然
    const noiseScale1 = uniform(0.1); // 第一层噪声缩放
    const noiseScale2 = uniform(0.3); // 第二层噪声缩放
    
    // 在反向模式下正确处理UV坐标用于噪声采样
    // 由于无法使用set或negate直接修改向量，我们需要采用不同的方法
    const normalUV = uv();
    const reversedUVx = float(1.0).sub(normalUV.x); // 反转X坐标
    
    // 创建一个新的向量用于噪声采样
    const noiseUV = vec3(
        mix(normalUV.x, reversedUVx, isReversed),
        normalUV.y,
        float(0.0)
    );
    
    const scaledUV1 = noiseUV.mul(noiseScale1);
    const scaledUV2 = noiseUV.mul(noiseScale2);
    
    // 多层噪声混合
    const noise1 = texture(noiseTexture, scaledUV1).r;
    const noise2 = texture(noiseTexture, scaledUV2).r;
    
    // 添加更多波动和细节
    const dissolveNoise = noise1.mul(0.6).add(noise2.mul(0.4)).add(
        sin(noiseUV.x.mul(15.0).add(time.mul(1.0))).mul(0.1).add(
            sin(noiseUV.y.mul(12.0).add(time.mul(0.8))).mul(0.1)
        )
    );
    
    // 基于位置的溶解强度 - 使曲线更加自然
    // 反向模式下需要反转位置计算
    const normalizedDistance = mix(
        distanceFromCenter, 
        distanceFromCenter.negate(), 
        isReversed
    );
    
    const positionFactor = normalizedDistance.add(maxDistance)
        .div(maxDistance.mul(2.0))
        .clamp(float(0.0), float(1.0));
    
    // 使用幂函数使后端溶解效果更强
    const positionBasedDissolve = positionFactor.pow(float(1.3))
        .mul(float(1.0).sub(frontEdgeMask.mul(0.7))); // 减少前端边缘的溶解影响
    
    // 边缘溶解效果 - 增大范围使过渡更平滑
    const dissolveMask = smoothstep(
        dissolveAmount.add(positionBasedDissolve.mul(0.3)).sub(0.25),
        dissolveAmount.add(positionBasedDissolve.mul(0.3)).add(0.25),
        dissolveNoise
    );
    
    // 在位置0和1处完全隐藏 - 使用更平滑的过渡
    const visibilityMask = smoothstep(float(0.0), float(0.15), flowPosition)
        .mul(smoothstep(float(0.0), float(0.15), float(1.0).sub(flowPosition)));
    
    // 垂直UV变化处理 - 沿Y方向添加额外的渐变
    // 反向模式下也可能需要调整垂直渐变
    const verticalGradient = smoothstep(
        float(0.3), 
        float(0.7), 
        noiseUV.y // 使用一致的UV
    );
    
    // 6. 混合颜色 - 边缘使用边缘颜色，添加渐变
    const edgeFactor = smoothstep(
        float(0.3), // 降低阈值使过渡更平滑
        float(0.7), // 增加阈值范围
        dissolveNoise.add(positionBasedDissolve.mul(0.4))
    );
    
    // 添加垂直渐变到颜色混合
    const finalColor = mix(
        baseColorNode,
        edgeColorUniform,
        edgeFactor.mul(verticalGradient.mul(0.7).add(0.3)) // 保留一些原始效果
    );
    
    // 7. 应用透明度 - 结合更平滑的过渡和渐变
    // 使用较低的溶解影响来保持原形状可见性
    
    // 获取并应用遮罩纹理
    const maskTextureNode = texture(maskTexture, uv());
    const maskValue = maskTextureNode.r; // 使用遮罩的红色通道作为遮罩值
    
    // 应用遮罩强度
    const finalMask = mix(
        float(1.0), // 无遮罩影响
        maskValue,  // 完全应用遮罩
        maskStrength
    );
    
    // 组合所有透明度因素
    const alpha = trailAreaMask.mul(
        mix(
            dissolveMask, // 减少溶解对整体透明度的影响，保持形状
            float(1.0), 
            frontEdgeMask.mul(0.1) // 前端边缘减少溶解影响
        )
    ).mul(baseTextureNode.a).mul(visibilityMask).mul(finalMask); // 应用遮罩
    
    // 8. 添加时间动画效果
    const timeEffect = sin(time.mul(3.0)).mul(0.07); // 减小闪烁强度
    const colorWithEffect = finalColor
    
    // 9. 设置材质节点
    trailMaterial.colorNode = colorWithEffect;
    trailMaterial.opacityNode = alpha;
    trailMaterial.roughnessNode = float(0.2);
    trailMaterial.metalnessNode = float(0.8);

    // 修改emissiveNode以增强发光效果
    // 首先，保留原来的基础发光
    const baseEmissive = colorWithEffect.mul(0.5);

    // 创建基于遮罩和噪声的增强发光
    const glowFactor = dissolveNoise
        .mul(maskValue) // 使用遮罩控制辉光区域
        .add(frontEdgeMask.mul(0.2)) // 前端边缘额外发光
        .mul(glowStrength); // 应用发光强度

    // 计算发光颜色
    const glowColor = mix(
        baseColorUniform,  // 使用基础颜色
        edgeColorUniform,  // 混合边缘颜色
        edgeFactor.mul(0.5)  // 边缘因子决定混合程度
    ).mul(glowFactor);      // 应用发光因子

    // 设置最终的发光效果
    trailMaterial.emissiveNode = baseEmissive.add(glowColor);

    // 配置粒子系统设置
    const settings: Partial<ParticleSystemSettings> = {
        loop: true,
        startLifetime: new MinMaxCurve(3, 3), // 1小时生命周期
        startSpeed: new MinMaxCurve(0, 0),
        startSize: new MinMaxCurve(1.0, 1.0),
        startRotation: new MinMaxCurve(0, 0),
        startColor: new ColorCurve(
            new THREE.Color(0x00ff88),
            new THREE.Color(0x00ff88)
        ),
        loop: false,
        emission: {
            rateOverTime: 0 // 极低的发射率
        },
        maxParticles: 1, // 最多只有1个粒子
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
            new THREE.Color(0x00ff88),
            new THREE.Color(0x00ff88)
        ),
        renderer: {
            renderMode: 'Mesh',
            mesh: trailGeometry,
            material: trailMaterial,
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

    /**
     * 流动刀光效果脚本 - 控制流动效果
     */
    class FlowingTrailScript extends Script {
        private flowTime: number = 0;
        
        override onStart(): void {
            console.log(`流动刀光脚本开始初始化`);
        }

        override onReady(): void {
            console.log(`流动刀光脚本已就绪`);
            
            // 创建UI控制面板
            this.createControlUI();
        }
        
        private createControlUI(): void {
            // 创建控制面板
            const controlPanel = document.createElement('div');
            controlPanel.style.position = 'absolute';
            controlPanel.style.top = '10px';
            controlPanel.style.left = '10px';
            controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            controlPanel.style.color = '#00ff88';
            controlPanel.style.padding = '15px';
            controlPanel.style.fontFamily = 'monospace';
            controlPanel.style.borderRadius = '8px';
            controlPanel.style.zIndex = '1000';
            controlPanel.style.width = '280px';
            controlPanel.id = 'flow-control';
            
            // 添加标题
            const title = document.createElement('h3');
            title.textContent = '流动刀光控制';
            title.style.margin = '0 0 15px 0';
            title.style.color = '#00ff88';
            controlPanel.appendChild(title);
            
            // 添加自动流动切换
            const autoFlowContainer = document.createElement('div');
            autoFlowContainer.style.marginBottom = '15px';
            
            const autoFlowCheckbox = document.createElement('input');
            autoFlowCheckbox.type = 'checkbox';
            autoFlowCheckbox.id = 'auto-flow-checkbox';
            autoFlowCheckbox.checked = true;
            
            const autoFlowLabel = document.createElement('label');
            autoFlowLabel.textContent = ' 自动流动';
            autoFlowLabel.htmlFor = 'auto-flow-checkbox';
            autoFlowLabel.style.marginLeft = '5px';
            
            autoFlowCheckbox.addEventListener('change', (e) => {
                const checked = (e.target as HTMLInputElement).checked;
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.autoFlow = checked;
                }
                
                // 启用/禁用流动位置滑块
                const positionSlider = document.getElementById('flow-position-slider') as HTMLInputElement;
                if (positionSlider) {
                    positionSlider.disabled = checked;
                }
            });
            
            autoFlowContainer.appendChild(autoFlowCheckbox);
            autoFlowContainer.appendChild(autoFlowLabel);
            controlPanel.appendChild(autoFlowContainer);
            
            // 添加方向控制切换
            const directionContainer = document.createElement('div');
            directionContainer.style.marginBottom = '15px';
            
            const directionCheckbox = document.createElement('input');
            directionCheckbox.type = 'checkbox';
            directionCheckbox.id = 'direction-checkbox';
            directionCheckbox.checked = true;
            
            const directionLabel = document.createElement('label');
            directionLabel.textContent = ' 正向流动';
            directionLabel.htmlFor = 'direction-checkbox';
            directionLabel.style.marginLeft = '5px';
            
            directionCheckbox.addEventListener('change', (e) => {
                const checked = (e.target as HTMLInputElement).checked;
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.reverseDirection.value = checked ? 1.0 : -1.0;
                    directionLabel.textContent = checked ? ' 正向流动' : ' 反向流动';
                }
            });
            
            directionContainer.appendChild(directionCheckbox);
            directionContainer.appendChild(directionLabel);
            controlPanel.appendChild(directionContainer);
            
            // 添加流动位置滑块
            const flowPositionContainer = document.createElement('div');
            flowPositionContainer.style.marginBottom = '15px';
            
            const flowPositionLabel = document.createElement('label');
            flowPositionLabel.textContent = '流动位置: 0.5';
            flowPositionLabel.style.display = 'block';
            flowPositionLabel.style.marginBottom = '5px';
            flowPositionLabel.id = 'flow-position-label';
            flowPositionContainer.appendChild(flowPositionLabel);
            
            const flowPositionSlider = document.createElement('input');
            flowPositionSlider.type = 'range';
            flowPositionSlider.min = '0';
            flowPositionSlider.max = '1';
            flowPositionSlider.step = '0.01';
            flowPositionSlider.value = '0.5';
            flowPositionSlider.style.width = '100%';
            flowPositionSlider.id = 'flow-position-slider';
            flowPositionSlider.disabled = true; // 默认自动流动时禁用
            
            flowPositionSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('flow-position-label')!.textContent = `流动位置: ${value.toFixed(2)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.flowPosition.value = value;
                }
            });
            
            flowPositionContainer.appendChild(flowPositionSlider);
            controlPanel.appendChild(flowPositionContainer);
            
            // 添加刀光长度滑块
            const trailLengthContainer = document.createElement('div');
            trailLengthContainer.style.marginBottom = '15px';
            
            const trailLengthLabel = document.createElement('label');
            trailLengthLabel.textContent = '刀光长度: 0.3';
            trailLengthLabel.style.display = 'block';
            trailLengthLabel.style.marginBottom = '5px';
            trailLengthLabel.id = 'trail-length-label';
            trailLengthContainer.appendChild(trailLengthLabel);
            
            const trailLengthSlider = document.createElement('input');
            trailLengthSlider.type = 'range';
            trailLengthSlider.min = '0.1';
            trailLengthSlider.max = '1.0';
            trailLengthSlider.step = '0.01';
            trailLengthSlider.value = '0.3';
            trailLengthSlider.style.width = '100%';
            trailLengthSlider.id = 'trail-length-slider';
            
            trailLengthSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('trail-length-label')!.textContent = `刀光长度: ${value.toFixed(2)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.trailLength.value = value;
                }
            });
            
            trailLengthContainer.appendChild(trailLengthSlider);
            controlPanel.appendChild(trailLengthContainer);
            
            // 添加溶解程度滑块
            const dissolveContainer = document.createElement('div');
            dissolveContainer.style.marginBottom = '15px';
            
            const dissolveLabel = document.createElement('label');
            dissolveLabel.textContent = '溶解程度: 0.2';
            dissolveLabel.style.display = 'block';
            dissolveLabel.style.marginBottom = '5px';
            dissolveLabel.id = 'dissolve-label';
            dissolveContainer.appendChild(dissolveLabel);
            
            const dissolveSlider = document.createElement('input');
            dissolveSlider.type = 'range';
            dissolveSlider.min = '0.01';
            dissolveSlider.max = '0.5';
            dissolveSlider.step = '0.01';
            dissolveSlider.value = '0.2';
            dissolveSlider.style.width = '100%';
            dissolveSlider.id = 'dissolve-slider';
            
            dissolveSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('dissolve-label')!.textContent = `溶解程度: ${value.toFixed(2)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.dissolveAmount.value = value;
                }
            });
            
            dissolveContainer.appendChild(dissolveSlider);
            controlPanel.appendChild(dissolveContainer);
            
            // 添加流动速度滑块
            const speedContainer = document.createElement('div');
            speedContainer.style.marginBottom = '15px';
            
            const speedLabel = document.createElement('label');
            speedLabel.textContent = '流动速度: 1.0';
            speedLabel.style.display = 'block';
            speedLabel.style.marginBottom = '5px';
            speedLabel.id = 'speed-label';
            speedContainer.appendChild(speedLabel);
            
            const speedSlider = document.createElement('input');
            speedSlider.type = 'range';
            speedSlider.min = '0.1';
            speedSlider.max = '3.0';
            speedSlider.step = '0.1';
            speedSlider.value = '1.0';
            speedSlider.style.width = '100%';
            speedSlider.id = 'speed-slider';
            
            speedSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('speed-label')!.textContent = `流动速度: ${value.toFixed(1)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.flowSpeed.value = value;
                }
            });
            
            speedContainer.appendChild(speedSlider);
            controlPanel.appendChild(speedContainer);
            
            // 添加颜色选择器
            const colorSection = document.createElement('div');
            colorSection.style.marginBottom = '15px';
            
            const colorTitle = document.createElement('div');
            colorTitle.textContent = '颜色控制';
            colorTitle.style.fontWeight = 'bold';
            colorTitle.style.marginBottom = '10px';
            colorSection.appendChild(colorTitle);
            
            // 主体颜色选择器
            const baseColorContainer = document.createElement('div');
            baseColorContainer.style.display = 'flex';
            baseColorContainer.style.alignItems = 'center';
            baseColorContainer.style.marginBottom = '10px';
            
            const baseColorLabel = document.createElement('label');
            baseColorLabel.textContent = '主体颜色: ';
            baseColorLabel.style.width = '80px';
            
            const baseColorPicker = document.createElement('input');
            baseColorPicker.type = 'color';
            baseColorPicker.value = '#00ff88'; // 默认青绿色
            baseColorPicker.style.marginLeft = '5px';
            
            baseColorPicker.addEventListener('input', (e) => {
                const value = (e.target as HTMLInputElement).value;
                if (trailMaterial && trailMaterial.userData && trailMaterial.userData.baseColor) {
                    // 将十六进制颜色转换为THREE.Color
                    const color = new THREE.Color(value);
                    trailMaterial.userData.baseColor.value = color;
                }
            });
            
            baseColorContainer.appendChild(baseColorLabel);
            baseColorContainer.appendChild(baseColorPicker);
            colorSection.appendChild(baseColorContainer);
            
            // 边缘颜色选择器
            const edgeColorContainer = document.createElement('div');
            edgeColorContainer.style.display = 'flex';
            edgeColorContainer.style.alignItems = 'center';
            
            const edgeColorLabel = document.createElement('label');
            edgeColorLabel.textContent = '边缘颜色: ';
            edgeColorLabel.style.width = '80px';
            
            const edgeColorPicker = document.createElement('input');
            edgeColorPicker.type = 'color';
            edgeColorPicker.value = '#ffff00'; // 默认黄色
            edgeColorPicker.style.marginLeft = '5px';
            
            edgeColorPicker.addEventListener('input', (e) => {
                const value = (e.target as HTMLInputElement).value;
                if (trailMaterial && trailMaterial.userData && trailMaterial.userData.edgeColor) {
                    // 将十六进制颜色转换为THREE.Color
                    const color = new THREE.Color(value);
                    trailMaterial.userData.edgeColor.value = color;
                }
            });
            
            edgeColorContainer.appendChild(edgeColorLabel);
            edgeColorContainer.appendChild(edgeColorPicker);
            colorSection.appendChild(edgeColorContainer);
            
            // 添加噪声强度滑块
            const edgeNoiseContainer = document.createElement('div');
            edgeNoiseContainer.style.marginBottom = '15px';
            
            const edgeNoiseLabel = document.createElement('label');
            edgeNoiseLabel.textContent = '边缘噪声: 0.3';
            edgeNoiseLabel.style.display = 'block';
            edgeNoiseLabel.style.marginBottom = '5px';
            edgeNoiseLabel.id = 'edge-noise-label';
            edgeNoiseContainer.appendChild(edgeNoiseLabel);
            
            const edgeNoiseSlider = document.createElement('input');
            edgeNoiseSlider.type = 'range';
            edgeNoiseSlider.min = '0.0';
            edgeNoiseSlider.max = '0.8';
            edgeNoiseSlider.step = '0.01';
            edgeNoiseSlider.value = '0.3';
            edgeNoiseSlider.style.width = '100%';
            edgeNoiseSlider.id = 'edge-noise-slider';
            
            edgeNoiseSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('edge-noise-label')!.textContent = `边缘噪声: ${value.toFixed(2)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.edgeNoisePower.value = value;
                }
            });
            
            edgeNoiseContainer.appendChild(edgeNoiseSlider);
            controlPanel.appendChild(edgeNoiseContainer);
            
            // 添加遮罩强度滑块
            const maskStrengthContainer = document.createElement('div');
            maskStrengthContainer.style.marginBottom = '15px';
            
            const maskStrengthLabel = document.createElement('label');
            maskStrengthLabel.textContent = '遮罩强度: 0.8';
            maskStrengthLabel.style.display = 'block';
            maskStrengthLabel.style.marginBottom = '5px';
            maskStrengthLabel.id = 'mask-strength-label';
            maskStrengthContainer.appendChild(maskStrengthLabel);
            
            const maskStrengthSlider = document.createElement('input');
            maskStrengthSlider.type = 'range';
            maskStrengthSlider.min = '0.0';
            maskStrengthSlider.max = '1.0';
            maskStrengthSlider.step = '0.01';
            maskStrengthSlider.value = '0.8';
            maskStrengthSlider.style.width = '100%';
            maskStrengthSlider.id = 'mask-strength-slider';
            
            maskStrengthSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('mask-strength-label')!.textContent = `遮罩强度: ${value.toFixed(2)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.maskStrength.value = value;
                }
            });
            
            maskStrengthContainer.appendChild(maskStrengthSlider);
            controlPanel.appendChild(maskStrengthContainer);
            
            // 添加辉光控制部分
            const glowEffectSection = document.createElement('div');
            glowEffectSection.style.marginBottom = '15px';
            
            const glowEffectTitle = document.createElement('div');
            glowEffectTitle.textContent = '辉光效果控制';
            glowEffectTitle.style.fontWeight = 'bold';
            glowEffectTitle.style.marginBottom = '10px';
            glowEffectSection.appendChild(glowEffectTitle);
            
            // 辉光强度滑块
            const glowIntensityContainer = document.createElement('div');
            glowIntensityContainer.style.marginBottom = '15px';
            
            const glowIntensityLabel = document.createElement('label');
            glowIntensityLabel.textContent = '辉光强度: 3.0';
            glowIntensityLabel.style.display = 'block';
            glowIntensityLabel.style.marginBottom = '5px';
            glowIntensityLabel.id = 'glow-intensity-label';
            glowIntensityContainer.appendChild(glowIntensityLabel);
            
            const glowIntensitySlider = document.createElement('input');
            glowIntensitySlider.type = 'range';
            glowIntensitySlider.min = '0.0';
            glowIntensitySlider.max = '10.0';
            glowIntensitySlider.step = '0.1';
            glowIntensitySlider.value = '3.0';
            glowIntensitySlider.style.width = '100%';
            glowIntensitySlider.id = 'glow-intensity-slider';
            
            glowIntensitySlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('glow-intensity-label')!.textContent = `辉光强度: ${value.toFixed(1)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.glowStrength.value = value;
                }
            });
            
            glowIntensityContainer.appendChild(glowIntensitySlider);
            glowEffectSection.appendChild(glowIntensityContainer);
            
            // 辉光遮罩强度滑块
            const glowMaskStrengthContainer = document.createElement('div');
            glowMaskStrengthContainer.style.marginBottom = '15px';
            
            const glowMaskStrengthLabel = document.createElement('label');
            glowMaskStrengthLabel.textContent = '辉光遮罩强度: 1.0';
            glowMaskStrengthLabel.style.display = 'block';
            glowMaskStrengthLabel.style.marginBottom = '5px';
            glowMaskStrengthLabel.id = 'glow-mask-strength-label';
            glowMaskStrengthContainer.appendChild(glowMaskStrengthLabel);
            
            const glowMaskStrengthSlider = document.createElement('input');
            glowMaskStrengthSlider.type = 'range';
            glowMaskStrengthSlider.min = '0.0';
            glowMaskStrengthSlider.max = '2.0';
            glowMaskStrengthSlider.step = '0.01';
            glowMaskStrengthSlider.value = '1.0';
            glowMaskStrengthSlider.style.width = '100%';
            glowMaskStrengthSlider.id = 'glow-mask-strength-slider';
            
            glowMaskStrengthSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('glow-mask-strength-label')!.textContent = `辉光遮罩强度: ${value.toFixed(2)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.glowMaskStrength.value = value;
                }
            });
            
            glowMaskStrengthContainer.appendChild(glowMaskStrengthSlider);
            glowEffectSection.appendChild(glowMaskStrengthContainer);
            
            // 辉光颜色选择器
            const glowColorContainer = document.createElement('div');
            glowColorContainer.style.display = 'flex';
            glowColorContainer.style.alignItems = 'center';
            glowColorContainer.style.marginBottom = '10px';
            
            const glowColorLabel = document.createElement('label');
            glowColorLabel.textContent = '辉光颜色: ';
            glowColorLabel.style.width = '80px';
            
            const glowColorPicker = document.createElement('input');
            glowColorPicker.type = 'color';
            glowColorPicker.value = '#ffffff'; // 默认白色
            glowColorPicker.style.marginLeft = '5px';
            
            glowColorPicker.addEventListener('input', (e) => {
                const value = (e.target as HTMLInputElement).value;
                if (trailMaterial && trailMaterial.userData && trailMaterial.userData.glowColor) {
                    // 将十六进制颜色转换为THREE.Color
                    const color = new THREE.Color(value);
                    trailMaterial.userData.glowColor.value = color;
                }
            });
            
            glowColorContainer.appendChild(glowColorLabel);
            glowColorContainer.appendChild(glowColorPicker);
            glowEffectSection.appendChild(glowColorContainer);
            
            // 添加发光效果控制部分
            const emissionSection = document.createElement('div');
            emissionSection.style.marginBottom = '15px';
            
            const emissionTitle = document.createElement('div');
            emissionTitle.textContent = '发光效果';
            emissionTitle.style.fontWeight = 'bold';
            emissionTitle.style.marginBottom = '10px';
            emissionSection.appendChild(emissionTitle);
            
            // 发光强度滑块
            const glowStrengthContainer = document.createElement('div');
            glowStrengthContainer.style.marginBottom = '10px';
            
            const glowStrengthLabel = document.createElement('label');
            glowStrengthLabel.textContent = '发光强度: 3.0';
            glowStrengthLabel.style.display = 'block';
            glowStrengthLabel.style.marginBottom = '5px';
            glowStrengthLabel.id = 'glow-strength-label';
            glowStrengthContainer.appendChild(glowStrengthLabel);
            
            const glowStrengthSlider = document.createElement('input');
            glowStrengthSlider.type = 'range';
            glowStrengthSlider.min = '0.0';
            glowStrengthSlider.max = '10.0';
            glowStrengthSlider.step = '0.1';
            glowStrengthSlider.value = '3.0';
            glowStrengthSlider.style.width = '100%';
            glowStrengthSlider.id = 'glow-strength-slider';
            
            glowStrengthSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('glow-strength-label')!.textContent = `发光强度: ${value.toFixed(1)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.glowStrength.value = value;
                }
            });
            
            glowStrengthContainer.appendChild(glowStrengthSlider);
            emissionSection.appendChild(glowStrengthContainer);
            
            // 发光半径滑块
            const glowRadiusContainer = document.createElement('div');
            glowRadiusContainer.style.marginBottom = '10px';
            
            const glowRadiusLabel = document.createElement('label');
            glowRadiusLabel.textContent = '发光半径: 0.5';
            glowRadiusLabel.style.display = 'block';
            glowRadiusLabel.style.marginBottom = '5px';
            glowRadiusLabel.id = 'glow-radius-label';
            glowRadiusContainer.appendChild(glowRadiusLabel);
            
            const glowRadiusSlider = document.createElement('input');
            glowRadiusSlider.type = 'range';
            glowRadiusSlider.min = '0.1';
            glowRadiusSlider.max = '2.0';
            glowRadiusSlider.step = '0.1';
            glowRadiusSlider.value = '0.5';
            glowRadiusSlider.style.width = '100%';
            glowRadiusSlider.id = 'glow-radius-slider';
            
            glowRadiusSlider.addEventListener('input', (e) => {
                const value = parseFloat((e.target as HTMLInputElement).value);
                document.getElementById('glow-radius-label')!.textContent = `发光半径: ${value.toFixed(1)}`;
                
                if (trailMaterial && trailMaterial.userData) {
                    trailMaterial.userData.glowRadius.value = value;
                }
            });
            
            glowRadiusContainer.appendChild(glowRadiusSlider);
            emissionSection.appendChild(glowRadiusContainer);
            
            // 将发光控制部分添加到控制面板
            controlPanel.appendChild(emissionSection);
            
            // 添加UI到页面
            document.body.appendChild(controlPanel);
        }
        
        public override update(deltaTime: number): void {
            const particleSystem = this.getNode() as ParticleSystem;
            const currentTime = Date.now() * 0.001;
            
            // 获取材质
            const renderer = particleSystem.getSettings().renderer;
            if (!renderer.material || !renderer.material.userData) return;
            
            const userData = renderer.material.userData;
            
            // 如果启用了自动流动，则更新流动位置
            // if (userData.autoFlow) {
            //     this.flowTime += deltaTime * userData.flowSpeed.value;
                
            //     // 计算流动位置 - 在0和1之间循环
            //     userData.flowPosition.value = (Math.sin(this.flowTime) + 1) * 0.5;
                
            //     // 更新UI滑块（如果存在）
            //     const slider = document.getElementById('flow-position-slider') as HTMLInputElement;
            //     if (slider) {
            //         slider.value = userData.flowPosition.value.toString();
            //     }
                
            //     const label = document.getElementById('flow-position-label');
            //     if (label) {
            //         label.textContent = `流动位置: ${userData.flowPosition.value.toFixed(2)}`;
            //     }
            // }
            
            // 简单的位置动画
            particleSystem.position.y = 3 + Math.sin(currentTime) * 0.2;
        }
    }

    // 添加脚本到粒子系统
    particleSystem.addScript(FlowingTrailScript);

    // 播放粒子系统
    particleSystem.play();

    console.log(`流动刀光粒子系统已创建`);
    
    // 添加到场景
    scene.addNode(particleSystem);
    return particleSystem;
}

// 运行示例
runPermanentSwordTrailExample();
