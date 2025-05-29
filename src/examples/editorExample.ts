import Engine from '../engine/core/Engine';
import { Scene } from '../engine/core/Scene';
import { Node3d } from '../engine/core/Node3d';
import * as THREE from 'three';
// 导入创建编辑器UI的函数，但注释掉不使用的导入
// import { initEditorUI } from '../engine/ui';
import { Script } from '../engine/core/Script/Script';
import { Pane } from 'tweakpane';
import { createEditorUI } from '../engine/ui';
import { createEffect } from '@lincode/reactivity';
import { getSelectedNode } from '../engine/states/useEditorMode';
// import { PropertyPanelElement } from '../engine/ui/PropertyPanelElement';

// // 注册 Web Components
// if (!customElements.get('todot-property-panel')) {
//   customElements.define('todot-property-panel', PropertyPanelElement);
// }
// 声明 Tweakpane 的类型


declare module 'tweakpane' {
  interface Pane {
    addFolder(params: { title: string; expanded?: boolean }): Pane;
    addBinding(target: any, prop: string, params?: any): void;
  }
}

// 简单的旋转脚本
class RotatorScript extends Script {
  private rotationSpeed: number = 1.0;
  
  onStart(): void {
    console.log('RotatorScript启动');
  }
  
  onReady(): void {
    console.log('RotatorScript准备就绪');
  }
  
  override update(deltaTime: number): void {
    const node = this.getNode();
    if (node) {
      // 绕Y轴旋转
      node.rotation.y += this.rotationSpeed * deltaTime;
    }
  }
}

// 初始化编辑器示例
async function initEditorExample() {
  // 创建容器
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100vh';
  container.style.position = 'relative';
  document.body.appendChild(container);
  
  // 创建引擎实例
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  
  const engine = new Engine(canvas);
  
  // 初始化引擎
  await engine.init({
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: false, 
    showSceneTreePanel:true,
    enablePropertyPanelShortcuts:true,
    showPropertyPanel:true
  });
  
  // 创建场景
  const scene = new Scene('编辑器示例场景');
  engine.addScene(scene);
  
  // 创建相机并定位
  const camera = engine.getCamera();
  camera.getThreeCamera().position.set(0, 5, 10);
  camera.getThreeCamera().lookAt(0, 0, 0);
  
  // 添加几个3D对象
  
  // 地面
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  
  const groundNode = new Node3d('地面');
  groundNode.getThreeObject().add(groundMesh);
  scene.addNode(groundNode);
  
  // 立方体
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cubeMesh.position.set(0, 0.5, 0);
  cubeMesh.castShadow = true;
  
  const cubeNode = new Node3d('立方体');
  cubeNode.getThreeObject().add(cubeMesh);
  cubeNode.addScript(RotatorScript);
  scene.addNode(cubeNode);
  
  // 球体
  const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphereMesh.position.set(2, 0.5, 0);
  sphereMesh.castShadow = true;
  
  const sphereNode = new Node3d('球体');
  sphereNode.getThreeObject().add(sphereMesh);
  scene.addNode(sphereNode);
  
  // 圆柱体
  const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinderMesh.position.set(-2, 0.5, 0);
  cylinderMesh.castShadow = true;
  
  const cylinderNode = new Node3d('圆柱体');
  cylinderNode.getThreeObject().add(cylinderMesh);
  scene.addNode(cylinderNode);
  
  // 激活场景
  engine.activateScene('编辑器示例场景');
  
  // 启动引擎
  await engine.start();
  
  // 创建编辑器UI
  const editorUI = createEditorUI(engine);
  container.appendChild(editorUI);

  


  console.log('编辑器示例已初始化');
}

// 当DOM加载完成后初始化示例
document.addEventListener('DOMContentLoaded', () => {
  initEditorExample().catch(error => {
    console.error('初始化编辑器示例时出错:', error);
  });
});

// 演示如何通过HTML直接使用Web Component
function addHTMLDemoMethod() {
  // 注册全局引擎实例以供Web Component使用
  const engine = Engine.getInstance();
  (window as any)['todotEngine'] = engine;
  
  // 创建一个HTML演示代码
  console.log(`
    <!-- HTML中使用编辑器UI示例 -->
    <todot-editor-ui engine-id="todotEngine"></todot-editor-ui>
    <todot-property-panel></todot-property-panel>
  `);
}

export { initEditorExample }; 