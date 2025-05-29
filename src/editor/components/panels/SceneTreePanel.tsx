import React, { useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { EditorNode } from '../../types';

/**
 * 树节点属性
 */
interface TreeNodeProps {
  node: EditorNode;
  level: number;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}

/**
 * 树节点组件
 */
const TreeNode: React.FC<TreeNodeProps> = ({ node, level, isSelected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 节点类型图标
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'ParticleSystem':
        return '✨';
      case 'Light':
        return '💡';
      case 'Camera':
        return '📷';
      case 'Mesh':
        return '📦';
      default:
        return '📄';
    }
  };
  
  // 切换展开状态
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // 选择节点
  const handleSelect = () => {
    onSelect(node.id);
  };
  
  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div 
        className={`tree-node ${isSelected ? 'selected' : ''}`}
        style={{
          padding: '4px 0',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#3a3a3a' : 'transparent',
          borderRadius: '2px',
        }}
        onClick={handleSelect}
      >
        {node.children.length > 0 && (
          <span 
            onClick={toggleExpand}
            style={{ 
              marginRight: '4px',
              fontSize: '10px',
              width: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            {isExpanded ? '▼' : '►'}
          </span>
        )}
        
        <span style={{ marginRight: '6px' }}>{getNodeIcon(node.type)}</span>
        <span style={{ 
          color: isSelected ? '#fff' : '#ddd',
          fontSize: '12px'
        }}>
          {node.name}
        </span>
      </div>
      
      {isExpanded && node.children.map(child => (
        <TreeNode 
          key={child.id}
          node={child}
          level={level + 1}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

/**
 * 场景树面板组件
 */
export const SceneTreePanel: React.FC = () => {
  const { state, selectNode } = useEditor();
  
  // 示例场景树数据
  const [sceneNodes] = useState<EditorNode[]>([
    {
      id: '1',
      name: '场景根节点',
      type: 'Scene',
      children: [
        {
          id: '2',
          name: '相机',
          type: 'Camera',
          children: []
        },
        {
          id: '3',
          name: '地面',
          type: 'Mesh',
          children: []
        },
        {
          id: '4',
          name: '粒子系统',
          type: 'ParticleSystem',
          children: []
        },
        {
          id: '5',
          name: '灯光',
          type: 'Light',
          children: []
        }
      ]
    }
  ]);
  
  // 处理节点选择
  const handleSelectNode = (nodeId: string) => {
    selectNode(nodeId);
  };
  
  return (
    <div className="scene-tree-panel" style={{ padding: '10px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#ddd' }}>场景树</h3>
        
        <div className="tree-actions" style={{ display: 'flex', gap: '5px' }}>
          <button style={{
            backgroundColor: '#333',
            border: 'none',
            color: '#ddd',
            padding: '2px 6px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}>
            +
          </button>
          <button style={{
            backgroundColor: '#333',
            border: 'none',
            color: '#ddd',
            padding: '2px 6px',
            fontSize: '12px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}>
            -
          </button>
        </div>
      </div>
      
      <div className="tree-container" style={{ color: '#ddd' }}>
        {sceneNodes.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            isSelected={state.selectedNodeId === node.id}
            onSelect={handleSelectNode}
          />
        ))}
      </div>
    </div>
  );
}; 