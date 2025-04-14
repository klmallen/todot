import * as THREE from 'three';
import { Curve } from './Curve';

/**
 * 颜色曲线 - 用于表示颜色随时间变化的曲线
 */
export class ColorCurve extends Curve<THREE.Color> {
  private startColor: THREE.Color;
  private endColor: THREE.Color;
  private gradient: Array<{ time: number, color: THREE.Color }> | null = null;
  
  /**
   * 构造函数
   * @param startColor 起始颜色
   * @param endColor 结束颜色
   * @param gradient 可选的颜色渐变
   */
  constructor(
    startColor: THREE.Color, 
    endColor: THREE.Color,
    gradient?: Array<{ time: number, color: THREE.Color }>
  ) {
    super();
    this.startColor = startColor;
    this.endColor = endColor;
    this.gradient = gradient || null;
  }
  
  /**
   * 评估曲线在给定时间的颜色
   * @param time 时间（0-1）
   */
  evaluate(time: number): THREE.Color {
    // 确保时间在0-1范围内
    time = Math.max(0, Math.min(1, time));
    
    if (this.gradient && this.gradient.length > 1) {
      // 使用渐变
      return this.evaluateGradient(time);
    } else {
      // 线性插值
      const color = new THREE.Color();
      return color.copy(this.startColor).lerp(this.endColor, time);
    }
  }
  
  /**
   * 评估渐变在给定时间的颜色
   * @param time 时间（0-1）
   */
  private evaluateGradient(time: number): THREE.Color {
    if (!this.gradient || this.gradient.length < 2) {
      return new THREE.Color().copy(this.startColor).lerp(this.endColor, time);
    }
    
    // 找到时间所在的区间
    let startIndex = 0;
    let endIndex = 0;
    
    for (let i = 0; i < this.gradient.length; i++) {
      if (this.gradient[i].time > time) {
        endIndex = i;
        startIndex = Math.max(0, i - 1);
        break;
      }
    }
    
    // 如果时间超过最后一个关键帧，使用最后一个颜色
    if (endIndex === 0) {
      endIndex = this.gradient.length - 1;
      startIndex = endIndex;
    }
    
    const startKeyframe = this.gradient[startIndex];
    const endKeyframe = this.gradient[endIndex];
    
    // 计算区间内的插值因子
    let t = 0;
    if (startIndex !== endIndex) {
      t = (time - startKeyframe.time) / (endKeyframe.time - startKeyframe.time);
    }
    
    // 插值颜色
    const color = new THREE.Color();
    return color.copy(startKeyframe.color).lerp(endKeyframe.color, t);
  }
  
  /**
   * 设置起始颜色
   * @param color 颜色
   */
  setStartColor(color: THREE.Color): void {
    this.startColor.copy(color);
  }
  
  /**
   * 设置结束颜色
   * @param color 颜色
   */
  setEndColor(color: THREE.Color): void {
    this.endColor.copy(color);
  }
  
  /**
   * 设置渐变
   * @param gradient 颜色渐变
   */
  setGradient(gradient: Array<{ time: number, color: THREE.Color }>): void {
    this.gradient = gradient;
  }
  
  /**
   * 获取起始颜色
   */
  getStartColor(): THREE.Color {
    return this.startColor;
  }
  
  /**
   * 获取结束颜色
   */
  getEndColor(): THREE.Color {
    return this.endColor;
  }
  
  /**
   * 获取渐变
   */
  getGradient(): Array<{ time: number, color: THREE.Color }> | null {
    return this.gradient;
  }
}
