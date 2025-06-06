import { setSelectGameSceneNode } from '../state/useSelectedNode';
import { BaseUINode } from './BaseUINode';
import { getAllScenes, getIsSceneChanged, getSceneSwitcherNode, setAllScenes, setSelectedObject, setSelectedNode } from '../../states/useEditorMode';
import { Scene as ThreeScene, Object3D } from 'three';
import Engine from '../Engine';
import { Scene } from '../Scene';
import { Node3d } from '../Node3d';
import { SceneSwitcherNode } from './SceneSwitcherNode';

interface TreeNodeData {
  name: string;
  children?: TreeNodeData[];
  type?: string;
  icon?: string;
  data?: Scene | Node3d;
  isScene?: boolean;
}

/**
 * 场景节点类
 */
export class SceneNode extends BaseUINode {
  private treeData: TreeNodeData[];
  private treeContainer: HTMLElement | null;
  private sceneUpdateCallback: (() => void) | null = null;
  private sceneSwitcher: SceneSwitcherNode | null = null;

  constructor(sceneSwitcher?: SceneSwitcherNode) {
    super('SceneNode');
    this.size = { width: 250, height: 600 };
    this.position = { x: 10, y: 10 };
    this.treeData = []; // 初始化为空数组
    this.treeContainer = null;
    this.sceneSwitcher = sceneSwitcher || null;
    
    // 扩展基础样式
    Object.assign(this.style, {
      backgroundColor: 'hsla(40, 3%, 70%, 1.00)',
      color: 'hsla(40, 3%, 20%, 1.00)',
      padding: '0',
      display: 'flex',
      flexDirection: 'column'
    });

    // 监听场景变化
    this.setupSceneListener();
    
    // 监听SceneSwitcherNode实例变化
    this.createEffect(() => {
      const switcher = getSceneSwitcherNode();
      if (switcher) {
        this.sceneSwitcher = switcher;
      }
    }, [getSceneSwitcherNode]);
  }

  /**
   * 设置场景切换器
   */
  public setSceneSwitcher(switcher: SceneSwitcherNode): void {
    this.sceneSwitcher = switcher;
  }

  /**
   * 设置场景变化监听
   */
  private setupSceneListener(): void {
    // 监听场景数组变化
    this.createEffect(() => {
      console.log('scene changed')
      // 使用getAllScenes替代直接访问Engine.getInstance().scenes
      const scenes = Engine.getInstance().scenes;
      // 将数组转换为Map
      const scenesMap = new Map<string, Scene>();
      scenes.forEach(scene => {
        scenesMap.set(scene.getName(), scene);
      });
      console.log('scenesMap', scenesMap)
      this.updateSceneTree(scenesMap);
    }, [getIsSceneChanged])
  }

  /**
   * 更新场景树
   */
  private updateSceneTree(scenes: Map<string, Scene>): void {
    // 将Map转换为数组并构建树形结构
    const treeData: TreeNodeData[] = Array.from(scenes.entries()).map(([key, scene]) => {
      // 获取场景的根节点
      const rootNode = scene.getRootNode();
      return {
        name: scene.getName() || 'Unnamed Scene',
        type: 'scene',
        icon: '🎬',
        data: scene,
        isScene: true,
        children: rootNode ? this.getSceneChildren(rootNode) : []
      };
    });

    this.updateTreeData(treeData);
  }

  /**
   * 获取场景子节点
   */
  private getSceneChildren(node: Node3d): TreeNodeData[] {
    const children: TreeNodeData[] = [];
    
    if (node.getChildren() && Array.isArray(node.getChildren())) {
      node.getChildren().forEach(child => {
        if (child) {
          children.push({
            name: child.getName() || child.constructor.name,
            type: child.constructor.name,
            icon: this.getNodeIcon(child.constructor.name),
            data: child,
            isScene: false,
            children: this.getSceneChildren(child)
          });
        }
      });
    }

    return children;
  }

  /**
   * 获取节点图标
   */
  private getNodeIcon(type: string): string {
    switch (type) {
      case 'MeshInstance3D': return '';
      case 'Light': return '';
      case 'CameraNode3D': return '';
      case 'Node3d': return '';
      case 'Scene': return '';
      default: return '';
    }
  }

  /**
   * 初始化场景节点
   */
  public override initialize(): void {
    super.initialize();
    
    // 获取内容容器
    this.treeContainer = this.getContentContainer();
    if (this.treeContainer) {
      Object.assign(this.treeContainer.style, {
        padding: '0'
      });
    }
    
    // 初始化场景树
    const scenes = getAllScenes();
    if (Array.isArray(scenes)) {
      // 将数组转换为Map
      const scenesMap = new Map<string, Scene>();
      scenes.forEach(scene => {
        scenesMap.set(scene.getName(), scene);
      });
      this.updateSceneTree(scenesMap);
    }
  }


  /**
   * 切换内容区域的显示/隐藏
   */
  private toggleContent(): void {
    this.toggleExpand();
  }

  /**
   * 创建树形视图
   */
  private createTreeView(): void {
    this.treeContainer = document.createElement('div');
    this.treeContainer.className = 'scene-tree-container';
    Object.assign(this.treeContainer.style, {
      flex: 1,
      overflow: 'auto',
      padding: '8px'
    });

    if (this.element) {
      this.element.appendChild(this.treeContainer);
      this.renderTree();
    }
  }

  /**
   * 创建树节点
   */
  private createTreeNode(data: TreeNodeData, isExpanded: boolean = false, depth: number = 0): HTMLElement {
    // 添加最大深度限制，防止无限递归
    if (depth > 100) {
      console.warn('Maximum tree depth reached');
      return document.createElement('div');
    }

    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'tree-node';
    Object.assign(nodeContainer.style, {
      marginBottom: '4px'
    });

    const nodeHeader = document.createElement('div');
    nodeHeader.className = 'tree-node-header';
    const defaultBgColor = 'hsla(40, 3%, 70%, 1.00)';
    const selectedBgColor = 'hsla(40, 3%, 75%, 1.00)';
    
    Object.assign(nodeHeader.style, {
      display: 'flex',
      alignItems: 'center',
      padding: '4px',
      cursor: 'pointer',
      borderRadius: '2px',
      backgroundColor: defaultBgColor,
      position: 'relative',
      transition: 'background-color 0.2s ease'
    });

    // 创建展开/折叠指示器
    const toggle = document.createElement('span');
    toggle.className = 'tree-node-toggle';
    Object.assign(toggle.style, {
      width: '16px',
      height: '16px',
      position: 'relative',
      marginRight: '4px',
      display: 'inline-block'
    });

    // 创建指示器的伪元素样式
    const toggleIndicator = document.createElement('span');
    Object.assign(toggleIndicator.style, {
      background: 'linear-gradient(to left, var(--cnt-fg, currentColor), var(--cnt-fg, currentColor) 2px, transparent 2px, transparent 4px, var(--cnt-fg, currentColor) 4px)',
      borderRadius: '2px',
      content: '""',
      display: 'block',
      height: '6px',
      width: '6px',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: isExpanded ? 'translate(-50%, -50%) rotate(90deg)' : 'translate(-50%, -50%)',
      transition: 'transform .2s ease-in-out',
      opacity: '0.5'
    });
    toggle.appendChild(toggleIndicator);

    nodeHeader.appendChild(toggle);

    // 节点图标
    const icon = document.createElement('span');
    icon.textContent = data.icon || '';
    icon.style.marginRight = '4px';
    nodeHeader.appendChild(icon);

    // 节点名称
    const label = document.createElement('span');
    label.textContent = data.name;
    nodeHeader.appendChild(label);

    nodeContainer.appendChild(nodeHeader);

    // 子节点容器
    const childrenContainer = document.createElement('div');
    childrenContainer.style.paddingLeft = '20px';
    childrenContainer.style.display = isExpanded ? 'block' : 'none';

    // 添加子节点（增加深度计数）
    if (data.children && Array.isArray(data.children)) {
      data.children.forEach(child => {
        try {
          childrenContainer.appendChild(this.createTreeNode(child, false, depth + 1));
        } catch (error) {
          console.error('Error creating child node:', error);
        }
      });
    }

    nodeContainer.appendChild(childrenContainer);

    // 添加点击事件
    nodeHeader.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      
      // 移除所有其他节点的选中状态
      document.querySelectorAll('.tree-node-header').forEach(header => {
        (header as HTMLElement).style.backgroundColor = defaultBgColor;
      });
      
      // 设置当前节点的选中状态
      nodeHeader.style.backgroundColor = selectedBgColor;
      
      const isExpanded = childrenContainer.style.display !== 'none';
      toggleIndicator.style.transform = isExpanded 
        ? 'translate(-50%, -50%)' 
        : 'translate(-50%, -50%) rotate(90deg)';
      childrenContainer.style.display = isExpanded ? 'none' : 'block';
      
      // 触发节点选中事件
      this.onNodeSelected(data);
    });

    // 添加双击事件 - 如果是场景节点，则添加到场景切换器中
    if (data.isScene) {
      nodeHeader.addEventListener('dblclick', (e: MouseEvent) => {
        e.stopPropagation();
        
        // 如果是场景节点，添加到场景切换器
        if (data.isScene && data.data instanceof Scene) {
          this.addToSceneSwitcher(data.data);
        }
      });
    }

    return nodeContainer;
  }

  /**
   * 添加场景到场景切换器
   */
  private addToSceneSwitcher(scene: Scene): void {
    // 从状态中获取场景切换器实例
    if (!this.sceneSwitcher) {
      const switcher = getSceneSwitcherNode();
      if (switcher) {
        this.sceneSwitcher = switcher;
      }
    }
    
    // 如果找到了场景切换器，添加场景
    if (this.sceneSwitcher) {
      this.sceneSwitcher.addScene(scene);
    } else {
      console.warn('无法找到场景切换器，请先设置场景切换器');
    }
  }

  /**
   * 渲染树
   */
  private renderTree(): void {
    if (!this.treeContainer) return;
    
    this.treeContainer.innerHTML = '';
    console.log('Rendering tree with data:', this.treeData);
    
    if (!Array.isArray(this.treeData) || this.treeData.length === 0) {
      console.warn('Tree data is empty or invalid');
      return;
    }

    this.treeData.forEach(data => {
      try {
        const node = this.createTreeNode(data, true, 0);
        if (node && this.treeContainer) {
          this.treeContainer.appendChild(node);
        }
      } catch (error) {
        console.error('Error rendering tree node:', error);
      }
    });
  }

  /**
   * 更新场景树数据
   */
  public updateTreeData(data: TreeNodeData[]): void {
    if (!Array.isArray(data)) {
      console.error('Invalid tree data format:', data);
      return;
    }
    
    console.log('Updating tree data:', data);
    this.treeData = data;
    this.renderTree();
  }

  /**
   * 节点选中事件
   */
  private onNodeSelected(data: TreeNodeData): void {
    if (data.data) {
      // 如果是场景节点，设置为当前场景
      if (data.isScene) {
        const scene = data.data as Scene;
        Engine.getInstance().setActiveScene(scene);
        
        // 将场景添加到场景切换器
        this.addToSceneSwitcher(scene);
      } else {
        // 如果是普通节点，设置为选中节点
        const node = data.data as Node3d;
        // 设置选中的节点对象
        setSelectedNode(node);
        // 同时设置选中的ThreeObject
        if (node.getThreeObject()) {
          setSelectedObject(node.getThreeObject());
        }
      }
      console.log('Selected node:', data);
    }
  }

  /**
   * 添加节点选中事件监听器
   */
  public onNodeSelect(callback: (data: TreeNodeData) => void): void {
    this.element?.addEventListener('node-selected', ((e: CustomEvent<TreeNodeData>) => {
      callback(e.detail);
    }) as EventListener);
  }

  /**
   * 清理资源
   */
  public override dispose(): void {
    if (this.sceneUpdateCallback) {
      // 移除场景变化监听
      this.sceneUpdateCallback = null;
    }
    super.destroy();
  }
} 