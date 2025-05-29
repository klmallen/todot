/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 16:02:12
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 18:44:51
 * @FilePath: \todot\src\engine\editor\components\SceneHierarchy\SceneCreator.tsx
 * @Description: 场景创建器组件
 */
import React, { useState } from 'react';
import { createScene } from '../../logic/SceneManager';
import './styles.css';

interface SceneCreatorProps {
  onClose: () => void;
  onSuccess?: () => void; // 创建成功的回调
}

/**
 * 场景创建器组件 - 提供创建新场景的用户界面
 */
const SceneCreator: React.FC<SceneCreatorProps> = ({ onClose, onSuccess }) => {
  const [sceneName, setSceneName] = useState('新场景');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sceneName.trim()) {
      setError('场景名称不能为空');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      const scene = await createScene(sceneName);
      if (scene) {
        console.log('场景创建成功:', scene.getName());
        onSuccess?.();
        onClose();
      } else {
        setError('创建场景失败，请检查名称是否唯一');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('创建场景出错:', error);
      setError(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsCreating(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>创建新场景</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={isCreating}
            title="关闭"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sceneName">场景名称:</label>
            <input
              id="sceneName"
              type="text"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="输入场景名称"
              disabled={isCreating}
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isCreating}
            >
              取消
            </button>
            
            <button
              type="submit"
              className="submit-button"
              disabled={isCreating}
            >
              {isCreating ? '创建中...' : '创建场景'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SceneCreator; 