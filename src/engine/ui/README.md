# 属性面板功能

## 概述

属性面板是引擎中用于显示和编辑节点属性的工具。引擎会直接使用PropertyPanel类，在右侧创建一个容器，并通过内部的effect机制自动监听当前选中节点的变化，实时更新属性显示。

## 功能特点

- 默认在引擎初始化时自动创建并显示在右侧
- 使用Tweakpane库提供美观的控件界面
- 通过内部effect自动监听选中节点的变化
- 支持手动更新要显示的节点属性

## 使用方法

### 1. 在初始化引擎时自动创建属性面板

```javascript
// 初始化引擎 - 默认会创建属性面板
const engine = new Engine(canvas);
await engine.init();

// 如果不想显示属性面板，可以明确设置
const engine = new Engine(canvas);
await engine.init({
  showPropertyPanel: false
});
```

### 2. 手动创建或关闭属性面板

```javascript
// 创建属性面板
const panelContainer = engine.createPropertyPanel();

// 创建自定义位置和大小的属性面板
const customPanelContainer = engine.createPropertyPanel(
  container, // 可选，面板容器
  { top: '50px', right: '10px', width: '300px' }, // 可选，面板位置和尺寸
  node // 可选，要显示的节点
);

// 关闭属性面板
engine.closePropertyPanel();

// 获取属性面板容器元素
const panelContainer = engine.getPropertyPanelContainer();

// 获取属性面板实例
const panel = engine.getPropertyPanel();

// 手动更新属性面板显示的节点
engine.updatePropertyPanelNode(myNode);
```

### 3. 快捷键支持

要启用属性面板快捷键支持，需要在引擎初始化时指定：

```javascript
// 在引擎初始化时启用属性面板快捷键
engine.init({
  // 其他选项...
  enablePropertyPanelShortcuts: true
});

// 或者单独启用快捷键
engine.initPropertyPanelShortcuts();
```

启用后，可以使用以下快捷键：

- `Ctrl+P`: 关闭属性面板

## 示例

查看以下示例了解完整用法：
- `src/examples/propertyPanelExample.js` - JavaScript示例
- `src/examples/propertyPanelExample.html` - HTML示例

## API 参考

### Engine类属性面板相关方法

| 方法 | 描述 |
|------|------|
| `createPropertyPanel(container?, position?, node?)` | 创建并显示属性面板，返回容器元素 |
| `closePropertyPanel()` | 关闭并移除属性面板 |
| `getPropertyPanelContainer()` | 获取属性面板容器元素 |
| `getPropertyPanel()` | 获取属性面板实例 |
| `updatePropertyPanelNode(node)` | 更新属性面板显示的节点 |
| `initPropertyPanelShortcuts()` | 初始化属性面板快捷键支持 |
```