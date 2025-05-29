import Engine from './engine/core/Engine';
import * as THREE from 'three';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { ModelLoader3D } from './engine/core/ModelLoader3D';
import { MeshInstance3D } from './engine/core/MeshInstance3D';
import { PhysicsNode } from './engine/physics/PhysicsNode';
import { CannonColliderType } from './engine/physics/CannonCollider';
import { InputHandlerNode3D } from './engine/core/InputHandlerNode3D';
import KeyboardController from './scriptDemo/KeyboardController';

/**
 * 测试InputHandlerNode3D和KeyboardController的主程序
 */
async function main() {
  // 创建引擎
  const engine = await new Engine().init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: false  // 使用WebGL
  });

  // 创建主场景
  const mainScene = new Scene("输入处理测试场景");
  engine.addScene(mainScene);

  // 添加环境光和方向光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  mainScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  mainScene.add(directionalLight);

  // 创建地板（带物理属性）
  const floorGeometry = new THREE.PlaneGeometry(20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.2,
    side: THREE.DoubleSide
  });
  
  // 使用PhysicsNode来创建地板
  const floor = new PhysicsNode("物理地板");
  const floorMesh = new MeshInstance3D("地板网格", floorGeometry, floorMaterial);
  floor.addChild(floorMesh);
  floor.setRotation(Math.PI / -2, 0, 0); // 旋转90度使其水平
  floor.setPosition(0, -1, 0);
  
  // 设置为静态刚体（质量为0）
  floor.setColliderType(CannonColliderType.BOX);
  floor.setMass(0);
  
  mainScene.addNode(floor);

  // 创建一个带有物理特性的盒子
  const boxNode = new PhysicsNode("物理盒子");
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const boxMesh = new MeshInstance3D("盒子网格", boxGeometry, boxMaterial);
  boxNode.addChild(boxMesh);
  boxNode.setPosition(0, 3, 0);
  
  // 设置盒子的物理属性
  boxNode.setColliderType(CannonColliderType.BOX);
  boxNode.setMass(1);
  boxNode.setFriction(0.5);
  boxNode.setRestitution(0.7); // 弹性
  
  mainScene.addNode(boxNode);
  
  // 创建一个球体（可以看到碰撞体）
  const sphereNode = new PhysicsNode("物理球体");
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const sphereMesh = new MeshInstance3D("球体网格", sphereGeometry, sphereMaterial);
  sphereNode.addChild(sphereMesh);
  sphereNode.setPosition(2, 3, 0);
  
  // 设置球体的物理属性
  sphereNode.setColliderType(CannonColliderType.SPHERE);
  sphereNode.setMass(1);
  
  mainScene.addNode(sphereNode);
  
  // 创建玩家节点（将使用键盘控制）
  const playerNode = new PhysicsNode("玩家");
  playerNode.setPosition(0, 1, 5);
  
  // 为玩家创建模型
  try {
    const modelNode = new ModelLoader3D("玩家模型", '../public/models/toy_terror_chogath.glb');
    modelNode.setScale(0.01, 0.01, 0.01);
    playerNode.addChild(modelNode);
  } catch (error) {
    console.error("加载模型失败，使用替代方案", error);
    
    // 如果模型加载失败，使用一个简单的网格
    const playerGeometry = new THREE.ConeGeometry(0.5, 1, 32);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const playerMesh = new MeshInstance3D("玩家网格", playerGeometry, playerMaterial);
    playerNode.addChild(playerMesh);
  }
  
  // 设置玩家的物理属性
  playerNode.setColliderType(CannonColliderType.CYLINDER);
  playerNode.setMass(5);
  if (playerNode.getCollider()) {
    playerNode.getCollider().setLinearDamping(0.8); // 添加阻尼使其移动更平滑
  }
  
  // 创建InputHandlerNode3D并添加到玩家节点
  const inputHandler = new InputHandlerNode3D("输入处理器");
  playerNode.addChild(inputHandler);
  
  // 设置目标节点为玩家节点
  inputHandler.setTargetNode(playerNode);
  
  // 设置物理可视化选项（默认不显示碰撞体）
  inputHandler.setPhysicsVisualOptions({
    showColliders: false,
    colliderColor: 0x00ff00,
    colliderOpacity: 0.3
  });
  
  // 添加KeyboardController脚本到玩家节点
  playerNode.addScript(KeyboardController);
  
  // 将玩家添加到场景
  mainScene.addNode(playerNode);
  
  // 创建UI说明
  createUI();
  
  // 激活场景并启动引擎
  engine.activateScene("输入处理测试场景");
  engine.start();
}

/**
 * 创建UI说明
 */
function createUI() {
  const instructions = document.createElement('div');
  instructions.style.position = 'absolute';
  instructions.style.top = '10px';
  instructions.style.left = '10px';
  instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  instructions.style.color = 'white';
  instructions.style.padding = '10px';
  instructions.style.borderRadius = '5px';
  instructions.style.fontFamily = 'Arial, sans-serif';
  instructions.style.zIndex = '1000';
  instructions.innerHTML = `
    <h3>输入处理器测试</h3>
    <p>操作说明：</p>
    <ul>
      <li>WASD - 移动</li>
      <li>空格 - 跳跃</li>
      <li>E - 切换碰撞体显示</li>
      <li>Q - 切换骨骼显示</li>
      <li>R + WASD - 旋转玩家</li>
    </ul>
  `;
  
  document.body.appendChild(instructions);
}

// 启动程序
main().catch(console.error); 