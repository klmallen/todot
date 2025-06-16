import { BaseUINode } from './BaseUINode';
import Engine from '../Engine';
import { Scene } from '../Scene';
import { getIsSceneChanged, setIsSceneChanged, setSceneSwitcherNode } from '../../states/useEditorMode';

interface SceneTab {
  name: string;
  element: HTMLElement;
  isActive: boolean;
}

/**
 * 场景切换器节点类 - 以Tabs形式展示和切换场景
 */
export class SceneSwitcherNode extends BaseUINode {
  private tabsContainer: HTMLElement | null = null;
  private sceneTabs: Map<string, SceneTab> = new Map();
  private activeSceneName: string | null = null;
  private closeButtons: Map<string, HTMLElement> = new Map();

  constructor() {
    super('场景切换器');
    this.size = { width: 400, height: 'auto' as any };
    this.position = { x: window.innerWidth - 450, y: window.innerHeight - 150 };
    

    // 将自身注册到状态系统
    setSceneSwitcherNode(this);

    // 监听场景变化
    this.createEffect(() => {
      // 使用计数器触发更新
      const counter = getIsSceneChanged();
      this.refreshSceneTabs();
    }, [getIsSceneChanged]);
    
    // 监听窗口大小变化，调整位置
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  /**
   * 窗口大小变化时调整位置
   */
  private onWindowResize(): void {
    // 更新位置到右下角
    this.position = { x: window.innerWidth - 450, y: window.innerHeight - 150 };
    this.setPosition(this.position.x, this.position.y);
  }

  /**
   * 初始化UI
   */
  public override initialize(): void {
    super.initialize();
    
    const contentContainer = this.getContentContainer();
    if (!contentContainer) return;
    
    // 创建标签容器
    this.tabsContainer = document.createElement('div');
    Object.assign(this.tabsContainer.style, {
      display: 'flex',
      flexWrap: 'wrap',
      padding: '8px',
      gap: '4px',
      borderBottom: '1px solid hsla(210, 30%, 30%, 1)'
    });
    
    contentContainer.appendChild(this.tabsContainer);
    
    // 添加"创建新场景"按钮
    this.addCreateSceneButton();
    
    // 默认选中第一个场景
    this.selectFirstScene();
  }

  private addCreateSceneButton(): void {
    const createButton = document.createElement('button');
    createButton.textContent = '创建新场景';
    createButton.className = 'create-scene-button';
    Object.assign(createButton.style, {
      padding: '8px 12px',
      margin: '8px',
      backgroundColor: 'hsla(210, 50%, 40%, 1)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    createButton.addEventListener('click', () => {
      this.createEmptyScene();
    });
    
    if (this.contentContainer) {
      this.contentContainer.appendChild(createButton);
    }
  }

  /**
   * 选择第一个场景
   */
  private selectFirstScene(): void {
    // 获取引擎实例和所有场景
    const engine = Engine.getInstance();
    const scenes = engine.scenes;
    
    if (scenes && scenes.size > 0) {
      // 获取第一个场景
      const firstSceneName = Array.from(scenes.keys())[0];
      const firstScene = scenes.get(firstSceneName);
      
      if (firstScene) {
        // 添加并激活第一个场景
        this.addScene(firstScene);
        
        // 确保UI上显示为激活状态
        this.updateActiveTab(firstSceneName);
        
        // 确保引擎中该场景被激活
        engine.activateScene(firstSceneName, true);
        
        // 触发场景变更事件
        setIsSceneChanged(getIsSceneChanged() + 1);
      }
    }
  }

  /**
   * 刷新场景标签
   */
  private refreshSceneTabs(): void {
    // 获取引擎实例和所有场景
    const engine = Engine.getInstance();
    const scenes = engine.scenes;
    
    if (!scenes || scenes.size === 0) return;
    
    // 获取当前活动场景
    const activeScene = engine.getActiveScene();
    const activeSceneName = activeScene ? activeScene.getName() : null;
    
    // 检查是否有场景变化
    let hasChanges = false;
    
    // 不再自动添加所有场景，而是只检查现有标签是否需要移除
    // 检查是否有旧场景需要移除
    const existingTabs = Array.from(this.sceneTabs.keys());
    for (const tabName of existingTabs) {
      if (!scenes.has(tabName)) {
        this.removeSceneTab(tabName);
        hasChanges = true;
      }
    }
    
    // 更新活动状态
    if (activeSceneName !== this.activeSceneName) {
      this.updateActiveTab(activeSceneName);
      hasChanges = true;
    }
    
    // 如果有变化，重新排列标签
    if (hasChanges) {
      this.renderTabs();
    }
  }

  /**
   * 添加场景标签
   */
  private addSceneTab(name: string, scene: Scene): void {
    // 如果已存在，不重复添加
    if (this.sceneTabs.has(name)) return;
    
    // 创建标签元素
    const tabElement = document.createElement('div');
    Object.assign(tabElement.style, {
      backgroundColor: 'hsla(210, 30%, 30%, 1)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px 4px 0 0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s'
    });

    // 标签名称
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    tabElement.appendChild(nameSpan);
    
    // 关闭按钮
    const closeButton = document.createElement('span');
    closeButton.textContent = '×';
    closeButton.title = '关闭';
    Object.assign(closeButton.style, {
      fontSize: '16px',
      fontWeight: 'bold',
      width: '16px',
      height: '16px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: 'hsla(210, 30%, 40%, 1)',
      cursor: 'pointer'
    });
    
    // 点击关闭按钮时，不切换场景，只关闭标签
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeSceneTab(name);
    });
    
    tabElement.appendChild(closeButton);
    this.closeButtons.set(name, closeButton);
    
    // 点击标签时切换场景
    tabElement.addEventListener('click', () => {
      this.switchToScene(name);
    });

    // 鼠标悬停效果
    tabElement.addEventListener('mouseover', () => {
      if (this.activeSceneName !== name) {
        tabElement.style.backgroundColor = 'hsla(210, 30%, 35%, 1)';
      }
    });
    
    tabElement.addEventListener('mouseout', () => {
      if (this.activeSceneName !== name) {
        tabElement.style.backgroundColor = 'hsla(210, 30%, 30%, 1)';
      }
    });
    
    // 存储标签信息
    this.sceneTabs.set(name, {
      name,
      element: tabElement,
      isActive: false
    });
  }

  /**
   * 移除场景标签
   */
  private removeSceneTab(name: string): void {
    const tab = this.sceneTabs.get(name);
    if (!tab) return;
    
    // 从DOM中移除
    const tabElement = tab.element;
    if (tabElement.parentElement) {
      tabElement.parentElement.removeChild(tabElement);
    }
    
    // 移除关闭按钮引用
    this.closeButtons.delete(name);
    
    // 从集合中移除
    this.sceneTabs.delete(name);
  }

  /**
   * 关闭场景标签
   * 注意：这里只是关闭标签，不影响场景本身
   */
  private closeSceneTab(name: string): void {
    this.removeSceneTab(name);
    this.renderTabs();
    
    // 如果删除的是当前活动场景，切换到第一个可用场景
    if (name === this.activeSceneName && this.sceneTabs.size > 0) {
      const firstSceneName = Array.from(this.sceneTabs.keys())[0];
      if (firstSceneName) {
        this.switchToScene(firstSceneName);
      }
    }
  }

  /**
   * 创建空场景
   */
  private createEmptyScene(): void {
    const engine = Engine.getInstance();
    
    // 生成唯一的场景名称
    const timestamp = new Date().getTime();
    const emptySceneName = `新场景_${timestamp}`;
    
    // 创建新场景
    const emptyScene = new Scene(emptySceneName);
    
    // 添加场景到引擎
    engine.addScene(emptyScene, true);
    
    // 添加场景到标签
    this.addSceneTab(emptySceneName, emptyScene);
    this.renderTabs();
    
    // 激活新场景
    this.switchToScene(emptySceneName);
    
    // 触发场景变化事件
    setIsSceneChanged(Date.now());
  }

  /**
   * 切换到指定场景
   */
  private switchToScene(name: string): void {
    // 如果点击的是当前活动场景，不做任何操作
    if (name === this.activeSceneName) return;
    
    const engine = Engine.getInstance();
    
    // 调用引擎的场景切换方法
    if (engine.isEditorMode()) {
      engine.switchEditorScene(name);
    } else {
      // 在非编辑器模式下，先停用所有场景，再激活指定场景
      engine.activateScene(name, true);
    }
    
    // 更新UI
    this.updateActiveTab(name);
    
    // 触发场景变更事件，以便SceneNode更新
    setIsSceneChanged(getIsSceneChanged() + 1);
  }

  /**
   * 更新活动标签
   */
  private updateActiveTab(name: string | null): void {
    // 先重置所有标签样式
    this.sceneTabs.forEach((tab) => {
      tab.isActive = false;
      tab.element.style.backgroundColor = 'var(--tp-container-background-color)';
      tab.element.style.fontWeight = 'normal';
    });
    
    // 设置新的活动标签
    if (name && this.sceneTabs.has(name)) {
      const activeTab = this.sceneTabs.get(name)!;
      activeTab.isActive = true;
      activeTab.element.style.backgroundColor = 'var(--tp-container-background-color-active)';
      activeTab.element.style.fontWeight = 'bold';
    }
    
    this.activeSceneName = name;
  }

  /**
   * 渲染所有标签
   */
  private renderTabs(): void {
    if (!this.tabsContainer) return;
    
    // 清空容器
    this.tabsContainer.innerHTML = '';
    
    // 按名称排序标签
    const sortedTabs = Array.from(this.sceneTabs.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // 添加标签到容器
    for (const tab of sortedTabs) {
      this.tabsContainer.appendChild(tab.element);
    }
  }

  /**
   * 添加场景标签
   * 供外部调用的公共方法
   */
  public addScene(scene: Scene): void {
    const name = scene.getName();
    
    // 如果标签已存在，仅激活它
    if (this.sceneTabs.has(name)) {
      this.switchToScene(name);
      return;
    }

    // 添加新标签
    this.addSceneTab(name, scene);
    this.renderTabs();
    
    // 激活新标签
    this.switchToScene(name);
  }

  /**
   * 清理资源
   */
  public override dispose(): void {
    // 从状态系统中移除自身
    setSceneSwitcherNode(null);
    
    this.sceneTabs.clear();
    this.closeButtons.clear();
    super.destroy();
  }
} 