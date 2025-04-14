# Scene

`Scene` 类表示一个 3D 场景，负责管理节点树、提供节点管理和更新功能。

## 导入

```javascript
import { Scene } from 'todot-engine/core/Scene';
```

## 构造函数

```javascript
constructor(name: string = '默认场景')
```

### 参数

- `name` (可选): 场景名称，默认为 '默认场景'

### 示例

```javascript
// 创建一个名为 "游戏场景" 的场景
const scene = new Scene('游戏场景');
```

## 属性

### name

场景名称。

```javascript
getName(): string
setName(name: string): void
```

#### 示例

```javascript
// 获取场景名称
const name = scene.getName();

// 设置场景名称
scene.setName('新场景名称');
```

### active

场景是否激活。

```javascript
isActive(): boolean
```

#### 示例

```javascript
// 检查场景是否激活
if (scene.isActive()) {
  console.log('场景已激活');
}
```

## 方法

### 节点管理

#### addNode

添加节点到场景。

```javascript
addNode(node: Node3d): void
```

##### 参数

- `node`: 要添加的节点

##### 示例

```javascript
const cube = new MeshInstance3D('立方体', geometry, material);
scene.addNode(cube);
```

#### removeNode

从场景移除节点。

```javascript
removeNode(node: Node3d): void
```

##### 参数

- `node`: 要移除的节点

##### 示例

```javascript
scene.removeNode(cube);
```

#### getNodeById

根据 ID 获取节点。

```javascript
getNodeById(id: string): Node3d | undefined
```

##### 参数

- `id`: 节点 ID

##### 返回值

- `Node3d | undefined`: 找到的节点，如果不存在则返回 `undefined`

##### 示例

```javascript
const node = scene.getNodeById('node-123');
```

#### getNodeByName

根据名称获取节点。

```javascript
getNodeByName(name: string): Node3d | undefined
```

##### 参数

- `name`: 节点名称

##### 返回值

- `Node3d | undefined`: 找到的节点，如果不存在则返回 `undefined`

##### 示例

```javascript
const node = scene.getNodeByName('立方体');
```

#### getNodesByType

获取指定类型的所有节点。

```javascript
getNodesByType(type: string): Node3d[]
```

##### 参数

- `type`: 节点类型

##### 返回值

- `Node3d[]`: 指定类型的节点数组

##### 示例

```javascript
const meshes = scene.getNodesByType('MeshInstance3D');
```

#### getNodesByTag

获取带有指定标签的所有节点。

```javascript
getNodesByTag(tag: string): Node3d[]
```

##### 参数

- `tag`: 节点标签

##### 返回值

- `Node3d[]`: 带有指定标签的节点数组

##### 示例

```javascript
const enemies = scene.getNodesByTag('enemy');
```

#### getAllNodes

获取所有节点。

```javascript
getAllNodes(): Node3d[]
```

##### 返回值

- `Node3d[]`: 所有节点的数组

##### 示例

```javascript
const allNodes = scene.getAllNodes();
```

#### findNode

使用自定义函数查找节点。

```javascript
findNode(predicate: (node: Node3d) => boolean): Node3d | undefined
```

##### 参数

- `predicate`: 用于测试节点的函数

##### 返回值

- `Node3d | undefined`: 第一个满足条件的节点，如果没有则返回 `undefined`

##### 示例

```javascript
const redCube = scene.findNode(node => 
  node.getType() === 'MeshInstance3D' && 
  node.getMaterial().color.equals(new THREE.Color('red'))
);
```

#### findNodes

使用自定义函数查找多个节点。

```javascript
findNodes(predicate: (node: Node3d) => boolean): Node3d[]
```

##### 参数

- `predicate`: 用于测试节点的函数

##### 返回值

- `Node3d[]`: 所有满足条件的节点数组

##### 示例

```javascript
const movingObjects = scene.findNodes(node => 
  node.hasScript(script => script.name === 'Movement')
);
```

### 场景管理

#### activate

激活场景。

```javascript
activate(): void
```

##### 示例

```javascript
scene.activate();
```

#### deactivate

停用场景。

```javascript
deactivate(): void
```

##### 示例

```javascript
scene.deactivate();
```

#### update

更新场景及其所有节点。

```javascript
update(deltaTime: number): void
```

##### 参数

- `deltaTime`: 时间间隔（秒）

##### 示例

```javascript
// 通常由引擎自动调用，不需要手动调用
scene.update(0.016); // 更新场景，假设帧率为 60 FPS
```

### THREE.js 集成

#### getThreeObject

获取场景的 THREE.Scene 对象。

```javascript
getThreeObject(): THREE.Scene
```

##### 返回值

- `THREE.Scene`: THREE.js 场景对象

##### 示例

```javascript
const threeScene = scene.getThreeObject();
```

#### add

添加 THREE.Object3D 对象到场景。

```javascript
add(threeObject: THREE.Object3D): void
```

##### 参数

- `threeObject`: THREE.js 对象

##### 示例

```javascript
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
```

#### remove

从场景移除 THREE.Object3D 对象。

```javascript
remove(threeObject: THREE.Object3D): void
```

##### 参数

- `threeObject`: THREE.js 对象

##### 示例

```javascript
scene.remove(mesh);
```

### 事件系统

#### on

添加事件监听器。

```javascript
on(event: string, callback: Function): void
```

##### 参数

- `event`: 事件名称
- `callback`: 回调函数

##### 示例

```javascript
scene.on('nodeAdded', (node) => {
  console.log(`节点 ${node.getName()} 已添加到场景`);
});
```

#### off

移除事件监听器。

```javascript
off(event: string, callback: Function): void
```

##### 参数

- `event`: 事件名称
- `callback`: 回调函数

##### 示例

```javascript
scene.off('nodeAdded', callback);
```

### 其他方法

#### dispose

清理场景。

```javascript
dispose(): void
```

##### 示例

```javascript
// 清理场景资源
scene.dispose();
```

#### toJSON

序列化场景为 JSON。

```javascript
toJSON(): any
```

##### 返回值

- `any`: 场景的 JSON 表示

##### 示例

```javascript
const sceneData = scene.toJSON();
```

## 事件

场景会触发以下事件：

- `nodeAdded`: 当节点被添加到场景时触发
- `nodeRemoved`: 当节点从场景移除时触发
- `activated`: 当场景被激活时触发
- `deactivated`: 当场景被停用时触发
- `nameChanged`: 当场景名称改变时触发

## 完整示例

```javascript
import { Scene } from 'todot-engine/core/Scene';
import { MeshInstance3D } from 'todot-engine/core/MeshInstance3D';
import { CameraNode3D } from 'todot-engine/core/CameraNode3D';
import * as THREE from 'three';

// 创建场景
const scene = new Scene('游戏场景');

// 创建相机
const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
  position: new THREE.Vector3(0, 5, 10)
});
scene.addNode(camera);

// 创建立方体
const cube = new MeshInstance3D(
  '立方体',
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
scene.addNode(cube);

// 监听节点添加事件
scene.on('nodeAdded', (node) => {
  console.log(`节点 ${node.getName()} 已添加到场景`);
});

// 激活场景
scene.activate();
```
