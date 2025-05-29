import React from 'react';
import { WorkspaceLayout } from './components/layout/WorkspaceLayout';
import { EditorProvider } from './state/EditorContext';


/**
 * 编辑器主组件
 */
export const Editor: React.FC = () => {
  return (
    <EditorProvider>
      <div className="editor-container" style={{ 
        width: '100%', 
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e'
      }}>
        <div className="editor-header" style={{
          height: '40px',
          backgroundColor: '#252525',
          borderBottom: '1px solid #333',
          color: '#ddd',
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>ToDot引擎编辑器</h2>
        </div>
        
        <div className="editor-workspace" style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          <WorkspaceLayout />
        </div>
      </div>
    </EditorProvider>
  );
};

export default Editor; 