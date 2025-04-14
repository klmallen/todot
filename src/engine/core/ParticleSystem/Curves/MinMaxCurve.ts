import { Curve } from './Curve';

/**
 * 最小最大曲线 - 用于表示在最小值和最大值之间随机的曲线
 */
export class MinMaxCurve extends Curve<number> {
  private minValue: number;
  private maxValue: number;
  private curve: ((t: number) => number) | null = null;
  
  /**
   * 构造函数
   * @param minValue 最小值
   * @param maxValue 最大值
   * @param curve 可选的曲线函数
   */
  constructor(minValue: number, maxValue: number, curve?: (t: number) => number) {
    super();
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.curve = curve || null;
  }
  
  /**
   * 评估曲线在给定时间的值
   * @param time 时间（0-1）
   */
  evaluate(time: number): number {
    // 确保时间在0-1范围内
    time = Math.max(0, Math.min(1, time));
    
    if (this.curve) {
      // 使用自定义曲线函数
      const t = this.curve(time);
      return this.minValue + (this.maxValue - this.minValue) * t;
    } else {
      // 线性插值
      return this.minValue + (this.maxValue - this.minValue) * time;
    }
  }
  
  /**
   * 设置最小值
   * @param value 最小值
   */
  setMinValue(value: number): void {
    this.minValue = value;
  }
  
  /**
   * 设置最大值
   * @param value 最大值
   */
  setMaxValue(value: number): void {
    this.maxValue = value;
  }
  
  /**
   * 设置曲线函数
   * @param curve 曲线函数
   */
  setCurve(curve: (t: number) => number): void {
    this.curve = curve;
  }
  
  /**
   * 获取最小值
   */
  getMinValue(): number {
    return this.minValue;
  }
  
  /**
   * 获取最大值
   */
  getMaxValue(): number {
    return this.maxValue;
  }
}
