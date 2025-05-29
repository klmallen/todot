/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 14:54:31
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 14:54:38
 * @FilePath: \todot\src\engine\states\scenesState.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { store } from '@lincode/reactivity';
import { Scene } from '../core/Scene';

// 场景列表状态
export const [setScenes, getScenes] = store<Scene[]>([]);

// 按名称查找场景
export function getSceneByName(name: string): Scene | undefined {
  return getScenes().find(scene => scene.getName() === name);
}

// 按ID查找场景
export function getSceneById(id: string): Scene | undefined {
  return getScenes().find(scene => scene.getId() === id);
}
