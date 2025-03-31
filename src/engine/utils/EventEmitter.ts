/**
 * 事件发射器类
 * 用于实现事件的发布订阅模式
 */
export class EventEmitter {
  // 事件监听器映射
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();
  
  /**
   * 添加事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(callback);
  }
  
  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param callback 要移除的回调函数
   */
  off(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
      
      // 如果没有监听器了，删除事件
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
  }
  
  /**
   * 发射事件
   * @param event 事件名称
   * @param args 参数
   */
  emit(event: string, ...args: any[]): void {
    if (!this.listeners.has(event)) {
      return;
    }
    
    const callbacks = this.listeners.get(event)!;
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  /**
   * 只监听一次事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  once(event: string, callback: (...args: any[]) => void): void {
    const onceCallback = (...args: any[]) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    
    this.on(event, onceCallback);
  }
  
  /**
   * 清除所有事件监听器
   * @param event 可选，指定要清除的事件
   */
  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
