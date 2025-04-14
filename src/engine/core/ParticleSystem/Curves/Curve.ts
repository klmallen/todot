/**
 * 曲线基类 - 用于表示随时间变化的值
 */
export abstract class Curve<T> {
  /**
   * 评估曲线在给定时间的值
   * @param time 时间（0-1）
   */
  abstract evaluate(time: number): T;
}
