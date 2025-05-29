import React, { useState } from 'react';
import { ProjectConfig } from '../core/project/ProjectManager';

// 新项目对话框属性
interface CreateProjectDialogProps {
  onClose: () => void;
  onCreateProject: (config: Partial<ProjectConfig>) => void;
}

/**
 * 创建新项目对话框组件
 */
const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ onClose, onCreateProject }) => {
  // 项目表单状态
  const [projectName, setProjectName] = useState('新项目');
  const [projectDescription, setProjectDescription] = useState('');
  const [useWebGPU, setUseWebGPU] = useState(true);
  const [showHelpers, setShowHelpers] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showGizmos, setShowGizmos] = useState(true);
  const [addDefaultLights, setAddDefaultLights] = useState(true);
  
  // 表单提交处理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 创建项目配置
    const config: Partial<ProjectConfig> = {
      name: projectName,
      description: projectDescription,
      settings: {
        useWebGPU,
        showHelpers,
        showGrid,
        showGizmos,
        addDefaultLights
      }
    };
    
    // 回调函数
    onCreateProject(config);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000
    }}>
      <div style={{
        width: '500px',
        backgroundColor: '#252525',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        padding: '25px',
        color: '#e0e0e0'
      }}>
        <h2 style={{ 
          margin: '0 0 20px 0',
          color: '#fff',
          fontSize: '20px',
          borderBottom: '1px solid #444',
          paddingBottom: '10px'
        }}>
          创建新项目
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* 项目名称 */}
          <div style={{ marginBottom: '15px' }}>
            <label 
              htmlFor="projectName" 
              style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px' 
              }}
            >
              项目名称 *
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#333',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>
          
          {/* 项目描述 */}
          <div style={{ marginBottom: '15px' }}>
            <label 
              htmlFor="projectDescription" 
              style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px' 
              }}
            >
              项目描述
            </label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#333',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <h3 style={{ 
            fontSize: '16px', 
            margin: '20px 0 10px 0',
            color: '#ccc' 
          }}>
            引擎设置
          </h3>
          
          {/* 渲染设置 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '10px',
            marginBottom: '20px'
          }}>
            {/* 使用WebGPU */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="useWebGPU"
                type="checkbox"
                checked={useWebGPU}
                onChange={e => setUseWebGPU(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="useWebGPU">使用 WebGPU</label>
            </div>
            
            {/* 显示辅助器 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="showHelpers"
                type="checkbox"
                checked={showHelpers}
                onChange={e => setShowHelpers(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="showHelpers">显示辅助器</label>
            </div>
            
            {/* 显示网格 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="showGrid"
                type="checkbox"
                checked={showGrid}
                onChange={e => setShowGrid(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="showGrid">显示网格</label>
            </div>
            
            {/* 显示Gizmos */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="showGizmos"
                type="checkbox"
                checked={showGizmos}
                onChange={e => setShowGizmos(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="showGizmos">显示Gizmos</label>
            </div>
            
            {/* 添加默认光源 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="addDefaultLights"
                type="checkbox"
                checked={addDefaultLights}
                onChange={e => setAddDefaultLights(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="addDefaultLights">默认光源</label>
            </div>
          </div>
          
          {/* 底部按钮 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            borderTop: '1px solid #444',
            paddingTop: '15px' 
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 15px',
                backgroundColor: '#555',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 15px',
                backgroundColor: '#007bff',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              创建项目
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectDialog; 