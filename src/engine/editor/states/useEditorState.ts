/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:47:28
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 14:08:29
 * @FilePath: \todot\src\engine\editor\states\useEditorState.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import store from "@lincode/reactivity";
import Engine from '../../core/Engine';
import { Scene } from "../../core/Scene";

// 添加一个canvas容器设置监听器
let canvasContainerSetCallback: (() => void) | null = null;

// 编辑器是否处于活动状态
export const [setEditorActive, getEditorActive] = store<boolean>(false);

// 引擎实例
export const [setEngineInstance, getEngineInstance] = store<Engine | null>(null);

// 引擎是否已初始化
export const [setEngineInitialized, getEngineInitialized] = store<boolean>(false);

// 当前活动场景
export const [setActiveScene, getActiveScene] = store<Scene | null>(null);

// 场景列表
export const [setScenes, getScenes] = store<Scene[]>([]);

// 节点选择器是否打开
export const [setNodeSelectorOpen, getNodeSelectorOpen] = store<boolean>(false);

// 创建场景对话框是否打开
export const [setCreateSceneDialogOpen, getCreateSceneDialogOpen] = store<boolean>(false);

// 节点选择器中选择的节点类型
export const [setSelectedNodeType, getSelectedNodeType] = store<string | null>(null);

// 节点名称输入
export const [setNodeNameInput, getNodeNameInput] = store<string>("");

// 场景名称输入
export const [setSceneNameInput, getSceneNameInput] = store<string>("新场景");

// 编辑器画布容器引用
export const [setCanvasContainer, getCanvasContainer] = store<HTMLDivElement | null>(null);

// 添加一个监听函数，在canvas容器设置时调用回调
// 修改原有的setCanvasContainer函数，增加一个包装器
const originalSetCanvasContainer = setCanvasContainer;
export function setCanvasContainerWithCallback(container: HTMLDivElement | null): void {
  originalSetCanvasContainer(container);
  
  if (container && canvasContainerSetCallback) {
    // 异步执行回调，确保DOM已经完全更新
    setTimeout(() => {
      canvasContainerSetCallback?.();
    }, 0);
  }
}

// 添加一个新函数，用于设置回调
export function onCanvasContainerSet(callback: () => void): void {
  // 如果容器已经存在，直接调用回调
  if (getCanvasContainer()) {
    setTimeout(callback, 0);
  } else {
    // 否则保存回调等待容器设置
    canvasContainerSetCallback = callback;
  }
} 