import * as THREE from 'three';
import { Node3d } from '../Node3d';
import { editableComponent, editable } from '../decorators';

@editableComponent({
  displayName: '灯光节点',
  description: '3D场景中的灯光节点',
  icon: 'light',
  category: 'Light'
})
export class LightNode3D extends Node3d {
  private light: THREE.Light;
  private helper: THREE.Object3D | null = null;
  private helperVisible: boolean = true;

  @editable({
    displayName: '灯光类型',
    description: '灯光的类型',
    type: 'select',
    enumOptions: ['DirectionalLight', 'PointLight', 'SpotLight', 'AmbientLight', 'HemisphereLight'],
    group: 'Light'
  })
  private lightType: string;

  @editable({
    displayName: '灯光颜色',
    description: '灯光的颜色',
    type: 'color',
    group: 'Light'
  })
  private lightColor: string = '#ffffff';

  @editable({
    displayName: '灯光强度',
    description: '灯光的强度',
    type: 'number',
    min: 0,
    max: 10,
    step: 0.1,
    group: 'Light'
  })
  private intensity: number = 1;

  @editable({
    displayName: '显示辅助器',
    description: '是否显示灯光辅助器',
    type: 'boolean',
    group: 'Helper'
  })
  private showHelper: boolean = true;

  constructor(name: string = '灯光节点', type: string = 'DirectionalLight', options?: { position?: THREE.Vector3, rotation?: THREE.Euler }) {
    super(name, options);
    this.lightType = type;
    this.light = this.createLight(type);
    this.getThreeObject().add(this.light);
    this.createHelper();
  }

  private createLight(type: string): THREE.Light {
    switch (type) {
      case 'DirectionalLight':
        return new THREE.DirectionalLight(this.lightColor, this.intensity);
      case 'PointLight':
        return new THREE.PointLight(this.lightColor, this.intensity);
      case 'SpotLight':
        return new THREE.SpotLight(this.lightColor, this.intensity);
      case 'AmbientLight':
        return new THREE.AmbientLight(this.lightColor, this.intensity);
      case 'HemisphereLight':
        return new THREE.HemisphereLight(this.lightColor, '#444444', this.intensity);
      default:
        return new THREE.DirectionalLight(this.lightColor, this.intensity);
    }
  }

  private createHelper(): void {
    // 移除旧的helper
    if (this.helper) {
      this.light.remove(this.helper);
      this.helper = null;
    }

    // 创建新的helper
    switch (this.lightType) {
      case 'DirectionalLight':
        this.helper = new THREE.DirectionalLightHelper(this.light as THREE.DirectionalLight, 1);
        break;
      case 'PointLight':
        this.helper = new THREE.PointLightHelper(this.light as THREE.PointLight, 1);
        break;
      case 'SpotLight':
        this.helper = new THREE.SpotLightHelper(this.light as THREE.SpotLight);
        break;
      case 'HemisphereLight':
        this.helper = new THREE.HemisphereLightHelper(this.light as THREE.HemisphereLight, 1);
        break;
    }

    if (this.helper) {
      // 重要：将helper添加到light对象
      this.light.add(this.helper);
      this.helper.visible = this.showHelper && this.helperVisible;
      
      // 修复TransformControls和Helper的问题
      if (this.helper instanceof THREE.Object3D) {
        // 将helper的matrixAutoUpdate设置为false
        this.helper.matrixAutoUpdate = false;
        // 在每帧更新时手动更新helper的矩阵
        this.helper.matrix.copy(this.light.matrix);
        this.helper.matrixWorld.copy(this.light.matrixWorld);
      }
    }
  }

  public setLightType(type: string): void {
    this.lightType = type;
    const oldLight = this.light;
    this.light = this.createLight(type);
    this.getThreeObject().remove(oldLight);
    this.getThreeObject().add(this.light);
    this.createHelper();
  }

  public setColor(color: string): void {
    this.lightColor = color;
    if (this.light instanceof THREE.Light) {
      this.light.color.set(color);
    }
  }

  public setIntensity(intensity: number): void {
    this.intensity = intensity;
    if (this.light instanceof THREE.Light) {
      this.light.intensity = intensity;
    }
  }

  public setHelperVisible(visible: boolean): void {
    this.helperVisible = visible;
    if (this.helper) {
      this.helper.visible = visible && this.showHelper;
    }
  }

  public getLight(): THREE.Light {
    return this.light;
  }

  public getHelper(): THREE.Object3D | null {
    return this.helper;
  }

  override update(deltaTime: number): void {
    super.update(deltaTime);
    
    // 手动更新helper的矩阵
    if (this.helper) {
      this.helper.matrix.copy(this.light.matrix);
      this.helper.matrixWorld.copy(this.light.matrixWorld);
    }
  }

  /**
   * 重写destroy方法，确保清理helper
   */
  public destroy(): void {
    if (this.helper) {
      this.light.remove(this.helper);
      this.helper = null;
    }
    this.getThreeObject().remove(this.light);
  }

  /**
   * 序列化为JSON
   */
  public override toJSON(): any {
    const json = super.toJSON();
    return {
      ...json,
      lightType: this.lightType,
      lightColor: this.lightColor,
      intensity: this.intensity,
      showHelper: this.showHelper,
      helperVisible: this.helperVisible
    };
  }

  /**
   * 从JSON恢复
   */
  public fromJSON(json: any): void {
    super.fromJSON(json);
    
    if (json.lightType) this.setLightType(json.lightType);
    if (json.lightColor) this.setColor(json.lightColor);
    if (json.intensity !== undefined) this.setIntensity(json.intensity);
    if (json.showHelper !== undefined) this.showHelper = json.showHelper;
    if (json.helperVisible !== undefined) this.setHelperVisible(json.helperVisible);
  }
} 