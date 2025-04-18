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


const timeUniform = uniform(0.0);
// 全局变量用于存储TSL uniform变量
let tslUniforms = {
  dissolveAmount: null,
  edgeWidth: null,
  baseColor: null,
  edgeColor: null,
  time: null
};
import { MeshStandardNodeMaterial } from 'three/webgpu';
// 导入TSL相关模块
import {
  uniform, texture, uv, mix, step, smoothstep, color, float, vec3, sin, add, positionLocal
} from 'three/tsl';

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

  // 加载刀光模型
  loadSwordTrailModel(scene);

  // 启动引擎
  engine.start();

  return engine;
}

/**
 * 加载刀光模型并创建粒子系统
 */
function loadSwordTrailModel(scene: Scene): void {
  // 创建一个简单的刀光模型（如果没有FBX模型可以使用）
  const defaultTrailMesh = createDefaultSwordTrailMesh();

  // 创建永久刀光粒子系统
  createPermanentSwordTrail(scene, defaultTrailMesh);

  // 尝试加载FBX模型（如果有的话）
  // 注意：这里的路径需要根据实际情况调整
  const modelPath = '../../../public/models/daoguang/SM_GPS_Diamond.FBX';

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
        createPermanentSwordTrail(scene, trailGeometry, true);
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

  // 使用TSL节点创建溶解效果材质
  const dissolveMaterial = new MeshStandardNodeMaterial();
  dissolveMaterial.side = THREE.DoubleSide;
  dissolveMaterial.transparent = true;
  dissolveMaterial.depthWrite = false;
  dissolveMaterial.blending = THREE.AdditiveBlending;

  // 创建自定义uniform变量
  const dissolveAmount = uniform(0.5);
  const edgeWidth = uniform(0.1);
  const baseColorUniform = uniform(new THREE.Color(useCustomModel ? 0x00ffff : 0xff5500));
  const edgeColorUniform = uniform(new THREE.Color(0xffffff));


  // 将uniform变量保存到材质的userData中，以便后续更新
  dissolveMaterial.userData.dissolveAmount = dissolveAmount;
  dissolveMaterial.userData.edgeWidth = edgeWidth;
  dissolveMaterial.userData.baseColor = baseColorUniform;
  dissolveMaterial.userData.edgeColor = edgeColorUniform;
  dissolveMaterial.userData.time = timeUniform;

  // 使用TSL编写溶解效果
  // 1. 获取基础纹理
  const baseTexture = texture(gradientTexture, uv());

  // 2. 获取噪声纹理
  const noise = texture(noiseTexture, uv()).r;

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

  // 6. 添加动画效果
  const position = positionLocal;
  const timeEffect = sin(
    position.x.mul(5.0).add(timeUniform)
  ).add(
    sin(position.y.mul(5.0).add(timeUniform))
  ).add(
    sin(position.z.mul(5.0).add(timeUniform))
  ).mul(0.1);

  const colorWithEffect = finalColor.add(vec3(timeEffect));

  // 7. 设置材质节点
  dissolveMaterial.colorNode = colorWithEffect;
  dissolveMaterial.opacityNode = alpha;
  dissolveMaterial.roughnessNode = float(0.2);
  dissolveMaterial.metalnessNode = float(0.8);


    // 将uniform变量保存到材质的userData中
  dissolveMaterial.userData.dissolveAmount = dissolveAmount;
  dissolveMaterial.userData.edgeWidth = edgeWidth;
  dissolveMaterial.userData.baseColor = baseColorUniform;
  dissolveMaterial.userData.edgeColor = edgeColorUniform;
  dissolveMaterial.userData.time = timeUniform;
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
    rotationOverLifetime: new MinMaxCurve(0.5, 0.5),
    renderer: {
      renderMode: 'Mesh',
      mesh: trailGeometry,
      material: dissolveMaterial,
      blending: true,
      blendMode: THREE.AdditiveBlending as THREE.BlendingDstFactor
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 设置自定义网格和材质
  particleSystem.setCustomMesh(trailGeometry);

  // 添加到场景
  scene.addNode(particleSystem);

  class DissolveEffectScript extends Script {
    override onStart(): void {
      
    }
    private material: MeshStandardNodeMaterial | null = null;
    
    override onReady(): void {
      // 获取粒子系统
      const particleSystem = this.getNode() as ParticleSystem;
    
      // 获取材质
      const renderer = particleSystem.getSettings().renderer;
      console.log(particleSystem.getSettings(),'particleSystem.getSettings()')
      if (renderer && renderer.material) {
        this.material = renderer.material as MeshStandardNodeMaterial;
      }
    }
    
    public override update(deltaTime: number): void {
      const particleSystem = this.getNode() as ParticleSystem;
      
      // 获取材质
      const renderer = particleSystem.getSettings().renderer;
      // console.log(renderer.material,'particleSystem.getSettings()')
      if (!renderer.material) return;
      
      particleSystem.rotation.z += deltaTime * 0.5;
      
      const time = Date.now() * 0.001;
      particleSystem.position.y = 1 + Math.sin(time) * 0.2;
      
      // 通过材质的userData更新uniform变量
      renderer.material.userData.time.value = time;
      console.log( renderer.material.userData.time.value,' this.material.userData.time.value')
      renderer.material.userData.dissolveAmount.value = Math.sin(time * 0.5) * 0.5 + 0.5;
      renderer.material.userData.edgeWidth.value = 0.05 + Math.sin(time * 2.0) * 0.05;
      
      const hue = (time * 0.1) % 1.0;
      renderer.material.userData.edgeColor.value.setHSL(hue, 1.0, 0.5);
    }
  }
  // 添加脚本到粒子系统
  particleSystem.addScript(DissolveEffectScript);

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
      <div>时间: ${dissolveMaterial.userData.time.value.toFixed(1)}</div>
    `;
  }, 500);

  // 返回粒子系统实例
  return particleSystem;
}

// 运行示例
runPermanentSwordTrailExample();