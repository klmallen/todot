// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Editor } from './engine/ui/Editor';

// 当DOM加载完成后初始化编辑器
document.addEventListener('DOMContentLoaded', () => {
  // 获取容器元素
  const container = document.getElementById('editor-container');
  
  if (container) {
    // 创建编辑器实例
    const editor = new Editor(container);
    
    // 如果需要额外配置，可以在这里完成
    console.log('编辑器已初始化');
  } else {
    console.error('找不到编辑器容器元素');
  }
});