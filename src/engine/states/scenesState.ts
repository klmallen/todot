/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 14:54:31
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-30 17:17:40
 * @FilePath: \todot\src\engine\states\scenesState.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { store } from '@lincode/reactivity';
import { Scene } from '../core/Scene';
import { Object3D } from 'three';

// 场景接口
export interface IScene {
  id: string;
  name: string;
  scene: Scene;
  isActive: boolean;
}

// 场景列表
export const [getScenes, setScenes] = store<Map<string, IScene>>(new Map());


// 主场景
export const [getMainScene, setMainScene] = store<Scene | null>(null);

// 场景事件
export const [getSceneAdded, emitSceneAdded] = store<IScene | null>(null);
export const [getSceneRemoved, emitSceneRemoved] = store<IScene | null>(null);
export const [getSceneActivated, emitSceneActivated] = store<IScene | null>(null);


// 激活的场景
export const [getActiveScene, setActiveScene] = store<IScene | null>(null);

//当前选中的场景
export const [getSelectedScene, setSelectedScene] = store<IScene | null>(null);




// 场景操作方法
export const addScene = (scene: Scene): void => {
  const scenes = getScenes();
  const newScene: IScene = {
    id: scene.getId(),
    name: scene.getName(),
    scene,
    isActive: false
  };
  
  scenes.set(newScene.id, newScene);
  setScenes(scenes);
  emitSceneAdded(newScene);
};

export const removeScene = (id: string): void => {
  const scenes = getScenes();
  const scene = scenes.get(id);
  if (scene) {
    scenes.delete(id);
    setScenes(scenes);
    emitSceneRemoved(scene);
  }
};

export const activateScene = (id: string): void => {
  const scenes = getScenes();
  const scene = scenes.get(id);
  if (scene) {
    // 更新场景状态
    scenes.forEach(s => {
      s.isActive = s.id === id;
    });
    setScenes(scenes);
    
    // 设置当前激活场景
    setActiveScene(scene);
    emitSceneActivated(scene);
  }
};

// 场景节点相关状态
export const [getSelectedNode, setSelectedNode] = store<Object3D | null>(null);
export const [getHoveredNode, setHoveredNode] = store<Object3D | null>(null);
export const [getExpandedNodes, setExpandedNodes] = store<Set<string>>(new Set());

// 场景视图状态
export const [getSceneViewMode, setSceneViewMode] = store<'3d' | '2d'>('3d');
export const [getShowGrid, setShowGrid] = store<boolean>(true);
export const [getShowAxes, setShowAxes] = store<boolean>(true);
export const [getShowBoundingBoxes, setShowBoundingBoxes] = store<boolean>(false);

// 按名称查找场景
export function getSceneByName(name: string): IScene | undefined {
  const scenes = getScenes();
  return Array.from(scenes.values()).find(scene => scene.name === name);
}

// 按ID查找场景
export function getSceneById(id: string): IScene | undefined {
  return getScenes().get(id);
}

// 获取所有场景列表
export function getAllScenes(): IScene[] {
  return Array.from(getScenes().values());
}
