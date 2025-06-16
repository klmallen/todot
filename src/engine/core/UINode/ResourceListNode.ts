import { BaseUINode } from './BaseUINode';
import Engine from '../Engine';
import { Scene } from '../Scene';
import { getIsSceneChanged, setIsSceneChanged, getSceneSwitcherNode } from '../../states/useEditorMode';
import { SceneSwitcherNode } from './SceneSwitcherNode';

/**
 * 资源列表UI节点类 - 以竖排列表形式展示所有场景
 */
export class ResourceListNode extends BaseUINode {
  private listContainer: HTMLElement | null = null;
  private resourceItems: Map<string, HTMLElement> = new Map();

  constructor(name: string = '资源列表') {
    super(name);
    
    // 设置默认尺寸和位置
    this.setSize(250, 400);
    this.setPosition(10, 10);
    
    // 监听场景变化
    this.createEffect(() => {
      // 使用计数器触发更新
      const counter = getIsSceneChanged();
      this.refreshResourceList();
    }, [getIsSceneChanged]);
  }

  /**
   * 初始化UI
   */
  public override initialize(): void {
    super.initialize();
    
    const contentContainer = this.getContentContainer();
    if (!contentContainer) return;
    
    // 添加标题
    const titleContainer = document.createElement('div');
    Object.assign(titleContainer.style, {
      padding: '8px 12px',
      borderBottom: '1px solid hsla(210, 30%, 30%, 1)',
      fontWeight: 'bold',
      fontSize: '14px'
    });
    titleContainer.textContent = '场景资源';
    contentContainer.appendChild(titleContainer);
    
    // 创建列表容器
    this.listContainer = document.createElement('div');
    Object.assign(this.listContainer.style, {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
      maxHeight: 'calc(100% - 40px)',
      padding: '4px 0'
    });
    
    contentContainer.appendChild(this.listContainer);
    
    // 初始化资源列表
    this.refreshResourceList();
  }

  /**
   * 刷新资源列表
   */
  private refreshResourceList(): void {
    // 获取引擎实例和所有场景
    const engine = Engine.getInstance();
    const scenes = engine.scenes;
    
    if (!this.listContainer || !scenes || scenes.size === 0) return;
    
    // 清空列表容器
    this.listContainer.innerHTML = '';
    this.resourceItems.clear();
    
    // 添加所有场景到列表
    Array.from(scenes.entries()).forEach(([name, scene]) => {
      const item = this.createSceneListItem(name, scene);
      this.listContainer?.appendChild(item);
      this.resourceItems.set(name, item);
    });
  }

  /**
   * 创建场景列表项
   */
  private createSceneListItem(name: string, scene: Scene): HTMLElement {
    const item = document.createElement('div');
    item.className = 'resource-list-item';
    Object.assign(item.style, {
      padding: '8px 12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      borderBottom: '1px solid hsla(210, 30%, 25%, 1)',
      transition: 'background-color 0.2s'
    });
    
    // 图标
    const icon = document.createElement('span');
    icon.textContent = '🎬';
    icon.style.fontSize = '16px';
    item.appendChild(icon);
    
    // 名称
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    nameSpan.style.flexGrow = '1';
    item.appendChild(nameSpan);
    
    // 悬停效果
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = 'hsla(210, 30%, 25%, 1)';
    });
    
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = 'transparent';
    });
    
    // 双击切换场景
    item.addEventListener('dblclick', () => {
      this.switchToScene(name);
    });
    
    return item;
  }

  /**
   * 切换到指定场景
   */
  private switchToScene(name: string): void {
    // 获取场景切换器
    const sceneSwitcher = getSceneSwitcherNode();
    if (sceneSwitcher) {
      // 调用场景切换器的addScene方法
      sceneSwitcher.addScene(Engine.getInstance().scenes.get(name)!);
    } else {
      // 如果没有场景切换器，直接使用引擎切换
      const engine = Engine.getInstance();
      if (engine.isEditorMode()) {
        engine.switchEditorScene(name);
      } else {
        engine.activateScene(name, true);
      }
      
      // 触发场景变更事件
      setIsSceneChanged(getIsSceneChanged() + 1);
    }
  }

  /**
   * 更新特定场景的UI状态
   */
  public updateSceneItem(name: string, isActive: boolean): void {
    const item = this.resourceItems.get(name);
    if (item) {
      if (isActive) {
        item.style.backgroundColor = 'var(--tp-container-background-color-active)';
        item.style.fontWeight = 'bold';
      } else {
        item.style.backgroundColor = 'var(--tp-container-background-color)';
        item.style.fontWeight = 'normal';
      }
    }
  }

  /**
   * 清理资源
   */
  public override dispose(): void {
    this.resourceItems.clear();
    super.destroy();
  }
} 