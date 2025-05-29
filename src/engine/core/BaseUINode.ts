import EventLoopItem from '../utils/EventLoopItem';

/**
 * UI元素大小接口
 */
export interface UISize {
  width: number;
  height: number;
}

/**
 * UI元素位置接口
 */
export interface UIPosition {
  x: number;
  y: number;
}

/**
 * 基础UI节点类
 * 提供了基本的UI元素创建和管理功能
 */
export class BaseUINode extends EventLoopItem {
  // DOM元素
  protected element: HTMLElement | null = null;
  
  // 内容容器
  protected contentContainer: HTMLElement | null = null;
  
  // 节点大小
  protected size: UISize = { width: 300, height: 200 };
  
  // 节点位置
  protected position: UIPosition = { x: 0, y: 0 };
  
  // 是否展开
  protected expanded: boolean = true;
  
  // 样式配置
  protected style: Record<string, string> = {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    color: '#ffffff',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden',
    transition: 'height 0.3s ease'
  };
  
  /**
   * 构造函数
   * @param id 节点ID
   */
  constructor(id: string) {
    super();
    this.createUIElement(id);
  }
  
  /**
   * 创建UI元素
   * @param id 元素ID
   */
  private createUIElement(id: string): void {
    // 创建容器元素
    this.element = document.createElement('div');
    this.element.id = id;
    this.element.className = 'ui-node';
    
    // 创建标题栏
    const header = document.createElement('div');
    header.className = 'ui-node-header';
    Object.assign(header.style, {
      padding: '8px 12px',
      fontWeight: 'bold',
      cursor: 'move',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    });
    
    // 标题文本
    const title = document.createElement('div');
    title.textContent = id;
    header.appendChild(title);
    
    // 控制按钮容器
    const controls = document.createElement('div');
    controls.className = 'ui-node-controls';
    
    // 折叠/展开按钮
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '▼';
    toggleButton.className = 'ui-node-toggle';
    Object.assign(toggleButton.style, {
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      fontSize: '10px',
      padding: '2px 5px'
    });
    
    toggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleExpand();
      toggleButton.textContent = this.expanded ? '▼' : '▲';
    });
    
    controls.appendChild(toggleButton);
    header.appendChild(controls);
    
    // 添加标题栏
    this.element.appendChild(header);
    
    // 创建内容容器
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'ui-node-content';
    Object.assign(this.contentContainer.style, {
      padding: '10px',
      overflowY: 'auto',
      height: `${this.size.height - 40}px` // 减去标题栏高度
    });
    
    this.element.appendChild(this.contentContainer);
    
    // 应用样式
    this.applyStyles();
    
    // 添加拖拽功能
    this.enableDragging(header);
    
    // 添加到DOM
    document.body.appendChild(this.element);
  }
  
  /**
   * 应用样式
   */
  private applyStyles(): void {
    if (!this.element) return;
    
    Object.assign(this.element.style, {
      position: 'absolute',
      width: `${this.size.width}px`,
      height: this.expanded ? `${this.size.height}px` : '40px',
      left: `${this.position.x}px`,
      top: `${this.position.y}px`,
      zIndex: '1000',
      ...this.style
    });
  }
  
  /**
   * 启用拖拽功能
   * @param dragHandle 拖拽手柄元素
   */
  private enableDragging(dragHandle: HTMLElement): void {
    if (!this.element) return;
    
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    
    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - this.position.x;
      offsetY = e.clientY - this.position.y;
      
      dragHandle.style.cursor = 'grabbing';
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      this.position.x = e.clientX - offsetX;
      this.position.y = e.clientY - offsetY;
      
      // 限制在视口内
      if (this.position.x < 0) this.position.x = 0;
      if (this.position.y < 0) this.position.y = 0;
      if (this.position.x + this.size.width > window.innerWidth) {
        this.position.x = window.innerWidth - this.size.width;
      }
      if (this.position.y + this.size.height > window.innerHeight) {
        this.position.y = window.innerHeight - this.size.height;
      }
      
      this.applyStyles();
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        dragHandle.style.cursor = 'move';
      }
    });
  }
  
  /**
   * 切换展开/折叠状态
   */
  protected toggleExpand(): void {
    this.expanded = !this.expanded;
    this.applyStyles();
    
    if (this.contentContainer) {
      this.contentContainer.style.display = this.expanded ? 'block' : 'none';
    }
  }
  
  /**
   * 设置节点大小
   * @param width 宽度
   * @param height 高度
   */
  public setSize(width: number, height: number): void {
    this.size.width = width;
    this.size.height = height;
    this.applyStyles();
    
    if (this.contentContainer) {
      this.contentContainer.style.height = `${height - 40}px`;
    }
  }
  
  /**
   * 设置节点位置
   * @param x X坐标
   * @param y Y坐标
   */
  public setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    this.applyStyles();
  }
  
  /**
   * 获取内容容器
   * @returns 内容容器元素
   */
  protected getContentContainer(): HTMLElement | null {
    return this.contentContainer;
  }
  
  /**
   * 初始化节点
   * 由子类实现
   */
  public initialize(): void {
    // 基类方法，由子类覆盖
  }
  
  /**
   * 销毁节点
   */
  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    this.element = null;
    this.contentContainer = null;
    
    // 调用父类的dispose方法取消所有订阅
    this.dispose();
  }
} 