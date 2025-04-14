import * as THREE from 'three';
import Engine from '../core/Engine';
import { Scene } from '../core/Scene';
import { Node3d } from '../core/Node3d';
import { MeshInstance3D } from '../core/MeshInstance3D';
import { ModelLoader3D } from '../core/ModelLoader3D';
import { ParticleSystem } from '../core/ParticleSystem/ParticleSystem';
import { ColorCurve } from '../core/ParticleSystem/Curves/ColorCurve';
import { GradientCurve } from '../core/ParticleSystem/Curves/GradientCurve';
import { MinMaxCurve } from '../core/ParticleSystem/Curves/MinMaxCurve';
import {
  createPhysicsEngine,
  PhysicsFactory,
  IPhysicsCapable,
  CannonColliderType
} from '../physics';

/**
 * 运行物理示例
 * @param canvas 渲染目标Canvas
 * @returns Promise<Engine> 引擎实例
 */
export async function runPhysicsExample(canvas: HTMLCanvasElement): Promise<Engine> {
  // 创建物理引擎
  const physics = createPhysicsEngine('cannon', 9.82);

  // 创建引擎实例并初始化
  const engine = await new Engine(canvas, physics).init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: false,
    showBoundingBoxes: true
  });

  // 清理现有场景
  const existingScenes = engine.getAllScenes();
  for (const existingScene of existingScenes) {
    if (existingScene.getName() === '物理示例场景') {
      engine.removeScene('物理示例场景');
      break;
    }
  }

  // 创建场景
  const scene = new Scene('物理示例场景');
  engine.addScene(scene);
  engine.activateScene('物理示例场景');

  // 创建一个地面（使用平面）
  const ground = PhysicsFactory.createPhysicsPlane('地面', 30, 30, {
    mass: 0, // 静态物体
    friction: 0.3,
    restitution: 0.3
  });

  // 旋转平面使其朝上 - 使用X, Y, Z参数代替Euler对象
  ground.setRotation(-Math.PI / 2, 0, 0);
  ground.setPosition(0, 0, 0);

  // 设置地面材质
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('red'),
    roughness: 0.8,
    metalness: 0.2
  });
  ground.setMaterial(groundMaterial);

  // 添加到场景
  scene.addNode(ground);

  // 创建多个物理物体
  // createPhysicsObjects(scene);

  // 创建一个普通的MeshInstance3D，并添加物理能力
  const regularCube = new MeshInstance3D(
    '普通立方体',
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  regularCube.setPosition(0, 15, 0);

  // // 使用PhysicsFactory为普通立方体添加物理能力
  // const physicsCube = PhysicsFactory.addPhysicsToMesh(regularCube, {
  //   mass: 20,
  //   friction: 0.5,
  //   restitution: 0.7
  // });

  // // 添加到场景
  // scene.addNode(physicsCube);

  // // 显示碰撞体可视化
  // physicsCube.showColliderVisual(true);


  // 加载一个模型并添加物理能力
  const model = new ModelLoader3D("玩家模型", '../public/models/toy_terror_chogath.glb');

  model.setPosition(0, 10, 5);
  model.setOnLoaded((_model) => {

     model.setScale(0.01, 0.01, 0.01);
       // 创建一个更大的碰撞体
       const physModel = PhysicsFactory.addPhysicsToModel(model, {
        colliderType: CannonColliderType.BOX,
        mass: 20,
        friction: 0.3,
        restitution: 0.2
      });

      physModel.showColliderVisual(true)
     scene.addNode(model);

  })
  // 添加到场景


  // 创建UI控制面板
  createControlPanel(scene);

  // 启动引擎
  engine.start();

  return engine;
}

/**
 * 创建多个物理物体
 * @param scene 场景
 */
function createPhysicsObjects(scene: Scene): void {
  // 创建一些盒子
  for (let i = 0; i < 5; i++) {
    const size = 0.5 + Math.random() * 1.0;
    const box = PhysicsFactory.createPhysicsBox(
      `盒子 ${i}`,
      new THREE.Vector3(size, size, size),
      {
        mass: 1 + Math.random() * 5,
        friction: 0.3 + Math.random() * 0.5,
        restitution: 0.2 + Math.random() * 0.5
      }
    );

    // 使用3个参数分别设置x, y, z位置
    box.setPosition(
      -5 + Math.random() * 10,
      5 + i * 2,
      -5 + Math.random() * 10
    );

    // 随机颜色
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const material = new THREE.MeshStandardMaterial({ color });
    box.setMaterial(material);

    // 添加到场景
    scene.addNode(box);
  }

  // 创建一些球体
  for (let i = 0; i < 5; i++) {
    const radius = 0.3 + Math.random() * 0.7;
    const sphere = PhysicsFactory.createPhysicsSphere(
      `球体 ${i}`,
      radius,
      {
        mass: 1 + Math.random() * 3,
        friction: 0.1 + Math.random() * 0.3,
        restitution: 0.5 + Math.random() * 0.5
      }
    );

    // 使用3个参数分别设置x, y, z位置
    sphere.setPosition(
      -5 + Math.random() * 10,
      5 + i * 2,
      -5 + Math.random() * 10
    );

    // 随机颜色
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const material = new THREE.MeshStandardMaterial({ color });
    sphere.setMaterial(material);

    // 添加到场景
    scene.addNode(sphere);
  }

  // 创建一些圆柱体
  for (let i = 0; i < 3; i++) {
    const radius = 0.3 + Math.random() * 0.5;
    const height = 1 + Math.random() * 2;
    const cylinder = PhysicsFactory.createPhysicsCylinder(
      `圆柱体 ${i}`,
      radius,
      height,
      {
        mass: 1 + Math.random() * 3,
        friction: 0.2 + Math.random() * 0.4,
        restitution: 0.3 + Math.random() * 0.4
      }
    );

    // 使用3个参数分别设置x, y, z位置
    cylinder.setPosition(
      -5 + Math.random() * 10,
      5 + i * 2,
      -5 + Math.random() * 10
    );

    // 随机角度 - 使用3个参数分别设置x, y, z旋转
    cylinder.setRotation(
      Math.random() * Math.PI * 0.2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 0.2
    );

    // 随机颜色
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const material = new THREE.MeshStandardMaterial({ color });
    cylinder.setMaterial(material);

    // 添加到场景
    scene.addNode(cylinder);
  }
}

/**
 * 创建控制面板
 * @param scene 场景
 */
function createControlPanel(scene: Scene): void {
  // 创建控制面板容器
  const panel = document.createElement('div');
  panel.style.position = 'absolute';
  panel.style.top = '10px';
  panel.style.right = '10px';
  panel.style.padding = '10px';
  panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  panel.style.color = 'white';
  panel.style.borderRadius = '5px';
  panel.style.fontFamily = 'Arial, sans-serif';
  panel.style.zIndex = '1000';

  // 标题
  const title = document.createElement('h3');
  title.textContent = '物理控制面板';
  title.style.margin = '0 0 10px 0';
  panel.appendChild(title);

  // 添加一个创建新盒子的按钮
  const addBoxButton = document.createElement('button');
  addBoxButton.textContent = '添加盒子';
  addBoxButton.style.display = 'block';
  addBoxButton.style.margin = '5px 0';
  addBoxButton.style.padding = '5px 10px';
  addBoxButton.onclick = () => {
    const size = 0.5 + Math.random() * 1.0;
    const box = PhysicsFactory.createPhysicsBox(
      `新盒子`,
      new THREE.Vector3(size, size, size),
      {
        mass: 1 + Math.random() * 5,
        friction: 0.3 + Math.random() * 0.5,
        restitution: 0.2 + Math.random() * 0.5
      }
    );

    // 使用3个参数分别设置x, y, z位置
    box.setPosition(0, 10, 0);

    // 随机颜色
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const material = new THREE.MeshStandardMaterial({ color });
    box.setMaterial(material);

    // 添加到场景
    scene.addNode(box);

    // 显示碰撞体可视化
    box.showColliderVisual(true);
  };
  panel.appendChild(addBoxButton);

  // 添加一个创建新球体的按钮
  const addSphereButton = document.createElement('button');
  addSphereButton.textContent = '添加球体';
  addSphereButton.style.display = 'block';
  addSphereButton.style.margin = '5px 0';
  addSphereButton.style.padding = '5px 10px';
  addSphereButton.onclick = () => {
    const radius = 0.3 + Math.random() * 0.7;
    const sphere = PhysicsFactory.createPhysicsSphere(
      `新球体`,
      radius,
      {
        mass: 1 + Math.random() * 3,
        friction: 0.1 + Math.random() * 0.3,
        restitution: 0.5 + Math.random() * 0.5
      }
    );

    // 使用3个参数分别设置x, y, z位置
    sphere.setPosition(0, 10, 0);

    // 随机颜色
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const material = new THREE.MeshStandardMaterial({ color });
    sphere.setMaterial(material);

    // 添加到场景
    scene.addNode(sphere);

    // 显示碰撞体可视化
    sphere.showColliderVisual(true);
  };
  panel.appendChild(addSphereButton);

  // 添加重力控制滑块
  const gravityLabel = document.createElement('div');
  gravityLabel.textContent = '重力：9.82';
  gravityLabel.style.margin = '10px 0 5px 0';
  panel.appendChild(gravityLabel);

  const gravitySlider = document.createElement('input');
  gravitySlider.type = 'range';
  gravitySlider.min = '0';
  gravitySlider.max = '20';
  gravitySlider.step = '0.1';
  gravitySlider.value = '9.82';
  gravitySlider.style.width = '100%';
  gravitySlider.oninput = () => {
    const gravity = parseFloat(gravitySlider.value);
    gravityLabel.textContent = `重力：${gravity.toFixed(2)}`;

    // 更新物理引擎重力
    const engine = Engine.getInstance();
    if (engine && engine.getPhysics) {
      const physics = engine.getPhysics();
      if (physics) {
        // 假设物理引擎接口有设置重力的方法
        (physics as any).setGravity(new THREE.Vector3(0, -gravity, 0));
      }
    }
  };
  panel.appendChild(gravitySlider);

  // 添加爆炸效果按钮
  const explosionButton = document.createElement('button');
  explosionButton.textContent = '爆炸效果';
  explosionButton.style.display = 'block';
  explosionButton.style.margin = '10px 0';
  explosionButton.style.padding = '5px 10px';
  explosionButton.onclick = () => {
    // 对场景中所有的物理物体施加随机冲量
    const nodes = scene.getAllNodes();
    nodes.forEach(node => {
      // 尝试将节点作为物理节点处理
      try {
        const physicsNode = node as unknown as IPhysicsCapable;
        if (physicsNode.getCollider && physicsNode.getCollider() &&
            !physicsNode.isKinematic() && physicsNode.getMass() > 0) {
          // 从中心点向外施加冲量
          const nodePos = new THREE.Vector3();
          // 获取节点位置
          if (node.getThreeObject()) {
            node.getThreeObject().getWorldPosition(nodePos);
          }
          const directionToNode = new THREE.Vector3().subVectors(nodePos, new THREE.Vector3(0, 0, 0)).normalize();
          const impulseStrength = 10 + Math.random() * 15;
          const impulse = directionToNode.multiplyScalar(impulseStrength);

          // 应用冲量
          physicsNode.applyImpulse(impulse);

          // 在物体位置创建爆炸粒子效果
          createExplosionEffect(scene, nodePos);
        }
      } catch (e) {
        // 忽略不是物理节点的对象
      }
    });
  };
  panel.appendChild(explosionButton);

  // 添加重置场景按钮
  const resetButton = document.createElement('button');
  resetButton.textContent = '重置场景';
  resetButton.style.display = 'block';
  resetButton.style.margin = '5px 0';
  resetButton.style.padding = '5px 10px';
  resetButton.onclick = () => {
    // 移除所有的物理物体，保留地面和一些系统节点
    const nodes = scene.getAllNodes();
    const nodesToRemove = nodes.filter(node => {
      return node.getName() !== '地面' &&
             !node.getName().includes('Camera') &&
             !node.getName().includes('Light');
    });

    // 从场景中移除节点
    nodesToRemove.forEach(node => {
      scene.removeNode(node);
    });

    // 重新创建物理物体
    // createPhysicsObjects(scene);
  };
  panel.appendChild(resetButton);

  // 添加面板到文档
  document.body.appendChild(panel);
}

/**
 * 展示碰撞体可视化效果
 * @param scene 场景
 * @param show 是否显示
 */
export function showColliderVisuals(scene: Scene, show: boolean): void {
  const nodes = scene.getAllNodes();
  nodes.forEach(node => {
    try {
      const physicsNode = node as unknown as IPhysicsCapable;
      if (physicsNode.showColliderVisual) {
        physicsNode.showColliderVisual(show);
      }
    } catch (e) {
      // 忽略不是物理节点的对象
    }
  });
}

/**
 * 创建爆炸粒子效果
 * @param scene 场景
 * @param position 爆炸位置
 */
function createExplosionEffect(scene: Scene, position: THREE.Vector3): void {
  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('爆炸效果');

  // 设置位置
  particleSystem.position.copy(position);

  // 配置粒子系统
  const settings = {
    duration: 1.0, // 短暂的爆炸效果
    loop: false, // 不循环
    startLifetime: new MinMaxCurve(0.5, 1.0),
    startSpeed: new MinMaxCurve(3.0, 8.0),
    startSize: new MinMaxCurve(0.2, 0.5),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 0.7, 0.3),
      new THREE.Color(1.0, 0.3, 0.1)
    ),
    emission: {
      rateOverTime: 0, // 不持续发射
      bursts: [{ time: 0, count: 50, cycles: 1, interval: 0.01 }] // 爆发式发射
    },
    shape: {
      type: 'Sphere',
      params: {
        sphere: {
          radius: 0.1,
          emitFrom: 'Shell'
        }
      },
      randomizeDirection: true,
      directionScale: 1.0
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 1.0 },
      { time: 0.7, value: 0.5 },
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

  // 设置完成回调，在粒子效果结束后移除节点
  particleSystem.onComplete(() => {
    scene.removeNode(particleSystem);
  });
}