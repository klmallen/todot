import React, { useState } from 'react';
import { DraggablePanel } from './DraggablePanel';
import { useEditor } from '../../state/EditorContext';
import { SceneTreePanel } from '../panels/SceneTreePanel';
import { PropertyPanel } from '../panels/PropertyPanel';
import { ResourcePanel } from '../panels/ResourcePanel';

/**
 * 工作区布局组件
 * 包含多个可拖拽面板
 */
export const WorkspaceLayout: React.FC = () => {
  const { state } = useEditor();
  
  // 面板布局状态
  const [layout, setLayout] = useState({
    // 左侧面板(场景树)宽度
    leftPanelWidth: 250,
    // 右侧面板(属性面板)宽度
    rightPanelWidth: 300,
    // 底部面板(控制台/资源面板)高度
    bottomPanelHeight: 200
  });
  
  // 处理左侧面板调整大小
  const handleLeftResize = (newWidth: number) => {
    setLayout(prev => ({
      ...prev,
      leftPanelWidth: newWidth
    }));
  };
  
  // 处理右侧面板调整大小
  const handleRightResize = (newWidth: number) => {
    setLayout(prev => ({
      ...prev,
      rightPanelWidth: newWidth
    }));
  };
  
  // 处理底部面板调整大小
  const handleBottomResize = (newHeight: number) => {
    setLayout(prev => ({
      ...prev,
      bottomPanelHeight: newHeight
    }));
  };
  
  return (
    <div className="workspace-layout" style={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* 左侧面板 - 场景树 */}
      {state.layout.showSceneTree && (
        <DraggablePanel 
          position="left"
          width={layout.leftPanelWidth}
          minWidth={150}
          maxWidth={400}
          onResize={handleLeftResize}
          style={{
            backgroundColor: '#252525',
            borderRight: '1px solid #333',
          }}
        >
          <SceneTreePanel />
        </DraggablePanel>
      )}
      
      {/* 中间内容区 - 场景视图 */}
      <div className="main-content" style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 主视图区域 */}
        <div className="viewport" style={{ 
          flex: 1,
          backgroundColor: '#1a1a1a',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: '#555',
            fontSize: '14px'
          }}>
            3D场景视图将在此显示
          </div>
        </div>
        
        {/* 底部面板 - 资源面板 */}
        {state.layout.showResourcePanel && (
          <DraggablePanel 
            position="bottom"
            height={layout.bottomPanelHeight}
            minHeight={100}
            maxHeight={500}
            onResize={handleBottomResize}
            style={{
              backgroundColor: '#252525',
              borderTop: '1px solid #333',
            }}
          >
            <ResourcePanel />
          </DraggablePanel>
        )}
      </div>
      
      {/* 右侧面板 - 属性面板 */}
      {state.layout.showPropertyPanel && (
        <DraggablePanel 
          position="right"
          width={layout.rightPanelWidth}
          minWidth={200}
          maxWidth={500}
          onResize={handleRightResize}
          style={{
            backgroundColor: '#252525',
            borderLeft: '1px solid #333',
          }}
        >
          <PropertyPanel />
        </DraggablePanel>
      )}
    </div>
  );
}; 