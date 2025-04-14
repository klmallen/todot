# Todot Engine 文档

这是 Todot Engine 的官方文档，使用 [VitePress](https://vitepress.dev/) 构建。

## 开始使用

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run docs:dev
```

这将启动一个本地开发服务器，你可以在浏览器中访问 `http://localhost:5173` 查看文档。

### 构建文档

```bash
npm run docs:build
```

这将在 `.vitepress/dist` 目录中生成静态 HTML 文件。

### 预览构建结果

```bash
npm run docs:preview
```

## 文档结构

- `index.md`: 首页
- `guide/`: 指南文档
  - `index.md`: 介绍
  - `getting-started.md`: 快速开始
  - `installation.md`: 安装指南
  - `concepts.md`: 基本概念
  - ...
- `api/`: API 文档
  - `engine.md`: Engine 类
  - `scene.md`: Scene 类
  - `node3d.md`: Node3d 类
  - ...
- `examples/`: 示例
  - `index.md`: 示例索引
  - `particles.md`: 粒子系统示例
  - `physics.md`: 物理系统示例
  - ...

## 贡献指南

1. 创建一个新分支
2. 添加或修改文档
3. 提交更改
4. 创建 Pull Request

## 文档风格指南

- 使用 Markdown 语法
- 代码块使用三个反引号 ``` 并指定语言
- 使用相对路径链接到其他文档页面
- 图片放在 `public` 目录中

## 部署

文档会自动部署到 GitHub Pages。每次推送到 `main` 分支时，GitHub Actions 会自动构建并部署文档。

## 许可证

MIT
