import * as THREE from 'three';
import Engine from '../core/Engine';
import { Scene } from '../core/Scene';
import { Node3d } from '../core/Node3d';
import { CameraNode3D } from '../core/CameraNode3D';
import { ModelLoader3D } from '../core/ModelLoader3D';
import { ParticleSystem } from '../core/ParticleSystem/ParticleSystem';
import { ParticleSystemSettings } from '../core/ParticleSystem/ParticleSystemSettings';
import { MinMaxCurve } from '../core/ParticleSystem/Curves/MinMaxCurve';
import { ColorCurve } from '../core/ParticleSystem/Curves/ColorCurve';
import { GradientCurve } from '../core/ParticleSystem/Curves/GradientCurve';

/**
 * 自定义网格粒子示例
 * 展示如何使用自定义网格和模型作为粒子
 */
export async function runCustomMeshParticleExample(): Promise<Engine> {
  // 创建引擎实例
  const engine = await new Engine().init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: true
  });

  // 创建场景 - 使用唯一的场景名称，包含时间戳避免冲突
  const sceneName = `自定义网格粒子示例_${Date.now()}`;
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

  // 创建简单几何体粒子系统
  createSimpleGeometryParticleSystem(scene);

  // 创建模型粒子系统
  // createModelParticleSystem(scene);

  // 启动引擎
  engine.start();

  return engine;
}

/**
 * 创建简单几何体粒子系统
 */
function createSimpleGeometryParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('简单几何体粒子系统');

  // 设置位置
  particleSystem.position.set(-3, 2, 0);

  // 创建自定义网格 - 使用简单几何体
  const customMesh = new THREE.TetrahedronGeometry(0.2, 0); // 四面体

  // 配置粒子系统 - 向外溢出效果
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 3.0), // 生命周期
    startSpeed: new MinMaxCurve(3.0, 5.0),    // 增大速度，使粒子移动更明显
    startSize: new MinMaxCurve(0.5, 0.8),     // 较大的尺寸，使粒子更明显
    startRotation: new MinMaxCurve(0, Math.PI * 2), // 随机旋转
    startColor: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0), // 纯白色
      new THREE.Color(1.0, 1.0, 1.0)  // 纯白色
    ),
    emission: {
      rateOverTime: 15 // 发射率
    },
    shape: {
      type: 'Sphere', // 球形发射器
      params: {
        sphere: {
          radius: 0.1,     // 小半径
          emitFrom: 'Volume' // 从体积内发射
        }
      },
      randomizeDirection: true,  // 随机化方向
      directionScale: 1.0        // 方向缩放
    },
    // 不使用颜色渐变，保持颜色一致
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0),
      new THREE.Color(1.0, 1.0, 1.0) // 保持纯白色
    ),
    rotationOverLifetime: new MinMaxCurve(-0.5, 0.5), // 轻微旋转
    renderer: {
      renderMode: 'Mesh',
      mesh: customMesh,
      blending: true,
      blendMode: THREE.AdditiveBlending // 加法混合
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 设置自定义网格 - 这一步很重要
  particleSystem.setCustomMesh(customMesh);

  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统 - 这一步很重要
  particleSystem.play();

  // 添加标签
  addLabel('简单几何体粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);
}

/**
 * 创建模型粒子系统
 */
function createModelParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('模型粒子系统');

  // 设置位置
  particleSystem.position.set(3, 2, 0);

  // 默认使用简单几何体，稍后会被模型替换
  const defaultMesh = new THREE.IcosahedronGeometry(0.1, 0);

  // 配置粒子系统 - 向外溢出效果
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 3.0), // 生命周期
    startSpeed: new MinMaxCurve(3.0, 5.0),    // 增大速度，使粒子移动更明显
    startSize: new MinMaxCurve(0.05, 0.08),   // 较小的尺寸，因为模型可能较大
    startRotation: new MinMaxCurve(0, Math.PI * 2), // 随机旋转
    startColor: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0), // 纯白色
      new THREE.Color(1.0, 1.0, 1.0)  // 纯白色
    ),
    emission: {
      rateOverTime: 10 // 较低的发射率，因为模型可能较复杂
    },
    shape: {
      type: 'Sphere', // 球形发射器
      params: {
        sphere: {
          radius: 0.1,     // 小半径
          emitFrom: 'Volume' // 从体积内发射
        }
      },
      randomizeDirection: true,  // 随机化方向
      directionScale: 1.0        // 方向缩放
    },
    // 不使用颜色渐变，保持颜色一致
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0),
      new THREE.Color(1.0, 1.0, 1.0) // 保持纯白色
    ),
    rotationOverLifetime: new MinMaxCurve(-0.5, 0.5), // 轻微旋转
    renderer: {
      renderMode: 'Mesh',
      mesh: defaultMesh,
      blending: true,
      blendMode: THREE.AdditiveBlending // 加法混合
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 设置默认网格
  particleSystem.setCustomMesh(defaultMesh);

  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 添加标签
  addLabel('模型粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);

  // 使用ModelLoader3D加载模型作为粒子
  const modelLoader = new ModelLoader3D('粒子模型', '../public/models/toy_terror_chogath.glb');

  // 设置模型加载完成后的回调
  modelLoader.setOnLoaded((loadedModel: THREE.Group) => {
    console.log('模型加载成功，正在提取几何体...');

    // 遍历模型查找第一个网格
    let modelGeometry: THREE.BufferGeometry | null = null;

    loadedModel.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && !modelGeometry) {
        // 克隆几何体，避免引用问题
        modelGeometry = child.geometry.clone();
        console.log('找到模型网格:', child.name);

        // 缩放几何体，使其适合作为粒子
        // 这一步很重要，因为模型通常比较大
        const scale = 0.05;
        const matrix = new THREE.Matrix4().makeScale(scale, scale, scale);
        modelGeometry.applyMatrix4(matrix);
      }
    });

    if (modelGeometry) {
      // 设置粒子系统使用这个模型网格
      particleSystem.setCustomMesh(modelGeometry);
      console.log('模型网格已应用到粒子系统');

      // 可以选择不显示原始模型
      modelLoader.getThreeObject().visible = false;
    } else {
      console.warn('无法从模型中提取网格');
    }
  });

  // 将模型加载器添加到场景中，但位置设置在其他地方
  modelLoader.setPosition(0, -100, 0); // 将模型放在视野外，只用于提取几何体
  scene.addNode(modelLoader);
}

/**
 * 添加标签
 */
function addLabel(text: string, position: THREE.Vector3, scene: Scene): void {
  // 创建标签节点
  const label = new Node3d(text);
  label.position.copy(position);

  // 创建HTML元素
  const div = document.createElement('div');
  div.className = 'engine-ui';
  div.style.position = 'absolute';
  div.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  div.style.color = 'white';
  div.style.padding = '5px 10px';
  div.style.borderRadius = '4px';
  div.style.fontSize = '14px';
  div.style.fontFamily = 'Arial, sans-serif';
  div.style.pointerEvents = 'none';
  div.style.transform = 'translate(-50%, -50%)';
  div.textContent = text;

  // 添加到文档
  document.body.appendChild(div);



  // 添加到场景
  scene.addNode(label);
}

runCustomMeshParticleExample()