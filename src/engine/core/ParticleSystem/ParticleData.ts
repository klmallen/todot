import * as THREE from 'three';

/**
 * 粒子数据类 - 存储单个粒子的属性
 */
export class ParticleData {
  // 基本属性
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  rotation: number;
  
  // 生命周期相关
  age: number;
  lifetime: number;
  
  // 初始值
  startSize: number;
  startColor: THREE.Color;
  startRotation: number;
  
  // 变化率
  rotationSpeed: number;
  
  // 自定义属性
  customData: Map<string, any>;
  
  /**
   * 构造函数
   */
  constructor() {
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.color = new THREE.Color(1, 1, 1);
    this.size = 1.0;
    this.rotation = 0;
    
    this.age = 0;
    this.lifetime = 5.0;
    
    this.startSize = 1.0;
    this.startColor = new THREE.Color(1, 1, 1);
    this.startRotation = 0;
    
    this.rotationSpeed = 0;
    
    this.customData = new Map<string, any>();
  }
  
  /**
   * 克隆粒子数据
   */
  clone(): ParticleData {
    const clone = new ParticleData();
    
    clone.position.copy(this.position);
    clone.velocity.copy(this.velocity);
    clone.color.copy(this.color);
    clone.size = this.size;
    clone.rotation = this.rotation;
    
    clone.age = this.age;
    clone.lifetime = this.lifetime;
    
    clone.startSize = this.startSize;
    clone.startColor.copy(this.startColor);
    clone.startRotation = this.startRotation;
    
    clone.rotationSpeed = this.rotationSpeed;
    
    // 复制自定义数据
    this.customData.forEach((value, key) => {
      clone.customData.set(key, value);
    });
    
    return clone;
  }
  
  /**
   * 重置粒子数据
   */
  reset(): void {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.color.set(1, 1, 1);
    this.size = 1.0;
    this.rotation = 0;
    
    this.age = 0;
    this.lifetime = 5.0;
    
    this.startSize = 1.0;
    this.startColor.set(1, 1, 1);
    this.startRotation = 0;
    
    this.rotationSpeed = 0;
    
    this.customData.clear();
  }
}
