/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 14:54:43
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 14:54:53
 * @FilePath: \todot\src\engine\states\activeSceneState.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { store } from '@lincode/reactivity';
import { Scene } from '../core/Scene';
import { getScenes } from './scenesState';

// 活动场景ID集合状态（支持多个活动场景）
export const [setActiveSceneIds, getActiveSceneIds] = store<Set<string>>(new Set());

// 获取所有活动场景
export function getActiveScenes(): Scene[] {
  const activeIds = getActiveSceneIds();
  return getScenes().filter(scene => activeIds.has(scene.getId()));
}

// 检查场景是否为活动状态
export function isSceneActive(sceneId: string): boolean {
  return getActiveSceneIds().has(sceneId);
}

// 激活场景（可选是否独占模式）
export function activateScene(sceneId: string, exclusive: boolean = false): void {
  const currentActiveIds = getActiveSceneIds();
  const newActiveIds = new Set(exclusive ? [] : currentActiveIds);
  newActiveIds.add(sceneId);
  setActiveSceneIds(newActiveIds);
}

// 取消激活场景
export function deactivateScene(sceneId: string): void {
  const currentActiveIds = getActiveSceneIds();
  const newActiveIds = new Set(currentActiveIds);
  newActiveIds.delete(sceneId);
  setActiveSceneIds(newActiveIds);
}

// 获取主要活动场景（第一个激活的场景）
export function getPrimaryActiveScene(): Scene | undefined {
  const activeScenes = getActiveScenes();
  return activeScenes.length > 0 ? activeScenes[0] : undefined;
}
