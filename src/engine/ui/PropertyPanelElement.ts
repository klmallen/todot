import { PropertyPanel } from './PropertyPanel';
import { getSelectedNode } from '../states/useEditorMode';
import { createEffect } from '@lincode/reactivity';
import { Node3d } from '../core/Node3d';

/**
 * 属性面板Web Component
 * 将属性面板封装为自定义元素
 */
export class PropertyPanelElement extends HTMLElement {
  private panel: PropertyPanel | null = null;
  private container: HTMLDivElement;
  private currentNode: Node3d | null = null;
  private disposer: any = null; // 使用 any 类型避免类型问题

  static get observedAttributes() {
    return ['position', 'width', 'node-id'];
  }

  constructor() {
    super();
    // 创建shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });
    
    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
      :host {
        position: absolute;
        top: 50px;
        right: 10px;
        width: 280px;
        z-index: 1000;
        pointer-events: auto;
      }
      
      .property-panel-container {
        background-color: rgba(30, 30, 30, 0.9);
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        overflow: auto;
        max-height: calc(100vh - 100px);
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }
    `;
    
    // 创建容器
    this.container = document.createElement('div');
    this.container.className = 'property-panel-container';
    
    shadow.appendChild(style);
    shadow.appendChild(this.container);
  }

  connectedCallback() {
    // 当元素添加到DOM时
    this.initPanel();
    
    // 监听选中节点变化
    this.setupNodeListener();
    
    // 应用属性
    this.applyAttributes();
  }
  
  disconnectedCallback() {
    // 当元素从DOM移除时
    if (this.panel) {
      this.panel.dispose();
      this.panel = null;
    }
    
    // 移除事件监听
    if (this.disposer) {
      this.disposer();
      this.disposer = null;
    }
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;
    
    // 属性变化时更新面板
    if (this.isConnected) {
      this.applyAttributes();
    }
  }
  
  /**
   * 应用HTML属性到组件
   */
  private applyAttributes() {
    // 位置属性
    const position = this.getAttribute('position');
    if (position) {
      const [top, right] = position.split(',');
      if (top) this.style.top = top.trim();
      if (right) this.style.right = right.trim();
    }
    
    // 宽度属性
    const width = this.getAttribute('width');
    if (width) {
      this.style.width = width;
    }
    
    // 节点ID属性
    const nodeId = this.getAttribute('node-id');
    if (nodeId) {
      // 查找指定ID的节点
      this.findNodeById(nodeId);
    }
  }
  
  /**
   * 根据ID查找节点
   */
  private findNodeById(nodeId: string) {
    // 这里需要实现从场景中查找指定ID的节点
    // 由于需要访问场景，这里先留空
    console.warn('通过ID查找节点的功能尚未实现');
  }
  
  /**
   * 初始化属性面板
   */
  private initPanel() {
    if (!this.panel) {
      this.panel = new PropertyPanel(this.container);
    }
  }
  
  /**
   * 设置监听选中节点的变化
   */
  private setupNodeListener() {
    if (this.disposer) {
      this.disposer();
    }
    
    this.disposer = createEffect(() => {
      const node = getSelectedNode();
      if (node !== this.currentNode) {
        this.currentNode = node;
        this.updateNodeProperties();
      }
    }, [getSelectedNode]);
  }
  
  /**
   * 更新当前节点的属性
   */
  private updateNodeProperties() {
    if (!this.panel) return;
    
    if (this.currentNode) {
      this.panel.showNodeProperties(this.currentNode);
    }
  }
  
  /**
   * 设置要显示属性的节点
   */
  public setNode(node: Node3d) {
    this.currentNode = node;
    this.updateNodeProperties();
  }
}

// 注册自定义元素
if (!customElements.get('todot-property-panel')) {
  customElements.define('todot-property-panel', PropertyPanelElement);
} 