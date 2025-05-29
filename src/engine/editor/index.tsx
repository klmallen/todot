/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:30:03
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-14 21:00:04
 * @FilePath: \todot\src\engine\editor\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleEditor from './SimpleEditor';

// 编辑器模式开关状态
let editorActive = false;
let editorContainer: HTMLElement | null = null;
let editorRoot: ReactDOM.Root | null = null;

/**
 * 启用编辑器模式
 * @param targetElement 可选的目标容器元素，默认为document.body
 */
export function enableEditor(targetElement?: HTMLElement): void {
  if (editorActive) return;
  
  // 创建编辑器容器
  if (!editorContainer) {
    editorContainer = document.createElement('div');
    editorContainer.id = 'todot-editor-container';
    editorContainer.style.position = 'absolute';
    editorContainer.style.top = '0';
    editorContainer.style.left = '0';
    editorContainer.style.width = '100%';
    editorContainer.style.height = '100%';
    editorContainer.style.zIndex = '1000';
    
    // 如果提供了目标元素，则附加到目标元素，否则附加到body
    const container = targetElement || document.body;
    container.appendChild(editorContainer);
  }
  
  // 渲染编辑器UI
  if (editorContainer && !editorRoot) {
    editorRoot = ReactDOM.createRoot(editorContainer);
    editorRoot.render(<SimpleEditor />);
  }
  
  editorActive = true;
}

/**
 * 禁用编辑器模式
 */
export function disableEditor(): void {
  if (!editorActive) return;
  
  // 卸载编辑器UI
  if (editorRoot) {
    editorRoot.unmount();
    editorRoot = null;
  }
  
  // 移除编辑器容器
  if (editorContainer && editorContainer.parentElement) {
    editorContainer.parentElement.removeChild(editorContainer);
    editorContainer = null;
  }
  
  editorActive = false;
}

/**
 * 切换编辑器模式
 * @param targetElement 可选的目标容器元素
 */
export function toggleEditor(targetElement?: HTMLElement): void {
  if (editorActive) {
    disableEditor();
  } else {
    enableEditor(targetElement);
  }
}

/**
 * 检查编辑器是否处于活动状态
 */
export function isEditorActive(): boolean {
  return editorActive;
}

// 直接导出SimpleEditor组件
export { default as SimpleEditor } from './SimpleEditor';

// 导出所有组件
export * from './components/NodeSelector';
export * from './components/CreateSceneDialog'; 