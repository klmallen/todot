import EventLoopItem from '../../utils/EventLoopItem';
import { Node3d } from '../Node3d';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface UIStyle {
  backgroundColor: string;
  color: string;
  borderRadius: string;
  boxShadow: string;
  padding: string;
  fontFamily: string;
  fontSize: string;
  position: string;
  zIndex: number;
  overflow: string;
  [key: string]: string | number; // 允许添加其他样式属性
}

/**
 * 基础UI节点类
 */
export class BaseUINode extends EventLoopItem {
  protected name: string;
  protected element: HTMLElement | null;
  protected visible: boolean;
  protected position: Position;
  protected size: Size;
  protected style: UIStyle;
  protected isDragging: boolean;
  protected dragOffset: Position;
  protected isExpanded: boolean;
  protected contentContainer: HTMLElement | null;
  private _cleanupHandlers: (() => void) | null = null;

  constructor(name: string = 'UINode') {
    super()
    this.name = name;
    this.element = null;
    this.visible = true;
    this.position = { x: 0, y: 0 };
    this.size = { width: 200, height: 300 };
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.isExpanded = true;
    this.contentContainer = null;
    
    this.style = {
      backgroundColor: 'hsla(40, 3%, 90%, 1.00)',
      color: 'hsla(40, 3%, 20%, 1.00)',
      borderRadius: '4px',
      boxShadow: '0 2px 10px hsla(0, 0%, 0%, 0.30)',
      padding: '0',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      position: 'absolute',
      zIndex: 1000,
      overflow: 'hidden',
      userSelect: 'none',
      cursor: 'default'
    };
  }

  /**
   * 初始化UI元素
   */
  public initialize(): void {
    this.element = document.createElement('div');
    this.element.className = `ui-node ${this.name.toLowerCase()}`;
    
    // 创建标题栏
    const header = this.createHeader();
    this.element.appendChild(header);
    
    // 创建内容容器
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'content-container';
    Object.assign(this.contentContainer.style, {
      padding: '10px',
      height: 'calc(100% - 32px)', // 减去header高度
      overflow: 'auto'
    });
    this.element.appendChild(this.contentContainer);
    
    this.applyStyles();
    this.setPosition(this.position.x, this.position.y);
    this.setSize(this.size.width, this.size.height);
    this.setupDragHandlers();
    document.body.appendChild(this.element);
  }

  /**
   * 创建标题栏
   */
  protected createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'ui-node-header';
    Object.assign(header.style, {
      backgroundColor: 'hsla(40, 3%, 55%, 1.00)',
      color: 'hsla(40, 3%, 20%, 1.00)',
      padding: '8px 12px',
      fontWeight: 'bold',
      borderBottom: '1px solid hsla(40, 3%, 60%, 1.00)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'move',
      userSelect: 'none',
      height: '32px',
      boxSizing: 'border-box'
    });

    // 添加标题和图标容器
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '8px';

    const title = document.createElement('span');
    title.textContent = this.name;
    titleContainer.appendChild(title);
    header.appendChild(titleContainer);

    // 添加展开/折叠按钮
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '-';
    Object.assign(toggleBtn.style, {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      fontSize: '16px',
      padding: '0 4px',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'background-color 0.2s'
    });

    toggleBtn.addEventListener('mouseover', () => {
      toggleBtn.style.backgroundColor = 'hsla(40, 3%, 50%, 0.5)';
    });

    toggleBtn.addEventListener('mouseout', () => {
      toggleBtn.style.backgroundColor = 'transparent';
    });

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleExpand();
    });

    header.appendChild(toggleBtn);
    return header;
  }

  /**
   * 设置拖拽处理
   */
  protected setupDragHandlers(): void {
    if (!this.element) return;
    console.log('this.element', this.element)
    const header = this.element.querySelector('.ui-node-header') as HTMLElement;
    console.log('header', header)
    if (!header) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const onMouseMove = (e: MouseEvent) => {
      
      if (!isDragging || !this.element) return;
      
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      const newLeft = startLeft + dx;
      const newTop = startTop + dy;
      
      this.setPosition(newLeft, newTop);
    };

    const onMouseUp = (e: MouseEvent) => {
      
      if (!isDragging) return;
      
      e.preventDefault();
      isDragging = false;
      
      if (this.element) {
        this.element.style.transition = 'all 0.2s ease';
      }
      
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseDown = (e: MouseEvent) => {
      // 如果点击的是按钮，不启动拖拽
      if (e.target instanceof HTMLButtonElement) return;
      
      e.preventDefault();
      isDragging = true;
      
      // 获取鼠标点击位置
      startX = e.clientX;
      startY = e.clientY;
      
      if (this.element) {
        // 获取当前元素位置
        const rect = this.element.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        
        // 移除过渡动画
        this.element.style.transition = 'none';
        
        // 提升z-index
        const maxZ = Math.max(...Array.from(document.querySelectorAll('.ui-node'))
          .map(el => parseInt(getComputedStyle(el).zIndex) || 0));
        this.element.style.zIndex = (maxZ + 1).toString();

        // 添加全局事件监听
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }
    };

    // 添加mousedown事件监听器
    header.addEventListener('mousedown', onMouseDown);

    // 在组件销毁时清理事件监听器
    const cleanup = () => {
      header.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    // 保存清理函数，在destroy时调用
    this._cleanupHandlers = cleanup;
  }

  /**
   * 切换展开/折叠状态
   */
  protected toggleExpand(): void {
    if (!this.contentContainer || !this.element) return;
    
    this.isExpanded = !this.isExpanded;
    
    // 设置过渡动画
    this.element.style.transition = 'height 0.2s ease';
    this.contentContainer.style.transition = 'opacity 0.2s ease';
    
    if (this.isExpanded) {
      // 展开时先设置 display，然后设置不透明度
      this.contentContainer.style.display = 'block';
      this.contentContainer.style.opacity = '0';
      
      // 强制重绘
      this.contentContainer.offsetHeight;
      
      // 设置展开后的高度和不透明度
      this.element.style.height = `${this.size.height}px`;
      this.contentContainer.style.opacity = '1';
    } else {
      // 收起时先设置不透明度为 0
      this.contentContainer.style.opacity = '0';
      this.element.style.height = '32px'; // header 高度
      
      // 等待动画完成后隐藏内容
      setTimeout(() => {
        if (!this.isExpanded) {
          this.contentContainer!.style.display = 'none';
        }
      }, 200);
    }
    
    // 更新按钮文本
    const toggleBtn = this.element.querySelector('button');
    if (toggleBtn) {
      toggleBtn.textContent = this.isExpanded ? '-' : '+';
    }
  }

  /**
   * 应用样式
   */
  protected applyStyles(): void {
    if (this.element) {
      Object.assign(this.element.style, this.style);
    }
  }

  /**
   * 设置位置
   * 支持负数坐标：
   * - 当x为负数时，表示相对于右侧的位置
   * - 当y为负数时，表示相对于底部的位置
   */
  public setPosition(x: number, y: number): void {
    this.position = { x, y };
    if (this.element) {
      if (x >= 0) {
        this.element.style.left = `${x}px`;
        this.element.style.right = 'auto';
      } else {
        this.element.style.right = `${Math.abs(x)}px`;
        this.element.style.left = 'auto';
      }
      
      if (y >= 0) {
        this.element.style.top = `${y}px`;
        this.element.style.bottom = 'auto';
      } else {
        this.element.style.bottom = `${Math.abs(y)}px`;
        this.element.style.top = 'auto';
      }
    }
  }

  /**
   * 设置大小
   */
  public setSize(width: number, height: number): void {
    this.size = { width, height };
    if (this.element && this.isExpanded) {
      this.element.style.width = `${width}px`;
      this.element.style.height = `${height}px`;
    }
  }

  /**
   * 获取内容容器
   */
  protected getContentContainer(): HTMLElement | null {
    return this.contentContainer;
  }

  /**
   * 显示节点
   */
  public show(): void {
    this.visible = true;
    if (this.element) {
      this.element.style.display = 'block';
    }
  }

  /**
   * 隐藏节点
   */
  public hide(): void {
    this.visible = false;
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  /**
   * 销毁节点
   */
  public destroy(): void {
    if (this._cleanupHandlers) {
      this._cleanupHandlers();
      this._cleanupHandlers = null;
    }
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }

  /**
   * 获取DOM元素
   */
  public getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * 获取可见性状态
   */
  public isVisible(): boolean {
    return this.visible;
  }
} 