# 粒子系统示例

本页面展示了使用 Todot Engine 创建各种粒子效果的示例。

## 基础粒子系统

这个示例展示了一个简单的粒子系统，从锥形发射器发射蓝色粒子。

```javascript
import Engine from 'todot-engine/core/Engine';
import { Scene } from 'todot-engine/core/Scene';
import { CameraNode3D } from 'todot-engine/core/CameraNode3D';
import { ParticleSystem } from 'todot-engine/core/ParticleSystem/ParticleSystem';
import { MinMaxCurve } from 'todot-engine/core/ParticleSystem/Curves/MinMaxCurve';
import { ColorCurve } from 'todot-engine/core/ParticleSystem/Curves/ColorCurve';
import { GradientCurve } from 'todot-engine/core/ParticleSystem/Curves/GradientCurve';
import * as THREE from 'three';

export async function runBasicParticleExample(canvas) {
  // 创建引擎实例
  const engine = await new Engine(canvas).init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true
  });

  // 创建场景
  const scene = new Scene('基础粒子示例');
  engine.addScene(scene);
  engine.activateScene('基础粒子示例');

  // 创建相机
  const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
    position: new THREE.Vector3(0, 5, 10),
    rotation: new THREE.Euler(-0.2, 0, 0)
  });
  scene.addNode(camera);

  // 创建粒子系统
  const particleSystem = new ParticleSystem('基础粒子系统');
  particleSystem.position.set(0, 1, 0);

  // 配置粒子系统
  const settings = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 4.0),
    startSpeed: new MinMaxCurve(1.0, 3.0),
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
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 1.0 },
      { time: 1.0, value: 0.0 }
    ]),
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

  // 启动引擎
  engine.start();

  return engine;
}
```

## 火焰效果

这个示例创建了一个逼真的火焰效果，使用锥形发射器和颜色渐变。

```javascript
function createFireParticleSystem(scene) {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('火焰粒子系统');
  
  // 设置位置
  particleSystem.position.set(-4, 1, 0);
  
  // 配置粒子系统
  const settings = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(0.6, 1.2),
    startSpeed: new MinMaxCurve(1.0, 2.0),
    startSize: new MinMaxCurve(0.5, 1.0),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 0.7, 0.3),
      new THREE.Color(1.0, 0.3, 0.1)
    ),
    emission: {
      rateOverTime: 40
    },
    shape: {
      type: 'Cone',
      params: {
        cone: {
          angle: 15,
          radius: 0.2,
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
      { time: 1.0, value: 0.0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 0.7, 0.3),
      new THREE.Color(0.7, 0.1, 0.0)
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
}
```

## 烟雾效果

这个示例创建了一个烟雾效果，使用锥形发射器和透明度渐变。

```javascript
function createSmokeParticleSystem(scene) {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('烟雾粒子系统');
  
  // 设置位置
  particleSystem.position.set(0, 1, 0);
  
  // 配置粒子系统
  const settings = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(3.0, 5.0),
    startSpeed: new MinMaxCurve(0.5, 1.0),
    startSize: new MinMaxCurve(1.0, 2.0),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(0.7, 0.7, 0.7),
      new THREE.Color(0.5, 0.5, 0.5)
    ),
    emission: {
      rateOverTime: 10
    },
    shape: {
      type: 'Cone',
      params: {
        cone: {
          angle: 15,
          radius: 0.2,
          length: 0.1,
          emitFrom: 'Base'
        }
      },
      randomizeDirection: true,
      directionScale: 1.0
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 0.5 },
      { time: 0.5, value: 1.5 },
      { time: 1.0, value: 2.0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(0.7, 0.7, 0.7),
      new THREE.Color(0.5, 0.5, 0.5, 0)
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
}
```

## 魔法效果

这个示例创建了一个魔法效果，使用球形发射器和颜色渐变。

```javascript
function createMagicParticleSystem(scene) {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('魔法粒子系统');
  
  // 设置位置
  particleSystem.position.set(4, 1, 0);
  
  // 配置粒子系统
  const settings = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(1.0, 2.0),
    startSpeed: new MinMaxCurve(0.5, 1.5),
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
      new THREE.Color(0.0, 0.5, 1.0, 0)
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
}
```

## 雪花效果

这个示例创建了一个雪花效果，使用盒形发射器和重力影响。

```javascript
function createSnowParticleSystem(scene) {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('雪花粒子系统');
  
  // 设置位置
  particleSystem.position.set(-8, 10, 0);
  
  // 配置粒子系统
  const settings = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(10.0, 15.0),
    startSpeed: new MinMaxCurve(0.5, 1.5),
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
      }
    },
    rotationOverLifetime: new MinMaxCurve(-0.1, 0.1),
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
}
```

## 自定义网格粒子

这个示例展示了如何使用自定义网格作为粒子。

```javascript
function createCustomMeshParticleSystem(scene) {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('自定义网格粒子系统');
  
  // 设置位置
  particleSystem.position.set(0, 1, 4);
  
  // 创建自定义网格
  const customMesh = new THREE.TorusKnotGeometry(0.2, 0.05, 32, 8);
  
  // 配置粒子系统
  const settings = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(3.0, 5.0),
    startSpeed: new MinMaxCurve(0.5, 1.0),
    startSize: new MinMaxCurve(0.3, 0.5),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 0.5, 0.0),
      new THREE.Color(0.0, 1.0, 0.5)
    ),
    emission: {
      rateOverTime: 5
    },
    shape: {
      type: 'Sphere',
      params: {
        sphere: {
          radius: 1.0,
          emitFrom: 'Shell'
        }
      },
      randomizeDirection: true,
      directionScale: 0.5
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 0.5 },
      { time: 0.5, value: 1.0 },
      { time: 1.0, value: 0.5 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 0.5, 0.0),
      new THREE.Color(0.0, 1.0, 0.5)
    ),
    rotationOverLifetime: new MinMaxCurve(-1.0, 1.0),
    renderer: {
      renderMode: 'Mesh',
      mesh: customMesh,
      blending: true,
      blendMode: THREE.AdditiveBlending
    }
  };
  
  // 应用设置
  particleSystem.setSettings(settings);
  
  // 设置自定义网格
  particleSystem.setCustomMesh(customMesh);
  
  // 添加到场景
  scene.addNode(particleSystem);
  
  // 播放粒子系统
  particleSystem.play();
}
```

## 使用 3D 模型作为粒子

这个示例展示了如何使用加载的 3D 模型作为粒子。

```javascript
function createModelParticleSystem(scene) {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('模型粒子系统');
  particleSystem.position.set(0, 1, 4);
  
  // 默认使用简单几何体，稍后会被模型替换
  const defaultMesh = new THREE.IcosahedronGeometry(0.1, 0);
  
  // 配置粒子系统 - 向外溢出效果
  const settings = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 3.0),
    startSpeed: new MinMaxCurve(1.0, 2.0),
    startSize: new MinMaxCurve(0.2, 0.3),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0),
      new THREE.Color(1.0, 1.0, 1.0)
    ),
    emission: {
      rateOverTime: 20
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
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0),
      new THREE.Color(1.0, 1.0, 1.0)
    ),
    rotationOverLifetime: new MinMaxCurve(-0.5, 0.5),
    renderer: {
      renderMode: 'Mesh',
      mesh: defaultMesh,
      blending: true,
      blendMode: THREE.AdditiveBlending
    }
  };
  
  // 应用设置
  particleSystem.setSettings(settings);
  particleSystem.setCustomMesh(defaultMesh);
  scene.addNode(particleSystem);
  
  // 使用ModelLoader3D加载模型作为粒子
  const modelLoader = new ModelLoader3D('粒子模型', 'models/toy_terror_chogath.glb');
  
  // 设置模型加载完成后的回调
  modelLoader.setOnLoaded((loadedModel) => {
    // 遍历模型查找第一个网格
    let modelGeometry = null;
    
    loadedModel.traverse((child) => {
      if (child instanceof THREE.Mesh && !modelGeometry) {
        modelGeometry = child.geometry;
      }
    });
    
    if (modelGeometry) {
      // 设置粒子系统使用这个模型网格
      particleSystem.setCustomMesh(modelGeometry);
      
      // 隐藏原始模型
      modelLoader.getThreeObject().visible = false;
    }
  });
  
  // 将模型加载器添加到场景，但位置设置在视野外
  modelLoader.setPosition(0, -100, 0);
  scene.addNode(modelLoader);
}
```

## 爆炸效果

这个示例创建了一个爆炸效果，使用球形发射器和爆发发射。

```javascript
function createExplosionParticleSystem(scene, position) {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('爆炸效果');
  
  // 设置位置
  particleSystem.position.copy(position);
  
  // 配置粒子系统
  const settings = {
    duration: 2.0,
    loop: false,
    startLifetime: new MinMaxCurve(0.5, 1.5),
    startSpeed: new MinMaxCurve(3.0, 8.0),
    startSize: new MinMaxCurve(0.2, 0.8),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 0.8, 0.3),
      new THREE.Color(1.0, 0.3, 0.1)
    ),
    emission: {
      rateOverTime: 0, // 不使用连续发射
      bursts: [
        { time: 0, count: 100, cycles: 1, interval: 0.01 } // 在开始时爆发100个粒子
      ]
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
      { time: 0.7, value: 0.7 },
      { time: 1.0, value: 0.0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 0.8, 0.3),
      new THREE.Color(0.7, 0.1, 0.0, 0)
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
  
  // 设置完成回调，在粒子效果结束后移除节点
  particleSystem.onComplete(() => {
    scene.removeNode(particleSystem);
  });
}
```

## 完整示例

下面是一个完整的示例，展示了如何在一个场景中组合多种粒子效果：

```javascript
import Engine from 'todot-engine/core/Engine';
import { Scene } from 'todot-engine/core/Scene';
import { CameraNode3D } from 'todot-engine/core/CameraNode3D';
import { Node3d } from 'todot-engine/core/Node3d';
import { ParticleSystem } from 'todot-engine/core/ParticleSystem/ParticleSystem';
import { MinMaxCurve } from 'todot-engine/core/ParticleSystem/Curves/MinMaxCurve';
import { ColorCurve } from 'todot-engine/core/ParticleSystem/Curves/ColorCurve';
import { GradientCurve } from 'todot-engine/core/ParticleSystem/Curves/GradientCurve';
import { InputNode } from 'todot-engine/input/InputNode';
import * as THREE from 'three';

export async function runParticleExample(canvas) {
  // 创建引擎实例
  const engine = await new Engine(canvas).init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true
  });

  // 创建场景
  const scene = new Scene('粒子示例场景');
  engine.addScene(scene);
  engine.activateScene('粒子示例场景');

  // 创建相机
  const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
    position: new THREE.Vector3(0, 5, 15),
    rotation: new THREE.Euler(-0.2, 0, 0)
  });
  scene.addNode(camera);

  // 创建地面
  const ground = new Node3d('地面');
  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  ground.getThreeObject().add(groundMesh);
  scene.addNode(ground);

  // 创建火焰效果
  createFireParticleSystem(scene);
  
  // 创建烟雾效果
  createSmokeParticleSystem(scene);
  
  // 创建魔法效果
  createMagicParticleSystem(scene);
  
  // 创建雪花效果
  createSnowParticleSystem(scene);
  
  // 创建自定义网格粒子效果
  createCustomMeshParticleSystem(scene);

  // 创建输入节点
  const input = new InputNode('输入控制器');
  scene.addNode(input);

  // 添加爆炸效果触发器
  input.on('action:pressed', () => {
    // 在随机位置创建爆炸效果
    const x = (Math.random() - 0.5) * 10;
    const y = 1 + Math.random() * 3;
    const z = (Math.random() - 0.5) * 10;
    
    createExplosionParticleSystem(scene, new THREE.Vector3(x, y, z));
  });

  // 添加相机控制脚本
  camera.addScript({
    update: function(deltaTime) {
      // 旋转相机
      const rotationSpeed = 0.1;
      camera.position.x = Math.sin(Date.now() * 0.0001 * rotationSpeed) * 15;
      camera.position.z = Math.cos(Date.now() * 0.0001 * rotationSpeed) * 15;
      camera.lookAt(new THREE.Vector3(0, 2, 0));
    }
  });

  // 启动引擎
  engine.start();

  return engine;
}

// 这里包含前面定义的所有粒子系统创建函数
// createFireParticleSystem, createSmokeParticleSystem, etc.
```

## 交互式示例

<div class="example-container">
  <iframe src="/examples/particles-demo.html" width="100%" height="500px" frameborder="0"></iframe>
</div>

## 总结

Todot Engine 的粒子系统提供了强大而灵活的工具，可以创建各种视觉效果。通过组合不同的设置，你可以创建从简单的火花到复杂的魔法效果的各种效果。

这些示例展示了粒子系统的基本用法，但你可以通过调整参数和组合不同的效果来创建更复杂的视觉效果。尝试修改这些示例，创建你自己的独特效果！
