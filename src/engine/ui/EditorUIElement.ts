import React from 'react';
import ReactDOM from 'react-dom/client';
import { EditorUI } from './EditorUI';
import Engine from '../core/Engine';
import { setEditorActive } from '../states/useEditorMode';

/**
 * 编辑器UI Web Component
 * 将React实现的编辑器UI封装为自定义元素
 */
export class EditorUIElement extends HTMLElement {
  private root: ReactDOM.Root | null = null;
  private engine: Engine | null = null;
  private shadowContainer: HTMLDivElement | null = null;
  
  static get observedAttributes() {
    return ['engine-id'];
  }
  
  constructor() {
    super();
    // 创建shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });
    
    // 创建容器元素
    this.shadowContainer = document.createElement('div');
    // 添加全局样式
    const style = document.createElement('style');
    style.textContent = `
      div {
        pointer-events: auto;
      }
    `;
    
    shadow.appendChild(style);
    shadow.appendChild(this.shadowContainer);
  }
  
  connectedCallback() {
    // 当组件添加到DOM时的处理逻辑
    this.connectToEngine();
    
    // 渲染React组件
    if (this.engine && this.shadowContainer) {
      this.root = ReactDOM.createRoot(this.shadowContainer);
      this.root.render(React.createElement(EditorUI, { engine: this.engine }));
      
      // 激活编辑器模式
      this.engine.initEditorMode();
      setEditorActive(true);
    }
  }
  
  disconnectedCallback() {
    // 当组件从DOM移除时清理资源
    if (this.root) {
      this.root.unmount();
    }
    
    // 如果有引擎实例，退出编辑器模式
    if (this.engine) {
      setEditorActive(false);
    }
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'engine-id' && oldValue !== newValue) {
      this.connectToEngine();
      this.updateUI();
    }
  }
  
  private connectToEngine() {
    // 尝试从全局对象获取引擎实例
    if (!this.engine) {
      const engineId = this.getAttribute('engine-id');
      
      if (engineId && (window as any)[engineId]) {
        this.engine = (window as any)[engineId];
      } else {
        // 尝试获取默认实例
        this.engine = Engine.getInstance();
      }
    }
  }
  
  private updateUI() {
    // 如果引擎已连接且UI已渲染，更新UI
    if (this.engine && this.root && this.shadowContainer) {
      this.root.render(React.createElement(EditorUI, { engine: this.engine }));
    }
  }
  
  /**
   * 设置引擎实例
   * @param engine 引擎实例
   */
  public setEngine(engine: Engine) {
    this.engine = engine;
    this.updateUI();
    
    // 激活编辑器模式
    if (this.engine) {
      this.engine.initEditorMode();
      setEditorActive(true);
    }
  }
}

// 注册自定义元素
// customElements.define('todot-editor-ui', EditorUIElement); 