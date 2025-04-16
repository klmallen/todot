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
    useWebGPU: false
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
 * 创建永久刀光效果
 * @param scene 场景
 * @param trailGeometry 刀光几何体
 * @param useCustomModel 是否使用自定义模型
 */
function createPermanentSwordTrail(scene: Scene, trailGeometry: THREE.BufferGeometry, useCustomModel: boolean = false): void {
  // 创建刀光粒子系统
  const particleSystem = new ParticleSystem(useCustomModel ? '自定义模型刀光' : '永久刀光');
  
  // 设置位置
  particleSystem.position.set(useCustomModel ? 2 : 0, 1, 0);
  particleSystem.rotation.set(Math.PI / 2, 0, 0);
  
  // 创建刀光材质
  const trailMaterial = new THREE.MeshBasicMaterial({
    map: createGradientTexture(),
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    color: useCustomModel ? 0x00ffff : 0xff5500
  });
  
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
      material: trailMaterial,
      blending: true,
      blendMode: THREE.AdditiveBlending
    }
  };
  
  // 应用设置
  particleSystem.setSettings(settings);
  
  // 设置自定义网格和材质
  particleSystem.setCustomMesh(trailGeometry);
  
  // 添加到场景
  scene.addNode(particleSystem);
  
  // 播放粒子系统
  particleSystem.play();
  
  // // 添加动画控制脚本
  // particleSystem.addScript({
  //   update: function(deltaTime) {
  //     // 旋转粒子系统
  //     particleSystem.rotation.y += deltaTime * 0.5;
      
  //     // 可以添加其他动画效果
  //     const time = Date.now() * 0.001;
  //     particleSystem.position.y = 1 + Math.sin(time) * 0.2;
  //   }
  // });
  
  console.log(`${useCustomModel ? '自定义模型' : '默认'} 永久刀光粒子系统已创建并播放`);
  
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
    `;
  }, 500);
}

runPermanentSwordTrailExample()