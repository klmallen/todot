import * as THREE from 'three';
import Engine from '../core/Engine';
import { Scene } from '../core/Scene';
import { Node3d } from '../core/Node3d';
import { CameraNode3D } from '../core/CameraNode3D';
import { ModelLoader3D } from '../core/ModelLoader3D';
import { createPhysicsEngine, PhysicsFactory, CannonColliderType } from '../physics';
import { InputNode } from '../input/InputNode';

/**
 * 物理模型示例
 * 展示如何为模型添加物理能力并正确显示碰撞体
 */
export async function runPhysicsModelExample(canvas: HTMLCanvasElement): Promise<Engine> {
  // 创建物理引擎
  const physics = createPhysicsEngine('cannon');

  // 创建引擎实例
  const engine = await new Engine(canvas, physics).init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: false
  });

  // 创建场景 - 使用唯一的场景名称，包含时间戳避免冲突
  const sceneName = `物理模型示例_${Date.now()}`;
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
  const ground = PhysicsFactory.createPhysicsPlane('地面', 20, 20, {
    mass: 0,
    friction: 0.3,
    restitution: 0.3
  });
  ground.setRotation(-Math.PI / 2, 0, 0);
  ground.setPosition(0, 0, 0);
  ground.setMaterial(new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8
  }));
  scene.addNode(ground);

  // 创建一些物理盒体
  for (let i = 0; i < 5; i++) {
    const size = 0.5 + Math.random() * 0.5;
    const box = PhysicsFactory.createPhysicsBox(`盒体${i}`, size, size, size, {
      mass: 1,
      friction: 0.5,
      restitution: 0.7
    });

    // 随机位置
    const x = (Math.random() - 0.5) * 8;
    const z = (Math.random() - 0.5) * 8;
    box.setPosition(x, 5 + i * 1.5, z);

    // 随机颜色
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    box.setMaterial(new THREE.MeshStandardMaterial({ color }));

    // 显示碰撞体可视化
    box.showColliderVisual(true);

    scene.addNode(box);
  }

  // 加载模型并添加物理能力
  loadPhysicsModel(scene, 'toy_terror_chogath.glb', new THREE.Vector3(-3, 3, 0));
  loadPhysicsModel(scene, 'toy_terror_chogath.glb', new THREE.Vector3(3, 3, 0), CannonColliderType.SPHERE);

  // 创建输入节点
  const input = new InputNode('输入控制器');
  scene.addNode(input);

  // 添加控制脚本
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

/**
 * 加载模型并添加物理能力
 */
function loadPhysicsModel(scene: Scene, modelName: string, position: THREE.Vector3, colliderType: CannonColliderType = CannonColliderType.BOX): void {
  // 加载模型
  const model = new ModelLoader3D(`物理模型_${modelName}`, `../public/models/${modelName}`);
  model.setPosition(position.x, position.y, position.z);

  // 在模型加载完成后添加物理能力
  model.setOnLoaded((_model) => {
    console.log(`模型 ${modelName} 加载完成，添加物理能力`);

    // 缩放模型
    model.setScale(0.05, 0.05, 0.05);

    // 添加物理能力
    const physModel = PhysicsFactory.addPhysicsToModel(model, {
      colliderType: colliderType,
      mass: 10,
      friction: 0.3,
      restitution: 0.2
    });

    // 显示碰撞体可视化
    physModel.showColliderVisual(true);

    // 添加标签
    addLabel(
      colliderType === CannonColliderType.BOX ? '盒体碰撞体' : '球体碰撞体',
      model.position.clone().add(new THREE.Vector3(0, 2, 0)),
      scene
    );
  });

  // 添加到场景
  scene.addNode(model);
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
