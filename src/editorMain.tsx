/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:01:18
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-06 17:29:43
 * @FilePath: \todot\src\editorMain.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import SimpleEditor from './engine/editor/SimpleEditor';
import './index.css';

// 初始化编辑器UI
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <SimpleEditor />
  </React.StrictMode>
);

// 导出编辑器启动函数供外部调用
export function startEditor(container?: HTMLElement) {
  const targetContainer = container || document.getElementById('root');
  if (!targetContainer) {
    console.error('找不到目标容器元素');
    return;
  }
  
  const editorRoot = ReactDOM.createRoot(targetContainer);
  editorRoot.render(
    <React.StrictMode>
      <SimpleEditor />
    </React.StrictMode>
  );
  
  return editorRoot;
} 