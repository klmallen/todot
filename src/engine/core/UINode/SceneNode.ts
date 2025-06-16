import { setSelectGameSceneNode } from '../state/useSelectedNode';
import { BaseUINode } from './BaseUINode';
import { getAllScenes, getIsSceneChanged, getSceneSwitcherNode, setAllScenes, setSelectedObject, setSelectedNode, setIsSceneChanged } from '../../states/useEditorMode';
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

  constructor(name: string = '场景节点') {
    super(name);
    
    // 设置默认尺寸和位置
    this.setSize(250, 'auto');
    this.setPosition(0, 0);
    this.treeData = []; // 初始化为空数组
    this.treeContainer = null;
    this.sceneSwitcher = null;
    
    // 监听场景变化
    this.setupSceneListener();
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
      // 获取当前活动场景
      const engine = Engine.getInstance();
      const activeScene = engine.getActiveScene();
      
      if (activeScene) {
        console.log('Active scene:', activeScene.getName())
        this.updateSceneTree(activeScene);
      } else {
        console.warn('No active scene found');
        this.treeData = [];
        this.renderTree();
      }
    }, [getIsSceneChanged])
  }

  /**
   * 更新场景树
   */
  private updateSceneTree(scene: Scene): void {
    // 设置窗口标题为当前场景名称
    this.setTitle(scene.getName() || 'Unnamed Scene');
    
    // 获取场景的根节点
    const rootNode = scene.getRootNode();
    
    // 构建树形结构，只包含当前场景的节点
    const children = rootNode ? this.getSceneChildren(rootNode) : [];
    
    this.treeData = children;
    this.renderTree();
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
    
    // 初始化场景树 - 只显示当前活动场景
    const activeScene = Engine.getInstance().getActiveScene();
    if (activeScene) {
      this.updateSceneTree(activeScene);
    } else {
      // 如果没有活动场景，显示空树
      this.treeData = [];
      this.renderTree();
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
      marginBottom: '3px',
      marginTop: '3px',
      position: 'relative'
    });

    const nodeHeader = document.createElement('div');
    nodeHeader.className = 'tree-node-header';
    const defaultBgColor = 'var(--tp-base-background-color)';
    const selectedBgColor = 'var(--tp-container-background-color-active)';
    
    Object.assign(nodeHeader.style, {
      display: 'flex',
      alignItems: 'center',
      padding: '1px',
      cursor: 'pointer',
      borderRadius: '2px',
      backgroundColor: defaultBgColor,
      position: 'relative',
      transition: 'background-color 0.2s ease',
      fontSize: '11px',
      height: '24px',
      color: 'var(--tp-label-foreground-color)'
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
    Object.assign(childrenContainer.style, {
      paddingLeft: '20px',
      display: isExpanded ? 'block' : 'none',
      position: 'relative'
    });

    // 添加连接线
    if (data.children && data.children.length > 0) {
      const connectionLine = document.createElement('div');
      Object.assign(connectionLine.style, {
        position: 'absolute',
        left: '8px',
        top: '0',
        bottom: '0',
        width: '1px',
        backgroundColor: 'var(--tp-groove-foreground-color)',
        opacity: '0.3'
      });
      childrenContainer.appendChild(connectionLine);
    }

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
      
      // 只在点击时触发节点选中事件，不切换场景
      this.onNodeSelected(data);
    });

    // 添加双击事件
    nodeHeader.addEventListener('dblclick', (e: MouseEvent) => {
      e.stopPropagation();
      
      if (data.isScene) {
        // 如果是场景节点，添加到场景切换器并激活
        if (data.data instanceof Scene) {
          this.addToSceneSwitcher(data.data);
        }
      } else {
        // 如果是普通节点，显示重命名对话            框
        this.showRenameDialog(data);
      }
    });

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
   * 更新指定场景的节点树
   */
  private updateSceneNodeTree(scene: Scene): void {
    // 直接更新当前场景的节点树
    this.updateSceneTree(scene);
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
      // 只处理普通节点，因为我们不再在SceneNode中显示场景节点
      if (!data.isScene) {
        const node = data.data as Node3d;
        // 设置选中的节点对象
        setSelectedNode(node);
        // 同时设置选中的ThreeObject
        if (node.getThreeObject()) {
          setSelectedObject(node.getThreeObject());
        }
        console.log('Selected node:', data);
      }
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
   * 显示重命名对话框
   */
  private showRenameDialog(nodeData: TreeNodeData): void {
    if (!nodeData.data) return;
    
    // 创建对话框容器
    const dialogContainer = document.createElement('div');
    dialogContainer.className = 'rename-dialog';
    Object.assign(dialogContainer.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '999999'
    });
    
    const dialog = document.createElement('div');
    Object.assign(dialog.style, {
      backgroundColor: 'hsla(40, 3%, 95%, 1.00)',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      width: '300px',
      maxWidth: '90%'
    });
    
    const title = document.createElement('h3');
    title.textContent = '重命名节点';
    Object.assign(title.style, {
      margin: '0 0 15px 0',
      fontSize: '18px'
    });
    
    const form = document.createElement('form');
    form.onsubmit = (e) => e.preventDefault();
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = nodeData.name;
    Object.assign(input.style, {
      width: '100%',
      padding: '4px',
      marginBottom: '6px',
      marginTop: '6px',
      boxSizing: 'border-box',
      border: '1px solid var(--tp-groove-foreground-color)',
      borderRadius: '2px',
      backgroundColor: 'var(--tp-input-background-color)',
      color: 'var(--tp-input-foreground-color)',
      fontSize: '11px',
      height: '24px'
    });
    input.focus();
    input.select();
    
    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px'
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    Object.assign(cancelButton.style, {
      padding: '8px 12px',
      backgroundColor: '#ccc',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    const saveButton = document.createElement('button');
    saveButton.textContent = '保存';
    Object.assign(saveButton.style, {
      padding: '8px 12px',
      backgroundColor: 'hsla(210, 50%, 40%, 1)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    form.appendChild(input);
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(saveButton);
    form.appendChild(buttonContainer);
    
    dialog.appendChild(title);
    dialog.appendChild(form);
    dialogContainer.appendChild(dialog);
    
    document.body.appendChild(dialogContainer);
    
    // 处理取消按钮点击
    cancelButton.onclick = () => {
      document.body.removeChild(dialogContainer);
    };
    
    // 处理保存按钮点击
    saveButton.onclick = () => {
      const newName = input.value.trim();
      if (newName && newName !== nodeData.name) {
        this.renameNode(nodeData, newName);
      }
      document.body.removeChild(dialogContainer);
    };
    
    // 处理回车键
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveButton.click();
      } else if (e.key === 'Escape') {
        cancelButton.click();
      }
    };
  }
  
  /**
   * 重命名节点
   */
  private renameNode(nodeData: TreeNodeData, newName: string): void {
    if (!nodeData.data) return;
    
    if (nodeData.isScene && nodeData.data instanceof Scene) {
      // 重命名场景
      nodeData.data.setName(newName);
    } else if (!nodeData.isScene && nodeData.data instanceof Node3d) {
      // 重命名普通节点
      nodeData.data.setName(newName);
    }
    
    // 触发场景变更事件
    setIsSceneChanged(getIsSceneChanged() + 1);
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

  /**
   * 设置节点标题
   */
  public setTitle(title: string): void {
    // 修改DOM中的标题
    if (this.element) {
      const titleElement = this.element.querySelector('.ui-node-header .ui-node-title');
      if (titleElement) {
        titleElement.textContent = title;
      } else {
        const titleEl = this.element.querySelector('.ui-node-header span');
        if (titleEl) {
          titleEl.textContent = title;
        }
      }
    }
  }
} 