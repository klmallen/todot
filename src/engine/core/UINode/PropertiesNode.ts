import { BaseUINode } from './BaseUINode';
import { Pane } from 'tweakpane';
import * as THREE from 'three';
import { getSelectedNode } from '../../states/useEditorMode';
import { createEffect } from '@lincode/reactivity';
import { Node3d } from '../Node3d';

interface Transform {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

// 修改Material接口定义
interface MaterialProperties {
  color?: THREE.Color;
  opacity?: number;
  metalness?: number;
  roughness?: number;
}

interface SceneObject {
  name?: string;
  transform?: Transform;
  material?: THREE.Material & MaterialProperties;
  [key: string]: any;
}

/**
 * 属性面板节点类
 */
export class PropertiesNode extends BaseUINode {
  private pane: any | null; // 临时使用any类型来解决Tweakpane的类型问题
  private currentTarget: SceneObject | null = null;
  private container: HTMLElement | null = null;
  private selectedNode: Node3d | null = null;
  private bindings: Map<string, any> = new Map(); // 存储所有绑定

  constructor() {
    super('PropertiesNode');
    this.size = { width: 300, height: 600 };
    this.position = { x: window.innerWidth - 310, y: 10 };
    this.pane = null;
    this.container = null;
    
    // 扩展基础样式
    Object.assign(this.style, {
      backgroundColor: 'hsla(40, 3%, 70%, 1.00)'
    });
  }

  /**
   * 初始化属性面板
   */
  public override initialize(): void {
    super.initialize();
    
    // 获取内容容器
    this.container = this.getContentContainer();
    if (!this.container) {
      console.error('Failed to get content container');
      return;
    }

    try {
      // 初始化Tweakpane
      this.createPane();
      // 监听选中节点的变化
      this.setupNodeSelectionListener();
    } catch (error) {
      console.error('Failed to initialize Tweakpane:', error);
    }
  }

  /**
   * 监听节点选择变化
   */
  private setupNodeSelectionListener(): void {
    // 使用createEffect监听选中节点的变化
    this.createEffect(() => {
      const selectedNode = getSelectedNode();
      if (selectedNode !== this.selectedNode) {
        console.log('选中节点变化:', selectedNode?.getName());
        this.selectedNode = selectedNode;
        this.updatePropertiesFromNode(selectedNode);
      }
    }, [getSelectedNode]);
  }

  /**
   * 从节点获取并更新属性
   * @param node 选中的节点
   */
  private updatePropertiesFromNode(node: Node3d | null): void {
    if (!node) {
      this.clearProperties();
      return;
    }

    try {
      // 重建属性面板
      this.createPane(node.getName() || '属性编辑器');

      // 获取节点的可编辑属性
      const editableProps = node.getEditableProperties();
      
      console.log('节点的可编辑属性:', editableProps);

      // 需要排除的属性
      const excludedProps = ['_scripts', '_tags'];

      // 创建分组
      const groups: Map<string, any> = new Map();
      
      // 按组添加属性
      for (const [key, prop] of Object.entries(editableProps)) {
        // 跳过被排除的属性
        if (excludedProps.includes(key)) continue;

        const group = prop.metadata.group || 'General';
        
        // 如果组不存在，创建新的文件夹
        if (!groups.has(group)) {
          groups.set(group, this.pane!.addFolder({ title: group }));
        }
        
        const folder = groups.get(group);
        
        // 根据属性类型创建不同的绑定
        const bindingOptions: any = {
          label: prop.metadata.displayName || key,
        };

        // 添加数值类型的约束
        if (prop.metadata.type === 'number') {
          if (prop.metadata.min !== undefined) bindingOptions.min = prop.metadata.min;
          if (prop.metadata.max !== undefined) bindingOptions.max = prop.metadata.max;
          if (prop.metadata.step !== undefined) bindingOptions.step = prop.metadata.step;
        }

        // 对于vector3类型的特殊处理
        if (prop.metadata.type === 'vector3') {
          console.log('Vector3 value:', prop.value);
          const binding = folder.addBinding(
            { value: prop.value },
            'value',
            {
              label: bindingOptions.label,
              x: { min: -100, max: 100, step: 0.1 },
              y: { min: -100, max: 100, step: 0.1 },
              z: { min: -100, max: 100, step: 0.1 }
            }
          );
          this.bindings.set(key, binding);
        }
        // 对于euler类型的特殊处理
        else if (prop.metadata.type === 'euler') {
          console.log('Vector3 value:', prop.value);
          const binding = folder.addBinding(
            { value: prop.value },
            'value',
            {
              label: bindingOptions.label,
              x: { min: -100, max: 100, step: 0.1 },
              y: { min: -100, max: 100, step: 0.1 },
              z: { min: -100, max: 100, step: 0.1 }
            }
          );
          this.bindings.set(key, binding);
        }
        // 其他类型的常规处理
        else {
          const target = prop.metadata.isAccessor ? node : { value: prop.value };
          const path = prop.metadata.isAccessor ? key : 'value';
          const binding = folder.addBinding(target, path, bindingOptions);
          this.bindings.set(key, binding);
        }
      }
      
      // 处理特殊节点类型的属性
      this.handleSpecialNodeTypes(node);

      // 添加自动刷新
      this.setupAutoRefresh();
      
    } catch (error) {
      console.error('Error updating properties from node:', error);
    }
  }
  
  /**
   * 处理特殊节点类型的属性
   */
  private handleSpecialNodeTypes(node: Node3d): void {
    // 处理 MeshInstance3D
    if (node.constructor.name === 'MeshInstance3D') {
      try {
        const meshNode = node as any;
        if (meshNode.getMaterial) {
          const material = meshNode.getMaterial();
          if (material) {
            const materialFolder = this.pane!.addFolder({ title: '材质属性' });
            
            // 检查是否有颜色属性
            if ('color' in material) {
              materialFolder.addInput(material, 'color', {
                label: '颜色'
              });
            }
            
            // 检查其他常见材质属性
            if ('opacity' in material) {
              materialFolder.addInput(material, 'opacity', {
                label: '不透明度',
                min: 0,
                max: 1,
                step: 0.01
              }).on('change', (ev: any) => {
                material.transparent = ev.value < 1;
                material.needsUpdate = true;
              });
            }
            
            if ('wireframe' in material) {
              materialFolder.addInput(material, 'wireframe', {
                label: '线框模式'
              });
            }
            
            if ('metalness' in material) {
              materialFolder.addInput(material, 'metalness', {
                label: '金属度',
                min: 0,
                max: 1,
                step: 0.01
              });
            }
            
            if ('roughness' in material) {
              materialFolder.addInput(material, 'roughness', {
                label: '粗糙度',
                min: 0,
                max: 1,
                step: 0.01
              });
            }
            
            if ('emissive' in material && material.emissive instanceof THREE.Color) {
              materialFolder.addInput(material, 'emissive', {
                label: '自发光',
                view: 'color'
              });
            }
          }
        }
      } catch (e) {
        console.warn('Error handling MeshInstance3D properties:', e);
      }
    }
    
    // 处理物理节点
    if (node.constructor.name === 'PhysicsNode') {
      try {
        const physicsNode = node as any;
        if (physicsNode.getCollider) {
          const collider = physicsNode.getCollider();
          if (collider) {
            const physicsFolder = this.pane!.addFolder({ title: '物理属性' });
            
            // 添加一些基本的物理属性按钮
            physicsFolder.addButton({
              title: '重置物理状态'
            }).on('click', () => {
              if (physicsNode.setLinearVelocity) {
                physicsNode.setLinearVelocity(new THREE.Vector3(0, 0, 0));
              }
              if (physicsNode.setAngularVelocity) {
                physicsNode.setAngularVelocity(new THREE.Vector3(0, 0, 0));
              }
            });
          }
        }
      } catch (e) {
        console.warn('Error handling PhysicsNode properties:', e);
      }
    }
  }

  /**
   * 创建或重新创建Tweakpane实例
   */
  private createPane(title: string = '属性编辑器'): void {
    if (!this.container) {
      throw new Error('Container not initialized');
    }

    if (this.pane) {
      this.pane.dispose();
    }

    this.pane = new Pane({
      container: this.container,
      title: title
    });
  }

  /**
   * 更新属性面板（用于兼容旧代码）
   */
  public updateProperties(target: SceneObject): void {
    if (!this.container) {
      console.error('Container not initialized');
      return;
    }

    try {
      this.currentTarget = target;
      this.createPane(target.name || '属性编辑器');

      if (!target) {
        console.warn('No target object provided');
        return;
      }

      // 添加基本变换属性
      if (target.transform) {
        const transformFolder = this.pane!.addFolder({ title: '变换' });
        
        // 位置
        if (target.transform.position) {
          transformFolder.addInput(target.transform.position, 'x', {
            label: 'X',
            min: -100,
            max: 100,
            step: 0.1
          });
          transformFolder.addInput(target.transform.position, 'y', {
            label: 'Y',
            min: -100,
            max: 100,
            step: 0.1
          });
          transformFolder.addInput(target.transform.position, 'z', {
            label: 'Z',
            min: -100,
            max: 100,
            step: 0.1
          });
        }

        // 旋转
        if (target.transform.rotation) {
          transformFolder.addInput(target.transform.rotation, 'x', {
            label: '旋转X',
            min: -Math.PI,
            max: Math.PI,
            step: 0.01
          });
          transformFolder.addInput(target.transform.rotation, 'y', {
            label: '旋转Y',
            min: -Math.PI,
            max: Math.PI,
            step: 0.01
          });
          transformFolder.addInput(target.transform.rotation, 'z', {
            label: '旋转Z',
            min: -Math.PI,
            max: Math.PI,
            step: 0.01
          });
        }

        // 缩放
        if (target.transform.scale) {
          transformFolder.addInput(target.transform.scale, 'x', {
            label: '缩放X',
            min: 0.01,
            max: 10,
            step: 0.01
          });
          transformFolder.addInput(target.transform.scale, 'y', {
            label: '缩放Y',
            min: 0.01,
            max: 10,
            step: 0.01
          });
          transformFolder.addInput(target.transform.scale, 'z', {
            label: '缩放Z',
            min: 0.01,
            max: 10,
            step: 0.01
          });
        }
      }

      // 如果目标对象有材质属性
      if (target.material) {
        const materialFolder = this.pane!.addFolder({ title: '材质' });
        
        if (target.material.color) {
          materialFolder.addInput(target.material, 'color', {
            label: '颜色'
          });
        }
        
        if (target.material.opacity !== undefined) {
          materialFolder.addInput(target.material, 'opacity', {
            label: '不透明度',
            min: 0,
            max: 1,
            step: 0.01
          });
        }
        
        if (target.material.metalness !== undefined) {
          materialFolder.addInput(target.material, 'metalness', {
            label: '金属度',
            min: 0,
            max: 1,
            step: 0.01
          });
        }
        
        if (target.material.roughness !== undefined) {
          materialFolder.addInput(target.material, 'roughness', {
            label: '粗糙度',
            min: 0,
            max: 1,
            step: 0.01
          });
        }
      }
    } catch (error) {
      console.error('Error updating properties:', error);
    }
  }

  /**
   * 清除属性面板
   */
  public clearProperties(): void {
    try {
      this.createPane();
    } catch (error) {
      console.error('Error clearing properties:', error);
    }
    this.currentTarget = null;
  }

  /**
   * 获取当前选中的对象
   */
  public getCurrentTarget(): SceneObject | null {
    return this.currentTarget;
  }

  /**
   * 设置自动刷新
   */
  private setupAutoRefresh(): void {
    if (this.selectedNode) {
      // 监听 position 变化
      const refreshInterval = setInterval(() => {
        if (this.pane && this.selectedNode) {
          // 刷新所有绑定
          this.bindings.forEach(binding => {
            binding.refresh();
          });
        } else {
          clearInterval(refreshInterval);
        }
      }, 100); // 每100ms刷新一次
    }
  }

  /**
   * 手动刷新面板
   */
  public refresh(): void {
    if (this.pane) {
      this.pane.refresh();
    }
  }
} 