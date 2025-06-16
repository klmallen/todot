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
import { GameControlNode } from './engine/core/UINode/GameControlNode';
import { ResourceListNode } from './engine/core/UINode/ResourceListNode';
import { MinMaxCurve } from './engine/core/ParticleSystem/Curves/MinMaxCurve';
import { ColorCurve } from './engine/core/ParticleSystem/Curves/ColorCurve';
import { GradientCurve } from './engine/core/ParticleSystem/Curves/GradientCurve';
import { ParticleSystemSettings } from './engine/core/ParticleSystem/ParticleSystemSettings';
import { ParticleSystem } from './engine/core/ParticleSystem/ParticleSystem';
import { UIPanelManager } from './engine/core/UINode/UIPanelManager';

// 创建粒子特效类（临时定义，实际应该在单独的文件中）
class SwordTrailParticle extends ModelLoader3D {
  constructor(name: string, modelPath: string) {
    super(name, modelPath);
    this.setType('SwordTrail');
  }
  
  // 这里可以添加粒子特效的特殊方法
}

// 创建UI节点
const sceneTreeNode = new SceneNode();
const propertiesNode = new PropertiesNode();
const sceneSwitcherNode = new SceneSwitcherNode();  
const gameControlNode = new GameControlNode();
const resourceListNode = new ResourceListNode();
const uIPanelManager  = new UIPanelManager()

// 创建引擎
const engine = await new Engine().init({
  showDefaultUI: true,
  showHelpers: true,
  isEditorMode: true,
  addDefaultLights: true,
  useWebGPU: false  // 禁用 WebGPU，使用 WebGL
});
gameControlNode.initialize();
// 初始化UI节点
sceneTreeNode.initialize();
propertiesNode.initialize();
sceneSwitcherNode.initialize();
resourceListNode.initialize();
uIPanelManager.initialize()

// uIPanelManager.addNode(sceneTreeNode)
// uIPanelManager.addNode(propertiesNode)
uIPanelManager.addNode(sceneSwitcherNode)
uIPanelManager.addNode(resourceListNode)
uIPanelManager.addNode(gameControlNode)
async function loadScene(){
  // 创建主场景
const mainScene = new Scene("主场景");
const mainScene2 = new Scene("主场景2");
const mainScene3 = new Scene("主场景3");
engine.addScene(mainScene);
engine.addScene(mainScene2);
engine.addScene(mainScene3);

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


  // 创建粒子系统节点
  const particleSystem = new ParticleSystem('球体粒子系统');

  // 设置位置
  particleSystem.position.set(0, 2, 0);

  // 创建自定义网格 - 使用球体
  const sphereMesh = new THREE.SphereGeometry(0.2, 16, 16);

  // 配置粒子系统
  const settings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(2.0, 3.0),
    startSpeed: new MinMaxCurve(3.0, 5.0),
    startSize: new MinMaxCurve(0.5, 0.8),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(0.0, 0.5, 1.0), // 蓝色
      new THREE.Color(0.0, 0.0, 1.0)  // 深蓝色
    ),
    emission: {
      rateOverTime: 15
    },
    shape: {
      type: 'Sphere',
      params: {
        sphere: {
          radius: 0.1,
          emitFrom: 'Volume'
        }
      },
      randomizeDirection: true,
      directionScale: 1.0
    },
    sizeOverLifetime: new GradientCurve([
      { time: 0, value: 1.0 },
      { time: 1.0, value: 0.0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(0.0, 0.5, 1.0),
      new THREE.Color(0.0, 0.0, 1.0)
    ),
    rotationOverLifetime: new MinMaxCurve(-1.0, 1.0),
    renderer: {
      renderMode: 'Mesh', // 重要：必须设置为Mesh模式
      mesh: sphereMesh,   // 设置自定义网格
      blending: true,
      blendMode: THREE.NormalBlending as THREE.BlendingDstFactor, // 修改为NormalBlending以避免类型错误
      enableLighting: false,
      castShadows: false,
      receiveShadows: false,
      sortMode: 'None',
      maxStretchFactor: 3.0,
      speedScale: 0.5,
      alignToDirection: false
    }
  };

  // 应用设置
  particleSystem.setSettings(settings);

  // 设置自定义网格 - 这一步很重要，确保在设置settings后再次设置
  particleSystem.setCustomMesh(sphereMesh);

  // 添加到场景
  mainScene.addNode(particleSystem);

  // 播放粒子系统
  particleSystem.play();

  // 创建第二个粒子系统 - 使用Billboard模式
  const billboardParticleSystem = new ParticleSystem('广告牌粒子系统');
  billboardParticleSystem.position.set(3, 2, 0);
  
  // 创建圆形纹理
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 128, 128);
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(64, 128, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  
  // 配置粒子系统
  const billboardSettings: Partial<ParticleSystemSettings> = {
    duration: 5.0,
    loop: true,
    startLifetime: new MinMaxCurve(1.0, 2.0),
    startSpeed: new MinMaxCurve(2.0, 3.0),
    startSize: new MinMaxCurve(0.3, 0.6),
    startRotation: new MinMaxCurve(0, Math.PI * 2),
    startColor: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0), // 白色
      new THREE.Color(0.5, 0.8, 1.0)  // 浅蓝色
    ),
    emission: {
      rateOverTime: 20
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
      { time: 0, value: 0.0 },
      { time: 0.1, value: 1.0 },
      { time: 1.0, value: 0.0 }
    ]),
    colorOverLifetime: new ColorCurve(
      new THREE.Color(1.0, 1.0, 1.0),
      new THREE.Color(0.0, 0.5, 1.0)
    ),
    renderer: {
      renderMode: 'Billboard', 
      texture: texture,
      blending: true,
      blendMode: THREE.NormalBlending as THREE.BlendingDstFactor,
      enableLighting: false,
      castShadows: false,
      receiveShadows: false,
      sortMode: 'None',
      maxStretchFactor: 3.0,
      speedScale: 0.5,
      alignToDirection: false
    }
  };
  
  // 应用设置
  billboardParticleSystem.setSettings(billboardSettings);
  
  // 添加到场景
  mainScene.addNode(billboardParticleSystem);
  
  // 播放粒子系统
  billboardParticleSystem.play();

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
    
    // 判断对象类型
    if (object instanceof Node3d) {
      const properties = {
        name: nodeData.name,
        transform: {
          position: object.position,
          rotation: object.rotation,
          scale: object.scale
        }
      };
      
      // 如果是MeshInstance3D类型，添加材质属性
      if (object instanceof MeshInstance3D && object.getMaterial) {
        const finalProps = {
          ...properties,
          material: object.getMaterial()
        };
        propertiesNode.updateProperties(finalProps);
      } else {
        propertiesNode.updateProperties(properties);
      }
    } else if (object instanceof Scene) {
      // 场景对象的属性
      const properties = {
        name: nodeData.name,
        type: 'Scene',
        nodeCount: object.getAllNodes ? object.getAllNodes().length : 0
      };
      
      propertiesNode.updateProperties(properties);
    }
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