# 粒子系统

粒子系统是 Todot Engine 中用于创建各种视觉效果的强大工具，如火焰、烟雾、魔法效果、雪花等。本指南将帮助你了解如何使用粒子系统创建丰富的视觉效果。

## 基本概念

粒子系统由以下几个主要部分组成：

1. **发射器**：控制粒子的生成位置、方向和速度
2. **粒子属性**：定义粒子的外观和行为，如大小、颜色、生命周期等
3. **渲染器**：负责将粒子渲染到屏幕上
4. **更新逻辑**：控制粒子随时间的变化，如位置、大小、颜色等

## 创建基本粒子系统

### 导入必要的类

```javascript
import { ParticleSystem } from 'todot-engine/core/ParticleSystem/ParticleSystem';
import { MinMaxCurve } from 'todot-engine/core/ParticleSystem/Curves/MinMaxCurve';
import { ColorCurve } from 'todot-engine/core/ParticleSystem/Curves/ColorCurve';
import { GradientCurve } from 'todot-engine/core/ParticleSystem/Curves/GradientCurve';
import * as THREE from 'three';
```

### 创建粒子系统节点

```javascript
// 创建粒子系统节点
const particleSystem = new ParticleSystem('基础粒子系统');

// 设置位置
particleSystem.position.set(0, 1, 0);

// 配置粒子系统
const settings = {
  duration: 5.0,           // 粒子系统持续时间（秒）
  loop: true,              // 是否循环播放
  startLifetime: new MinMaxCurve(2.0, 4.0),  // 粒子生命周期范围
  startSpeed: new MinMaxCurve(1.0, 3.0),     // 粒子初始速度范围
  startSize: new MinMaxCurve(0.1, 0.3),      // 粒子初始大小范围
  startColor: new ColorCurve(               // 粒子初始颜色范围
    new THREE.Color(0.8, 0.8, 1.0),
    new THREE.Color(0.5, 0.5, 1.0)
  ),
  emission: {
    rateOverTime: 20       // 每秒发射的粒子数量
  },
  shape: {
    type: 'Cone',          // 发射器形状
    params: {
      cone: {
        angle: 25,         // 锥体角度
        radius: 0.5,       // 锥体半径
        length: 1.0,       // 锥体长度
        emitFrom: 'Base'   // 从锥体底部发射
      }
    },
    randomizeDirection: true,  // 随机化方向
    directionScale: 1.0        // 方向缩放
  },
  renderer: {
    renderMode: 'Billboard',   // 渲染模式
    blending: true,            // 启用混合
    blendMode: THREE.AdditiveBlending  // 加法混合模式
  }
};

// 应用设置
particleSystem.setSettings(settings);

// 添加到场景
scene.addNode(particleSystem);

// 播放粒子系统
particleSystem.play();
```

## 粒子系统设置

### 基本设置

- **duration**: 粒子系统的持续时间（秒）
- **loop**: 是否循环播放
- **playOnAwake**: 是否在添加到场景时自动播放
- **prewarm**: 是否预热粒子系统（仅在循环模式下有效）
- **startDelay**: 开始播放前的延迟时间
- **playbackSpeed**: 播放速度倍率
- **maxParticles**: 最大粒子数量
- **simulationSpace**: 模拟空间，可以是 'Local' 或 'World'

### 粒子属性

- **startLifetime**: 粒子的生命周期
- **startSpeed**: 粒子的初始速度
- **startSize**: 粒子的初始大小
- **startRotation**: 粒子的初始旋转
- **startColor**: 粒子的初始颜色
- **gravityModifier**: 重力影响系数
- **useGravity**: 是否受重力影响

### 发射设置

- **emission.rateOverTime**: 每秒发射的粒子数量
- **emission.bursts**: 粒子爆发设置，可以在特定时间点发射大量粒子

### 形状设置

粒子系统支持多种发射器形状：

- **Cone**: 锥形发射器
- **Sphere**: 球形发射器
- **Box**: 盒形发射器
- **Circle**: 圆形发射器
- **Edge**: 边缘发射器
- **Point**: 点发射器

每种形状都有特定的参数，例如：

```javascript
shape: {
  type: 'Sphere',
  params: {
    sphere: {
      radius: 1.0,
      emitFrom: 'Shell'  // 'Shell', 'Volume'
    }
  }
}
```

### 随时间变化的属性

粒子系统允许粒子的属性随时间变化：

- **sizeOverLifetime**: 粒子大小随生命周期的变化
- **colorOverLifetime**: 粒子颜色随生命周期的变化
- **rotationOverLifetime**: 粒子旋转速度随生命周期的变化
- **velocityOverLifetime**: 粒子速度随生命周期的变化

例如：

```javascript
// 大小随生命周期变化
sizeOverLifetime: new GradientCurve([
  { time: 0, value: 1.0 },
  { time: 0.5, value: 1.5 },
  { time: 1.0, value: 0.0 }
]),

// 颜色随生命周期变化
colorOverLifetime: new ColorCurve(
  new THREE.Color(1.0, 0.7, 0.3),
  new THREE.Color(0.7, 0.1, 0.0)
)
```

### 渲染设置

- **renderer.renderMode**: 渲染模式，可以是 'Billboard'（公告板）或 'Mesh'（网格）
- **renderer.blending**: 是否启用混合
- **renderer.blendMode**: 混合模式，如 THREE.AdditiveBlending
- **renderer.mesh**: 当 renderMode 为 'Mesh' 时使用的网格

## 曲线类型

Todot Engine 提供了几种曲线类型来控制粒子属性：

### MinMaxCurve

用于定义一个范围内的随机值：

```javascript
// 在 1.0 到 2.0 之间的随机值
new MinMaxCurve(1.0, 2.0)
```

### ColorCurve

用于定义颜色渐变：

```javascript
// 从红色渐变到蓝色
new ColorCurve(
  new THREE.Color(1.0, 0.0, 0.0),
  new THREE.Color(0.0, 0.0, 1.0)
)
```

### GradientCurve

用于定义随时间变化的数值：

```javascript
// 值随时间的变化
new GradientCurve([
  { time: 0, value: 0.0 },
  { time: 0.5, value: 1.0 },
  { time: 1.0, value: 0.0 }
])
```

## 常见效果示例

### 火焰效果

```javascript
const fireSettings = {
  duration: 5.0,
  loop: true,
  startLifetime: new MinMaxCurve(0.6, 1.2),
  startSpeed: new MinMaxCurve(1.0, 2.0),
  startSize: new MinMaxCurve(0.5, 1.0),
  startColor: new ColorCurve(
    new THREE.Color(1.0, 0.7, 0.3),
    new THREE.Color(1.0, 0.3, 0.1)
  ),
  emission: {
    rateOverTime: 40
  },
  shape: {
    type: 'Cone',
    params: {
      cone: {
        angle: 15,
        radius: 0.2,
        length: 0.5,
        emitFrom: 'Base'
      }
    }
  },
  sizeOverLifetime: new GradientCurve([
    { time: 0, value: 0.5 },
    { time: 0.3, value: 1.0 },
    { time: 1.0, value: 0.0 }
  ]),
  colorOverLifetime: new ColorCurve(
    new THREE.Color(1.0, 0.7, 0.3),
    new THREE.Color(0.7, 0.1, 0.0)
  ),
  renderer: {
    renderMode: 'Billboard',
    blending: true,
    blendMode: THREE.AdditiveBlending
  }
};

const fireSystem = new ParticleSystem('火焰');
fireSystem.setSettings(fireSettings);
scene.addNode(fireSystem);
fireSystem.play();
```

### 烟雾效果

```javascript
const smokeSettings = {
  duration: 5.0,
  loop: true,
  startLifetime: new MinMaxCurve(3.0, 5.0),
  startSpeed: new MinMaxCurve(0.5, 1.0),
  startSize: new MinMaxCurve(1.0, 2.0),
  startRotation: new MinMaxCurve(0, Math.PI * 2),
  startColor: new ColorCurve(
    new THREE.Color(0.7, 0.7, 0.7, 0.7),
    new THREE.Color(0.5, 0.5, 0.5, 0.5)
  ),
  emission: {
    rateOverTime: 10
  },
  shape: {
    type: 'Cone',
    params: {
      cone: {
        angle: 15,
        radius: 0.2,
        length: 0.1,
        emitFrom: 'Base'
      }
    }
  },
  sizeOverLifetime: new GradientCurve([
    { time: 0, value: 0.5 },
    { time: 0.5, value: 1.5 },
    { time: 1.0, value: 2.0 }
  ]),
  colorOverLifetime: new ColorCurve(
    new THREE.Color(0.7, 0.7, 0.7, 0.7),
    new THREE.Color(0.5, 0.5, 0.5, 0)
  ),
  rotationOverLifetime: new MinMaxCurve(-0.1, 0.1),
  useGravity: false,
  renderer: {
    renderMode: 'Billboard',
    blending: true,
    blendMode: THREE.NormalBlending
  }
};

const smokeSystem = new ParticleSystem('烟雾');
smokeSystem.setSettings(smokeSettings);
scene.addNode(smokeSystem);
smokeSystem.play();
```

### 雪花效果

```javascript
const snowSettings = {
  duration: 5.0,
  loop: true,
  startLifetime: new MinMaxCurve(10.0, 15.0),
  startSpeed: new MinMaxCurve(0.5, 1.5),
  startSize: new MinMaxCurve(0.05, 0.15),
  startRotation: new MinMaxCurve(0, Math.PI * 2),
  startColor: new ColorCurve(
    new THREE.Color(1.0, 1.0, 1.0),
    new THREE.Color(0.9, 0.9, 1.0)
  ),
  emission: {
    rateOverTime: 30
  },
  shape: {
    type: 'Box',
    params: {
      box: {
        width: 10,
        height: 0.1,
        depth: 10,
        emitFrom: 'Volume'
      }
    }
  },
  rotationOverLifetime: new MinMaxCurve(-0.1, 0.1),
  useGravity: true,
  gravityModifier: 0.1,
  renderer: {
    renderMode: 'Billboard',
    blending: true,
    blendMode: THREE.NormalBlending
  }
};

const snowSystem = new ParticleSystem('雪花');
snowSystem.setPosition(0, 10, 0);
snowSystem.setSettings(snowSettings);
scene.addNode(snowSystem);
snowSystem.play();
```

## 自定义网格粒子

除了默认的公告板粒子，你还可以使用自定义网格作为粒子：

```javascript
// 创建自定义网格
const customMesh = new THREE.TorusKnotGeometry(0.2, 0.05, 32, 8);

// 配置粒子系统
const settings = {
  // ... 其他设置 ...
  renderer: {
    renderMode: 'Mesh',
    mesh: customMesh,
    blending: true,
    blendMode: THREE.AdditiveBlending
  }
};

// 应用设置
particleSystem.setSettings(settings);

// 设置自定义网格
particleSystem.setCustomMesh(customMesh);
```

## 使用 3D 模型作为粒子

你可以使用 ModelLoader3D 加载 3D 模型，并将其几何体用作粒子：

```javascript
// 创建粒子系统
const particleSystem = new ParticleSystem('模型粒子系统');
particleSystem.position.set(0, 1, 0);

// 使用默认几何体作为占位符
const defaultMesh = new THREE.IcosahedronGeometry(0.1, 0);
particleSystem.setCustomMesh(defaultMesh);

// 配置粒子系统
const settings = {
  // ... 基本设置 ...
  renderer: {
    renderMode: 'Mesh',
    mesh: defaultMesh,
    blending: true,
    blendMode: THREE.AdditiveBlending
  }
};
particleSystem.setSettings(settings);

// 加载模型
const modelLoader = new ModelLoader3D('粒子模型', 'models/your_model.glb');

// 设置模型加载完成后的回调
modelLoader.setOnLoaded((loadedModel) => {
  // 遍历模型查找第一个网格
  let modelGeometry = null;
  
  loadedModel.traverse((child) => {
    if (child instanceof THREE.Mesh && !modelGeometry) {
      modelGeometry = child.geometry;
    }
  });
  
  if (modelGeometry) {
    // 设置粒子系统使用这个模型网格
    particleSystem.setCustomMesh(modelGeometry);
  }
});

// 将模型加载器添加到场景
scene.addNode(modelLoader);
```

## 粒子系统事件

粒子系统提供了几个事件回调：

```javascript
// 设置完成回调
particleSystem.onComplete(() => {
  console.log('粒子系统播放完成');
});

// 设置循环回调
particleSystem.onLoop(() => {
  console.log('粒子系统循环');
});
```

## 控制粒子系统

### 播放和暂停

```javascript
// 播放粒子系统
particleSystem.play();

// 暂停粒子系统
particleSystem.pause();

// 停止粒子系统
particleSystem.stop();

// 重置粒子系统
particleSystem.reset();
```

### 检查状态

```javascript
// 检查是否正在播放
if (particleSystem.isPlaying()) {
  console.log('粒子系统正在播放');
}

// 检查是否已暂停
if (particleSystem.isPaused()) {
  console.log('粒子系统已暂停');
}
```

## 性能优化

1. **限制粒子数量**：使用 `maxParticles` 设置合理的粒子数量上限
2. **简化粒子网格**：使用低多边形网格作为粒子
3. **使用纹理代替几何体**：对于远处的效果，使用纹理可能比使用几何体更高效
4. **调整发射率**：根据需要调整 `rateOverTime`，避免不必要的粒子
5. **使用对象池**：对于频繁创建和销毁的粒子系统，考虑使用对象池

## 总结

Todot Engine 的粒子系统提供了强大而灵活的工具，可以创建各种视觉效果。通过组合不同的设置，你可以创建从简单的火花到复杂的魔法效果的各种效果。

记住，创建好的粒子效果需要反复调整和测试。不要害怕尝试不同的参数组合，直到你得到满意的效果！
