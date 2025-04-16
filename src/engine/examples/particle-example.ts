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
 * 粒子系统示例
 * 展示如何创建和使用粒子系统
 */
export async function runParticleExample(): Promise<Engine> {
  // 创建引擎实例
  const engine = await new Engine().init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: false
  });

  // 创建场景 - 使用唯一的场景名称，包含时间戳避免冲突
  const sceneName = `粒子示例场景_${Date.now()}`;
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

  // // 创建基础粒子系统
  // createBasicParticleSystem(scene);

  // // 创建火焰粒子系统
  // createFireParticleSystem(scene);

  // // 创建烟雾粒子系统
  // createSmokeParticleSystem(scene);

  // 创建魔法粒子系统
  // createMagicParticleSystem(scene);

  createSwordTrailEffect(scene)

  // // 创建雪花粒子系统
  // createSnowParticleSystem(scene);

  // // 创建自定义网格粒子系统
  // createCustomMeshParticleSystem(scene);

  // 启动引擎
  engine.start();

  return engine;
}

/**
 * 创建基础粒子系统
 */
function createBasicParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('基础粒子系统');

  // 设置位置
  particleSystem.position.set(-8, 1, 0);

  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 4.0),
    startSpeed: new MinMaxCurve(3.0, 5.0),
    startSize: new MinMaxCurve(0.1, 0.3),
    startColor: new ColorCurve(
      new THREE.Color(0.8, 0.8, 1.0),
      new THREE.Color(0.5, 0.5, 1.0)
    ),
    emission: {
      rateOverTime: 20
    },
    shape: {
      type: 'Cone',
      params: {
        cone: {
          angle: 25,
          radius: 0.5,
          length: 1.0,
          emitFrom: 'Base'
        }
      },
      randomizeDirection: true,
      directionScale: 1.0
    },
    renderer: {
      renderMode: 'Billboard',
      blending: true,
      blendMode: THREE.AdditiveBlending
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统 - 这一步很重要
  particleSystem.play();

  // 添加标签
  addLabel('基础粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);
}

/**
 * 创建火焰粒子系统
 */
function createFireParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('火焰粒子系统');

  // 设置位置
  particleSystem.position.set(-4, 0, 0);

  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(0.5, 1.5),
    startSpeed: new MinMaxCurve(3.0, 5.0),
    startSize: new MinMaxCurve(0.5, 1.0),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 0.7, 0.3),
      new THREE.Color(1.0, 0.3, 0.1)
    ),
    emission: {
      rateOverTime: 30
    },
    shape: {
      type: 'Cone',
      params: {
        cone: {
          angle: 15,
          radius: 0.3,
          length: 0.5,
          emitFrom: 'Base'
        }
      },
      randomizeDirection: true,
      directionScale: 1.0
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 0.5 },
      { time: 0.3, value: 1.0 },
      { time: 1.0, value: 0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 0.7, 0.3),
      new THREE.Color(0.7, 0.1, 0.0, 0) // 透明度为0的红色
    ),
    renderer: {
      renderMode: 'Billboard',
      blending: true,
      blendMode: THREE.AdditiveBlending
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 添加标签
  addLabel('火焰粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);
}

/**
 * 创建烟雾粒子系统
 */
function createSmokeParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('烟雾粒子系统');

  // 设置位置
  particleSystem.position.set(0, 0, 0);

  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(3.0, 5.0),
    startSpeed: new MinMaxCurve(2.0, 3.0),
    startSize: new MinMaxCurve(0.5, 1.0),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(0.7, 0.7, 0.7),
      new THREE.Color(0.5, 0.5, 0.5)
    ),
    emission: {
      rateOverTime: 10
    },
    shape: {
      type: 'Circle',
      params: {
        circle: {
          radius: 0.3,
          arc: 360,
          emitFrom: 'Edge'
        }
      },
      randomizeDirection: false,
      directionScale: 1.0
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 0.5 },
      { time: 0.3, value: 1.0 },
      { time: 1.0, value: 2.0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(0.7, 0.7, 0.7, 0.7),
      new THREE.Color(0.5, 0.5, 0.5, 0) // 透明度为0的灰色
    ),
    rotationOverLifetime: new MinMaxCurve(-0.1, 0.1),
    useGravity: false,
    renderer: {
      renderMode: 'Billboard',
      blending: true,
      blendMode: THREE.NormalBlending
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 添加标签
  addLabel('烟雾粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);
}

/**
 * 创建魔法粒子系统
 */
function createMagicParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('魔法粒子系统');
  const BoxMesh = new THREE.BoxGeometry(10, 10, 10)
  // 设置位置
  particleSystem.position.set(4, 1, 0);

  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(1.0, 2.0),
    startSpeed: new MinMaxCurve(2.0, 3.0),
    startSize: new MinMaxCurve(0.1, 0.2),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(0.5, 0.0, 1.0),
      new THREE.Color(0.0, 0.5, 1.0)
    ),
    emission: {
      rateOverTime: 50
    },
    shape: {
      type: 'Sphere',
      params: {
        sphere: {
          radius: 0.5,
          emitFrom: 'Shell'
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
      new THREE.Color(0.5, 0.0, 1.0),
      new THREE.Color(0.0, 0.5, 1.0,) // 透明度为0的蓝色
    ),
    renderer: {
      renderMode: 'Mesh',
      mesh: BoxMesh,
      material: new THREE.MeshBasicMaterial({ color: new THREE.Color('red') }),
      blending: true,
      blendMode: THREE.AdditiveBlending
    }
  };
  particleSystem.setCustomMesh(BoxMesh)
  // 应用设置
  particleSystem.setSettings(settings);
  // particleSystem.setCustomMesh(BoxMesh)
  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 添加标签
  addLabel('魔法粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);
}

function createSwordTrailEffect(scene) {
// 创建刀光粒子系统
const particleSystem = new ParticleSystem('永久刀光');
  
// 设置位置
particleSystem.position.set(0, 1, 0);
//平着
particleSystem.rotation.set(Math.PI / 2, 0, 0);

// 创建刀光网格 - 使用平面几何体
const trailMesh = new THREE.PlaneGeometry(2, 0.5);

// 创建刀光材质
const trailMaterial = new THREE.MeshBasicMaterial({
  map: createGradientTexture(),
  transparent: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending
});

// 配置粒子系统为永久模式
const settings = {
  loop: true,
  startLifetime: new MinMaxCurve(3600, 3600),  // 1小时生命周期
  startSpeed: new MinMaxCurve(0, 0),
  startSize: new MinMaxCurve(1.0, 1.0),
  startRotation: new MinMaxCurve(0, 0),
  startColor: new ColorCurve(
    new THREE.Color(1.0, 0.5, 0.2),
    new THREE.Color(1.0, 0.5, 0.2)
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
    new THREE.Color(1.0, 0.5, 0.2),
    new THREE.Color(1.0, 0.5, 0.2)
  ),
  // 持续旋转
  rotationOverLifetime: new MinMaxCurve(0.5, 0.5),
  renderer: {
    renderMode: 'Mesh',
    mesh: trailMesh,
    material: trailMaterial,
    blending: true,
    blendMode: THREE.AdditiveBlending
  }
};

// 应用设置
particleSystem.setSettings(settings);

// 设置自定义网格和材质
particleSystem.setCustomMesh(trailMesh);
particleSystem.setCustomMaterial(trailMaterial);

// 添加到场景
scene.addNode(particleSystem);

// 播放粒子系统
particleSystem.play();

return particleSystem;
}

// 创建渐变纹理
function createGradientTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  
  const ctx = canvas.getContext('2d');
  
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
 * 创建雪花粒子系统
 */
function createSnowParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('雪花粒子系统');

  // 设置位置
  particleSystem.position.set(8, 5, 0);

  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(5.0, 8.0),
    startSpeed: new MinMaxCurve(2.0, 3.0),
    startSize: new MinMaxCurve(0.05, 0.15),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0),
      new THREE.Color(0.9, 0.9, 1.0)
    ),
    emission: {
      rateOverTime: 30
    },
    shape: {
      type: 'Box',
      params: {
        box: {
          width: 10,
          height: 0.1,
          depth: 10,
          emitFrom: 'Volume'
        }
      },
      randomizeDirection: false,
      directionScale: 0.1
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 1.0 },
      { time: 1.0, value: 0.8 }
    ]),
    rotationOverLifetime: new MinMaxCurve(-0.5, 0.5),
    useGravity: true,
    gravityModifier: 0.1,
    renderer: {
      renderMode: 'Billboard',
      blending: true,
      blendMode: THREE.NormalBlending
    }
  };


  // 应用设置
  particleSystem.setSettings(settings);


  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 添加标签
  addLabel('雪花粒子', particleSystem.position.clone().add(new THREE.Vector3(0, -6, 0)), scene);
}

/**
 * 创建自定义网格粒子系统
 */
function createCustomMeshParticleSystem(scene: Scene): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('自定义模型粒子系统');

  // 设置位置
  particleSystem.position.set(0, 3, 4);

  // 默认使用简单几何体，稍后会被模型替换
  const defaultMesh = new THREE.BoxGeometry(0.1, 0.1, 0.1, 0);

  // 配置粒子系统 - 向外溢出效果
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 3.0), // 生命周期缩短，使效果更动态
    startSpeed: new MinMaxCurve(3.0, 5.0),    // 增大速度，使粒子向外溢出更快
    startSize: new MinMaxCurve(0.2, 0.3),      // 保持粒子大小适中
    startRotation: new MinMaxCurve(0, Math.PI * 2), // 随机旋转
    startColor: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0), // 使用纯白色，不变化颜色
      new THREE.Color(1.0, 1.0, 1.0)  // 使用纯白色，不变化颜色
    ),
    emission: {
      rateOverTime: 20 // 增加发射率，使效果更密集
    },
    shape: {
      type: 'Sphere', // 使用球形发射器，从中心向外溢出
      params: {
        sphere: {
          radius: 0.1,     // 小半径，使粒子从中心发出
          emitFrom: 'Volume' // 从体积内发射，而不仅仅是表面
        }
      },
      randomizeDirection: true,  // 随机化方向
      directionScale: 1.0        // 保持方向缩放为1
    },
    // 不使用大小随生命周期变化，保持大小一致
    // 不使用颜色随生命周期变化，保持颜色一致
    // 只在生命周期结束时渐隐
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0),
      new THREE.Color(1.0, 1.0, 1.0) // 保持颜色一致，不变化
    ),
    rotationOverLifetime: new MinMaxCurve(-0.5, 0.5), // 轻微旋转
    renderer: {
      renderMode: 'Mesh',
      mesh: defaultMesh,
      blending: true,
      blendMode: THREE.AdditiveBlending // 使用加法混合使粒子看起来更亮
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 设置默认网格
  // particleSystem.setCustomMesh(defaultMesh);

  // 添加到场景
  scene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 添加标签
  addLabel('模型粒子效果', particleSystem.position.clone().add(new THREE.Vector3(0, -1, 0)), scene);

  // // 使用ModelLoader3D加载模型作为粒子
  // const modelLoader = new ModelLoader3D('粒子模型', '../public/models/toy_terror_chogath.glb');

  // // 设置模型加载完成后的回调
  // modelLoader.setOnLoaded((loadedModel: THREE.Group) => {
  //   console.log('模型加载成功，正在提取几何体...');

  //   // 遍历模型查找第一个网格
  //   let modelGeometry: THREE.BufferGeometry | null = null;

  //   loadedModel.traverse((child: THREE.Object3D) => {
  //     if (child instanceof THREE.Mesh && !modelGeometry) {
  //       modelGeometry = child.geometry;
  //       console.log('找到模型网格:', child.name);
  //     }
  //   });

  //   if (modelGeometry) {
  //     // 设置粒子系统使用这个模型网格
  //     // particleSystem.setCustomMesh(modelGeometry);
  //     // console.log('模型网格已应用到粒子系统');

  //     // // 可以选择不显示原始模型
  //     // modelLoader.getThreeObject().visible = true;
  //   } else {
  //     console.warn('无法从模型中提取网格');
  //   }
  // });

  // // 将模型加载器添加到场景中，但位置设置在其他地方
  // modelLoader.setPosition(0, 4, 0); // 将模型放在视野外，只用于提取几何体
  // scene.addNode(modelLoader);
}

/**
 * 添加标签
 */
function addLabel(text: string, position: THREE.Vector3, scene: Scene): void {
  // 创建标签节点
  const label = new Node3d(`${text}标签`);
  label.position.copy(position);

  // 创建文本精灵
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;

  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);

    label.getThreeObject().add(sprite);
    scene.addNode(label);
  }
}

runParticleExample()