# 快速开始

本指南将帮助你快速上手 Todot Engine，创建一个简单的 3D 场景。

## 安装

Todot Engine 可以通过 npm 安装：

```bash
npm install todot-engine
```

或者直接在 HTML 中引入：

```html
<script src="https://cdn.example.com/todot-engine.min.js"></script>
```

## 创建你的第一个场景

### 1. 设置 HTML

首先，创建一个 HTML 文件，并添加一个 canvas 元素作为渲染目标：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My First Todot App</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="app.js"></script>
</body>
</html>
```

### 2. 初始化引擎

创建一个 `app.js` 文件，初始化引擎：

```javascript
import Engine from 'todot-engine/core/Engine';
import { Scene } from 'todot-engine/core/Scene';
import { CameraNode3D } from 'todot-engine/core/CameraNode3D';
import { MeshInstance3D } from 'todot-engine/core/MeshInstance3D';
import * as THREE from 'three';

// 获取 canvas 元素
const canvas = document.getElementById('canvas');

// 创建引擎实例
const engine = await new Engine(canvas).init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true,
  useWebGPU: false // 使用 WebGL 渲染
});

// 创建场景
const scene = new Scene('我的第一个场景');
engine.addScene(scene);
engine.activateScene('我的第一个场景');

// 创建相机
const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
  position: new THREE.Vector3(0, 5, 10),
  rotation: new THREE.Euler(-0.2, 0, 0)
});
scene.addNode(camera);

// 创建一个立方体
const cube = new MeshInstance3D(
  '立方体',
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
cube.setPosition(0, 0, 0);
scene.addNode(cube);

// 添加旋转脚本
cube.addScript({
  update: function(deltaTime) {
    cube.rotation.y += deltaTime * 0.5;
    cube.rotation.x += deltaTime * 0.2;
  }
});

// 启动引擎
engine.start();
```

### 3. 运行你的应用

使用本地开发服务器运行你的应用：

```bash
npx vite
```

现在，你应该能看到一个旋转的绿色立方体！

## 添加交互

让我们为场景添加一些交互功能：

```javascript
// 导入输入系统
import { InputNode } from 'todot-engine/input/InputNode';

// 创建输入节点
const input = new InputNode('输入控制器');
scene.addNode(input);

// 监听输入事件
input.on('move:pressed', () => {
  console.log('移动按键被按下');
});

// 在更新循环中使用输入状态
cube.addScript({
  update: function(deltaTime) {
    // 旋转立方体
    cube.rotation.y += deltaTime * 0.5;
    
    // 根据输入移动立方体
    if (input.isActionPressed('moveForward')) {
      cube.position.z -= deltaTime * 2;
    }
    if (input.isActionPressed('moveBackward')) {
      cube.position.z += deltaTime * 2;
    }
    if (input.isActionPressed('moveLeft')) {
      cube.position.x -= deltaTime * 2;
    }
    if (input.isActionPressed('moveRight')) {
      cube.position.x += deltaTime * 2;
    }
  }
});
```

## 添加物理效果

让我们为立方体添加物理效果：

```javascript
// 导入物理系统
import { createPhysicsEngine, PhysicsFactory } from 'todot-engine/physics';

// 创建物理引擎
const physics = createPhysicsEngine('cannon', 9.82);

// 重新创建引擎，添加物理支持
const engine = await new Engine(canvas, physics).init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true,
  useWebGPU: false
});

// ... 创建场景和相机 ...

// 创建地面
const ground = PhysicsFactory.createPhysicsPlane('地面', 20, 20, {
  mass: 0, // 静态物体
  friction: 0.3,
  restitution: 0.3
});
ground.setRotation(-Math.PI / 2, 0, 0);
ground.setPosition(0, -2, 0);
scene.addNode(ground);

// 创建物理立方体
const cube = new MeshInstance3D(
  '物理立方体',
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
cube.setPosition(0, 5, 0);

// 添加物理能力
const physicsCube = PhysicsFactory.addPhysicsToMesh(cube, {
  mass: 1,
  friction: 0.5,
  restitution: 0.7
});

scene.addNode(physicsCube);
```

## 下一步

恭喜！你已经创建了你的第一个 Todot Engine 应用。接下来，你可以：

- 了解更多关于[场景管理](/guide/scenes)的知识
- 学习如何使用[节点系统](/guide/nodes)
- 探索[粒子系统](/guide/particles)创建视觉效果
- 深入了解[物理系统](/guide/physics)实现真实的物理交互

查看[示例](/examples/)获取更多灵感！
