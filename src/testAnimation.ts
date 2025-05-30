/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-10 17:37:42
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-30 16:29:04
 * @FilePath: \todot\src\testAnimation.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Engine from './engine/core/Engine'
import * as THREE from 'three';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { ModelLoader3D } from './engine/core/ModelLoader3D';
import { AnimationNode3D } from './engine/core/AnimationNode3D';
import { Script } from './engine/core/Script/Script';
import { CameraNode3D } from './engine/core/CameraNode3D';
import { MeshInstance3D } from './engine/core/MeshInstance3D';
import PlayerController  from './scriptDemo/PlayerController';
import { SceneNode } from './engine/core/UINode/SceneNode';
import { PropertiesNode } from './engine/core/UINode/PropertiesNode';
import { CameraFollowMode } from './engine/core/CameraNode3D';
import { SceneSwitcherNode } from './engine/core/UINode/SceneSwitcherNode'; 
// 创建UI节点
const sceneTreeNode = new SceneNode();
const propertiesNode = new PropertiesNode();
const sceneSwitcherNode = new SceneSwitcherNode();  

// 创建引擎
const engine = await new Engine().init({
  showDefaultUI: true,
  showHelpers: true,
  isEditorMode: true,
  addDefaultLights: true,
  useWebGPU: false  // 禁用 WebGPU，使用 WebGL
});

// 初始化UI节点
sceneTreeNode.initialize();
propertiesNode.initialize();
sceneSwitcherNode.initialize();
async function loadScene(){
  // 创建主场景
const mainScene = new Scene("主场景");
engine.addScene(mainScene);

// 添加环境光和方向光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
mainScene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
mainScene.add(directionalLight);

// 创建地板
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x808080,
  roughness: 0.8,
  metalness: 0.2,
  side: THREE.DoubleSide
});
const floor = new MeshInstance3D("地板", floorGeometry, floorMaterial);
floor.setRotation(-Math.PI / 2, 0, 0); // 旋转90度使其水平
floor.setPosition(0, -1, 0); // 稍微下移一点
mainScene.addNode(floor);

// 创建玩家节点
const playerNode = new Node3d("玩家");
mainScene.addNode(playerNode);

// 创建模型节点
const modelNode = new ModelLoader3D("玩家模型", '../public/models/toy_terror_chogath.glb');
modelNode.setScale(0.01,0.01,0.01)
playerNode.addChild(modelNode);

setTimeout(() => {
  const _modelNode = new ModelLoader3D("玩家模型", '../public/models/inkshadow_volibear.glb');
_modelNode.setScale(0.01,0.01,0.01)
_modelNode.setPosition(0,0,4)
playerNode.addChild(_modelNode);
}, 4000)
// 创建动画节点
const animationNode = new AnimationNode3D("玩家动画");
playerNode.addChild(animationNode);

// 创建相机节点
const cameraNode = new CameraNode3D("第三人称相机");

// 设置轨道控制器配置
cameraNode.setOrbitControlsConfig({
  minDistance: 2,
  maxDistance: 20,
  minPolarAngle: Math.PI / 4,    // 45度
  maxPolarAngle: Math.PI / 2     // 90度
});

// 设置跟随配置
cameraNode.setFollowConfig({
  mode: CameraFollowMode.SMOOTH,
  distance: 5,                    // 距离目标5个单位
  height: 2,                     // 高度2个单位
  angle: {
    horizontal: Math.PI / 4,     // 45度
    vertical: Math.PI / 6        // 30度
  }
});

// 设置键盘映射
cameraNode.setKeyboardConfig({
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  up: 'Space',
  down: 'ShiftLeft',
  lookUp: 'ArrowUp',
  lookDown: 'ArrowDown',
  lookLeft: 'ArrowLeft',
  lookRight: 'ArrowRight'
});

// 设置跟随目标
cameraNode.setTarget(playerNode);

// 设置为引擎相机
await cameraNode.setAsEngineCamera();

playerNode.addChild(cameraNode);
playerNode.addScript(PlayerController);

// // 更新场景树数据
// const sceneTreeData = [{
//   name: "主场景",
//   icon: "🌍",
//   children: [
//     {
//       name: "地板",
//       icon: "⬜",
//       data: floor
//     },
//     {
//       name: "玩家",
//       icon: "👤",
//       children: [
//         {
//           name: "玩家模型",
//           icon: "🎮",
//           data: modelNode
//         },
//         {
//           name: "玩家动画",
//           icon: "🎬",
//           data: animationNode
//         }
//       ],
//       data: playerNode
//     },
//     {
//       name: "主相机",
//       icon: "📷",
//       data: cameraNode
//     }
//   ]
// }];

// sceneTreeNode.updateTreeData(sceneTreeData);

// 添加节点选择事件处理
sceneTreeNode.onNodeSelect((nodeData) => {
  if (nodeData.data) {
    const object = nodeData.data;
    const properties = {
      name: nodeData.name,
      transform: {
        position: object.position,
        rotation: object.rotation,
        scale: object.scale
      }
    };
    
    if (object instanceof MeshInstance3D) {
      properties.material = object.getMaterial();
    }
    
    propertiesNode.updateProperties(properties);
  }
});
}
loadScene()
engine.activateScene("主场景");
// 启动引擎
engine.start();

// 导出和加载场景的功能
setTimeout(()=>{
  // 导出并打印JSON数据
  const sceneData = engine.exportAllScenesJSON();
  console.log(sceneData, 'exportSceneToJSON');
  console.log(engine.scenes, 'scenes');
  
  // 下载JSON文件
  const jsonString = JSON.stringify(sceneData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'animation_scene.json';
  
  // 触发下载
  document.body.appendChild(link);
  // link.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

 
}, 2000);

 // 创建加载按钮
 const loadButton = document.createElement('button');
 loadButton.textContent = '加载场景';
 loadButton.style.position = 'absolute';
 loadButton.style.top = '10px';
 loadButton.style.left = '10px';
 loadButton.style.zIndex = '1000';
 loadButton.style.padding = '8px 16px';
 loadButton.style.backgroundColor = '#4CAF50';
 loadButton.style.color = 'white';
 loadButton.style.border = 'none';
 loadButton.style.borderRadius = '4px';
 loadButton.style.cursor = 'pointer';
 document.body.appendChild(loadButton);

 // 添加文件输入元素（隐藏）
 const fileInput = document.createElement('input');
 fileInput.type = 'file';
 fileInput.accept = '.json';
 fileInput.style.display = 'none';
 document.body.appendChild(fileInput);

 // 点击按钮时触发文件选择
 loadButton.onclick = () => fileInput.click();

 // 处理文件选择
 fileInput.onchange = async (e: Event) => {
   const target = e.target as HTMLInputElement;
   if (!target.files?.length) return;

   const file = target.files[0];
   const reader = new FileReader();

   reader.onload = (event: ProgressEvent<FileReader>) => {
     try {
       if (!event.target?.result) return;
       
       const jsonData = JSON.parse(event.target.result as string);
       console.log('加载的场景数据:', jsonData);
       
       // 导入场景数据
       engine.importEngineState(jsonData);
       console.log('场景加载成功',engine.scenes);
     } catch (error) {
       console.error('解析场景数据失败:', error);
     }
   };

   reader.onerror = (error) => {
     console.error('读取文件失败:', error);
   };

   // 开始读取文件
   reader.readAsText(file);
 };