import Engine from './engine/core/Engine'
import { GameObject } from './engine/core/GameObject';
import * as THREE from 'three';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { MeshInstance3D } from './engine/core/MeshInstance3D';
import { ModelLoader3D} from './engine/core/ModelLoader3D'
import { Script } from './engine/core/Script';
import playerGlb from './engine/assets/player'
import { 
  texture, 
  tslFn, 
  uv, 
  float, 
  vec2, 
  vec3, 
  vec4, 
  uniform, 
  sin, 
  cos, 
  mix,
  modelViewProjection,
  positionLocal,
  normalLocal,
  varying
} from 'three/tsl';
import { MeshBasicNodeMaterial, ModelNode } from 'three/webgpu';
import { CameraNode3D } from './engine/core/CameraNode3D';
import { MoveNode } from './engine/core/MoveNode';

// 创建引擎
const engine = new Engine().init({
  showDefaultUI: true ,
  showHelpers: true,
  addDefaultLights: true ,
  useWebGPU:true
});

// 直接创建场景 - 不再使用引擎的工厂方法
const mainScene = new Scene("主场景");
const uiScene = new Scene("UI场景");

// 直接创建节点 - 不再使用引擎的工厂方法
const playerNode = new Node3d("玩家");

const enemyNode = new Node3d("敌人");
const uiNode = new Node3d("UI元素");


  document.body.append(generateButton)
// 添加节点到场景
mainScene.addNode(playerNode);
mainScene.addNode(enemyNode);
uiScene.addNode(uiNode);

// 将场景添加到引擎
engine.addScene(mainScene);
engine.addScene(uiScene);

// 为节点添加脚本
// playerNode.addScript(PlayerController, { speed: 5 });
// enemyNode.addScript(EnemyAI, { difficulty: "hard" });

// 激活场景
engine.activateScene("主场景");

// 创建角色层次结构
const characterNode = new Node3d("角色");

 // 创建基础节点材质
 const material = new MeshBasicNodeMaterial();
  
 // 使用TSL定义颜色
 const fragmentColor = tslFn(() => {
   // 简单的纯红色
   return vec4(1.0, 0.0, 0.0, 1.0);
 });
 
 // 设置材质的颜色节点
 material.colorNode = fragmentColor();

// 躯干
const torsoMesh = new MeshInstance3D("躯干", 
  new THREE.BoxGeometry(1, 1.5, 0.5), 
  material
);

// 头部
const headMesh = new ModelLoader3D("头部", 
 '../src/engine/assets/player.glb'
);
headMesh.setScale(0.5,0.5,0.5)
//让他竖起来
headMesh.setRotation(-Math.PI / 2, 0, 0);
headMesh.setPosition(0, 1.3, 0);

// 添加眼睛
const leftEye = new MeshInstance3D("左眼", 
  new THREE.SphereGeometry(0.08, 16, 16), 
  new THREE.MeshStandardMaterial({ color: new THREE.Color('#000000') })
);
leftEye.setPosition(-0.15, 0.1, 0.3);

const rightEye = new MeshInstance3D("右眼", 
  new THREE.SphereGeometry(0.08, 16, 16), 
  new THREE.MeshStandardMaterial({ color: new THREE.Color('#000000') })
);
rightEye.setPosition(0.15, 0.1, 0.3);

// 添加嘴巴
const mouth = new MeshInstance3D("嘴巴", 
  new THREE.BoxGeometry(0.25, 0.05, 0.05), 
  new THREE.MeshStandardMaterial({ color: new THREE.Color('#ff0000') })
);
mouth.setPosition(0, -0.15, 0.3);

// 左臂（创建关节节点和网格）
const leftArmJoint = new Node3d("左臂关节");
leftArmJoint.setPosition(-0.5, 0.3, 0);

const leftArmMesh = new MeshInstance3D("左臂", 
  new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16), 
  new THREE.MeshStandardMaterial({ color: 0x3366ff })
);
// leftArmMesh.setPosition(0, -0.4, 0);
// leftArmMesh.setRotation(0, 0, Math.PI/2);

// 右臂
const rightArmJoint = new Node3d("右臂关节");
rightArmJoint.setPosition(0.5, 0.3, 0);

const rightArmMesh = new MeshInstance3D("右臂", 
  new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16), 
  new THREE.MeshStandardMaterial({ color: 0x3366ff })
);
// rightArmMesh.setPosition(0, -0.4, 0);
// rightArmMesh.setRotation(0, 0, -Math.PI/2);

// 左腿
const leftLegJoint = new Node3d("左腿关节");
leftLegJoint.setPosition(-0.3, -0.8, 0);

const leftLegMesh = new MeshInstance3D("左腿", 
  new THREE.CylinderGeometry(0.15, 0.15, 1, 16), 
  new THREE.MeshStandardMaterial({ color: 0x33cc33 })
);
leftLegMesh.setPosition(0, -0.5, 0);

// 右腿
const rightLegJoint = new Node3d("右腿关节");
rightLegJoint.setPosition(0.3, -0.8, 0);

const rightLegMesh = new MeshInstance3D("右腿", 
  new THREE.CylinderGeometry(0.15, 0.15, 1, 16), 
  new THREE.MeshStandardMaterial({ color: 0x33cc33 })
);
rightLegMesh.setPosition(0, -0.5, 0);

// 构建层次结构
characterNode.addChild(torsoMesh);
characterNode.addChild(headMesh);

// 添加眼睛和嘴巴到头部
headMesh.addChild(leftEye);
headMesh.addChild(rightEye);
headMesh.addChild(mouth);

// 添加左臂
characterNode.addChild(leftArmJoint);
leftArmJoint.addChild(leftArmMesh);

// 添加右臂
characterNode.addChild(rightArmJoint);
rightArmJoint.addChild(rightArmMesh);

// 添加左腿
characterNode.addChild(leftLegJoint);
leftLegJoint.addChild(leftLegMesh);

// 添加右腿
characterNode.addChild(rightLegJoint);
rightLegJoint.addChild(rightLegMesh);


class demo1Script extends Script{
  onStart(): void {
    // 初始化逻辑
    console.log(this.getNode()?.findNodeByName('躯干'), 'this');
    const fragmentColor = tslFn(() => {
      return vec4(1.0, 0.0, 1.0, 1.0);
    });
    const m = new MeshBasicNodeMaterial();
    m.colorNode = fragmentColor();
    this.getNode()?.findNodeByName('躯干').setMaterial(m);
  }
  onReady(): void {
    // 准备逻辑
  }
  update(deltaTime: number): void {
    // 更新逻辑
    // 例如：根据用户输入移动角色
  }
}
characterNode.addScript(demo1Script)
// 将角色添加到场景
mainScene.addNode(characterNode);

// 创建相机节点
const cameraNode = new CameraNode3D("主相机", 75, 0.1, 1000, {
  position: new THREE.Vector3(0, 5, 10),
  rotation: new THREE.Euler(0, 0, 0)
});

// 山洞崩塌震动（强烈的、持续性的震动）
cameraNode.shake(0.1, 5, {
  axes: {x: true, y: false, z: true},
  frequency: 15,
  pattern: 'perlin',
  rotation: true,
  rotationIntensity: 0.03,
  decay: 'exponential'
});

// cameraNode.rotate(1,1,2)
// 将相机节点添加到主场景
mainScene.addNode(cameraNode);

// 设置相机参数
cameraNode.setFov(60);
cameraNode.setNear(0.5);
cameraNode.setFar(2000);

// 设置相机跟踪角色
cameraNode.setTarget(characterNode);

// 示例：动画 - 摆动手臂和腿部，实现行走
function animateCharacter() {
  const time = Date.now() * 0.001;
  const walkSpeed = 1.5; // 行走速度
  
  // 摆动左臂
  leftArmJoint.setRotation(
    Math.sin(time * walkSpeed) * 0.5, // 沿X轴旋转（前后摆动）
    0,
    0
  );
  
  // 摆动右臂（反相位）
  rightArmJoint.setRotation(
    -Math.sin(time * walkSpeed) * 0.5, // 沿X轴旋转（前后摆动）
    0,
    0
  );
  
  // 摆动左腿（与右臂同相位）
  leftLegJoint.setRotation(
    -Math.sin(time * walkSpeed) * 0.5,
    0,
    0
  );
  
  // 摆动右腿（与左臂同相位）
  rightLegJoint.setRotation(
    Math.sin(time * walkSpeed) * 0.5,
    0,
    0
  );
  
  // 让角色前进
  characterNode.position = new THREE.Vector3(
    -Math.sin(time * 0.5) * 3, // 让角色在场景中移动
    0,
    -Math.cos(time * 0.5) * 3  // 圆形路径
  );
  
  // 让角色面向行走方向
  characterNode.setRotation(
    0,
    0,
    0
  );
  
  requestAnimationFrame(animateCharacter);
}
animateCharacter();

// 创建一个MoveNode实例（作为Node3d的子类直接使用）
const movableCharacter = new MoveNode("可移动角色", {
  position: new THREE.Vector3(0, 0, 0),
  moveSpeed: 3.0,
  rotationSpeed: 2.0
});

// 添加网格
const characterMesh = new MeshInstance3D("角色网格", 
  new THREE.BoxGeometry(1, 2, 1), 
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
movableCharacter.addChild(characterMesh);

// 将节点添加到场景
mainScene.addNode(movableCharacter);

// 设置路径点
const pathPoints = [];
const radius = 5;
const numPoints = 12;

for (let i = 0; i < numPoints; i++) {
  const angle = (i / numPoints) * Math.PI * 2;
  pathPoints.push(new THREE.Vector3(
    Math.sin(angle) * radius,
    0,
    Math.cos(angle) * radius
  ));
}

// 让角色沿路径移动
movableCharacter.followPath(pathPoints, true);

// 创建一个跟随者
const follower = new MoveNode("跟随者", {
  position: new THREE.Vector3(2, 0, 2),
  moveSpeed: 2.0
});

const followerMesh = new MeshInstance3D("跟随者网格", 
  new THREE.SphereGeometry(0.5, 16, 16), 
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
follower.addChild(followerMesh);

// 将跟随者添加到场景
mainScene.addNode(follower);

// 设置跟随
follower.follow(characterNode, 10, 1, 0.05);

// 创建一个点击位置移动的节点
const clickMover = new MoveNode("点击移动节点", {
  position: new THREE.Vector3(-3, 0, -3)
});

const clickMoverMesh = new MeshInstance3D("点击移动网格", 
  new THREE.ConeGeometry(0.5, 1, 16), 
  new THREE.MeshStandardMaterial({ color: 0x0000ff })
);
clickMover.addChild(clickMoverMesh);

// 将点击移动节点添加到场景
mainScene.addNode(clickMover);

// 监听点击事件，移动节点到点击位置
document.addEventListener('click', (event) => {
  // 这里需要实现射线检测地面，简化版本：
  const randomPoint = new THREE.Vector3(
    Math.random() * 10 - 5,
    0,
    Math.random() * 10 - 5
  );
  
  // 平滑移动到随机点
  clickMover.smoothMoveTo(randomPoint, 1.0, 0.3, () => {
    // 到达后轻微震动
    clickMover.shake(0.1, 0.3);
  });
});

// 启动引擎
engine.start();

console.log(engine,'engine')