import * as THREE from 'three';
import Engine from './engine/core/Engine';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { MeshInstance3D } from './engine/core/MeshInstance3D';
import { 
  createPhysicsEngine, 
  PhysicsFactory, 
  CannonColliderType
} from './engine/physics';

/**
 * 物理引擎演示程序入口
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100vh';
    canvas.style.display = 'block';
    document.body.appendChild(canvas);
    
    // 运行物理引擎示例
    runPhysicsDemo(canvas);
    
    // 添加说明信息
    addInstructions();
    
    console.log('物理引擎演示启动成功!');
  } catch (error) {
    console.error('物理引擎演示启动失败:', error);
    alert(`启动失败: ${error.message}`);
  }
});

/**
 * 运行物理演示
 * @param canvas 画布元素
 */
function runPhysicsDemo(canvas: HTMLCanvasElement): void {
  // 创建物理引擎
  const physics = createPhysicsEngine('cannon', 9.82);
  
  // 创建引擎实例
  const engine = new Engine(canvas, physics);
  
  // 创建场景
  const scene = new Scene('物理演示场景');
  
  // 添加场景到引擎并激活
  engine.addScene(scene);
  engine.activateScene(scene.getName(), true);
  
  // 创建地面
  const ground = PhysicsFactory.createPhysicsPlane('地面', 30, 30, {
    mass: 0, // 静态物体
    friction: 0.3,
    restitution: 0.3
  });
  
  // 旋转平面使其朝上
  ground.setRotation(new THREE.Euler(-Math.PI / 2, 0, 0));
  
  // 设置地面材质
  ground.setMaterial(new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.8,
    metalness: 0.2
  }));
  
  // 添加地面到场景
  scene.addNode(ground);
  
  // 创建掉落的盒子
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
    
    // 设置位置
    box.setPosition(new THREE.Vector3(
      -5 + Math.random() * 10,
      5 + i * 2,
      -5 + Math.random() * 10
    ));
    
    // 随机颜色
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    box.setMaterial(new THREE.MeshStandardMaterial({ color }));
    
    // 添加到场景
    scene.addNode(box);
    
    // 显示碰撞体可视化
    box.showColliderVisual(true);
  }
  
  // 创建掉落的球体
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
    
    // 设置位置
    sphere.setPosition(new THREE.Vector3(
      -5 + Math.random() * 10,
      5 + i * 2,
      -5 + Math.random() * 10
    ));
    
    // 随机颜色
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    sphere.setMaterial(new THREE.MeshStandardMaterial({ color }));
    
    // 添加到场景
    scene.addNode(sphere);
    
    // 显示碰撞体可视化
    sphere.showColliderVisual(true);
  }
  
  // 创建控制按钮
  createControlPanel(() => {
    // 添加新的盒子
    const box = PhysicsFactory.createPhysicsBox(
      `新盒子`,
      new THREE.Vector3(1, 1, 1),
      { mass: 2, restitution: 0.7 }
    );
    
    box.setPosition(new THREE.Vector3(0, 10, 0));
    box.setMaterial(new THREE.MeshStandardMaterial({ 
      color: Math.random() * 0xffffff 
    }));
    box.showColliderVisual(true);
    
    scene.addNode(box);
  });
  
  // 启动引擎
  engine.init().then(() => {
    engine.start();
  });
}

/**
 * 创建控制面板
 * @param addBoxCallback 添加盒子的回调函数
 */
function createControlPanel(addBoxCallback: () => void): void {
  // 创建控制面板
  const panel = document.createElement('div');
  panel.style.position = 'absolute';
  panel.style.top = '20px';
  panel.style.right = '20px';
  panel.style.padding = '15px';
  panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  panel.style.color = 'white';
  panel.style.borderRadius = '5px';
  panel.style.fontFamily = 'Arial, sans-serif';
  panel.style.zIndex = '1000';
  
  // 添加标题
  const title = document.createElement('h3');
  title.textContent = '物理控制面板';
  title.style.margin = '0 0 15px 0';
  panel.appendChild(title);
  
  // 添加盒子按钮
  const addBoxButton = document.createElement('button');
  addBoxButton.textContent = '掉落新物体';
  addBoxButton.style.display = 'block';
  addBoxButton.style.width = '100%';
  addBoxButton.style.padding = '8px';
  addBoxButton.style.marginBottom = '10px';
  addBoxButton.style.cursor = 'pointer';
  addBoxButton.onclick = addBoxCallback;
  panel.appendChild(addBoxButton);
  
  // 添加到文档
  document.body.appendChild(panel);
}

/**
 * 添加说明信息
 */
function addInstructions(): void {
  // 创建说明面板
  const instructions = document.createElement('div');
  instructions.style.position = 'absolute';
  instructions.style.top = '20px';
  instructions.style.left = '20px';
  instructions.style.padding = '15px';
  instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  instructions.style.color = 'white';
  instructions.style.fontFamily = 'Arial, sans-serif';
  instructions.style.fontSize = '14px';
  instructions.style.borderRadius = '5px';
  instructions.style.maxWidth = '300px';
  instructions.style.zIndex = '1000';
  
  // 添加说明内容
  instructions.innerHTML = `
    <h2 style="margin-top: 0; color: #4CAF50;">CANNON-ES 物理引擎演示</h2>
    <p>这个示例展示了如何使用CANNON-ES物理引擎与Three.js集成。</p>
    <ul>
      <li>绿色线框显示了物体的碰撞边界</li>
      <li>物体受重力影响并互相碰撞</li>
      <li>点击"掉落新物体"按钮添加更多物体</li>
      <li>使用鼠标拖动来旋转视图</li>
      <li>使用鼠标滚轮缩放视图</li>
    </ul>
    <p style="font-size: 12px; color: #aaa;">按ESC键隐藏此说明</p>
  `;
  
  // 添加到文档
  document.body.appendChild(instructions);
  
  // 添加ESC键监听器
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    }
  });
} 