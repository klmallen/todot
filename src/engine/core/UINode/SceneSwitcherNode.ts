import { BaseUINode } from './BaseUINode';
import { Scene } from '../Scene';
import Engine from '../Engine';
// import { 
//   getScenes,
//   getSceneAdded,
//   getSceneRemoved,
//   getSceneActivated,
//   activateScene,
//   IScene
// } from '../../states/scenesState';

interface SceneItemData {
  id: string;
  name: string;
  isActive: boolean;
}

/**
 * 场景切换节点类
 */
export class SceneSwitcherNode extends BaseUINode {
  private sceneListContainer: HTMLElement | null = null;
  private scenes: SceneItemData[] = [];

  constructor() {
    super('场景切换器');
    this.size = { width: 200, height: 300 };
    this.position = { x: 10, y: 10 };
    
    // 扩展基础样式
    Object.assign(this.style, {
      backgroundColor: 'hsla(230, 25%, 16%, 1.00)',
      color: '#fff',
      padding: '0',
    });

   
  }

  /**
   * 设置场景事件监听
   */
  private setupSceneListeners(): void {
    // 监听场景添加事件
    this.createEffect(() => {
      const addedScene = getSceneAdded();
      if (addedScene) {
        this.addSceneItem(addedScene);
        this.updateSceneList();
      }
    }, [getSceneAdded]);

    // 监听场景移除事件
    this.createEffect(() => {
      const removedScene = getSceneRemoved();
      if (removedScene) {
        this.removeSceneItem(removedScene.id);
        this.updateSceneList();
      }
    }, [getSceneRemoved]);

    // 监听场景激活事件
    this.createEffect(() => {
      const activatedScene = getSceneActivated();
      if (activatedScene) {
        this.updateSceneActiveState(activatedScene.id);
        this.updateSceneList();
      }
    }, [getSceneActivated]);

    // 监听场景列表变化
    this.createEffect(() => {
      const scenes = getScenes();
      this.scenes = Array.from(scenes.values()).map(scene => ({
        id: scene.id,
        name: scene.name,
        isActive: scene.isActive
      }));
      this.updateSceneList();
    }, [getScenes]);
  }

  /**
   * 初始化UI
   */
  public override initialize(): void {
    super.initialize();
    
    // 创建场景列表容器
    this.sceneListContainer = document.createElement('div');
    Object.assign(this.sceneListContainer.style, {
      padding: '8px',
      overflow: 'auto'
    });

    // 添加到内容容器
    const contentContainer = this.getContentContainer();
    if (contentContainer) {
      contentContainer.appendChild(this.sceneListContainer);
    }

    // 初始化场景列表
    this.updateSceneList();
     // 监听场景变化
    //  this.setupSceneListeners();
  }

  /**
   * 添加场景项
   */
  private addSceneItem(scene: IScene): void {
    const sceneItem: SceneItemData = {
      id: scene.id,
      name: scene.name,
      isActive: scene.isActive
    };
    this.scenes.push(sceneItem);
  }

  /**
   * 移除场景项
   */
  private removeSceneItem(sceneId: string): void {
    this.scenes = this.scenes.filter(scene => scene.id !== sceneId);
  }

  /**
   * 更新场景激活状态
   */
  private updateSceneActiveState(activeSceneId: string): void {
    this.scenes.forEach(scene => {
      scene.isActive = scene.id === activeSceneId;
    });
  }

  /**
   * 创建场景项元素
   */
  private createSceneItemElement(scene: SceneItemData): HTMLElement {
    const item = document.createElement('div');
    Object.assign(item.style, {
      padding: '8px 12px',
      marginBottom: '4px',
      backgroundColor: scene.isActive ? 'hsla(230, 25%, 26%, 1.00)' : 'hsla(230, 25%, 21%, 1.00)',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'background-color 0.2s'
    });

    // 场景名称
    const nameSpan = document.createElement('span');
    nameSpan.textContent = scene.name;
    item.appendChild(nameSpan);

    // 激活状态图标
    const statusIcon = document.createElement('span');
    statusIcon.textContent = scene.isActive ? '●' : '○';
    statusIcon.style.color = scene.isActive ? '#4fc3f7' : '#666';
    item.appendChild(statusIcon);

    // 鼠标悬停效果
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = 'hsla(230, 25%, 28%, 1.00)';
    });

    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = scene.isActive ? 
        'hsla(230, 25%, 26%, 1.00)' : 
        'hsla(230, 25%, 21%, 1.00)';
    });

    // 点击事件
    item.addEventListener('click', () => {
      activateScene(scene.id);
    });

    return item;
  }

  /**
   * 更新场景列表
   */
  private updateSceneList(): void {
    if (!this.sceneListContainer) return;

    // 清空当前列表
    this.sceneListContainer.innerHTML = '';

    // 如果没有场景，显示提示信息
    if (this.scenes.length === 0) {
      const emptyMessage = document.createElement('div');
      Object.assign(emptyMessage.style, {
        padding: '16px',
        textAlign: 'center',
        color: '#666'
      });
      emptyMessage.textContent = '暂无场景';
      this.sceneListContainer.appendChild(emptyMessage);
      return;
    }

    // 渲染场景列表
    this.scenes.forEach(scene => {
      const sceneElement = this.createSceneItemElement(scene);
      this.sceneListContainer?.appendChild(sceneElement);
    });
  }

  /**
   * 清理资源
   */
  public override dispose(): void {
    super.destroy();
  }
} 