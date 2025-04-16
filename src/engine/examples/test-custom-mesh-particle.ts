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

/**
 * 测试自定义网格粒子示例
 * 用于调试自定义网格粒子的问题
 */
export async function runTestCustomMeshParticleExample(canvas: HTMLCanvasElement): Promise<Engine> {
  console.log('开始运行测试自定义网格粒子示例');
  
  // 创建引擎实例
  const engine = await new Engine(canvas).init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: false
  });

  // 创建场景 - 使用唯一的场景名称，包含时间戳避免冲突
  const sceneName = `测试自定义网格粒子_${Date.now()}`;
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

  // 创建测试粒子系统
  createTestParticleSystem(scene);

  // 启动引擎
  engine.start();

  return engine;
}

/**
 * 创建测试粒子系统
 */
function createTestParticleSystem(scene: Scene): void {
  console.log('创建测试粒子系统');
  
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('测试粒子系统');
  
  // 设置位置
  particleSystem.position.set(0, 2, 0);
  
  // 创建自定义网格 - 使用立方体
  const boxMesh = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  
  console.log('创建的自定义网格:', boxMesh);
  
  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(3.0, 5.0), // 较长的生命周期
    startSpeed: new MinMaxCurve(1.0, 2.0),    // 较慢的速度
    startSize: new MinMaxCurve(1.0, 1.0),     // 固定大小
    startRotation: new MinMaxCurve(0, 0),     // 无旋转
    startColor: new ColorCurve(
      new THREE.Color(1.0, 0.0, 0.0), // 红色
      new THREE.Color(1.0, 0.0, 0.0)  // 红色
    ),
    emission: {
      rateOverTime: 5 // 较低的发射率，便于观察
    },
    shape: {
      type: 'Sphere',
      params: {
        sphere: {
          radius: 0.1,
          emitFrom: 'Shell' // 从表面发射
        }
      },
      randomizeDirection: true,
      directionScale: 1.0
    },
    // 不使用大小变化
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 1.0 },
      { time: 1.0, value: 1.0 }
    ]),
    // 不使用颜色变化
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 0.0, 0.0),
      new THREE.Color(1.0, 0.0, 0.0)
    ),
    // 不使用旋转
    rotationOverLifetime: new MinMaxCurve(0, 0),
    renderer: {
      renderMode: 'Mesh', // 重要：必须设置为Mesh模式
      mesh: boxMesh,      // 设置自定义网格
      blending: true,
      blendMode: THREE.NormalBlending // 使用普通混合模式
    }
  };
  
  console.log('粒子系统设置:', settings);
  
  // 应用设置
  particleSystem.setSettings(settings);
  
  // 设置自定义网格 - 这一步很重要，确保在设置settings后再次设置
  particleSystem.setCustomMesh(boxMesh);
  
  // 添加到场景
  scene.addNode(particleSystem);
  
  // 播放粒子系统
  particleSystem.play();
  
  console.log('粒子系统已创建并播放');
  
  // 添加调试信息
  const debugInfo = document.createElement('div');
  debugInfo.style.position = 'absolute';
  debugInfo.style.top = '10px';
  debugInfo.style.left = '10px';
  debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  debugInfo.style.color = 'white';
  debugInfo.style.padding = '10px';
  debugInfo.style.fontFamily = 'monospace';
  debugInfo.style.zIndex = '1000';
  debugInfo.textContent = '测试自定义网格粒子系统';
  document.body.appendChild(debugInfo);
  
  // 更新调试信息
  setInterval(() => {
    const count = particleSystem.getParticleCount();
    const renderer = particleSystem.getRenderer().getMesh();
    const rendererType = renderer ? renderer.constructor.name : 'null';
    const rendererCount = renderer && 'count' in renderer ? renderer.count : 'N/A';
    
    debugInfo.innerHTML = `
      <div>测试自定义网格粒子系统</div>
      <div>粒子数量: ${count}</div>
      <div>渲染器类型: ${rendererType}</div>
      <div>渲染器实例数: ${rendererCount}</div>
      <div>渲染模式: ${particleSystem.getSettings().renderer.renderMode}</div>
    `;
  }, 500);
}
