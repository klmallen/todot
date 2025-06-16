import { BaseUINode } from './BaseUINode';
import { Node3d } from '../Node3d';
import Engine from '../Engine';

interface UITab {
  id: string;
  node: BaseUINode;
  isActive: boolean;
  originalWidth: string;
}

/**
 * UI面板管理器
 * 用于管理和组织多个UI节点
 */
export class UIPanelManager extends BaseUINode {
  private tabs: Map<string, UITab>;
  protected tabContainer: HTMLElement | null = null;
  private engine: Engine = null;
  private dropZone: HTMLElement | null = null;

  constructor(name: string = 'UI面板管理器') {
    super(name);
    this.tabs = new Map();
    // 设置默认尺寸和位置
    this.setSize('auto', 400);
    this.setPosition(0, -1); // 默认靠右放置
  }

  public override getName(): string {
    return this.name;
  }

  /**
   * 初始化UI元素
   */
  public override initialize(): void {
    super.initialize();
    if (!this.contentContainer) return;
      
    // 创建标签容器
    this.tabContainer = document.createElement('div');
    this.tabContainer.className = 'panel-tabs';
    Object.assign(this.tabContainer.style, {
      display: 'flex',
      borderBottom: '1px solid var(--tp-groove-foreground-color)',
      backgroundColor: 'var(--tp-base-background-color)',
      padding: '2px 2px 0 2px',
      gap: '1px',
      height: '24px',
      boxSizing: 'border-box'
    });
    
    // 创建拖放区域
    this.dropZone = document.createElement('div');
    this.dropZone.className = 'panel-drop-zone';
    Object.assign(this.dropZone.style, {
      flex: 1,
      minWidth: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: '0.5',
      backgroundColor: 'var(--tp-base-background-color)',
      color: 'var(--tp-container-foreground-color)',
      fontSize: '12px'
    });
    this.dropZone.textContent = '+';
    
    this.tabContainer.appendChild(this.dropZone);
    this.contentContainer.insertBefore(this.tabContainer, this.contentContainer.firstChild);
    
    // 设置拖放事件
    this.setupDropZone();
  }

  /**
   * 设置拖放区域
   */
  private setupDropZone(): void {
    if (!this.dropZone) return;

    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone!.style.backgroundColor = 'hsla(40, 3%, 60%, 1.00)';
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone!.style.backgroundColor = '';
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone!.style.backgroundColor = '';
      
      const nodeId = e.dataTransfer?.getData('text/plain');
      if (nodeId) {
        const node = this.findUINode(nodeId);
        if (node) {
          this.addNode(node);
        }
      }
    });
  }

  /**
   * 查找UI节点
   */
  private findUINode(id: string): BaseUINode | null {
    // 这里需要实现查找逻辑，可能需要通过某种注册机制
    // 暂时返回null
    return null;
  }

  /**
   * 添加UI节点
   */
  public addNode(node: BaseUINode): void {
    const id = node.getName();
    
    // 如果节点已经在面板中，激活它
    if (this.tabs.has(id)) {
      this.activateTab(id);
      return;
    }
    
    // 创建新标签
    const tab: UITab = {
      id,
      node,
      isActive: false,
      originalWidth: ''
    };
    
    // 创建标签按钮
    this.createTabButton(tab);
    
    // 存储标签信息
    this.tabs.set(id, tab);
    
    // 隐藏节点的原始DOM元素
    const nodeElement = node.getElement();
    if (nodeElement && nodeElement.parentElement) {
      nodeElement.parentElement.removeChild(nodeElement);
    }
    
    // 将节点添加到内容容器
    if (this.contentContainer) {
      this.contentContainer.appendChild(nodeElement!);
      // 保存原始宽度
      const originalWidth = nodeElement!.style.width;
      nodeElement!.style.position = 'relative';
      nodeElement!.style.width = originalWidth || '250px'; // 使用原始宽度或默认值
      nodeElement!.style.height = '100%';
      nodeElement!.style.display = 'none';
      // 禁用拖动
      nodeElement!.style.pointerEvents = 'none';
      // 存储原始宽度到tab对象中
      tab.originalWidth = originalWidth || '250px';
    }
    
    // 激活新标签
    this.activateTab(id);
  }

  /**
   * 创建标签按钮
   */
  private createTabButton(tab: UITab): void {
    if (!this.tabContainer) return;

    const button = document.createElement('div');
    button.className = 'panel-tab';
    Object.assign(button.style, {
      padding: '4px 8px',
      backgroundColor: 'var(--tp-base-background-color)',
      color: 'var(--tp-container-foreground-color)',
      cursor: 'pointer',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      height: '22px',
      boxSizing: 'border-box'
    });

    // 标签文本
    const text = document.createElement('span');
    text.textContent = tab.node.getName();
    button.appendChild(text);

    // 关闭按钮
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
      opacity: '0.5',
      fontSize: '12px',
      padding: '0 2px',
      color: 'var(--tp-container-foreground-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '16px',
      height: '16px'
    });
    button.appendChild(closeBtn);

    // 事件处理
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = 'var(--tp-container-background-color-hover)';
    });

    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = tab.isActive ? 
        'var(--tp-container-background-color-active)' : 
        'var(--tp-base-background-color)';
    });

    button.onclick = (e) => {
      if (e.target !== closeBtn) {
        this.activateTab(tab.id);
      }
    };

    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.removeNode(tab.id);
    };

    // 添加到标签容器
    this.tabContainer.insertBefore(button, this.dropZone);
  }

  /**
   * 激活标签
   */
  private activateTab(id: string): void {
    this.tabs.forEach((tab, tabId) => {
      const isActive = tabId === id;
      tab.isActive = isActive;
      
      // 更新标签按钮样式
      const button = this.findTabButton(tabId);
      if (button) {
        button.style.backgroundColor = isActive ? 
          'var(--tp-container-background-color-active)' : 
          'var(--tp-base-background-color)';
      }
      
      // 更新节点显示状态
      const element = tab.node.getElement();
      if (element) {
        element.style.display = isActive ? 'block' : 'none';
      }
    });
  }

  /**
   * 查找标签按钮
   */
  private findTabButton(id: string): HTMLElement | null {
    if (!this.tabContainer) return null;
    return Array.from(this.tabContainer.children).find(
      child => child.querySelector('span')?.textContent === id
    ) as HTMLElement || null;
  }

  /**
   * 移除节点
   */
  public removeNode(id: string): void {
    const tab = this.tabs.get(id);
    if (!tab) return;
    
    // 移除标签按钮
    const button = this.findTabButton(id);
    if (button) {
      button.remove();
    }
    
    // 恢复节点的独立状态
    const element = tab.node.getElement();
    if (element) {
      document.body.appendChild(element);
      element.style.position = 'absolute';
      element.style.width = tab.originalWidth; // 恢复原始宽度
      element.style.display = 'block';
      element.style.pointerEvents = 'auto'; // 恢复拖动功能
    }
    
    // 移除标签信息
    this.tabs.delete(id);
    
    // 如果还有其他标签，激活第一个
    if (this.tabs.size > 0) {
      this.activateTab(Array.from(this.tabs.keys())[0]);
    }
  }

  /**
   * 获取当前激活的节点
   */
  public getActiveNode(): BaseUINode | null {
    for (const [_, tab] of this.tabs) {
      if (tab.isActive) {
        return tab.node;
      }
    }
    return null;
  }

  /**
   * 销毁面板
   */
  public override destroy(): void {
    // 恢复所有节点的独立状态
    this.tabs.forEach(tab => {
      const element = tab.node.getElement();
      if (element) {
        document.body.appendChild(element);
        element.style.position = 'absolute';
        element.style.display = 'block';
      }
    });
    
    // 清空标签
    this.tabs.clear();
    
    // 调用父类销毁方法
    super.destroy();
  }

  /**
   * 应用样式
   */
  protected override applyStyles(): void {
    super.applyStyles();
    // 添加面板特定的样式
    if (this.element) {
      Object.assign(this.element.style, {
        backgroundColor: 'var(--tp-container-background-color)',
        color: 'var(--tp-container-foreground-color)',
        border: '1px solid var(--tp-groove-foreground-color)'
      });
    }
  }
} 