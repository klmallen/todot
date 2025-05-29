import React, { useState, useEffect, useRef } from 'react';
import { Node3d } from '../core/Node3d';
import Engine from '../core/Engine';
import { getSelectedNode, setSelectedNode } from '../states/useEditorMode';

interface SceneTreeNodeProps {
  node: Node3d;
  level: number;
  selectedNodeId: string | null;
  onNodeSelect: (node: Node3d) => void;
}

// 节点组件
const SceneTreeNode: React.FC<SceneTreeNodeProps> = ({ node, level, selectedNodeId, onNodeSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const children = node.getChildren();
  const hasChildren = children.length > 0;
  
  // SVG图标
  const icons = {
    chevronRight: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 12L10 8L6 4" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    chevronDown: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6L8 10L12 6" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    cube: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L13 5V11L8 14L3 11V5L8 2Z" stroke="#CCCCCC" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    camera: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 5H14V12H2V5Z" stroke="#CCCCCC" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="8" cy="8.5" r="2" stroke="#CCCCCC" strokeWidth="1.5"/>
      </svg>
    ),
    light: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="3" stroke="#CCCCCC" strokeWidth="1.5"/>
        <path d="M8 3V2M8 14V13M3 8H2M14 8H13M12 4L11 5M4 12L5 11M12 12L11 11M4 4L5 5" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    default: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="4" stroke="#CCCCCC" strokeWidth="1.5"/>
      </svg>
    )
  };
  
  // 获取节点类型对应的图标
  const getIconForType = (type: string) => {
    switch (type) {
      case 'MeshInstance3D': return icons.cube;
      case 'Camera': return icons.camera;
      case 'Light': return icons.light;
      default: return icons.default;
    }
  };
  
  const isSelected = node.getId() === selectedNodeId;
  
  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '2px 4px',
          cursor: 'pointer',
          backgroundColor: isSelected ? 'rgba(0, 127, 255, 0.2)' : 'transparent',
          color: '#e0e0e0',
          borderRadius: '2px',
          height: '24px'
        }}
        onClick={() => onNodeSelect(node)}
      >
        {/* 展开/折叠按钮 */}
        <span 
          style={{ 
            width: '16px', 
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasChildren ? 'pointer' : 'default'
          }}
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setExpanded(!expanded);
            }
          }}
        >
          {hasChildren ? (expanded ? icons.chevronDown : icons.chevronRight) : null}
        </span>
        
        {/* 节点图标 */}
        <span style={{ marginRight: '4px', display: 'flex', alignItems: 'center' }}>
          {getIconForType(node.getType())}
        </span>
        
        {/* 节点名称 */}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.getName()}
        </span>
      </div>
      
      {/* 子节点递归 */}
      {expanded && hasChildren && children.map((child) => (
        <SceneTreeNode 
          key={child.getId()} 
          node={child} 
          level={level + 1} 
          selectedNodeId={selectedNodeId}
          onNodeSelect={onNodeSelect}
        />
      ))}
    </div>
  );
};

// 场景分组组件
interface SceneSectionProps {
  scene: any;
  selectedNodeId: string | null;
  onNodeSelect: (node: Node3d) => void;
}

const SceneSection: React.FC<SceneSectionProps> = ({ scene, selectedNodeId, onNodeSelect }) => {
  const [expanded, setExpanded] = useState(true);
  const rootNode = scene.getRootNode();
  
  // SVG图标
  const chevronRight = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 12L10 8L6 4" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  const chevronDown = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  return (
    <div style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
      {/* 场景标题 */}
      <div 
        style={{
          padding: '4px',
          fontWeight: 'bold',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          color: 'rgba(255, 255, 255, 0.8)',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {expanded ? chevronDown : chevronRight}
        </span>
        {scene.getName() || '未命名场景'}
      </div>
      
      {/* 场景内容 */}
      {expanded && rootNode && (
        <div style={{ paddingLeft: '8px' }}>
          <SceneTreeNode 
            key={rootNode.getId()} 
            node={rootNode} 
            level={0} 
            selectedNodeId={selectedNodeId}
            onNodeSelect={onNodeSelect}
          />
        </div>
      )}
    </div>
  );
};

// 场景树主组件
interface SceneTreeViewProps {
  onClose?: () => void;
}

export const SceneTreeView: React.FC<SceneTreeViewProps> = ({ onClose }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 10, y: 50 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  
  useEffect(() => {
    // 获取引擎实例和场景
    const engine = Engine.getInstance();
    const allScenes = engine.getAllScenes();
    setScenes(allScenes);
    
    // 监听选中节点变化
    const selectedNode = getSelectedNode();
    if (selectedNode) {
      setSelectedNodeId(selectedNode.getId());
    }
    
    // 这里可以添加监听器，以便在场景变化时更新视图
  }, []);
  
  // 处理节点选择
  const handleNodeSelect = (node: Node3d) => {
    setSelectedNodeId(node.getId());
    setSelectedNode(node);
  };
  
  // 处理拖动开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget.querySelector('.tree-header') ||
        (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y
      };
    }
  };
  
  // 处理拖动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragRef.current) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.startPosX + dx,
        y: dragRef.current.startPosY + dy
      });
    }
  };
  
  // 处理拖动结束
  const handleMouseUp = () => {
    setIsDragging(false);
    dragRef.current = null;
  };
  
  // SVG图标
  const collapseIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  const expandIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 12L10 8L6 4" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  const closeIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4L12 12M4 12L12 4" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  const hamburgerIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4H13M3 8H13M3 12H13" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isCollapsed ? '36px' : '280px',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        zIndex: 999,
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        maxHeight: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 头部 */}
      <div 
        className="tree-header"
        style={{ 
          padding: '8px',
          backgroundColor: 'rgba(20, 20, 20, 0.9)',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'move',
          userSelect: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#e0e0e0'
        }}
      >
        <div className="drag-handle" style={{ display: 'flex', alignItems: 'center' }}>
          {isCollapsed ? hamburgerIcon : '场景树'}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            style={{
              background: 'none',
              border: 'none',
              color: '#e0e0e0',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? expandIcon : collapseIcon}
          </button>
          {!isCollapsed && (
            <button 
              style={{
                background: 'none',
                border: 'none',
                color: '#e0e0e0',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={onClose}
            >
              {closeIcon}
            </button>
          )}
        </div>
      </div>
      
      {/* 主体内容 */}
      {!isCollapsed && (
        <div style={{ 
          overflow: 'auto', 
          maxHeight: 'calc(100vh - 150px)',
          padding: '8px'
        }}>
          {scenes.length > 0 ? (
            scenes.map((scene) => (
              <SceneSection 
                key={scene.getName()} 
                scene={scene} 
                selectedNodeId={selectedNodeId}
                onNodeSelect={handleNodeSelect}
              />
            ))
          ) : (
            <div style={{ padding: '8px', color: '#e0e0e0' }}>
              没有可用的场景
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 