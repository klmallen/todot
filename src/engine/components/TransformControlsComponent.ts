import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { Component } from '../core/Component';
import { getTransformMode, getSelectedObject, setSelectedObject } from '../states/useEditorMode';
import Engine from '../core/Engine';
import { Node3d } from '../core/Node3d';

/**
 * 变换控制器组件，用于在编辑模式下移动、旋转和缩放对象
 */
export class TransformControlsComponent extends Component {
  private transformControls: TransformControls | null = null;
  private orbitControls: THREE.OrbitControls | null = null;
  private camera: THREE.Camera | null = null;
  private domElement: HTMLElement | null = null;
  private selectedObject: THREE.Object3D | null = null;

  constructor() {
    super();
    this.addListeners();
  }

  /**
   * 当组件附加到游戏对象时初始化
   */
  override onAttach(): void {
    const engine = Engine.getInstance();
    this.camera = engine.getCamera().getThreeCamera();
    this.orbitControls = engine.getOrbitControls();
    
    // 获取渲染器的DOM元素
    const renderer = engine.getRenderer();
    if (renderer instanceof THREE.WebGLRenderer) {
      this.domElement = renderer.domElement;
    } else {
      const nativeRenderer = (renderer as any).getNativeRenderer?.();
      if (nativeRenderer?.domElement) {
        this.domElement = nativeRenderer.domElement;
      }
    }

    if (!this.camera || !this.domElement) {
      console.error('无法初始化TransformControls: 缺少相机或DOM元素');
      return;
    }

    // 创建变换控制器
    this.transformControls = new TransformControls(this.camera, this.domElement);
    this.transformControls.setSize(0.8); // 设置控制器大小
    
    // 事件处理
    this.transformControls.addEventListener('dragging-changed', (event) => {
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value;
      }
    });

    // 添加change事件监听
    this.transformControls.addEventListener('change', () => {
      // 获取属性面板并刷新
      const engine = Engine.getInstance();
      const propertyPanel = engine.getPropertyPanel();
      if (propertyPanel) {
        propertyPanel.refresh();
      }
    });

    // 添加到场景
    const scene = this.getGameObject()?.getScene()?.getThreeScene();
    if (scene) {
      scene.add(this.transformControls);
    }

    // 监听变换模式变化
    this.updateTransformMode();
  }

  /**
   * 添加状态监听
   */
  private addListeners(): void {
    // 监听变换模式变化
    getTransformMode((mode) => {
      this.updateTransformMode();
    });

    // 监听选中对象变化
    getSelectedObject((object) => {
      this.selectedObject = object;
      this.updateSelection();
    });
  }

  /**
   * 更新变换模式
   */
  private updateTransformMode(): void {
    if (!this.transformControls) return;
    
    const mode = getTransformMode();
    this.transformControls.setMode(mode);
  }

  /**
   * 更新选中对象
   */
  private updateSelection(): void {
    if (!this.transformControls) return;
    
    if (this.selectedObject) {
      this.transformControls.attach(this.selectedObject);
    } else {
      this.transformControls.detach();
    }
  }

  /**
   * 选择对象
   */
  public selectObject(object: THREE.Object3D | null): void {
    setSelectedObject(object);
  }

  /**
   * 取消选择
   */
  public deselectObject(): void {
    setSelectedObject(null);
  }

  /**
   * 组件更新
   */
  override update(deltaTime: number): void {
    // TransformControls不需要每帧更新
  }

  /**
   * 组件销毁
   */
  override onDetach(): void {
    if (this.transformControls) {
      this.transformControls.detach();
      
      const scene = this.getGameObject()?.getScene()?.getThreeScene();
      if (scene) {
        scene.remove(this.transformControls);
      }
      
      this.transformControls.dispose();
      this.transformControls = null;
    }
  }
} 