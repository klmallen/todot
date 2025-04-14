/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-12 12:31:20
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-04-12 12:32:36
 * @FilePath: \todot\src\engine\input\IInputMapping.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 按键映射接口
 * 定义了输入动作和键盘按键的映射关系
 */
export interface IInputMapping {
  // 输入操作名称 -> 按键代码
  [action: string]: string | string[];
}

/**
 * 输入动作状态
 * 记录每个动作的状态数据
 */
export interface IInputActionState {
  // 是否被按下
  pressed: boolean;
  // 是否刚刚被按下 (本帧按下，上一帧未按下)
  justPressed: boolean;
  // 是否刚刚被释放 (本帧释放，上一帧按下)
  justReleased: boolean;
  // 按下持续时间（毫秒）
  duration: number;
  // 上次变化时间（时间戳）
  lastChanged: number;
}

/**
 * 输入系统状态
 * 存储所有动作和按键的状态
 */
export interface IInputState {
  // 动作名称 -> 动作状态
  actions: Record<string, IInputActionState>;
  // 按键代码 -> 是否按下
  keys: Record<string, boolean>;
}

/**
 * 默认输入映射
 * 提供基础的WASD移动和空格跳跃等常用操作
 */
export const DEFAULT_INPUT_MAPPING: IInputMapping = {
  moveForward: 'KeyW',
  moveBackward: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  jump: 'Space',
  run: 'ShiftLeft',
  crouch: 'ControlLeft',
  action: 'KeyE',
  pause: 'Escape'
}; 