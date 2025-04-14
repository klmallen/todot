# Engine

`Engine` 是 Todot 引擎的核心类，负责管理场景、渲染循环、物理系统和其他全局资源。

## 导入

```javascript
import Engine from 'todot-engine/core/Engine';
```

## 构造函数

```javascript
constructor(canvas?: HTMLCanvasElement, physics?: IPhysics | null = null)
```

### 参数

- `canvas` (可选): 用于渲染的 HTML Canvas 元素。如果不提供，将创建一个新的 Canvas 元素。
- `physics` (可选): 物理引擎实例。如果不提供，引擎将不支持物理功能。

### 示例

```javascript
// 创建引擎实例，不使用物理系统
const engine = new Engine(document.getElementById('canvas'));

// 创建引擎实例，使用物理系统
import { createPhysicsEngine } from 'todot-engine/physics';
const physics = createPhysicsEngine('cannon');
const engine = new Engine(document.getElementById('canvas'), physics);
```

## 方法

### init

初始化引擎，设置渲染器和其他选项。

```javascript
async init(options: {
  showDefaultUI?: boolean,
  showHelpers?: boolean,
  addDefaultLights?: boolean,
  useWebGPU?: boolean,
  showBoundingBoxes?: boolean,
} = {}): Promise<Engine>
```

#### 参数

- `options.showDefaultUI` (可选): 是否显示默认 UI，默认为 `false`
- `options.showHelpers` (可选): 是否显示辅助工具，如坐标轴，默认为 `false`
- `options.addDefaultLights` (可选): 是否添加默认光源，默认为 `false`
- `options.useWebGPU` (可选): 是否使用 WebGPU 渲染，默认为 `false`
- `options.showBoundingBoxes` (可选): 是否显示包围盒，默认为 `false`

#### 返回值

- `Promise<Engine>`: 初始化后的引擎实例

#### 示例

```javascript
const engine = await new Engine().init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true,
  useWebGPU: true
});
```

### start

启动引擎的渲染循环。

```javascript
start(): Promise<void>
```

#### 示例

```javascript
engine.start();
```

### addScene

添加场景到引擎。

```javascript
addScene(scene: Scene): void
```

#### 参数

- `scene`: 要添加的场景实例

#### 示例

```javascript
const scene = new Scene('主场景');
engine.addScene(scene);
```

### removeScene

从引擎中移除场景。

```javascript
removeScene(nameOrScene: string | Scene): void
```

#### 参数

- `nameOrScene`: 场景名称或场景实例

#### 示例

```javascript
engine.removeScene('主场景');
```

### activateScene

激活指定场景，使其成为当前活动场景。

```javascript
activateScene(nameOrScene: string | Scene): void
```

#### 参数

- `nameOrScene`: 场景名称或场景实例

#### 示例

```javascript
engine.activateScene('主场景');
```

### getScene

获取指定名称的场景。

```javascript
getScene(name: string): Scene | undefined
```

#### 参数

- `name`: 场景名称

#### 返回值

- `Scene | undefined`: 找到的场景实例，如果不存在则返回 `undefined`

#### 示例

```javascript
const scene = engine.getScene('主场景');
```

### getAllScenes

获取所有场景。

```javascript
getAllScenes(): Scene[]
```

#### 返回值

- `Scene[]`: 所有场景的数组

#### 示例

```javascript
const scenes = engine.getAllScenes();
```

### getActiveScenes

获取所有激活的场景。

```javascript
getActiveScenes(): Scene[]
```

#### 返回值

- `Scene[]`: 所有激活场景的数组

#### 示例

```javascript
const activeScenes = engine.getActiveScenes();
```

### getCamera

获取主相机。

```javascript
getCamera(): Camera
```

#### 返回值

- `Camera`: 主相机实例

#### 示例

```javascript
const camera = engine.getCamera();
```

### getRenderer

获取渲染器。

```javascript
getRenderer(): THREE.WebGLRenderer | IRenderer
```

#### 返回值

- `THREE.WebGLRenderer | IRenderer`: 渲染器实例

#### 示例

```javascript
const renderer = engine.getRenderer();
```

### getPhysics

获取物理引擎。

```javascript
getPhysics(): IPhysics | null
```

#### 返回值

- `IPhysics | null`: 物理引擎实例，如果未初始化物理引擎则返回 `null`

#### 示例

```javascript
const physics = engine.getPhysics();
```

### setShowBoundingBoxes

设置是否显示包围盒。

```javascript
setShowBoundingBoxes(show: boolean): void
```

#### 参数

- `show`: 是否显示包围盒

#### 示例

```javascript
engine.setShowBoundingBoxes(true);
```

### initOrbitControls

初始化轨道控制器。

```javascript
initOrbitControls(): void
```

#### 示例

```javascript
engine.initOrbitControls();
```

### getOrbitControls

获取轨道控制器。

```javascript
getOrbitControls(): OrbitControls | null
```

#### 返回值

- `OrbitControls | null`: 轨道控制器实例，如果未初始化则返回 `null`

#### 示例

```javascript
const controls = engine.getOrbitControls();
```

### configureOrbitControls

配置轨道控制器。

```javascript
configureOrbitControls(config: Partial<OrbitControls>): void
```

#### 参数

- `config`: 轨道控制器配置

#### 示例

```javascript
engine.configureOrbitControls({
  enableDamping: true,
  dampingFactor: 0.05
});
```

## 静态方法

### getInstance

获取引擎实例（单例模式）。

```javascript
static getInstance(): Engine
```

#### 返回值

- `Engine`: 引擎实例

#### 示例

```javascript
const engine = Engine.getInstance();
```

## 事件

引擎会触发以下事件：

- `sceneAdded`: 当场景被添加时触发
- `sceneRemoved`: 当场景被移除时触发
- `sceneActivated`: 当场景被激活时触发
- `sceneDeactivated`: 当场景被停用时触发

## 完整示例

```javascript
import Engine from 'todot-engine/core/Engine';
import { Scene } from 'todot-engine/core/Scene';
import { CameraNode3D } from 'todot-engine/core/CameraNode3D';
import * as THREE from 'three';

// 创建引擎实例
const engine = await new Engine().init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true
});

// 创建场景
const scene = new Scene('主场景');
engine.addScene(scene);

// 创建相机
const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
  position: new THREE.Vector3(0, 5, 10)
});
scene.addNode(camera);

// 激活场景
engine.activateScene('主场景');

// 初始化轨道控制器
engine.initOrbitControls();

// 启动引擎
engine.start();
```
