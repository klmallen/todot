import * as THREE from 'three';
import { Node3d } from './Node3d';
import { editable, editableComponent } from './decorators';
import { Script } from './Script/Script';

/**
 * 键盘按键状态
 */
export interface KeyState {
  pressed: boolean;      // 是否被按下
  duration: number;      // 按下持续时间
  timestamp: number;     // 最后一次状态变化的时间戳
}

/**
 * 键盘事件处理器接口
 */
export interface KeyboardEventHandler {
  onKeyDown?: (key: string) => void;   // 按键按下时触发
  onKeyUp?: (key: string) => void;     // 按键释放时触发
  onKeyHold?: (key: string, duration: number) => void; // 按键持续按下时触发
}

/**
 * 键盘映射配置接口
 */
export interface KeyboardConfig {
  forward: string;       // 前进键
  backward: string;      // 后退键
  left: string;          // 左移键
  right: string;         // 右移键
  up: string;            // 上升键
  down: string;          // 下降键
  action1: string;       // 动作1键
  action2: string;       // 动作2键
  action3: string;       // 动作3键
  jump: string;          // 跳跃键
}

/**
 * 输入处理节点类 - 专门处理键盘输入和事件处理
 */
@editableComponent({
  displayName: '输入处理节点',
  description: '处理键盘输入和事件处理',
  icon: 'keyboard',
  category: 'Input'
})
export class InputHandlerNode3D extends Node3d {
  // 键盘状态
  private keyStates: Map<string, KeyState> = new Map();
  private keyboardEventHandlers: KeyboardEventHandler[] = [];
  
  // 默认键盘映射
  @editable({
    displayName: '键盘映射',
    description: '键盘按键映射配置',
    type: 'object',
    group: '输入设置'
  })
  private keyboardConfig: KeyboardConfig = {
    forward: 'KeyW',
    backward: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    up: 'Space',
    down: 'ShiftLeft',
    action1: 'KeyE',
    action2: 'KeyQ',
    action3: 'KeyF',
    jump: 'Space'
  };
  
  /**
   * 构造函数
   */
  constructor(name: string = '输入处理节点') {
    super(name);
    
    // 设置节点类型
    this.setType('InputHandlerNode3D');
    
    // 初始化键盘事件监听
    this.initKeyboardListeners();
  }
  
  /**
   * 初始化键盘事件监听器
   */
  private initKeyboardListeners(): void {
    // 添加键盘按下事件
    window.addEventListener('keydown', (event) => {
      const key = event.code;
      
      // 如果键不在状态映射中，添加它
      if (!this.keyStates.has(key)) {
        const now = performance.now();
        this.keyStates.set(key, { 
          pressed: true, 
          duration: 0,
          timestamp: now
        });
        
        // 触发键盘按下事件
        this.keyboardEventHandlers.forEach(handler => {
          if (handler.onKeyDown) {
            handler.onKeyDown(key);
          }
        });
      }
    });
    
    // 添加键盘释放事件
    window.addEventListener('keyup', (event) => {
      const key = event.code;
      
      if (this.keyStates.has(key)) {
        // 重置键状态
        this.keyStates.delete(key);
        
        // 触发键盘释放事件
        this.keyboardEventHandlers.forEach(handler => {
          if (handler.onKeyUp) {
            handler.onKeyUp(key);
          }
        });
      }
    });
    
    // 页面失去焦点时清除所有按键状态
    window.addEventListener('blur', () => {
      this.keyStates.clear();
    });
  }
  
  /**
   * 添加键盘事件处理器
   * @param handler 键盘事件处理器
   * @returns 处理器ID，用于后续移除
   */
  public addKeyboardEventHandler(handler: KeyboardEventHandler): number {
    this.keyboardEventHandlers.push(handler);
    return this.keyboardEventHandlers.length - 1;
  }
  
  /**
   * 移除键盘事件处理器
   * @param id 处理器ID
   */
  public removeKeyboardEventHandler(id: number): void {
    if (id >= 0 && id < this.keyboardEventHandlers.length) {
      this.keyboardEventHandlers.splice(id, 1);
    }
  }
  
  /**
   * 检查键是否被按下
   * @param key 键码
   * @returns 是否被按下
   */
  public isKeyPressed(key: string): boolean {
    return this.keyStates.has(key) && this.keyStates.get(key)!.pressed;
  }
  
  /**
   * 获取键被按下的持续时间
   * @param key 键码
   * @returns 持续时间（秒）
   */
  public getKeyPressDuration(key: string): number {
    if (this.keyStates.has(key)) {
      return this.keyStates.get(key)!.duration;
    }
    return 0;
  }
  
  /**
   * 检查配置的按键是否被按下
   * @param actionKey 动作键名称（如'forward', 'action1'等）
   * @returns 是否被按下
   */
  public isActionKeyPressed(actionKey: keyof KeyboardConfig): boolean {
    const key = this.keyboardConfig[actionKey];
    return this.isKeyPressed(key);
  }
  
  /**
   * 更新键盘状态
   * @param deltaTime 时间间隔
   */
  private updateKeyboardState(deltaTime: number): void {
    const now = performance.now();
    
    // 更新所有按下的键的持续时间
    this.keyStates.forEach((state, key) => {
      state.duration += deltaTime;
      
      // 触发键盘持续按下事件
      this.keyboardEventHandlers.forEach(handler => {
        if (handler.onKeyHold) {
          handler.onKeyHold(key, state.duration);
        }
      });
    });
  }
  
  /**
   * 设置键盘映射配置
   * @param config 键盘映射配置
   */
  @editable({
    displayName: '设置键盘映射',
    description: '配置键盘按键映射',
    type: 'function',
    group: '输入设置'
  })
  public setKeyboardConfig(config: Partial<KeyboardConfig>): void {
    this.keyboardConfig = { ...this.keyboardConfig, ...config };
  }
  
  /**
   * 将键盘状态暴露给脚本
   * @param script 目标脚本
   */
  public connectToScript(script: Script): void {
    // 添加脚本可以访问的方法
    (script as any).input = {
      isKeyPressed: this.isKeyPressed.bind(this),
      getKeyPressDuration: this.getKeyPressDuration.bind(this),
      isActionKeyPressed: this.isActionKeyPressed.bind(this),
      getKeyboardConfig: () => ({ ...this.keyboardConfig }),
      addKeyHandler: this.addKeyboardEventHandler.bind(this),
      removeKeyHandler: this.removeKeyboardEventHandler.bind(this)
    };
  }
  
  /**
   * 检查某组键是否同时被按下
   * @param keys 要检查的键数组
   * @returns 是否所有键都被按下
   */
  public areKeysPressed(keys: string[]): boolean {
    return keys.every(key => this.isKeyPressed(key));
  }
  
  /**
   * 覆盖更新方法
   */
  public override update(deltaTime: number): void {
    // 调用父类的更新方法
    super.update(deltaTime);
    
    // 更新键盘状态
    this.updateKeyboardState(deltaTime);
  }
} 