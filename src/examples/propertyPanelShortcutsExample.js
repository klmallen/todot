// 引入必要的模块
import Engine from '../engine/core/Engine';
import { Node3d } from '../engine/core/Node3d';
import { Scene } from '../engine/core/Scene';
import '../engine/ui/PropertyPanelElement';

/**
 * 属性面板增强功能示例 - 展示如何使用快捷键和切换功能
 */
async function initPropertyPanelEnhancedExample() {
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
  
  // 初始化引擎
  const engine = new Engine(canvas);
  await engine.init({
    showHelpers: true,
    addDefaultLights: true,
    enablePropertyPanelShortcuts: true // 启用属性面板快捷键
  });
  
  // 创建场景
  const scene = new Scene('属性面板增强示例场景');
  engine.addScene(scene);
  
  // 创建一些节点
  const cubeNode = new Node3d('立方体');
  scene.addNode(cubeNode);
  
  const sphereNode = new Node3d('球体');
  scene.addNode(sphereNode);
  
  const cylinderNode = new Node3d('圆柱体');
  scene.addNode(cylinderNode);
  
  // 激活场景并启动引擎
  engine.activateScene(scene.getName());
  await engine.start();
  
  // 添加控制按钮
  addControlButtons(container, engine, [cubeNode, sphereNode, cylinderNode]);

  console.log('属性面板增强示例已初始化');
  console.log('使用 Ctrl+P 快捷键可以切换属性面板的显示/隐藏');
}

/**
 * 添加控制按钮
 */
function addControlButtons(container, engine, nodes) {
  // 创建控制按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.top = '10px';
  buttonContainer.style.left = '10px';
  buttonContainer.style.zIndex = '1000';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '10px';
  container.appendChild(buttonContainer);
  
  // 切换默认面板按钮
  const toggleDefaultButton = createButton('切换默认属性面板');
  toggleDefaultButton.addEventListener('click', () => {
    engine.togglePropertyPanel();
  });
  buttonContainer.appendChild(toggleDefaultButton);
  
  // 创建第二个面板按钮
  const createSecondPanelButton = createButton('创建第二个属性面板');
  createSecondPanelButton.addEventListener('click', () => {
    engine.createPropertyPanel(
      container, 
      { top: '50px', left: '10px', width: '300px' }, 
      nodes[1], 
      'second-panel'
    );
  });
  buttonContainer.appendChild(createSecondPanelButton);
  
  // 关闭所有面板按钮
  const closeAllButton = createButton('关闭所有属性面板');
  closeAllButton.addEventListener('click', () => {
    engine.closeAllPropertyPanels();
  });
  buttonContainer.appendChild(closeAllButton);
  
  // 为每个节点创建按钮
  nodes.forEach((node, index) => {
    const button = createButton(`显示 ${node.getName()} 属性`);
    button.addEventListener('click', () => {
      // 获取默认面板，如果不存在则创建
      let panel = engine.getPropertyPanel();
      if (!panel) {
        panel = engine.createPropertyPanel(container);
      }
      // 更新面板显示的节点
      engine.updatePropertyPanelNode(node);
    });
    buttonContainer.appendChild(button);
  });
}

/**
 * 创建一个按钮
 */
function createButton(text) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.padding = '8px 12px';
  button.style.borderRadius = '4px';
  button.style.border = 'none';
  button.style.backgroundColor = '#3080ff';
  button.style.color = 'white';
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';
  button.addEventListener('mouseover', () => {
    button.style.backgroundColor = '#4090ff';
  });
  button.addEventListener('mouseout', () => {
    button.style.backgroundColor = '#3080ff';
  });
  return button;
}

// 当DOM加载完成后初始化示例
document.addEventListener('DOMContentLoaded', () => {
  initPropertyPanelEnhancedExample().catch(error => {
    console.error('初始化属性面板增强示例时出错:', error);
  });
}); 