// 引入必要的模块
import Engine from '../engine/core/Engine';
import { Node3d } from '../engine/core/Node3d';
import { Scene } from '../engine/core/Scene';

/**
 * 属性面板示例 - 展示如何在JavaScript中创建属性面板
 */
async function initPropertyPanelExample() {
  // 创建容器
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100vh';
  container.style.position = 'relative';
  document.body.appendChild(container);
  
  // 创建画布
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  
  // 初始化引擎 - 属性面板默认显示
  const engine = new Engine(canvas);
  await engine.init({
    showHelpers: true,
    addDefaultLights: true,
    // 默认显示属性面板 (showPropertyPanel默认为true)
  });
  
  // 创建场景
  const scene = new Scene('属性面板示例场景');
  engine.addScene(scene);
  
  // 创建一些节点
  const cubeNode = new Node3d('立方体');
  scene.addNode(cubeNode);
  
  const sphereNode = new Node3d('球体');
  scene.addNode(sphereNode);
  
  // 激活场景并启动引擎
  engine.activateScene(scene.getName());
  await engine.start();
  
  // 创建按钮用于切换显示的节点
  const switchButton = document.createElement('button');
  switchButton.textContent = '切换属性面板节点';
  switchButton.style.position = 'absolute';
  switchButton.style.top = '10px';
  switchButton.style.left = '10px';
  switchButton.style.zIndex = 1000;
  switchButton.style.padding = '8px 12px';
  switchButton.style.backgroundColor = '#3080ff';
  switchButton.style.color = 'white';
  switchButton.style.border = 'none';
  switchButton.style.borderRadius = '4px';
  switchButton.style.cursor = 'pointer';
  container.appendChild(switchButton);
  
  // 当前显示的节点索引
  let currentNodeIndex = 0;
  const nodes = [cubeNode, sphereNode];
  
  // 添加切换事件
  switchButton.addEventListener('click', () => {
    currentNodeIndex = (currentNodeIndex + 1) % nodes.length;
    // 使用updatePropertyPanelNode方法更新面板显示的节点
    engine.updatePropertyPanelNode(nodes[currentNodeIndex]);
  });
  
  console.log('属性面板示例已初始化');
}

// 当DOM加载完成后初始化示例
document.addEventListener('DOMContentLoaded', () => {
  initPropertyPanelExample().catch(error => {
    console.error('初始化属性面板示例时出错:', error);
  });
}); 