import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { SceneTreeView } from './SceneTreeView';
import Engine from '../core/Engine';

// 场景树容器类，用于创建和管理场景树UI
export class SceneTreeContainer {
  private container: HTMLDivElement | null = null;
  private isVisible: boolean = false;

  constructor() {
    // 创建容器元素
    this.container = document.createElement('div');
    this.container.id = 'scene-tree-container';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '1000';
    this.container.style.display = 'none';
  }

  // 初始化场景树UI
  public init(): void {
    // 添加容器到文档
    document.body.appendChild(this.container);
    this.render();
  }

  // 显示场景树
  public show(): void {
    if (this.container) {
      this.isVisible = true;
      this.container.style.display = 'block';
      this.render();
    }
  }

  // 隐藏场景树
  public hide(): void {
    if (this.container) {
      this.isVisible = false;
      this.container.style.display = 'none';
    }
  }

  // 切换显示状态
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  // 销毁场景树UI
  public destroy(): void {
    if (this.container) {
      ReactDOM.unmountComponentAtNode(this.container);
      document.body.removeChild(this.container);
      this.container = null;
    }
  }

  // 渲染场景树组件
  private render(): void {
    if (this.container) {
      ReactDOM.render(
        <SceneTreeView onClose={() => this.hide()} />,
        this.container
      );
    }
  }
} 