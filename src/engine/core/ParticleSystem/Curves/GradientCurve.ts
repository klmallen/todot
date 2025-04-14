import { Curve } from './Curve';

/**
 * 渐变曲线 - 用于表示数值随时间变化的曲线
 */
export class GradientCurve extends Curve<number> {
  private keyframes: Array<{ time: number, value: number }>;
  
  /**
   * 构造函数
   * @param keyframes 关键帧数组
   */
  constructor(keyframes?: Array<{ time: number, value: number }>) {
    super();
    this.keyframes = keyframes || [
      { time: 0, value: 0 },
      { time: 1, value: 1 }
    ];
    
    // 确保关键帧按时间排序
    this.sortKeyframes();
  }
  
  /**
   * 评估曲线在给定时间的值
   * @param time 时间（0-1）
   */
  evaluate(time: number): number {
    // 确保时间在0-1范围内
    time = Math.max(0, Math.min(1, time));
    
    // 如果只有一个关键帧，返回该关键帧的值
    if (this.keyframes.length === 1) {
      return this.keyframes[0].value;
    }
    
    // 找到时间所在的区间
    let startIndex = 0;
    let endIndex = 0;
    
    for (let i = 0; i < this.keyframes.length; i++) {
      if (this.keyframes[i].time > time) {
        endIndex = i;
        startIndex = Math.max(0, i - 1);
        break;
      }
    }
    
    // 如果时间超过最后一个关键帧，使用最后一个值
    if (endIndex === 0) {
      endIndex = this.keyframes.length - 1;
      startIndex = endIndex;
    }
    
    const startKeyframe = this.keyframes[startIndex];
    const endKeyframe = this.keyframes[endIndex];
    
    // 计算区间内的插值因子
    let t = 0;
    if (startIndex !== endIndex) {
      t = (time - startKeyframe.time) / (endKeyframe.time - startKeyframe.time);
    }
    
    // 线性插值
    return startKeyframe.value + (endKeyframe.value - startKeyframe.value) * t;
  }
  
  /**
   * 添加关键帧
   * @param time 时间（0-1）
   * @param value 值
   */
  addKeyframe(time: number, value: number): void {
    // 确保时间在0-1范围内
    time = Math.max(0, Math.min(1, time));
    
    // 添加关键帧
    this.keyframes.push({ time, value });
    
    // 重新排序
    this.sortKeyframes();
  }
  
  /**
   * 移除关键帧
   * @param index 关键帧索引
   */
  removeKeyframe(index: number): void {
    if (index >= 0 && index < this.keyframes.length) {
      this.keyframes.splice(index, 1);
    }
  }
  
  /**
   * 设置关键帧
   * @param keyframes 关键帧数组
   */
  setKeyframes(keyframes: Array<{ time: number, value: number }>): void {
    this.keyframes = keyframes;
    this.sortKeyframes();
  }
  
  /**
   * 获取关键帧
   */
  getKeyframes(): Array<{ time: number, value: number }> {
    return this.keyframes;
  }
  
  /**
   * 对关键帧按时间排序
   */
  private sortKeyframes(): void {
    this.keyframes.sort((a, b) => a.time - b.time);
  }
}
