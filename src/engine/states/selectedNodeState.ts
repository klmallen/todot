/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 15:56:24
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 15:56:32
 * @FilePath: \todot\src\engine\states\selectedNodeState.ts
 * @Description: 选中节点状态管理
 */
import { store } from '@lincode/reactivity';
import { Node3d } from '../core/Node3d';
import { Scene } from '../core/Scene';
import { getScenes } from './scenesState';

// 选中节点ID状态
export const [setSelectedNodeId, getSelectedNodeId] = store<string | null>(null);

// 查找节点辅助函数（递归）
function findNodeById(rootNode: Node3d, id: string): Node3d | null {
  // 检查当前节点
  if (rootNode.getId && rootNode.getId() === id) {
    return rootNode;
  }
  
  // 检查子节点
  for (const child of rootNode.getChildren()) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  
  return null;
}

/**
 * 获取当前选中的节点
 * @returns 选中的节点对象
 */
export function getSelectedNode(): Node3d | null {
  const nodeId = getSelectedNodeId();
  if (!nodeId) return null;
  
  // 在所有场景中查找节点
  for (const scene of getScenes()) {
    // 如果Scene类有getNodeById方法，使用它
    if (typeof scene.getNodeById === 'function') {
      const node = scene.getNodeById(nodeId);
      if (node) return node;
    } else {
      // 否则手动查找
      const rootNode = scene.getRootNode();
      const node = findNodeById(rootNode, nodeId);
      if (node) return node;
    }
  }
  
  return null;
}

/**
 * 查找节点所在的场景
 * @param nodeId 节点ID
 * @returns 包含节点的场景，如果未找到则返回null
 */
export function findSceneContainingNode(nodeId: string): Scene | null {
  if (!nodeId) return null;
  
  for (const scene of getScenes()) {
    // 如果Scene类有getNodeById方法，使用它
    if (typeof scene.getNodeById === 'function') {
      const node = scene.getNodeById(nodeId);
      if (node) return scene;
    } else {
      // 否则手动查找
      const rootNode = scene.getRootNode();
      const node = findNodeById(rootNode, nodeId);
      if (node) return scene;
    }
  }
  
  return null;
}

/**
 * 查找节点的父节点
 * @param nodeId 节点ID
 * @returns 父节点，如果未找到则返回null
 */
export function findParentNode(nodeId: string): Node3d | null {
  if (!nodeId) return null;
  
  for (const scene of getScenes()) {
    const rootNode = scene.getRootNode();
    
    // 递归查找父节点
    function findParent(node: Node3d): Node3d | null {
      for (const child of node.getChildren()) {
        if (child.getId && child.getId() === nodeId) {
          return node;
        }
        
        const found = findParent(child);
        if (found) return found;
      }
      
      return null;
    }
    
    const parent = findParent(rootNode);
    if (parent) return parent;
  }
  
  return null;
}