import React from 'react';
import { createScene } from '../logic/SceneManager';
import { 
  setCreateSceneDialogOpen, 
  setSceneNameInput, 
  getSceneNameInput 
} from '../states/useEditorState';

/**
 * 创建场景对话框组件
 */
export const CreateSceneDialog: React.FC = () => {
  // 处理场景创建
  const handleCreateScene = () => {
    const sceneName = getSceneNameInput().trim();
    if (sceneName) {
      const scene = createScene(sceneName);
      if (scene) {
        handleClose();
      }
    }
  };
  
  // 处理关闭
  const handleClose = () => {
    setCreateSceneDialogOpen(false);
  };
  
  // 处理场景名称变更
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSceneNameInput(e.target.value);
  };
  
  return (
    <div className="create-scene-overlay">
      <div className="create-scene-container">
        <div className="create-scene-header">
          <h3>创建新场景</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="create-scene-content">
          <div className="form-group">
            <label htmlFor="scene-name">场景名称:</label>
            <input 
              id="scene-name" 
              type="text" 
              value={getSceneNameInput()}
              onChange={handleNameChange}
              placeholder="输入场景名称"
            />
          </div>
        </div>
        
        <div className="create-scene-footer">
          <button className="cancel-button" onClick={handleClose}>取消</button>
          <button 
            className="create-button" 
            onClick={handleCreateScene}
            disabled={!getSceneNameInput().trim()}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}; 