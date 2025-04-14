import * as THREE from 'three';
import Engine from '../core/Engine';
import { Scene } from '../core/Scene';
import { createPhysicsEngine, PhysicsNode, CannonColliderType } from '../physics';

/**
 * 物理引擎示例
 * 展示如何使用CANNON-ES物理引擎
 */
export async function runPhysicsExample() {
  // 创建画布
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  // 创建物理引擎
  const physics = createPhysicsEngine('cannon');
  
  // 创建引擎实例
  const engine = new Engine(canvas, physics);
  
  // 初始化引擎
  await engine.init({
    showHelpers: true,
    addDefaultLights: true
  });
  
  // 创建场景
  const scene = new Scene('PhysicsExample');
  engine.addScene(scene);
  engine.activateScene('PhysicsExample');
  
  // 设置相机位置
  const camera = engine.getCamera();
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);
  
  // 创建地面
  const floor = new PhysicsNode('Floor');
  floor.scale.set(20, 1, 20);
  floor.position.set(0, -2, 0);
  
  // 创建地面材质
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.2
  });
  
  // 创建地面网格
  const floorGeometry = new THREE.BoxGeometry(1, 1, 1);
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.add(floorMesh);
  
  // 设置地面为静态物体
  floor.setMass(0);
  floor.setColliderType(CannonColliderType.BOX);
  floor.setShowCollider(true);
  
  // 添加地面到场景
  scene.add(floor);
  
  // 创建几个可动的箱子
  for (let i = 0; i < 5; i++) {
    createBox(scene, i);
  }
  
  // 创建几个可动的球体
  for (let i = 0; i < 5; i++) {
    createSphere(scene, i);
  }
  
  // 添加掉落按钮
  addDropButton();
  
  // 启动引擎
  engine.start();
  
  return engine;
}

/**
 * 创建物理箱体
 * @param scene 场景
 * @param index 索引
 */
function createBox(scene: Scene, index: number) {
  // 创建物理节点
  const box = new PhysicsNode(`Box${index}`);
  
  // 设置位置和尺寸
  box.position.set(-5 + index * 2.5, 5 + index * 2, 0);
  box.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  
  // 创建箱体材质
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    roughness: 0.7,
    metalness: 0.3
  });
  
  // 创建箱体网格
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  box.add(boxMesh);
  
  // 设置物理属性
  box.setMass(1 + Math.random() * 5);
  box.setColliderType(CannonColliderType.BOX);
  box.setFriction(0.5);
  box.setRestitution(0.3);
  box.setShowCollider(true);
  
  // 添加箱体到场景
  scene.add(box);
  
  return box;
}

/**
 * 创建物理球体
 * @param scene 场景
 * @param index 索引
 */
function createSphere(scene: Scene, index: number) {
  // 创建物理节点
  const sphere = new PhysicsNode(`Sphere${index}`);
  
  // 设置位置
  sphere.position.set(5 - index * 2.5, 10 + index * 2, 3);
  
  // 创建球体材质
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    roughness: 0.3,
    metalness: 0.7
  });
  
  // 创建球体网格
  const radius = 0.5 + Math.random() * 0.5;
  const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
  const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.add(sphereMesh);
  
  // 设置物理属性
  sphere.setMass(1 + Math.random() * 3);
  sphere.setColliderType(CannonColliderType.SPHERE);
  sphere.setFriction(0.1);
  sphere.setRestitution(0.7);
  sphere.setShowCollider(true);
  
  // 添加球体到场景
  scene.add(sphere);
  
  return sphere;
}

/**
 * 添加掉落按钮
 */
function addDropButton() {
  // 创建按钮
  const button = document.createElement('button');
  button.innerText = '掉落新物体';
  button.style.position = 'absolute';
  button.style.bottom = '20px';
  button.style.left = '20px';
  button.style.padding = '10px 20px';
  button.style.fontSize = '16px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  
  // 添加按钮点击事件
  button.addEventListener('click', () => {
    const engine = Engine.getInstance();
    const scene = engine.getScene('PhysicsExample');
    
    if (scene) {
      // 随机创建箱体或球体
      if (Math.random() > 0.5) {
        const index = scene.getAllNodes().filter(node => node.name.startsWith('Box')).length;
        createBox(scene, index);
      } else {
        const index = scene.getAllNodes().filter(node => node.name.startsWith('Sphere')).length;
        createSphere(scene, index);
      }
    }
  });
  
  // 添加按钮到文档
  document.body.appendChild(button);
} 