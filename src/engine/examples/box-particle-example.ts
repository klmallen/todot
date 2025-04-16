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
 * 盒子粒子示例
 * 展示如何使用立方体作为粒子
 */
export async function runBoxParticleExample(canvas: HTMLCanvasElement): Promise<Engine> {
  // 创建引擎实例
  const engine = await new Engine(canvas).init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: false
  });

  // 创建场景 - 使用唯一的场景名称，包含时间戳避免冲突
  const sceneName = `盒子粒子示例_${Date.now()}`;
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

  // 创建盒子粒子系统
  createBoxParticleSystem(scene);

  // 创建球体粒子系统
  createSphereParticleSystem(scene);

  // 创建圆环粒子系统
  createTorusParticleSystem(scene);

  // 启动引擎
  engine.start();

  return engine;
}

/**
 * 创建盒子粒子系统
 */
function createBoxParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('盒子粒子系统');

  // 设置位置
  particleSystem.position.set(-3, 2, 0);

  // 创建自定义网格 - 使用立方体
  const boxMesh = new THREE.BoxGeometry(0.3, 0.3, 0.3);

  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 3.0),
    startSpeed: new MinMaxCurve(3.0, 5.0),
    startSize: new MinMaxCurve(0.5, 0.8),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 0.5, 0.0), // 橙色
      new THREE.Color(1.0, 0.0, 0.0)  // 红色
    ),
    emission: {
      rateOverTime: 15
    },
    shape: {
      type: 'Sphere',
      params: {
        sphere: {
          radius: 0.1,
          emitFrom: 'Volume'
        }
      },
      randomizeDirection: true,
      directionScale: 1.0
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 1.0 },
      { time: 1.0, value: 0.0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 0.5, 0.0),
      new THREE.Color(1.0, 0.0, 0.0)
    ),
    rotationOverLifetime: new MinMaxCurve(-1.0, 1.0),
    renderer: {
      renderMode: 'Mesh', // 重要：必须设置为Mesh模式
      mesh: boxMesh,      // 设置自定义网格
      blending: true,
      blendMode: THREE.AdditiveBlending
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 设置自定义网格 - 这一步很重要，确保在设置settings后再次设置
  particleSystem.setCustomMesh(boxMesh);

  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 添加标签
  addLabel('盒子粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);
}

/**
 * 创建球体粒子系统
 */
function createSphereParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('球体粒子系统');

  // 设置位置
  particleSystem.position.set(0, 2, 0);

  // 创建自定义网格 - 使用球体
  const sphereMesh = new THREE.SphereGeometry(0.2, 16, 16);

  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 3.0),
    startSpeed: new MinMaxCurve(3.0, 5.0),
    startSize: new MinMaxCurve(0.5, 0.8),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(0.0, 0.5, 1.0), // 蓝色
      new THREE.Color(0.0, 0.0, 1.0)  // 深蓝色
    ),
    emission: {
      rateOverTime: 15
    },
    shape: {
      type: 'Sphere',
      params: {
        sphere: {
          radius: 0.1,
          emitFrom: 'Volume'
        }
      },
      randomizeDirection: true,
      directionScale: 1.0
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 1.0 },
      { time: 1.0, value: 0.0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(0.0, 0.5, 1.0),
      new THREE.Color(0.0, 0.0, 1.0)
    ),
    rotationOverLifetime: new MinMaxCurve(-1.0, 1.0),
    renderer: {
      renderMode: 'Mesh', // 重要：必须设置为Mesh模式
      mesh: sphereMesh,   // 设置自定义网格
      blending: true,
      blendMode: THREE.AdditiveBlending
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 设置自定义网格 - 这一步很重要，确保在设置settings后再次设置
  particleSystem.setCustomMesh(sphereMesh);

  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 添加标签
  addLabel('球体粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);
}

/**
 * 创建圆环粒子系统
 */
function createTorusParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('圆环粒子系统');

  // 设置位置
  particleSystem.position.set(3, 2, 0);

  // 创建自定义网格 - 使用圆环
  const torusMesh = new THREE.TorusGeometry(0.2, 0.1, 16, 32);

  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 3.0),
    startSpeed: new MinMaxCurve(3.0, 5.0),
    startSize: new MinMaxCurve(0.5, 0.8),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(0.0, 1.0, 0.5), // 绿色
      new THREE.Color(0.0, 1.0, 0.0)  // 深绿色
    ),
    emission: {
      rateOverTime: 15
    },
    shape: {
      type: 'Sphere',
      params: {
        sphere: {
          radius: 0.1,
          emitFrom: 'Volume'
        }
      },
      randomizeDirection: true,
      directionScale: 1.0
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 1.0 },
      { time: 1.0, value: 0.0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(0.0, 1.0, 0.5),
      new THREE.Color(0.0, 1.0, 0.0)
    ),
    rotationOverLifetime: new MinMaxCurve(-1.0, 1.0),
    renderer: {
      renderMode: 'Mesh', // 重要：必须设置为Mesh模式
      mesh: torusMesh,    // 设置自定义网格
      blending: true,
      blendMode: THREE.AdditiveBlending
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 设置自定义网格 - 这一步很重要，确保在设置settings后再次设置
  particleSystem.setCustomMesh(torusMesh);

  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 添加标签
  addLabel('圆环粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);
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

  // 更新位置
  label.addScript({
    update: function() {
      // 将3D位置转换为屏幕位置
      const camera = scene.getCamera().getThreeCamera();
      const vector = new THREE.Vector3();

      // 获取世界位置
      vector.copy(label.position);

      // 转换为屏幕坐标
      vector.project(camera);

      // 转换为CSS坐标
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

      // 更新标签位置
      div.style.left = x + 'px';
      div.style.top = y + 'px';

      // 根据深度调整透明度
      const depth = vector.z;
      if (depth > 1 || depth < -1) {
        div.style.opacity = '0';
      } else {
        div.style.opacity = '1';
      }
    },

    // 清理
    onDestroy: function() {
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      }
    }
  });

  // 添加到场景
  scene.addNode(label);
}
