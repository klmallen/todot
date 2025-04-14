# Node3d

`Node3d` 是 Todot 引擎中所有 3D 节点的基类，提供了基本的变换、层次结构和脚本功能。

## 导入

```javascript
import { Node3d } from 'todot-engine/core/Node3d';
```

## 构造函数

```javascript
constructor(name: string, options?: { position?: THREE.Vector3; rotation?: THREE.Euler })
```

### 参数

- `name`: 节点名称
- `options` (可选): 节点选项
  - `position` (可选): 初始位置
  - `rotation` (可选): 初始旋转

### 示例

```javascript
// 创建一个简单的节点
const node = new Node3d('我的节点');

// 创建一个带有初始位置和旋转的节点
const positionedNode = new Node3d('定位节点', {
  position: new THREE.Vector3(1, 2, 3),
  rotation: new THREE.Euler(0, Math.PI / 2, 0)
});
```

## 属性

### id

节点的唯一标识符。

```javascript
getId(): string
```

#### 示例

```javascript
const id = node.getId();
```

### name

节点名称。

```javascript
getName(): string
setName(name: string): void
```

#### 示例

```javascript
// 获取节点名称
const name = node.getName();

// 设置节点名称
node.setName('新名称');
```

### position

节点在 3D 空间中的位置。

```javascript
get position(): THREE.Vector3
set position(value: THREE.Vector3)
```

#### 示例

```javascript
// 获取位置
const position = node.position;

// 设置位置
node.position = new THREE.Vector3(1, 2, 3);

// 修改单个坐标
node.position.x = 5;

// 使用 setPosition 方法
node.setPosition(1, 2, 3);
```

### rotation

节点的旋转（欧拉角）。

```javascript
get rotation(): THREE.Euler
set rotation(value: THREE.Euler)
```

#### 示例

```javascript
// 获取旋转
const rotation = node.rotation;

// 设置旋转
node.rotation = new THREE.Euler(0, Math.PI, 0);

// 修改单个角度
node.rotation.y = Math.PI / 2;

// 使用 setRotation 方法
node.setRotation(0, Math.PI / 2, 0);
```

### quaternion

节点的旋转（四元数）。

```javascript
get quaternion(): THREE.Quaternion
set quaternion(value: THREE.Quaternion)
```

#### 示例

```javascript
// 获取四元数
const quaternion = node.quaternion;

// 设置四元数
node.quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0));

// 使用 setQuaternion 方法
node.setQuaternion(quaternion);
```

### scale

节点的缩放。

```javascript
get scale(): THREE.Vector3
set scale(value: THREE.Vector3)
```

#### 示例

```javascript
// 获取缩放
const scale = node.scale;

// 设置缩放
node.scale = new THREE.Vector3(2, 2, 2);

// 修改单个缩放值
node.scale.x = 1.5;

// 使用 setScale 方法
node.setScale(2, 2, 2);
```

### visible

节点是否可见。

```javascript
get visible(): boolean
set visible(value: boolean)
```

#### 示例

```javascript
// 检查节点是否可见
if (node.visible) {
  console.log('节点可见');
}

// 设置节点可见性
node.visible = false;

// 使用 setVisible 方法
node.setVisible(true);
```

### type

节点类型。

```javascript
getType(): string
setType(type: string): void
```

#### 示例

```javascript
// 获取节点类型
const type = node.getType();

// 设置节点类型
node.setType('CustomNode');
```

### tags

节点标签。

```javascript
getTags(): string[]
hasTag(tag: string): boolean
addTag(tag: string): void
removeTag(tag: string): void
```

#### 示例

```javascript
// 获取所有标签
const tags = node.getTags();

// 检查是否有特定标签
if (node.hasTag('enemy')) {
  console.log('这是一个敌人节点');
}

// 添加标签
node.addTag('interactive');

// 移除标签
node.removeTag('temporary');
```

## 方法

### 层次结构

#### getParent

获取父节点。

```javascript
getParent(): Node3d | null
```

##### 返回值

- `Node3d | null`: 父节点，如果没有则返回 `null`

##### 示例

```javascript
const parent = node.getParent();
```

#### getChildren

获取子节点。

```javascript
getChildren(): Node3d[]
```

##### 返回值

- `Node3d[]`: 子节点数组

##### 示例

```javascript
const children = node.getChildren();
```

#### addChild

添加子节点。

```javascript
addChild(child: Node3d): void
```

##### 参数

- `child`: 要添加的子节点

##### 示例

```javascript
const child = new Node3d('子节点');
parent.addChild(child);
```

#### removeChild

移除子节点。

```javascript
removeChild(child: Node3d): void
```

##### 参数

- `child`: 要移除的子节点

##### 示例

```javascript
parent.removeChild(child);
```

#### findChild

查找子节点。

```javascript
findChild(predicate: (node: Node3d) => boolean, recursive: boolean = false): Node3d | null
```

##### 参数

- `predicate`: 用于测试节点的函数
- `recursive` (可选): 是否递归查找，默认为 `false`

##### 返回值

- `Node3d | null`: 找到的节点，如果没有则返回 `null`

##### 示例

```javascript
// 查找名为 "武器" 的子节点
const weapon = character.findChild(node => node.getName() === '武器');

// 递归查找带有 "interactive" 标签的子节点
const interactive = scene.findChild(node => node.hasTag('interactive'), true);
```

### 脚本管理

#### addScript

添加脚本到节点。

```javascript
addScript(script: Script | object): Script
```

##### 参数

- `script`: 脚本实例或脚本对象

##### 返回值

- `Script`: 添加的脚本实例

##### 示例

```javascript
// 添加脚本对象
node.addScript({
  name: '旋转脚本',
  update: function(deltaTime) {
    node.rotation.y += deltaTime;
  }
});

// 添加脚本实例
import { Script } from 'todot-engine/core/Script/Script';
class RotationScript extends Script {
  update(deltaTime) {
    this.node.rotation.y += deltaTime;
  }
}
node.addScript(new RotationScript('旋转脚本'));
```

#### removeScript

移除脚本。

```javascript
removeScript(scriptOrName: Script | string): void
```

##### 参数

- `scriptOrName`: 要移除的脚本实例或脚本名称

##### 示例

```javascript
// 通过名称移除脚本
node.removeScript('旋转脚本');

// 通过实例移除脚本
node.removeScript(rotationScript);
```

#### getScripts

获取所有脚本。

```javascript
getScripts(): Script[]
```

##### 返回值

- `Script[]`: 脚本数组

##### 示例

```javascript
const scripts = node.getScripts();
```

#### hasScript

检查节点是否有指定脚本。

```javascript
hasScript(predicate: string | ((script: Script) => boolean)): boolean
```

##### 参数

- `predicate`: 脚本名称或用于测试脚本的函数

##### 返回值

- `boolean`: 如果有匹配的脚本则返回 `true`，否则返回 `false`

##### 示例

```javascript
// 通过名称检查
if (node.hasScript('移动脚本')) {
  console.log('节点有移动脚本');
}

// 通过函数检查
if (node.hasScript(script => script.name.includes('AI'))) {
  console.log('节点有 AI 相关脚本');
}
```

### 变换

#### setPosition

设置节点位置。

```javascript
setPosition(x: number, y: number, z: number): void
```

##### 参数

- `x`: X 坐标
- `y`: Y 坐标
- `z`: Z 坐标

##### 示例

```javascript
node.setPosition(1, 2, 3);
```

#### setRotation

设置节点旋转（欧拉角）。

```javascript
setRotation(x: number, y: number, z: number): void
```

##### 参数

- `x`: X 轴旋转（弧度）
- `y`: Y 轴旋转（弧度）
- `z`: Z 轴旋转（弧度）

##### 示例

```javascript
node.setRotation(0, Math.PI / 2, 0);
```

#### setScale

设置节点缩放。

```javascript
setScale(x: number, y: number, z: number): void
```

##### 参数

- `x`: X 轴缩放
- `y`: Y 轴缩放
- `z`: Z 轴缩放

##### 示例

```javascript
node.setScale(2, 2, 2);
```

#### lookAt

使节点朝向目标点。

```javascript
lookAt(target: THREE.Vector3 | Node3d): void
```

##### 参数

- `target`: 目标点或目标节点

##### 示例

```javascript
// 朝向一个点
node.lookAt(new THREE.Vector3(0, 0, 10));

// 朝向另一个节点
node.lookAt(targetNode);
```

#### getWorldPosition

获取节点的世界坐标位置。

```javascript
getWorldPosition(target?: THREE.Vector3): THREE.Vector3
```

##### 参数

- `target` (可选): 存储结果的向量

##### 返回值

- `THREE.Vector3`: 世界坐标位置

##### 示例

```javascript
const worldPos = node.getWorldPosition();
```

#### getWorldQuaternion

获取节点的世界四元数。

```javascript
getWorldQuaternion(target?: THREE.Quaternion): THREE.Quaternion
```

##### 参数

- `target` (可选): 存储结果的四元数

##### 返回值

- `THREE.Quaternion`: 世界四元数

##### 示例

```javascript
const worldQuat = node.getWorldQuaternion();
```

#### getWorldScale

获取节点的世界缩放。

```javascript
getWorldScale(target?: THREE.Vector3): THREE.Vector3
```

##### 参数

- `target` (可选): 存储结果的向量

##### 返回值

- `THREE.Vector3`: 世界缩放

##### 示例

```javascript
const worldScale = node.getWorldScale();
```

### 动画

#### animate

创建属性动画。

```javascript
animate(property: string, targetValue: any, duration: number, easing?: Function): Promise<void>
```

##### 参数

- `property`: 要动画的属性路径
- `targetValue`: 目标值
- `duration`: 动画持续时间（秒）
- `easing` (可选): 缓动函数

##### 返回值

- `Promise<void>`: 动画完成时解析的 Promise

##### 示例

```javascript
// 位置动画
await node.animate('position.y', 5, 2);

// 旋转动画
await node.animate('rotation.y', Math.PI, 1);

// 带缓动的缩放动画
await node.animate('scale', new THREE.Vector3(2, 2, 2), 1.5, t => t * t);
```

#### moveTowards

匀速移动到目标位置。

```javascript
moveTowards(targetPosition: THREE.Vector3, speed: number, deltaTime: number): boolean
```

##### 参数

- `targetPosition`: 目标位置
- `speed`: 移动速度（单位/秒）
- `deltaTime`: 帧时间间隔

##### 返回值

- `boolean`: 是否已到达目标位置

##### 示例

```javascript
// 在更新循环中使用
node.addScript({
  update: function(deltaTime) {
    const targetReached = node.moveTowards(
      new THREE.Vector3(0, 0, 10),
      5, // 速度为 5 单位/秒
      deltaTime
    );
    
    if (targetReached) {
      console.log('到达目标位置');
    }
  }
});
```

### THREE.js 集成

#### getThreeObject

获取节点的 THREE.Object3D 对象。

```javascript
getThreeObject(): THREE.Object3D
```

##### 返回值

- `THREE.Object3D`: THREE.js 对象

##### 示例

```javascript
const threeObject = node.getThreeObject();
```

### 生命周期

#### onReady

当节点准备好时调用。

```javascript
onReady(): void
```

#### onStart

当节点开始时调用。

```javascript
onStart(): void
```

#### onEnterScene

当节点进入场景时调用。

```javascript
onEnterScene(): void
```

#### onExitScene

当节点退出场景时调用。

```javascript
onExitScene(): void
```

#### update

更新节点及其子节点。

```javascript
update(deltaTime: number): void
```

##### 参数

- `deltaTime`: 时间间隔（秒）

### 其他方法

#### clone

克隆节点。

```javascript
clone(): Node3d
```

##### 返回值

- `Node3d`: 克隆的节点

##### 示例

```javascript
const clonedNode = node.clone();
```

#### dispose

清理节点资源。

```javascript
dispose(): void
```

##### 示例

```javascript
node.dispose();
```

#### toJSON

序列化节点为 JSON。

```javascript
toJSON(): any
```

##### 返回值

- `any`: 节点的 JSON 表示

##### 示例

```javascript
const nodeData = node.toJSON();
```

## 完整示例

```javascript
import { Node3d } from 'todot-engine/core/Node3d';
import * as THREE from 'three';

// 创建父节点
const parent = new Node3d('父节点');
parent.setPosition(0, 0, 0);

// 创建子节点
const child = new Node3d('子节点');
child.setPosition(0, 2, 0);

// 添加子节点到父节点
parent.addChild(child);

// 添加旋转脚本
parent.addScript({
  name: '旋转脚本',
  update: function(deltaTime) {
    parent.rotation.y += deltaTime * 0.5;
  }
});

// 创建动画
async function animateNode() {
  // 上下移动动画
  await child.animate('position.y', 4, 1);
  await child.animate('position.y', 2, 1);
  
  // 递归调用，创建循环动画
  animateNode();
}

// 启动动画
animateNode();
```
