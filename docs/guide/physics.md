# 物理系统

Todot Engine 的物理系统基于 Cannon.js，提供了真实的物理模拟功能，包括刚体动力学、碰撞检测和约束。本指南将帮助你了解如何在游戏中使用物理系统。

## 基本概念

物理系统的核心概念包括：

1. **刚体**：具有质量、惯性和碰撞形状的物理对象
2. **碰撞体**：定义物体的碰撞形状，如盒体、球体、平面等
3. **约束**：限制物体运动的条件，如铰链、弹簧等
4. **力和冲量**：影响物体运动的外部作用

## 设置物理系统

### 创建物理引擎

首先，需要创建一个物理引擎实例：

```javascript
import { createPhysicsEngine } from 'todot-engine/physics';

// 创建物理引擎，使用默认重力 (9.82 m/s²)
const physics = createPhysicsEngine('cannon');

// 或者指定重力
const physics = createPhysicsEngine('cannon', 9.82);
```

### 将物理引擎添加到游戏引擎

```javascript
import Engine from 'todot-engine/core/Engine';

// 创建引擎实例，传入物理引擎
const engine = await new Engine(canvas, physics).init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true,
  useWebGPU: false,
  showBoundingBoxes: true // 显示碰撞体边界框，便于调试
});
```

## 创建物理对象

Todot Engine 提供了几种创建物理对象的方法：

### 使用 PhysicsFactory

`PhysicsFactory` 是创建物理对象的最简单方法：

```javascript
import { PhysicsFactory, CannonColliderType } from 'todot-engine/physics';
import { MeshInstance3D } from 'todot-engine/core/MeshInstance3D';
import * as THREE from 'three';

// 创建一个物理平面（地面）
const ground = PhysicsFactory.createPhysicsPlane('地面', 30, 30, {
  mass: 0, // 质量为 0 表示静态物体
  friction: 0.3,
  restitution: 0.3 // 弹性
});

// 旋转平面使其朝上
ground.setRotation(-Math.PI / 2, 0, 0);
ground.setPosition(0, 0, 0);

// 设置地面材质
const groundMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color('gray'),
  roughness: 0.8
});
ground.setMaterial(groundMaterial);

// 添加到场景
scene.addNode(ground);

// 创建一个物理盒体
const box = PhysicsFactory.createPhysicsBox('盒体', 1, 1, 1, {
  mass: 1, // 质量为 1，表示动态物体
  friction: 0.5,
  restitution: 0.7
});

box.setPosition(0, 5, 0);
scene.addNode(box);

// 创建一个物理球体
const sphere = PhysicsFactory.createPhysicsSphere('球体', 0.5, {
  mass: 1,
  friction: 0.1,
  restitution: 0.9
});

sphere.setPosition(1, 7, 0);
scene.addNode(sphere);
```

### 为现有对象添加物理能力

你也可以为现有的网格或节点添加物理能力：

```javascript
// 创建一个普通的网格实例
const cube = new MeshInstance3D(
  '立方体',
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
cube.setPosition(0, 10, 0);

// 添加物理能力
const physicsCube = PhysicsFactory.addPhysicsToMesh(cube, {
  mass: 2,
  friction: 0.5,
  restitution: 0.7
});

// 添加到场景
scene.addNode(physicsCube);

// 显示碰撞体可视化（调试用）
physicsCube.showColliderVisual(true);
```

### 为模型添加物理能力

你可以为加载的 3D 模型添加物理能力：

```javascript
import { ModelLoader3D } from 'todot-engine/core/ModelLoader3D';

// 加载模型
const model = new ModelLoader3D('玩家模型', 'models/character.glb');
model.setPosition(0, 5, 0);

// 在模型加载完成后添加物理能力
model.setOnLoaded((_model) => {
  // 缩放模型
  model.setScale(0.01, 0.01, 0.01);
  
  // 添加物理能力，使用盒体碰撞体
  const physModel = PhysicsFactory.addPhysicsToModel(model, {
    colliderType: CannonColliderType.BOX,
    mass: 10,
    friction: 0.3,
    restitution: 0.2
  });
  
  // 显示碰撞体可视化
  physModel.showColliderVisual(true);
  
  // 添加到场景
  scene.addNode(model);
});
```

## 物理属性

物理对象有多种可配置的属性：

### 基本属性

- **mass**: 物体质量，0 表示静态物体
- **friction**: 摩擦系数，控制物体在表面上滑动的难易程度
- **restitution**: 弹性系数，控制碰撞后反弹的程度
- **linearDamping**: 线性阻尼，减缓物体的线性运动
- **angularDamping**: 角阻尼，减缓物体的旋转运动

### 碰撞组和掩码

碰撞组和掩码用于控制哪些物体可以相互碰撞：

```javascript
// 设置碰撞组和掩码
physicsCube.setCollisionGroup(1); // 设置为组 1
physicsCube.setCollisionMask(2);  // 只与组 2 的物体碰撞

// 或者在创建时设置
const ball = PhysicsFactory.createPhysicsSphere('球体', 0.5, {
  mass: 1,
  collisionGroup: 2,
  collisionMask: 1
});
```

### 运动学物体

运动学物体不受物理引擎的力的影响，但可以影响其他物体：

```javascript
// 创建运动学物体
const platform = PhysicsFactory.createPhysicsBox('平台', 3, 0.5, 3, {
  mass: 0,
  isKinematic: true
});

// 添加移动脚本
platform.addScript({
  update: function(deltaTime) {
    // 手动移动平台
    platform.position.y = 2 + Math.sin(Date.now() * 0.001) * 2;
    
    // 必须调用 updatePhysics 来同步物理状态
    platform.updatePhysics();
  }
});
```

## 物理交互

### 应用力和冲量

你可以对物理对象应用力和冲量：

```javascript
// 应用力（持续作用）
physicsCube.applyForce(new THREE.Vector3(0, 10, 0)); // 向上的力
physicsCube.applyForceAtPoint(new THREE.Vector3(5, 0, 0), new THREE.Vector3(1, 0, 0)); // 在特定点应用力

// 应用冲量（瞬时作用）
physicsCube.applyImpulse(new THREE.Vector3(0, 0, -5)); // 向后的冲量
physicsCube.applyImpulseAtPoint(new THREE.Vector3(0, 0, 10), new THREE.Vector3(-1, 0, 0)); // 在特定点应用冲量

// 应用扭矩（旋转力）
physicsCube.applyTorque(new THREE.Vector3(0, 1, 0)); // 绕 Y 轴旋转的扭矩
```

### 设置速度

你可以直接设置物体的线性和角速度：

```javascript
// 设置线性速度
physicsCube.setLinearVelocity(new THREE.Vector3(0, 5, 0)); // 向上的速度

// 设置角速度
physicsCube.setAngularVelocity(new THREE.Vector3(0, 2, 0)); // 绕 Y 轴旋转
```

### 获取物理状态

```javascript
// 获取线性速度
const velocity = physicsCube.getLinearVelocity();
console.log(`速度: ${velocity.length()} m/s`);

// 获取角速度
const angularVelocity = physicsCube.getAngularVelocity();

// 检查是否接触地面
if (physicsCube.isGrounded()) {
  console.log('物体在地面上');
}
```

## 碰撞检测

### 碰撞回调

你可以监听碰撞事件：

```javascript
// 监听碰撞开始事件
physicsCube.onCollisionEnter((otherBody, contact) => {
  console.log(`与 ${otherBody.node.getName()} 开始碰撞`);
  
  // 获取碰撞点
  const contactPoint = contact.getContactPoint();
  
  // 获取碰撞法线
  const normal = contact.getNormal();
  
  // 获取碰撞冲量
  const impulse = contact.getImpulse();
  
  // 根据碰撞对象做不同处理
  if (otherBody.node.hasTag('enemy')) {
    // 与敌人碰撞的逻辑
  } else if (otherBody.node.hasTag('pickup')) {
    // 与拾取物碰撞的逻辑
  }
});

// 监听碰撞持续事件
physicsCube.onCollisionStay((otherBody, contact) => {
  // 碰撞持续期间的逻辑
});

// 监听碰撞结束事件
physicsCube.onCollisionExit((otherBody) => {
  console.log(`与 ${otherBody.node.getName()} 结束碰撞`);
});
```

### 射线检测

你可以使用射线检测来查询物理世界：

```javascript
// 创建射线
const origin = new THREE.Vector3(0, 5, 0);
const direction = new THREE.Vector3(0, -1, 0);
const maxDistance = 10;

// 执行射线检测
const result = physics.raycast(origin, direction, maxDistance);

if (result.hasHit) {
  console.log(`射线击中了 ${result.node.getName()}`);
  console.log(`击中点: ${result.point.x}, ${result.point.y}, ${result.point.z}`);
  console.log(`击中法线: ${result.normal.x}, ${result.normal.y}, ${result.normal.z}`);
  console.log(`击中距离: ${result.distance}`);
}
```

## 物理约束

物理约束用于限制物体之间的相对运动：

### 铰链约束

```javascript
// 创建两个物理盒体
const boxA = PhysicsFactory.createPhysicsBox('盒体A', 1, 1, 1, { mass: 1 });
boxA.setPosition(0, 5, 0);

const boxB = PhysicsFactory.createPhysicsBox('盒体B', 1, 1, 1, { mass: 1 });
boxB.setPosition(0, 7, 0);

scene.addNode(boxA);
scene.addNode(boxB);

// 创建铰链约束
const pivotA = new THREE.Vector3(0, 0.5, 0); // 相对于 boxA 的枢轴点
const pivotB = new THREE.Vector3(0, -0.5, 0); // 相对于 boxB 的枢轴点
const axisA = new THREE.Vector3(0, 0, 1); // 旋转轴
const axisB = new THREE.Vector3(0, 0, 1);

const hinge = physics.createHingeConstraint(boxA, boxB, {
  pivotA,
  pivotB,
  axisA,
  axisB
});

// 设置铰链限制
hinge.setLimits(-Math.PI / 4, Math.PI / 4); // 限制旋转范围
```

### 距离约束

```javascript
// 创建距离约束
const distance = 3; // 保持的距离
const distanceConstraint = physics.createDistanceConstraint(boxA, boxB, distance);
```

### 点对点约束

```javascript
// 创建点对点约束
const pivotA = new THREE.Vector3(0.5, 0, 0);
const pivotB = new THREE.Vector3(-0.5, 0, 0);
const pointConstraint = physics.createPointToPointConstraint(boxA, boxB, pivotA, pivotB);
```

## 创建复合碰撞体

对于复杂形状，你可以创建复合碰撞体：

```javascript
// 创建一个角色节点
const character = new Node3d('角色');
character.setPosition(0, 5, 0);

// 添加物理能力，使用复合碰撞体
const physicsCharacter = PhysicsFactory.addPhysicsToNode(character, {
  mass: 70, // 70 kg
  friction: 0.3,
  restitution: 0.1
});

// 添加胶囊体作为主体
physicsCharacter.addColliderShape(
  CannonColliderType.CYLINDER,
  new THREE.Vector3(0, 0, 0), // 位置偏移
  new THREE.Quaternion(), // 旋转偏移
  { radius: 0.3, height: 1.5 } // 参数
);

// 添加球体作为头部
physicsCharacter.addColliderShape(
  CannonColliderType.SPHERE,
  new THREE.Vector3(0, 0.9, 0), // 头部位置
  new THREE.Quaternion(),
  { radius: 0.25 }
);

scene.addNode(physicsCharacter);
```

## 物理材质

你可以创建和使用物理材质来控制不同物体之间的摩擦和弹性：

```javascript
// 创建物理材质
const iceMaterial = physics.createMaterial('ice', {
  friction: 0.01,
  restitution: 0.1
});

const bouncyMaterial = physics.createMaterial('bouncy', {
  friction: 0.5,
  restitution: 0.9
});

// 应用材质
const iceBlock = PhysicsFactory.createPhysicsBox('冰块', 10, 0.1, 10, {
  mass: 0,
  material: iceMaterial
});

const ball = PhysicsFactory.createPhysicsSphere('弹球', 0.5, {
  mass: 1,
  material: bouncyMaterial
});

// 创建材质接触
physics.createContactMaterial(iceMaterial, bouncyMaterial, {
  friction: 0.05,
  restitution: 0.95
});
```

## 物理触发器

触发器是不产生碰撞响应但可以检测重叠的特殊碰撞体：

```javascript
// 创建触发器区域
const triggerZone = PhysicsFactory.createPhysicsBox('触发区域', 3, 3, 3, {
  mass: 0,
  isTrigger: true
});
triggerZone.setPosition(0, 1.5, 5);

// 使触发器半透明
const triggerMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.3
});
triggerZone.setMaterial(triggerMaterial);

// 监听触发器事件
triggerZone.onTriggerEnter((otherBody) => {
  console.log(`${otherBody.node.getName()} 进入触发区域`);
});

triggerZone.onTriggerStay((otherBody) => {
  // 物体在触发区域内的逻辑
});

triggerZone.onTriggerExit((otherBody) => {
  console.log(`${otherBody.node.getName()} 离开触发区域`);
});
```

## 物理调试

调试物理系统可以帮助你解决问题：

```javascript
// 显示所有碰撞体的可视化
engine.setShowBoundingBoxes(true);

// 显示特定物体的碰撞体
physicsCube.showColliderVisual(true);

// 启用物理调试绘制
physics.enableDebugDraw(true);

// 设置调试绘制选项
physics.setDebugDrawOptions({
  drawWireframe: true,
  drawAABBs: false,
  drawContactPoints: true,
  drawContactNormals: true
});
```

## 性能优化

1. **使用简单碰撞体**：尽量使用简单的碰撞形状（盒体、球体）而不是复杂的凸包
2. **限制物理对象数量**：只为需要物理交互的对象添加物理能力
3. **使用适当的碰撞组**：通过碰撞组和掩码减少不必要的碰撞检测
4. **休眠设置**：允许静止的物体进入休眠状态以节省计算资源
5. **物理步长**：调整物理更新频率，平衡精度和性能

```javascript
// 配置物理引擎
physics.setUpdateFrequency(60); // 每秒 60 次物理更新
physics.setSleepingThreshold(0.1, 0.1); // 设置休眠阈值
```

## 示例：创建简单的物理游戏

下面是一个简单的物理游戏示例，包括地面、障碍物和可控制的球体：

```javascript
import Engine from 'todot-engine/core/Engine';
import { Scene } from 'todot-engine/core/Scene';
import { CameraNode3D } from 'todot-engine/core/CameraNode3D';
import { InputNode } from 'todot-engine/input/InputNode';
import { createPhysicsEngine, PhysicsFactory } from 'todot-engine/physics';
import * as THREE from 'three';

// 创建物理引擎
const physics = createPhysicsEngine('cannon');

// 创建引擎实例
const engine = await new Engine(canvas, physics).init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true
});

// 创建场景
const scene = new Scene('物理游戏场景');
engine.addScene(scene);
engine.activateScene('物理游戏场景');

// 创建相机
const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
  position: new THREE.Vector3(0, 10, 15),
  rotation: new THREE.Euler(-0.5, 0, 0)
});
scene.addNode(camera);

// 创建地面
const ground = PhysicsFactory.createPhysicsPlane('地面', 30, 30, {
  mass: 0,
  friction: 0.3,
  restitution: 0.3
});
ground.setRotation(-Math.PI / 2, 0, 0);
scene.addNode(ground);

// 创建障碍物
for (let i = 0; i < 10; i++) {
  const size = 0.5 + Math.random() * 1.0;
  const obstacle = PhysicsFactory.createPhysicsBox(`障碍物${i}`, size, size, size, {
    mass: 2,
    friction: 0.5,
    restitution: 0.3
  });
  
  // 随机位置
  const x = (Math.random() - 0.5) * 10;
  const z = (Math.random() - 0.5) * 10;
  obstacle.setPosition(x, size / 2 + 0.5, z);
  
  // 随机颜色
  const color = new THREE.Color(Math.random(), Math.random(), Math.random());
  obstacle.setMaterial(new THREE.MeshStandardMaterial({ color }));
  
  scene.addNode(obstacle);
}

// 创建玩家控制的球体
const player = PhysicsFactory.createPhysicsSphere('玩家球', 0.5, {
  mass: 1,
  friction: 0.1,
  restitution: 0.7
});
player.setPosition(0, 1, 0);
player.setMaterial(new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
scene.addNode(player);

// 创建输入节点
const input = new InputNode('输入控制器');
scene.addNode(input);

// 添加控制脚本
player.addScript({
  update: function(deltaTime) {
    // 获取输入
    const moveForce = 10; // 移动力度
    
    // 根据输入应用力
    if (input.isActionPressed('moveForward')) {
      player.applyForce(new THREE.Vector3(0, 0, -moveForce));
    }
    if (input.isActionPressed('moveBackward')) {
      player.applyForce(new THREE.Vector3(0, 0, moveForce));
    }
    if (input.isActionPressed('moveLeft')) {
      player.applyForce(new THREE.Vector3(-moveForce, 0, 0));
    }
    if (input.isActionPressed('moveRight')) {
      player.applyForce(new THREE.Vector3(moveForce, 0, 0));
    }
    if (input.isActionJustPressed('jump') && player.isGrounded()) {
      player.applyImpulse(new THREE.Vector3(0, 5, 0));
    }
    
    // 更新相机位置跟随球体
    const playerPos = player.position;
    camera.position.set(playerPos.x, playerPos.y + 10, playerPos.z + 15);
    camera.lookAt(playerPos);
  }
});

// 创建目标区域
const goal = PhysicsFactory.createPhysicsBox('目标', 2, 0.1, 2, {
  mass: 0,
  isTrigger: true
});
goal.setPosition(0, 0.05, -10);
goal.setMaterial(new THREE.MeshStandardMaterial({
  color: 0xffff00,
  transparent: true,
  opacity: 0.7
}));
scene.addNode(goal);

// 监听目标触发
goal.onTriggerEnter((otherBody) => {
  if (otherBody.node === player) {
    console.log('玩家到达目标！');
    alert('恭喜，你赢了！');
    
    // 重置玩家位置
    player.setPosition(0, 1, 0);
    player.setLinearVelocity(new THREE.Vector3(0, 0, 0));
    player.setAngularVelocity(new THREE.Vector3(0, 0, 0));
  }
});

// 启动引擎
engine.start();
```

## 总结

Todot Engine 的物理系统提供了丰富的功能，可以创建真实的物理交互。通过合理使用这些功能，你可以为你的游戏添加沉浸式的物理体验，从简单的碰撞到复杂的机械装置。

记住，物理模拟是计算密集型的，所以始终要平衡物理精度和性能需求。通过本指南中的优化技巧，你可以创建既真实又高效的物理系统。
