# Todot Engine 编辑器UI组件

Todot Engine是一个基于WebGL/WebGPU的3D游戏引擎。这个组件提供了编辑器UI功能，使得开发者可以在浏览器中直接编辑和调试3D场景。

## 特性

- 播放/停止按钮，控制场景运行
- 变换工具（移动、旋转、缩放）
- 对象选择器
- 属性面板，使用Tweakpane实时编辑对象属性

## 使用方法

### 方法1：使用Web Component

你可以直接在HTML中使用`todot-editor-ui`标签：

```html
<!-- 将引擎实例注册为全局变量 -->
<script>
  // 初始化引擎等操作...
  window.myEngine = engine;
</script>

<!-- 使用Web Component -->
<todot-editor-ui engine-id="myEngine"></todot-editor-ui>
```

### 方法2：使用引擎的createEditorUI方法

```javascript
import Engine from 'todot-engine/core/Engine';

// 初始化引擎
const engine = new Engine(canvas);
await engine.init();

// 创建场景及对象...

// 一行代码添加编辑器UI
engine.createEditorUI();
```

### 方法3：使用createEditorUI函数

```javascript
import { createEditorUI } from 'todot-engine/ui';
import Engine from 'todot-engine/core/Engine';

// 初始化引擎
const engine = new Engine(canvas);
await engine.init();

// 创建编辑器UI并手动添加到DOM
const editorUI = createEditorUI(engine);
document.body.appendChild(editorUI);
```

### 方法4：传统方式（不推荐）

```javascript
import { initEditorUI } from 'todot-engine/ui';
import Engine from 'todot-engine/core/Engine';

// 初始化引擎
const engine = new Engine(canvas);
await engine.init();

// 创建容器元素
const container = document.createElement('div');
container.style.position = 'absolute';
container.style.top = '0';
container.style.left = '0';
container.style.width = '100%';
container.style.height = '100%';
document.body.appendChild(container);

// 初始化编辑器UI
initEditorUI(container, engine);
```

## 开发

如需扩展编辑器UI功能，请参考以下文件：

- `src/engine/ui/EditorUIElement.ts` - Web Component实现
- `src/engine/ui/EditorUI.tsx` - React组件实现
- `src/engine/ui/EditorToolbar.tsx` - 工具栏组件
- `src/engine/ui/PropertyPanel.tsx` - 属性面板组件

## 注意事项

- 编辑器UI组件需要React和ReactDOM支持
- 编辑器UI组件仅在编辑模式下显示
- 对象选择需要在引擎初始化时启用，通常可以在引擎初始化选项中设置
- 在生产环境中，可能需要移除编辑器UI相关代码以减少最终包的大小 