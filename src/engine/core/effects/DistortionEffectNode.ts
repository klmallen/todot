import * as THREE from 'three';
import { BaseEffectNode } from '../BaseEffectNode';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import {
  uniform, texture, uv, mix, float, vec2, vec3, sin, time,
  normalize, positionWorld, normalWorld
} from 'three/tsl';

/**
 * 扭曲效果的参数接口
 */
export interface DistortionEffectParams {
  /**
   * 基础纹理
   */
  textureMap?: THREE.Texture;
  
  /**
   * 用于扭曲效果的噪声纹理
   */
  distortionMap?: THREE.Texture;
  
  /**
   * 扭曲强度
   */
  distortionStrength?: number;
  
  /**
   * 扭曲动画速度
   */
  distortionSpeed?: number;
}

/**
 * 扭曲效果节点
 * 用于创建物体的扭曲效果
 */
export class DistortionEffectNode extends BaseEffectNode {
  private params: DistortionEffectParams;
  private nodeMaterial: MeshStandardNodeMaterial | null = null;
  private animationTime: number = 0;
  
  /**
   * 构造函数
   * @param name 节点名称
   * @param params 扭曲效果参数
   */
  constructor(name: string, params: DistortionEffectParams = {}) {
    super(name);
    
    // 设置默认参数
    this.params = {
      textureMap: params.textureMap || new THREE.Texture(),
      distortionMap: params.distortionMap || new THREE.Texture(),
      distortionStrength: params.distortionStrength !== undefined ? params.distortionStrength : 0.1,
      distortionSpeed: params.distortionSpeed !== undefined ? params.distortionSpeed : 1.0
    };
  }
  
  /**
   * 初始化扭曲效果
   */
  protected initEffect(): void {
    // 保存原始材质
    this.saveOriginalMaterial();
    
    // 创建扭曲材质
    this.createDistortionMaterial();
    
    // 应用扭曲材质
    this.applyEffectMaterial();
  }
  
  /**
   * 更新效果参数
   * @param params 扭曲效果参数
   */
  public updateEffectParams(params: Partial<DistortionEffectParams>): void {
    // 更新参数
    if (params.textureMap !== undefined) {
      this.params.textureMap = params.textureMap;
    }
    
    if (params.distortionMap !== undefined) {
      this.params.distortionMap = params.distortionMap;
    }
    
    if (params.distortionStrength !== undefined) {
      this.params.distortionStrength = params.distortionStrength;
    }
    
    if (params.distortionSpeed !== undefined) {
      this.params.distortionSpeed = params.distortionSpeed;
    }
    
    // 重新创建材质
    this.createDistortionMaterial();
    
    // 应用更新后的材质
    this.applyEffectMaterial();
  }
  
  /**
   * 创建扭曲材质
   */
  private createDistortionMaterial(): void {
    // 确保纹理已加载
    if (!this.params.textureMap) {
      console.warn('扭曲效果需要有效的纹理');
      return;
    }
    
    if (!this.params.distortionMap) {
      console.warn('扭曲效果需要有效的扭曲纹理');
      return;
    }
    
    // 创建基础材质
    this.nodeMaterial = new MeshStandardNodeMaterial();
    this.nodeMaterial.side = THREE.DoubleSide;
    
    // 创建uniform节点用于动态更新
    const distortionStrength = uniform(this.params.distortionStrength);
    const distortionSpeed = uniform(this.params.distortionSpeed);
    
    // 获取基础UV坐标
    const baseUV = uv();
    
    // 创建时间相关的动画
    const timeValue = time().mul(distortionSpeed);
    
    // 创建动态UV偏移，让扭曲纹理移动
    const offsetUV = baseUV.add(vec2(timeValue.mul(0.1), timeValue.mul(0.2)));
    
    // 从扭曲纹理中获取扭曲值
    // 将0-1值转换为-1到1区间
    const distortion = texture(this.params.distortionMap, offsetUV).rg.sub(0.5).mul(2.0).mul(distortionStrength);
    
    // 应用扭曲值到基础UV
    const distortedUV = baseUV.add(distortion);
    
    // 使用扭曲后的UV获取主纹理颜色
    const baseColor = texture(this.params.textureMap, distortedUV);
    
    // 设置材质属性
    this.nodeMaterial.colorNode = baseColor;
    this.nodeMaterial.roughnessNode = float(0.4);
    this.nodeMaterial.metalnessNode = float(0.1);
    
    // 存储到effectMaterial
    this.effectMaterial = this.nodeMaterial;
  }
  
  /**
   * 更新动画
   * @param deltaTime 时间增量
   */
  public update(deltaTime: number): void {
    // 累积时间用于动画
    this.animationTime += deltaTime;
  }
  
  /**
   * 设置扭曲强度
   * @param strength 扭曲强度
   */
  public setDistortionStrength(strength: number): void {
    this.updateEffectParams({ distortionStrength: strength });
  }
  
  /**
   * 设置扭曲速度
   * @param speed 扭曲速度
   */
  public setDistortionSpeed(speed: number): void {
    this.updateEffectParams({ distortionSpeed: speed });
  }
} 