import Engine from '../../engine/core/Engine';
import { Scene } from '../../engine/core/Scene';
import * as THREE from 'three';
import React from 'react';
import ReactDOM from 'react-dom/client';
import BattleScene from './BattleScene';
import { ModelLoader3D } from '../../engine/core/ModelLoader3D';
import { SceneExporter } from './utils/SceneExporter';

// 游戏初始化函数
async function initGame(): Promise<Engine> {
  // 创建引擎实例
  const engine = new Engine();
  
  // 初始化引擎
  await engine.initialize();
  
  // 创建战斗场景
  const scene = new Scene('BattleScene');
  
  // 设置场景灯光
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
  
  // 创建一个简单的地面
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  scene.add(ground);
  
  // 添加场景到引擎
  engine.addScene(scene);
  engine.setActiveScene(scene);
  
  // 设置相机位置
  const camera = engine.getCamera();
  if (camera) {
    // 获取相机的THREE.js对象并设置位置
    const threeCamera = camera.getThreeCamera();
    threeCamera.position.set(0, 4, 8);
    threeCamera.lookAt(0, 0, 0);
  }
  
  return engine;
}

// 加载模型
async function loadModel(modelPath: string, scene: Scene, position: { x: number, y: number, z: number }): Promise<ModelLoader3D> {
  // 创建模型加载器节点
  const modelLoader = new ModelLoader3D('模型', modelPath);
  modelLoader.setPosition(position.x, position.y, position.z);
  
  // 添加到场景
  scene.addNode(modelLoader);
  
  // 等待模型加载完成
  await modelLoader.waitForLoad();
  
  return modelLoader;
}

// 渲染战斗UI
function renderBattleUI(engine: Engine, containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`找不到容器元素: ${containerId}`);
    return;
  }
  
  // 创建UI层
  const uiContainer = document.createElement('div');
  uiContainer.style.position = 'absolute';
  uiContainer.style.top = '0';
  uiContainer.style.left = '0';
  uiContainer.style.width = '100%';
  uiContainer.style.height = '100%';
  uiContainer.style.pointerEvents = 'none';
  container.appendChild(uiContainer);
  
  // 渲染React组件
  const uiRoot = ReactDOM.createRoot(uiContainer);
  uiRoot.render(
    React.createElement(BattleScene, { 
      engine,
      onBattleEnd: (victory) => {
        console.log(victory ? '战斗胜利!' : '战斗失败!');
        // 这里可以添加战斗结束后的逻辑
      }
    })
  );
  
  // 添加场景导出按钮
  addSceneExportButton(engine, container);
}

// 添加场景导出按钮
function addSceneExportButton(engine: Engine, container: HTMLElement): void {
  // 创建场景导出器
  const sceneExporter = new SceneExporter(engine);
  
  // 创建导出按钮并添加到容器
  sceneExporter.createExportButton(container, {
    top: '10px',
    right: '10px'
  });
  
  console.log('场景导出按钮已添加');
}

// 启动游戏
export async function startRpgBattle(containerId: string): Promise<void> {
  try {
    console.log('初始化RPG战斗游戏...');
    
    // 初始化引擎
    const engine = await initGame();
    
    // 渲染UI
    renderBattleUI(engine, containerId);
    
    // 启动游戏循环
    engine.start();
    
    // 添加窗口调整大小事件处理
    window.addEventListener('resize', () => {
      // 这里应该调用正确的方法来处理窗口大小变化
      const renderer = engine.getRenderer();
      const camera = engine.getCamera();
      
      if (renderer && camera) {
        const canvas = renderer instanceof THREE.WebGLRenderer 
          ? renderer.domElement 
          : (renderer as any).domElement;
        
        if (canvas && canvas.parentElement) {
          const width = canvas.parentElement.clientWidth;
          const height = canvas.parentElement.clientHeight;
          
          if (renderer instanceof THREE.WebGLRenderer) {
            renderer.setSize(width, height, false);
          } else if (typeof (renderer as any).setSize === 'function') {
            (renderer as any).setSize(width, height, false);
          }
          
          const threeCamera = camera.getThreeCamera();
          if (threeCamera instanceof THREE.PerspectiveCamera) {
            threeCamera.aspect = width / height;
            threeCamera.updateProjectionMatrix();
          }
        }
      }
    });
    
    console.log('RPG战斗游戏初始化完成');
  } catch (error) {
    console.error('启动游戏失败:', error);
  }
}

// 如果直接运行此文件，则启动游戏
if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    if (!container) {
      const newContainer = document.createElement('div');
      newContainer.id = 'game-container';
      newContainer.style.width = '100%';
      newContainer.style.height = '100vh';
      newContainer.style.position = 'relative';
      document.body.appendChild(newContainer);
    }
    
    startRpgBattle('game-container');
  });
} 