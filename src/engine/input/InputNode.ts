import * as THREE from 'three';
import { Node3d } from '../core/Node3d';
import { IInputMapping, IInputState, IInputActionState, DEFAULT_INPUT_MAPPING } from './IInputMapping';
import { EventEmitter } from '../utils/EventEmitter';
import { editable, editableComponent } from '../core/decorators';

/**
 * 输入节点
 * 用于处理和管理键盘输入
 */
@editableComponent({
  displayName: '输入节点',
  description: '处理键盘输入并管理输入映射',
  icon: 'keyboard',
  category: 'Input'
})
export class InputNode extends Node3d {
  // 输入映射配置
  @editable({
    displayName: '输入映射',
    description: '键盘按键到动作的映射配置',
    type: 'object',
    group: 'Input'
  })
  private mapping: IInputMapping;

  // 当前输入状态
  private state: IInputState = {
    actions: {},
    keys: {}
  };

  // 事件管理器
  private events: EventEmitter = new EventEmitter();

  // 事件监听绑定引用
  private boundKeyDown: (event: KeyboardEvent) => void;
  private boundKeyUp: (event: KeyboardEvent) => void;

  // 是否已注册事件
  private eventsRegistered: boolean = false;

  // 是否启用输入
  @editable({
    displayName: '启用输入',
    description: '是否接收键盘输入',
    type: 'boolean',
    group: 'Input'
  })
  private enabled: boolean = true;

  /**
   * 构造函数
   * @param name 节点名称
   * @param mapping 可选的自定义输入映射
   */
  constructor(name: string = '输入节点', mapping: IInputMapping = DEFAULT_INPUT_MAPPING) {
    super(name);
    this.mapping = { ...mapping }; // 创建映射的副本
    
    // 预绑定事件处理函数
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    
    // 初始化状态
    this.initState();
  }

  /**
   * 节点进入场景时调用
   * 注册键盘事件监听器
   */
  onEnterScene(): void {
    if (!this.eventsRegistered && this.enabled) {
      this.registerEvents();
    }
  }

  /**
   * 节点退出场景时调用
   * 移除键盘事件监听器
   */
  onExitScene(): void {
    this.unregisterEvents();
  }

  /**
   * 节点更新
   * @param deltaTime 帧时间间隔
   */
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    // 更新所有动作的状态
    if (this.enabled) {
      this.updateActionStates();
    }
  }

  /**
   * 初始化输入状态
   */
  private initState(): void {
    // 初始化所有映射动作的状态
    Object.keys(this.mapping).forEach(action => {
      this.state.actions[action] = {
        pressed: false,
        justPressed: false,
        justReleased: false,
        duration: 0,
        lastChanged: 0
      };
    });
  }

  /**
   * 注册键盘事件监听器
   */
  private registerEvents(): void {
    if (this.eventsRegistered) return;
    
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    this.eventsRegistered = true;
  }

  /**
   * 移除键盘事件监听器
   */
  private unregisterEvents(): void {
    if (!this.eventsRegistered) return;
    
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.eventsRegistered = false;
  }

  /**
   * 处理键盘按下事件
   * @param event 键盘事件
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;
    
    // 记录按键状态
    this.state.keys[event.code] = true;
    
    // 更新对应动作的状态
    Object.entries(this.mapping).forEach(([action, keys]) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      
      if (keyList.includes(event.code)) {
        const actionState = this.state.actions[action];
        
        // 如果之前未按下，标记为刚刚按下
        if (!actionState.pressed) {
          actionState.justPressed = true;
          actionState.pressed = true;
          actionState.lastChanged = Date.now();
          
          // 触发动作按下事件
          this.events.emit(`${action}:pressed`, action);
        }
      }
    });
  }

  /**
   * 处理键盘释放事件
   * @param event 键盘事件
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.enabled) return;
    
    // 更新按键状态
    this.state.keys[event.code] = false;
    
    // 更新对应动作的状态
    Object.entries(this.mapping).forEach(([action, keys]) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      
      if (keyList.includes(event.code)) {
        const actionState = this.state.actions[action];
        const allKeysReleased = keyList.every(key => !this.state.keys[key]);
        
        // 只有当所有关联按键都释放时，才将动作标记为释放
        if (allKeysReleased && actionState.pressed) {
          actionState.pressed = false;
          actionState.justReleased = true;
          actionState.lastChanged = Date.now();
          actionState.duration = 0;
          
          // 触发动作释放事件
          this.events.emit(`${action}:released`, action);
        }
      }
    });
  }

  /**
   * 更新所有动作的状态
   */
  private updateActionStates(): void {
    const now = Date.now();
    
    // 更新每个动作的状态
    Object.keys(this.state.actions).forEach(action => {
      const actionState = this.state.actions[action];
      
      // 更新持续时间
      if (actionState.pressed) {
        actionState.duration = now - actionState.lastChanged;
      }
      
      // 重置单帧状态标志
      if (actionState.justPressed) {
        actionState.justPressed = false;
      }
      
      if (actionState.justReleased) {
        actionState.justReleased = false;
      }
    });
  }

  /**
   * 检查动作是否被按下
   * @param action 动作名称
   * @returns 是否按下
   */
  isActionPressed(action: string): boolean {
    return this.state.actions[action]?.pressed || false;
  }

  /**
   * 检查动作是否刚刚被按下（本帧按下）
   * @param action 动作名称
   * @returns 是否刚刚按下
   */
  isActionJustPressed(action: string): boolean {
    return this.state.actions[action]?.justPressed || false;
  }

  /**
   * 检查动作是否刚刚被释放（本帧释放）
   * @param action 动作名称
   * @returns 是否刚刚释放
   */
  isActionJustReleased(action: string): boolean {
    return this.state.actions[action]?.justReleased || false;
  }

  /**
   * 获取动作按下的持续时间（毫秒）
   * @param action 动作名称
   * @returns 按下持续时间
   */
  getActionDuration(action: string): number {
    return this.state.actions[action]?.duration || 0;
  }

  /**
   * 获取按键是否按下
   * @param keyCode 按键代码
   * @returns 是否按下
   */
  isKeyPressed(keyCode: string): boolean {
    return this.state.keys[keyCode] || false;
  }

  /**
   * 添加动作事件监听器
   * @param action 动作名称
   * @param event 事件类型（pressed/released）
   * @param callback 回调函数
   */
  onAction(action: string, event: 'pressed' | 'released', callback: (action: string) => void): void {
    this.events.on(`${action}:${event}`, callback);
  }

  /**
   * 移除动作事件监听器
   * @param action 动作名称
   * @param event 事件类型
   * @param callback 回调函数
   */
  offAction(action: string, event: 'pressed' | 'released', callback: (action: string) => void): void {
    this.events.off(`${action}:${event}`, callback);
  }

  /**
   * 设置输入映射
   * @param mapping 新的输入映射
   */
  setMapping(mapping: IInputMapping): void {
    this.mapping = { ...mapping };
    this.initState(); // 重新初始化状态
  }

  /**
   * 更新单个动作的映射
   * @param action 动作名称
   * @param keys 按键或按键数组
   */
  mapAction(action: string, keys: string | string[]): void {
    this.mapping[action] = keys;
    
    // 如果这是新动作，初始化其状态
    if (!this.state.actions[action]) {
      this.state.actions[action] = {
        pressed: false,
        justPressed: false,
        justReleased: false,
        duration: 0,
        lastChanged: 0
      };
    }
  }

  /**
   * 移除动作映射
   * @param action 要移除的动作名称
   */
  unmapAction(action: string): void {
    if (this.mapping[action]) {
      delete this.mapping[action];
      delete this.state.actions[action];
    }
  }

  /**
   * 设置输入启用状态
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (enabled && !this.eventsRegistered) {
      this.registerEvents();
    } else if (!enabled && this.eventsRegistered) {
      this.unregisterEvents();
    }
  }

  /**
   * 获取输入状态
   * @returns 当前输入状态的副本
   */
  getState(): IInputState {
    // 返回状态的深拷贝
    return {
      actions: { ...this.state.actions },
      keys: { ...this.state.keys }
    };
  }

  /**
   * 节点销毁时调用
   */
  destroy(): void {
    this.unregisterEvents();
    this.events.clear();
  }
} 