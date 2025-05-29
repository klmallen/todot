import { Pane } from 'tweakpane';
import { createEffect } from '@lincode/reactivity';
import { getSelectedNode } from '../states/useEditorMode';
import { Node3d } from '../core/Node3d';

/**
 * 属性面板类 - 用于显示和编辑节点属性
 */
export class PropertyPanel {
  private pane: Pane | null = null;
  private container: HTMLElement;
  private currentNode: Node3d | null = null;
  private disposers: Array<any> = []; // 使用any类型临时解决类型错误问题

  /**
   * 创建属性面板
   * @param container 面板容器元素
   */
  constructor(container: HTMLElement) {
    this.container = container;
    this.initTweakpane();
    this.setupNodeListener();
  }

  /**
   * 初始化 Tweakpane
   */
  private initTweakpane() {
    if (this.pane) {
      this.pane.dispose();
    }
    
    // 创建Pane实例，确保没有标题
    this.pane = new Pane({
      container: this.container,
      expanded: true,  // 保持面板展开
      title: null,     // 明确设置为null以避免默认标题
    });
  }

  /**
   * 设置节点监听器
   */
  private setupNodeListener() {
    // 监听选中节点的变化
    const disposer = createEffect(() => {
      const node = getSelectedNode();
      if (node !== this.currentNode) {
        this.currentNode = node;
        console.log(this.currentNode, ' this.currentNode')
        this.updateProperties();
      }
    }, [getSelectedNode]);
    
    this.disposers.push(disposer);
  }

  /**
   * 显示指定节点的属性
   * @param node 要显示属性的节点
   */
  public showNodeProperties(node: Node3d) {
    this.currentNode = node;
    this.updateProperties();
  }

  /**
   * 更新属性显示
   */
  private updateProperties() {
    if (!this.pane) return;
    
    // 清除现有内容
    this.pane.dispose();
    this.initTweakpane();
    console.log(this.currentNode, ' this.currentNode')
    if (!this.currentNode) {
      this.pane.addBinding({ message: '未选择对象' }, 'message', {
        readonly: true
      });
      return;
    }

    // 获取节点基本信息
    const folder = this.pane.addFolder({
      title: '基本信息',
      expanded: true
    });

    folder.addBinding(this.currentNode, 'name');
    folder.addBinding({ type: this.currentNode.getType() }, 'type', { readonly: true });

    const transformFolder = this.pane.addFolder({
        title: '变换',
        expanded: true
      });
      
    // 添加位置控件
    this.addVector3Controls(transformFolder, this.currentNode, 'position', {
      displayName: '位置',
      min: -100,
      max: 100,
      step: 0.01
    });
      
    // 添加旋转控件
    this.addEulerControls(transformFolder, this.currentNode, 'rotation', {
      displayName: '旋转',
      min: -Math.PI,
      max: Math.PI,
      step: 0.01
    });
      
    // 添加缩放控件
    this.addVector3Controls(transformFolder, this.currentNode, 'scale', {
      displayName: '缩放',
      min: 0.01,
      max: 10,
      step: 0.01
    });

    // 获取节点的可编辑属性
    const editableProps = this.currentNode.getEditableProperties();
    
    // 按组分类属性
    const groupedProps = new Map<string, Array<{ key: string; metadata: any }>>();
    
    // 处理每个可编辑属性
    for (const [propKey, propData] of Object.entries(editableProps)) {
      const group = propData.metadata?.group || 'General';
      
      if (!groupedProps.has(group)) {
        groupedProps.set(group, []);
      }
      
      const props = groupedProps.get(group);
      if (props) {
        props.push({
          key: propKey,
          metadata: propData.metadata
        });
      }
    }
    
    // 为每个组创建文件夹并添加属性
    for (const [groupName, props] of groupedProps) {
      // 按照 order 属性排序
      props.sort((a, b) => 
        ((a.metadata?.order || 0) - (b.metadata?.order || 0))
      );
      
      if (groupName !== 'General' && groupName !== '变换') {
        const groupFolder = this.pane.addFolder({
          title: groupName,
          expanded: true
        });
      }
    }
    
    // 添加可见性控制
    const visibilityFolder = this.pane.addFolder({
      title: '可见性',
      expanded: true
    });
    
    visibilityFolder.addBinding(this.currentNode, 'isVisible');
  }
  
  /**
   * 添加 Vector3 的三个分量控件
   */
  private addVector3Controls(folder: any, target: any, prop: string, metadata: any) {
    // 使用3D点直接绑定整个vector对象
    folder.addBinding(target, prop, {
      label: metadata.displayName || prop,
      x: { 
        min: metadata.min !== undefined ? metadata.min : -10,
        max: metadata.max !== undefined ? metadata.max : 10,
        step: metadata.step || 0.01
      },
      y: { 
        min: metadata.min !== undefined ? metadata.min : -10,
        max: metadata.max !== undefined ? metadata.max : 10,
        step: metadata.step || 0.01
      },
      z: { 
        min: metadata.min !== undefined ? metadata.min : -10,
        max: metadata.max !== undefined ? metadata.max : 10,
        step: metadata.step || 0.01
      }
    });
  }
  
  /**
   * 添加 Euler 的三个分量控件
   */
  private addEulerControls(folder: any, target: any, prop: string, metadata: any) {
    // 使用3D点直接绑定整个euler对象
    folder.addBinding(target, prop, {
      label: metadata.displayName || prop,
      x: { 
        min: metadata.min !== undefined ? metadata.min : -Math.PI,
        max: metadata.max !== undefined ? metadata.max : Math.PI,
        step: metadata.step || 0.01
      },
      y: { 
        min: metadata.min !== undefined ? metadata.min : -Math.PI,
        max: metadata.max !== undefined ? metadata.max : Math.PI,
        step: metadata.step || 0.01
      },
      z: { 
        min: metadata.min !== undefined ? metadata.min : -Math.PI,
        max: metadata.max !== undefined ? metadata.max : Math.PI,
        step: metadata.step || 0.01
      }
    });
  }

  /**
   * 销毁面板
   */
  public dispose() {
    if (this.pane) {
      this.pane.dispose();
      this.pane = null;
    }
    
    // 清理监听器
    this.disposers.forEach(disposer => {
      console.log(disposer,'disposer')
      // disposer();
    });
    this.disposers = [];
  }
} 