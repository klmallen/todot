/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:32:34
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-06 17:51:53
 * @FilePath: \todot\src\engine\editor\components\SceneTree.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState, useEffect } from 'react';
import { getActiveScene, getScenes } from '../states/useEditorState';
import { setSelectedNode, getSelectedNode } from '../../states/useEditorMode';
import { switchScene } from '../logic/SceneManager';
import { selectNode } from '../logic/NodeManager';
import { Node3d } from '../../core/Node3d';

// 转换Node3d为树形结构数据
interface TreeNodeData {
  id: string;
  name: string;
  type?: string;
  node: Node3d;
  children?: TreeNodeData[];
  isScene?: boolean;
}

/**
 * 场景树组件 - 显示场景中的节点层次结构
 */
const SceneTree: React.FC = () => {
  // 本地状态
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // 更新树数据
  useEffect(() => {
    updateTreeData();
    
    // 创建事件监听器，监听场景变化
    const interval = setInterval(updateTreeData, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // 更新树数据
  const updateTreeData = () => {
    const scenes = getScenes();
    const activeScene = getActiveScene();
    
    if (scenes.length === 0) {
      setTreeData([]);
      return;
    }
    
    // 转换场景列表为树形结构
    const data: TreeNodeData[] = scenes.map(scene => {
      const rootNode = scene.getRootNode();
      
      // 把场景作为根节点
      return {
        id: scene.getName(),
        name: scene.getName(),
        node: rootNode,
        isScene: true,
        children: convertNodeToTreeData(rootNode)
      };
    });
    
    setTreeData(data);
    
    // 如果有活动场景，确保它被展开
    if (activeScene) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        newSet.add(activeScene.getName());
        return newSet;
      });
    }
  };
  
  // 将Node3d转换为树形结构数据
  const convertNodeToTreeData = (node: Node3d): TreeNodeData[] => {
    return node.getChildren().map(child => ({
      id: child.getId(),
      name: child.getName(),
      type: child.getType(),
      node: child,
      children: child.getChildren().length > 0 ? convertNodeToTreeData(child) : undefined
    }));
  };
  
  // 切换节点展开/折叠状态
  const toggleNodeExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };
  
  // 选择节点
  const handleNodeSelect = (nodeData: TreeNodeData) => {
    if (nodeData.isScene) {
      // 如果是场景节点，切换场景
      switchScene(nodeData.name);
    } else {
      // 否则选择节点
      selectNode(nodeData.node);
    }
  };
  
  // 渲染树节点
  const renderTreeNode = (nodeData: TreeNodeData, depth = 0) => {
    const isExpanded = expandedNodes.has(nodeData.id);
    const isSelected = getSelectedNode() === nodeData.node;
    const hasChildren = nodeData.children && nodeData.children.length > 0;
    
    return (
      <div key={nodeData.id}>
        <div 
          className={`tree-node ${isSelected ? 'selected' : ''}`} 
          style={{ paddingLeft: `${depth * 20}px` }}
          onClick={() => handleNodeSelect(nodeData)}
        >
          <div className="node-content">
            {hasChildren && (
              <span 
                className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpanded(nodeData.id);
                }}
              >
                {isExpanded ? '▼' : '►'}
              </span>
            )}
            <span className={`node-icon ${nodeData.isScene ? 'scene-icon' : ''}`}>
              {nodeData.isScene ? '📁' : nodeData.type === 'mesh' ? '📦' : '⚪'}
            </span>
            <span className="node-name">{nodeData.name}</span>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="tree-children">
            {nodeData.children!.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="simple-scene-tree">
      <div className="panel-header">场景树</div>
      <div className="panel-content">
        {treeData.length > 0 ? (
          treeData.map(node => renderTreeNode(node))
        ) : (
          <div className="empty-message">没有场景，请先创建场景</div>
        )}
      </div>
    </div>
  );
};

export default SceneTree; 