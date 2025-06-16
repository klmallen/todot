import { BaseUINode } from './BaseUINode';
import { Node3d } from '../Node3d';
import { Scene } from '../Scene';
import { IEngine } from '../interfaces';
import Engine from '../Engine';
import { getSelectedNode, getIsSceneChanged, setIsSceneChanged, setSelectedNode, setSelectedObject } from '../../states/useEditorMode';
import { EventEmitter } from '../../utils/EventEmitter';
import EventLoopItem from '../../utils/EventLoopItem';
import { MeshInstance3D } from '../MeshInstance3D';
import { ModelNode } from '../ModelNode';
import * as THREE from 'three';

// 定义节点类型接口
interface NodeType {
  name: string;
  description: string;
  icon?: string;
  createNode: (name: string) => Node3d;
}

/**
 * 节点创建器UI
 */
export class NodeCreatorUI extends BaseUINode {
  private engine: Engine;
  private nodeTypes: NodeType[] = [];
  private contextMenuElement: HTMLElement | null = null;
  private currentScene: Scene | null = null;

  constructor(engine: Engine) {
    super('节点创建器');
    this.engine = engine;
    this.size = { width: 250, height: 400 };
    this.position = { x: 50, y: 100 };
    
    // 初始化默认节点类型
    this.registerDefaultNodeTypes();
    
    // 默认隐藏，通过右键菜单显示
    this.visible = false;
  }

  /**
   * 注册默认节点类型
   */
  private registerDefaultNodeTypes(): void {
    // 空节点
    this.registerNodeType({
      name: '空节点',
      description: '一个空的3D节点',
      createNode: (name) => new Node3d(name)
    });
    
    // 相机节点
    this.registerNodeType({
      name: '相机',
      description: '场景相机',
      createNode: (name) => {
        const node = new Node3d(name);
        node.setType('Camera');
        return node;
      }
    });
    
    // 光源节点
    this.registerNodeType({
      name: '点光源',
      description: '点光源',
      createNode: (name) => {
        const node = new Node3d(name);
        node.setType('PointLight');
        return node;
      }
    });
    
    // 平行光
    this.registerNodeType({
      name: '平行光',
      description: '平行光源',
      createNode: (name) => {
        const node = new Node3d(name);
        node.setType('DirectionalLight');
        return node;
      }
    });
    
    // 环境光
    this.registerNodeType({
      name: '环境光',
      description: '环境光源',
      createNode: (name) => {
        const node = new Node3d(name);
        node.setType('AmbientLight');
        return node;
      }
    });
    
    // 立方体网格
    this.registerNodeType({
      name: '立方体',
      description: '立方体网格',
      createNode: (name) => {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x3080ff });
        return new MeshInstance3D(name, geometry, material);
      }
    });
    
    // 球体网格
    this.registerNodeType({
      name: '球体',
      description: '球体网格',
      createNode: (name) => {
        const geometry = new THREE.SphereGeometry(0.5, 32, 16);
        const material = new THREE.MeshStandardMaterial({ color: 0x3080ff });
        return new MeshInstance3D(name, geometry, material);
      }
    });
    
    // 平面网格
    this.registerNodeType({
      name: '平面',
      description: '平面网格',
      createNode: (name) => {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x808080,
          side: THREE.DoubleSide 
        });
        return new MeshInstance3D(name, geometry, material);
      }
    });
    
    // 圆柱体网格
    this.registerNodeType({
      name: '圆柱体',
      description: '圆柱体网格',
      createNode: (name) => {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0x3080ff });
        return new MeshInstance3D(name, geometry, material);
      }
    });
    
    // 圆锥体网格
    this.registerNodeType({
      name: '圆锥体',
      description: '圆锥体网格',
      createNode: (name) => {
        const geometry = new THREE.ConeGeometry(0.5, 1, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0x3080ff });
        return new MeshInstance3D(name, geometry, material);
      }
    });
    
    // 环形网格
    this.registerNodeType({
      name: '环形',
      description: '环形网格',
      createNode: (name) => {
        const geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
        const material = new THREE.MeshStandardMaterial({ color: 0x3080ff });
        return new MeshInstance3D(name, geometry, material);
      }
    });
    
    // 模型节点
    this.registerNodeType({
      name: '模型',
      description: '3D模型加载器',
      createNode: (name) => {
        return new ModelNode(name);
      }
    });
  }

  /**
   * 注册新的节点类型
   */
  public registerNodeType(nodeType: NodeType): void {
    this.nodeTypes.push(nodeType);
  }

  /**
   * 初始化UI
   */
  public override initialize(): void {
    super.initialize();
    this.renderNodeTypeList();
    this.setupContextMenu();
  }

  /**
   * 渲染节点类型列表
   */
  private renderNodeTypeList(): void {
    if (!this.contentContainer) return;
    
    this.contentContainer.innerHTML = '';
    
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = '搜索节点类型...';
    Object.assign(searchBox.style, {
      width: '100%',
      padding: '8px',
      marginBottom: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxSizing: 'border-box'
    });
    
    searchBox.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const query = target.value.toLowerCase();
      this.filterNodeTypes(query);
    });
    
    this.contentContainer.appendChild(searchBox);
    
    const nodeListContainer = document.createElement('div');
    nodeListContainer.className = 'node-type-list';
    Object.assign(nodeListContainer.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      overflowY: 'auto',
      height: 'calc(100% - 40px)'
    });
    
    this.nodeTypes.forEach(nodeType => {
      const nodeItem = this.createNodeTypeItem(nodeType);
      nodeListContainer.appendChild(nodeItem);
    });
    
    this.contentContainer.appendChild(nodeListContainer);
  }

  /**
   * 创建节点类型项
   */
  private createNodeTypeItem(nodeType: NodeType): HTMLElement {
    const item = document.createElement('div');
    item.className = 'node-type-item';
    Object.assign(item.style, {
      padding: '8px 10px',
      borderRadius: '4px',
      backgroundColor: 'var(--tp-container-background-color)',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'var(--tp-label-foreground-color)'
    });
    
    // 图标（如果有）
    if (nodeType.icon) {
      const icon = document.createElement('div');
      icon.className = 'node-type-icon';
      icon.innerHTML = nodeType.icon;
      Object.assign(icon.style, {
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
      item.appendChild(icon);
    }
    
    // 名称和描述
    const textContainer = document.createElement('div');
    textContainer.style.flexGrow = '1';
    
    const name = document.createElement('div');
    name.textContent = nodeType.name;
    name.style.fontWeight = 'bold';
    
    const description = document.createElement('div');
    description.textContent = nodeType.description;
    description.style.fontSize = '12px';
    description.style.color = '#666';
    
    textContainer.appendChild(name);
    textContainer.appendChild(description);
    item.appendChild(textContainer);
    
    // 悬停效果
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = 'var(--tp-container-background-color-active)';
    });
    
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = 'var(--tp-container-background-color)';
    });
    
    // 点击创建节点
    item.addEventListener('click', () => {
      this.createNodeOfType(nodeType);
      this.hide();
    });
    
    return item;
  }

  /**
   * 过滤节点类型
   */
  private filterNodeTypes(query: string): void {
    if (!this.contentContainer) return;
    
    const nodeList = this.contentContainer.querySelector('.node-type-list');
    if (!nodeList) return;
    
    nodeList.innerHTML = '';
    
    this.nodeTypes.forEach(nodeType => {
      if (nodeType.name.toLowerCase().includes(query) || 
          nodeType.description.toLowerCase().includes(query)) {
        const nodeItem = this.createNodeTypeItem(nodeType);
        nodeList.appendChild(nodeItem);
      }
    });
  }

  /**
   * 创建指定类型的节点
   */
  private createNodeOfType(nodeType: NodeType): void {
    // 获取当前活动场景
    const activeScenes = this.engine.getAllScenes().filter(scene => scene.isActive());
    if (activeScenes.length === 0) {
      console.error('没有活动场景，无法创建节点');
      return;
    }
    
    const scene = activeScenes[0];
    if (!scene) {
      console.error(`无法获取活动场景`);
      return;
    }
    
    // 创建输入对话框
    const dialogContainer = document.createElement('div');
    dialogContainer.className = 'node-name-dialog';
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
    title.textContent = `创建${nodeType.name}`;
    Object.assign(title.style, {
      margin: '0 0 15px 0',
      fontSize: '18px',
      color: '#333'
    });
    
    const form = document.createElement('form');
    form.onsubmit = (e) => e.preventDefault();
    
    const inputLabel = document.createElement('label');
    inputLabel.textContent = '节点名称:';
    inputLabel.htmlFor = 'node-name-input';
    Object.assign(inputLabel.style, {
      display: 'block',
      marginBottom: '5px',
      color: '#333'
    });
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'node-name-input';
    input.value = nodeType.name; // 默认使用节点类型名称
    Object.assign(input.style, {
      width: '100%',
      padding: '8px',
      marginBottom: '15px',
      boxSizing: 'border-box',
      border: '1px solid #ccc',
      borderRadius: '4px',
      color: '#333'
    });
    input.focus();
    
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
    
    const createButton = document.createElement('button');
    createButton.textContent = '创建';
    Object.assign(createButton.style, {
      padding: '8px 12px',
      backgroundColor: 'hsla(210, 50%, 40%, 1)',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    });
    
    form.appendChild(inputLabel);
    form.appendChild(input);
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(createButton);
    form.appendChild(buttonContainer);
    
    dialog.appendChild(title);
    dialog.appendChild(form);
    dialogContainer.appendChild(dialog);
    
    document.body.appendChild(dialogContainer);
    
    // 处理取消按钮点击
    cancelButton.onclick = () => {
      document.body.removeChild(dialogContainer);
    };
    
    // 处理创建按钮点击
    createButton.onclick = () => {
      const nodeName = input.value.trim();
      if (nodeName) {
        this.createNodeWithName(nodeType, nodeName, scene);
      }
      document.body.removeChild(dialogContainer);
    };
    
    // 处理回车键
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        createButton.click();
      } else if (e.key === 'Escape') {
        cancelButton.click();
      }
    };
  }
  
  /**
   * 使用指定名称创建节点
   */
  private createNodeWithName(nodeType: NodeType, baseName: string, scene: Scene): void {
    let nodeName = baseName;
    let counter = 1;
    
    // 检查名称是否已存在
    while (scene.getNodesByName(nodeName).length > 0) {
      nodeName = `${baseName}_${counter}`;
      counter++;
    }
    
    // 创建节点
    const newNode = nodeType.createNode(nodeName);
    
    // 获取选中的节点作为父节点，如果没有则添加到根节点
    const selectedNode = getSelectedNode();
    if (selectedNode) {
      selectedNode.addChild(newNode);
    } else {
      scene.addNode(newNode);
    }
    
    // 设置选中节点
    setSelectedNode(newNode);
    
    // 尝试获取变换控制器并附加到新节点
    setTimeout(() => {
      const threeObject = newNode.getThreeObject();
      if (threeObject) {
        // 使用setSelectedObject触发变换控制器的附加
        setSelectedObject(threeObject);
      }
    }, 10);
  }

  /**
   * 设置当前场景
   */
  public setCurrentScene(scene: Scene): void {
    this.currentScene = scene;
  }

  /**
   * 设置上下文菜单
   */
  private setupContextMenu(): void {
    // 监听右键点击事件，针对画布区域
    document.addEventListener('contextmenu', (e) => {
      // 只在编辑器模式下启用
      if (!this.engine.isEditorMode()) return;
      
      // 获取当前活动场景，如果没有活动场景则不显示菜单
      const activeScenes = this.engine.getAllScenes().filter(scene => scene.isActive());
      if (activeScenes.length === 0) return;
      
      // 检查点击位置是否在编辑器区域内
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const isInCanvas = (
          e.clientX >= rect.left && 
          e.clientX <= rect.right && 
          e.clientY >= rect.top && 
          e.clientY <= rect.bottom
        );
        
        if (isInCanvas) {
          e.preventDefault();
          this.showContextMenu(e.clientX, e.clientY);
        }
      } else {
        // 如果找不到canvas，就在任何地方都显示菜单
        e.preventDefault();
        this.showContextMenu(e.clientX, e.clientY);
      }
    });
    
    // 点击其他地方关闭菜单
    document.addEventListener('click', () => {
      this.hideContextMenu();
    });
  }

  /**
   * 显示上下文菜单
   */
  private showContextMenu(x: number, y: number): void {
    // 如果已有菜单，先移除
    this.hideContextMenu();
    
    // 创建上下文菜单
    this.contextMenuElement = document.createElement('div');
    this.contextMenuElement.className = 'node-creator-context-menu';
    Object.assign(this.contextMenuElement.style, {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      backgroundColor: 'hsla(40, 3%, 95%, 1.00)',
      border: '1px solid hsla(40, 3%, 75%, 1.00)',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      zIndex: '999999',
      minWidth: '150px',
      padding: '5px 0'
    });
    
    // 添加菜单项
    const createNodeOption = document.createElement('div');
    createNodeOption.textContent = '创建节点';
    Object.assign(createNodeOption.style, {
      padding: '8px 12px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    });
    
    createNodeOption.addEventListener('mouseover', () => {
      createNodeOption.style.backgroundColor = 'hsla(40, 3%, 85%, 1.00)';
    });
    
    createNodeOption.addEventListener('mouseout', () => {
      createNodeOption.style.backgroundColor = 'transparent';
    });
    
    createNodeOption.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideContextMenu();
      
      // 显示节点创建器
      this.setPosition(x, y);
      this.show();
    });
    
    this.contextMenuElement.appendChild(createNodeOption);
    document.body.appendChild(this.contextMenuElement);
  }

  /**
   * 隐藏上下文菜单
   */
  private hideContextMenu(): void {
    if (this.contextMenuElement && this.contextMenuElement.parentNode) {
      this.contextMenuElement.parentNode.removeChild(this.contextMenuElement);
      this.contextMenuElement = null;
    }
  }
} 