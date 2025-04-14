# 安装

本指南将帮助你安装和设置 Todot Engine。

## 系统要求

Todot Engine 是一个基于 Web 的 3D 引擎，因此需要以下环境：

- **浏览器**：支持 WebGL 2.0 的现代浏览器（Chrome、Firefox、Edge、Safari 等）
- **开发环境**：Node.js 14.0 或更高版本
- **构建工具**：推荐使用 Vite、Webpack 或 Parcel

对于 WebGPU 支持（可选）：
- 支持 WebGPU 的浏览器（Chrome 113+ 或 Edge 113+ 并启用 WebGPU 标志）

## 安装方法

### 使用 npm

最简单的安装方法是通过 npm：

```bash
npm install todot-engine three
```

Todot Engine 依赖于 Three.js，所以需要同时安装。

### 使用 CDN

你也可以通过 CDN 直接在 HTML 中引入：

```html
<script src="https://cdn.example.com/todot-engine.min.js"></script>
```

注意：请将上面的 URL 替换为实际的 CDN 地址。

### 从源代码构建

如果你想从源代码构建 Todot Engine，可以按照以下步骤操作：

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/todot-engine.git
cd todot-engine
```

2. 安装依赖：

```bash
npm install
```

3. 构建引擎：

```bash
npm run build
```

构建完成后，你可以在 `dist` 目录中找到构建好的文件。

## 项目设置

### 使用 Vite

1. 创建一个新的 Vite 项目：

```bash
npm create vite@latest my-todot-app -- --template vanilla-ts
cd my-todot-app
```

2. 安装 Todot Engine：

```bash
npm install todot-engine three
```

3. 在 `main.ts` 中导入和使用 Todot Engine：

```typescript
import Engine from 'todot-engine/core/Engine';
import { Scene } from 'todot-engine/core/Scene';
import { CameraNode3D } from 'todot-engine/core/CameraNode3D';
import * as THREE from 'three';

async function main() {
  // 创建引擎实例
  const engine = await new Engine().init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true
  });

  // 创建场景
  const scene = new Scene('我的场景');
  engine.addScene(scene);
  engine.activateScene('我的场景');

  // 创建相机
  const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
    position: new THREE.Vector3(0, 5, 10),
    rotation: new THREE.Euler(-0.2, 0, 0)
  });
  scene.addNode(camera);

  // 启动引擎
  engine.start();
}

main();
```

4. 启动开发服务器：

```bash
npm run dev
```

### 使用 Webpack

1. 创建一个新的项目目录：

```bash
mkdir my-todot-app
cd my-todot-app
npm init -y
```

2. 安装 Webpack 和相关依赖：

```bash
npm install webpack webpack-cli webpack-dev-server typescript ts-loader html-webpack-plugin --save-dev
npm install todot-engine three
```

3. 创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

4. 创建 `webpack.config.js`：

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true,
    port: 9000
  }
};
```

5. 创建 `src/index.html`：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todot Engine App</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
</body>
</html>
```

6. 创建 `src/index.ts`：

```typescript
import Engine from 'todot-engine/core/Engine';
import { Scene } from 'todot-engine/core/Scene';
import { CameraNode3D } from 'todot-engine/core/CameraNode3D';
import * as THREE from 'three';

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  
  // 创建引擎实例
  const engine = await new Engine(canvas).init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true
  });

  // 创建场景
  const scene = new Scene('我的场景');
  engine.addScene(scene);
  engine.activateScene('我的场景');

  // 创建相机
  const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
    position: new THREE.Vector3(0, 5, 10),
    rotation: new THREE.Euler(-0.2, 0, 0)
  });
  scene.addNode(camera);

  // 启动引擎
  engine.start();
}

main();
```

7. 添加 npm 脚本到 `package.json`：

```json
"scripts": {
  "start": "webpack serve",
  "build": "webpack --mode production"
}
```

8. 启动开发服务器：

```bash
npm start
```

## 验证安装

要验证 Todot Engine 是否正确安装，可以创建一个简单的场景：

```typescript
import Engine from 'todot-engine/core/Engine';
import { Scene } from 'todot-engine/core/Scene';
import { CameraNode3D } from 'todot-engine/core/CameraNode3D';
import { MeshInstance3D } from 'todot-engine/core/MeshInstance3D';
import * as THREE from 'three';

async function main() {
  // 创建引擎实例
  const engine = await new Engine().init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true
  });

  // 创建场景
  const scene = new Scene('测试场景');
  engine.addScene(scene);
  engine.activateScene('测试场景');

  // 创建相机
  const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
    position: new THREE.Vector3(0, 5, 10),
    rotation: new THREE.Euler(-0.2, 0, 0)
  });
  scene.addNode(camera);

  // 创建一个旋转的立方体
  const cube = new MeshInstance3D(
    '立方体',
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
  );
  scene.addNode(cube);

  // 添加旋转脚本
  cube.addScript({
    update: function(deltaTime) {
      cube.rotation.y += deltaTime;
      cube.rotation.x += deltaTime * 0.5;
    }
  });

  // 启动引擎
  engine.start();

  // 如果一切正常，你应该能看到一个旋转的绿色立方体
  console.log('Todot Engine 初始化成功！');
}

main().catch(error => {
  console.error('初始化失败:', error);
});
```

如果你能看到一个旋转的绿色立方体，说明 Todot Engine 已经成功安装和配置。

## 故障排除

### 常见问题

1. **模块未找到错误**

   ```
   Error: Cannot find module 'todot-engine/core/Engine'
   ```

   解决方案：确保你已经正确安装了 Todot Engine，并且导入路径正确。

2. **WebGL 不支持**

   ```
   Error: WebGL not supported
   ```

   解决方案：确保你的浏览器支持 WebGL 2.0。你可以访问 [WebGL Report](https://webglreport.com/) 检查你的浏览器是否支持 WebGL。

3. **Three.js 版本不兼容**

   解决方案：Todot Engine 依赖于特定版本的 Three.js。确保你安装的 Three.js 版本与 Todot Engine 兼容。

### 获取帮助

如果你遇到其他问题，可以通过以下渠道获取帮助：

- **GitHub Issues**：在 [GitHub 仓库](https://github.com/yourusername/todot-engine/issues) 提交问题
- **社区论坛**：访问 [Todot Engine 论坛](https://forum.todot-engine.com)
- **Discord**：加入我们的 [Discord 社区](https://discord.gg/todot-engine)

## 下一步

现在你已经成功安装了 Todot Engine，可以继续学习：

- [快速开始](/guide/getting-started) - 创建你的第一个 Todot Engine 应用
- [基本概念](/guide/concepts) - 了解引擎的核心概念
- [场景管理](/guide/scenes) - 学习如何管理场景和节点
