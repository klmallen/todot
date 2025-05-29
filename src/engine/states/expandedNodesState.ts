/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 14:55:11
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 14:58:16
 * @FilePath: \todot\src\engine\states\expandedNodesState.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// src/engine/states/expandedNodesState.ts
import { store } from '@lincode/reactivity';

// 展开的节点ID集合状态
export const [setExpandedNodeIds, getExpandedNodeIds] = store<Set<string>>(new Set());

// 切换节点展开状态
export function toggleNodeExpanded(nodeId: string): void {
  const expandedIds = new Set(getExpandedNodeIds());
  if (expandedIds.has(nodeId)) {
    expandedIds.delete(nodeId);
  } else {
    expandedIds.add(nodeId);
  }
  setExpandedNodeIds(expandedIds);
}

// 设置节点展开状态
export function setNodeExpanded(nodeId: string, expanded: boolean): void {
  const expandedIds = new Set(getExpandedNodeIds());
  if (expanded) {
    expandedIds.add(nodeId);
  } else {
    expandedIds.delete(nodeId);
  }
  setExpandedNodeIds(expandedIds);
}

// 展开节点的路径（包括所有父节点）
export function expandNodePath(nodeId: string): void {
  // 这个函数需要在实现时使用selectedNodeState中的findParentNode函数
  // 递归找出所有父节点并展开
}