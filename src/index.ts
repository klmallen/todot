/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 11:02:11
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 13:26:06
 * @FilePath: \todot\src\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Engine from './engine/core/Engine';
import { Node3d } from './engine/core/Node3d';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// 启动应用
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 渲染React编辑器组件
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(React.createElement(App));
    } else {
      console.error('找不到root元素，无法渲染React组件');
    }
  } catch (error) {
    console.error('应用程序启动失败:', error);
  }
});

// 导出主要类，方便使用
export { Engine, Node3d }; 