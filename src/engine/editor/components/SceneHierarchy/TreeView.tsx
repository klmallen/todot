/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 16:10:25
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 16:43:28
 * @FilePath: \todot\src\engine\editor\components\SceneHierarchy\TreeView.tsx
 * @Description: 树形视图组件
 */
import React, { useState } from 'react';
import { Scene } from '../../../../engine/core/Scene';
import { Node3d } from '../../../../engine/core/Node3d';

interface TreeViewProps {
  scenes: Scene[];
  activeSceneIds: Set<string>;
  selectedNodeId: string | null;
  selectedSceneId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onSceneSelect: (sceneId: string) => void;
  onSceneToggleActive: (sceneId: string, exclusive: boolean) => void;
  onNodeDelete: (nodeId: string) => Promise<boolean>;
  onSceneDelete: (sceneId: string) => Promise<boolean>;
}

/**
 * 树形视图组件 - 展示场景和节点的层级结构
 */
const TreeView: React.FC<TreeViewProps> = ({
  scenes,
  activeSceneIds,
  selectedNodeId,
  selectedSceneId,
  onNodeSelect,
  onSceneSelect,
  onSceneToggleActive,
  onNodeDelete,
  onSceneDelete
}) => {
  // 展开状态管理
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  
  // 切换节点展开状态
  const toggleNodeExpanded = (nodeId: string) => {
    const newExpandedNodeIds = new Set(expandedNodeIds);
    if (newExpandedNodeIds.has(nodeId)) {
      newExpandedNodeIds.delete(nodeId);
    } else {
      newExpandedNodeIds.add(nodeId);
    }
    setExpandedNodeIds(newExpandedNodeIds);
  };
  
  // 渲染场景节点
  const renderSceneNode = (scene: Scene) => {
    // 兼容没有getId方法的场景
    const sceneId = scene.getName();
    const sceneName = scene.getName();
    const isActive = activeSceneIds.has(sceneId);
    const isSelectedScene = selectedSceneId === sceneId;
    const isSelectedNode = selectedNodeId === sceneId;
    const isExpanded = expandedNodeIds.has(sceneId) || isSelectedScene;
    
    return (
      <div key={sceneId} className="tree-item-container">
        <div 
          className={`tree-item ${isActive ? 'active' : ''} ${isSelectedScene ? 'selected-scene' : ''} ${isSelectedNode ? 'selected' : ''}`}
          onClick={() => onSceneSelect(sceneId)}
          onDoubleClick={() => onSceneToggleActive(sceneId, true)}
        >
          {/* 展开/折叠图标 */}
          <span 
            className={`expand-icon ${isExpanded ? 'expanded' : 'collapsed'}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleNodeExpanded(sceneId);
            }}
          >
            {isExpanded ? '▼' : '►'}
          </span>
          
          {/* 场景图标 */}
          <span className="node-icon scene">📦</span>
          
          {/* 场景名称 */}
          <span className="node-name">{sceneName}</span>
          
          {/* 场景激活控制 */}
          <span 
            className={`scene-activate-control ${isActive ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSceneToggleActive(sceneId, e.ctrlKey ? false : true);
            }}
            title={isActive ? "点击取消激活 (Ctrl+点击 保持多选)" : "点击激活 (Ctrl+点击 多选)"}
          >
            {isActive ? '👁️' : '👁️‍🗨️'}
          </span>
          
          {/* 删除按钮 */}
          <button 
            className="node-action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`确定要删除场景 "${sceneName}" 吗？所有内容将会丢失。`)) {
                onSceneDelete(sceneId);
              }
            }}
            title="删除场景"
          >
            🗑️
          </button>
        </div>
        
        {/* 场景子节点 */}
        {isExpanded && (
          <div className="tree-children">
            {renderChildNodes(scene.getRootNode())}
          </div>
        )}
      </div>
    );
  };
  
  // 递归渲染子节点
  const renderChildNodes = (node: Node3d) => {
    const children = node.getChildren();
    
    // 如果没有子节点，返回空
    if (!children || children.length === 0) {
      return null;
    }
    
    // 渲染所有子节点
    return children.map(child => {
      // 兼容没有getId方法的节点
      const nodeId = child.getId?.() || child.getName();
      const nodeName = child.getName();
      const nodeType = child.constructor.name;
      const isSelected = selectedNodeId === nodeId;
      const isExpanded = expandedNodeIds.has(nodeId);
      const hasChildren = child.getChildren().length > 0;
      
      return (
        <div key={nodeId} className="tree-item-container">
          <div 
            className={`tree-item ${isSelected ? 'selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onNodeSelect(nodeId);
            }}
          >
            {/* 展开/折叠图标 */}
            {hasChildren ? (
              <span 
                className={`expand-icon ${isExpanded ? 'expanded' : 'collapsed'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpanded(nodeId);
                }}
              >
                {isExpanded ? '▼' : '►'}
              </span>
            ) : (
              <span className="expand-icon-placeholder"></span>
            )}
            
            {/* 节点图标 */}
            <span className={`node-icon ${nodeType.toLowerCase()}`}>
              {getNodeTypeIcon(nodeType)}
            </span>
            
            {/* 节点名称 */}
            <span className="node-name">
              {nodeName}
              <span className="node-type">({getNodeTypeLabel(nodeType)})</span>
            </span>
            
            {/* 删除按钮 */}
            <button 
              className="node-action-btn delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`确定要删除节点 "${nodeName}" 吗？`)) {
                  onNodeDelete(nodeId);
                }
              }}
              title="删除节点"
            >
              🗑️
            </button>
          </div>
          
          {/* 子节点 */}
          {isExpanded && hasChildren && (
            <div className="tree-children">
              {renderChildNodes(child)}
            </div>
          )}
        </div>
      );
    });
  };
  
  // 根据节点类型获取图标
  const getNodeTypeIcon = (nodeType: string): string => {
    const type = nodeType.toLowerCase();
    
    if (type.includes('light')) return '💡';
    if (type.includes('camera')) return '📷';
    if (type.includes('mesh')) return '📦';
    if (type.includes('group')) return '📁';
    if (type.includes('text')) return '📝';
    if (type.includes('sprite')) return '🖼️';
    if (type.includes('particle')) return '✨';
    if (type.includes('physics')) return '🔴';
    
    // 默认图标
    return '🔹';
  };
  
  // 获取节点类型的显示标签
  const getNodeTypeLabel = (nodeType: string): string => {
    // 简化类型名称显示
    return nodeType.replace('3D', '').replace('Node', '');
  };
  
  return (
    <div className="tree-view">
      {scenes.map(renderSceneNode)}
    </div>
  );
};

export default TreeView; 