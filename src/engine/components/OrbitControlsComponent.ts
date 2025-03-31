import { Component } from '../core/Component';
import { Camera } from '../core/Camera';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';

export class OrbitControlsComponent extends Component {
  private controls: OrbitControls | null = null;
  private camera: Camera | null = null;
  private domElement: HTMLElement;
  
  // 控制器配置选项
  private options: {
    enableDamping: boolean;
    dampingFactor: number;
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    enableZoom: boolean;
    enableRotate: boolean;
    enablePan: boolean;
  };

  constructor(domElement: HTMLElement, options?: Partial<typeof OrbitControlsComponent.prototype.options>) {
    super();
    this.domElement = domElement;
    
    // 默认配置
    this.options = {
      enableDamping: true,
      dampingFactor: 0.25,
      minDistance: 1,
      maxDistance: 20,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
      enableZoom: true,
      enableRotate: true,
      enablePan: true,
      ...options
    };
  }

  override onAttach(): void {
    const gameObject = this.getGameObject();
    if (!gameObject) return;

    // 获取场景中的相机
    const engine = gameObject.getScene()?.getEngine();
    if (!engine) return;
    
    this.camera = engine.getCamera();
    if (!this.camera) return;

    // 创建轨道控制器
    this.controls = new OrbitControls(
      this.camera.getThreeCamera() as THREE.PerspectiveCamera,
      this.domElement
    );

    // 应用配置
    Object.assign(this.controls, this.options);
  }

  override onDetach(): void {
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }
  }

  override update(deltaTime: number): void {
    if (this.controls && this.options.enableDamping) {
      this.controls.update();
    }
  }

  // 控制器配置方法
  setTarget(x: number, y: number, z: number): void {
    if (this.controls) {
      this.controls.target.set(x, y, z);
    }
  }

  setEnabled(enabled: boolean): void {
    if (this.controls) {
      this.controls.enabled = enabled;
    }
  }

  setDamping(enabled: boolean, factor?: number): void {
    if (this.controls) {
      this.controls.enableDamping = enabled;
      if (factor !== undefined) {
        this.controls.dampingFactor = factor;
      }
    }
  }

  setDistance(min: number, max: number): void {
    if (this.controls) {
      this.controls.minDistance = min;
      this.controls.maxDistance = max;
    }
  }

  setPolarAngle(min: number, max: number): void {
    if (this.controls) {
      this.controls.minPolarAngle = min;
      this.controls.maxPolarAngle = max;
    }
  }

  setZoom(enabled: boolean): void {
    if (this.controls) {
      this.controls.enableZoom = enabled;
    }
  }

  setRotate(enabled: boolean): void {
    if (this.controls) {
      this.controls.enableRotate = enabled;
    }
  }

  setPan(enabled: boolean): void {
    if (this.controls) {
      this.controls.enablePan = enabled;
    }
  }

  getControls(): OrbitControls | null {
    return this.controls;
  }
} 