import { Editor } from './engine/Editor';
import { PropertyPanel } from './engine/ui/PropertyPanel.tsx';
import { test } from './engine/ui/SceneTreeView/index.tsx';
// import register from "preact-custom-element"
import './engine/ui/SceneTreeView/index.tsx'

/**
// import './style.css';

/**
 * 等待DOM加载完成
 */
document.addEventListener('DOMContentLoaded', () => {
  // 获取编辑器容器
  const editorContainer = document.getElementById('editor-container');
   
  // 如果没有找到容器，则创建一个
  if (!editorContainer) {
    console.warn('未找到编辑器容器，创建一个新的容器');
    const newContainer = document.createElement('div');
    newContainer.id = 'editor-container';
    newContainer.style.width = '100vw';
    newContainer.style.height = '100vh';


    document.body.appendChild(newContainer);
    newContainer.innerHTML = `
    `
   
    
    // 初始化编辑器
    initEditor(newContainer);
  } else {
    // 初始化编辑器
    initEditor(editorContainer);
  }
});

/**
 * 初始化编辑器
 * @param container 容器元素
 */
function initEditor(container: HTMLElement): void {
  console.log('初始化编辑器...');
  
  try {
    // 创建编辑器实例
    const editor = new Editor(container);
    
    // 保存到全局变量，方便调试
    (window as any).editor = editor;
    
    // 处理键盘快捷键
    initKeyboardShortcuts(editor);
    
    console.log('编辑器初始化完成');
  } catch (error) {
    console.error('编辑器初始化失败:', error);
    
    // 显示错误信息
    container.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h2>编辑器初始化失败</h2>
        <p>${error}</p>
      </div>
    `;
  }
}

/**
 * 初始化键盘快捷键
 * @param editor 编辑器实例
 */
function initKeyboardShortcuts(editor: Editor): void {
  document.addEventListener('keydown', (event) => {
    // 如果是在输入框中，不处理快捷键
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Ctrl/Cmd + S: 保存场景
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      editor.saveScene();
    }
    
    // Ctrl/Cmd + N: 新建场景
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault();
      editor.createNewScene();
    }
    
    // Ctrl/Cmd + O: 打开场景
    if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
      event.preventDefault();
      editor.openScene();
    }
    
    // Delete: 删除选中对象
    if (event.key === 'Delete') {
      editor.deleteSelected();
    }
    
    // Ctrl/Cmd + D: 复制选中对象
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      editor.duplicateSelected();
    }
    
    // W: 位移模式
    if (event.key === 'w' && !event.ctrlKey && !event.metaKey) {
      editor.setTransformMode('translate');
    }
    
    // E: 旋转模式
    if (event.key === 'e' && !event.ctrlKey && !event.metaKey) {
      editor.setTransformMode('rotate');
    }
    
    // R: 缩放模式
    if (event.key === 'r' && !event.ctrlKey && !event.metaKey) {
      editor.setTransformMode('scale');
    }
    
    // Space: 播放/暂停
    if (event.key === ' ' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      editor.togglePlay();
    }
  });
}