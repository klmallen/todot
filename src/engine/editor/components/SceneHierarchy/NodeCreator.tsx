/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 16:04:07
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 22:18:55
 * @FilePath: \todot\src\engine\editor\components\SceneHierarchy\NodeCreator.tsx
 * @Description: 节点创建器组件
 */
import React, { useState } from 'react';
import { 
  getAvailableNodeTypes, 
  createNodeUnderSelected,
  createNodeInScene,
  getSelectedNodeInstance
} from '../../logic/NodeManager';
import { getAllScenes } from '../../logic/SceneManager';
import './styles.css';

interface NodeCreatorProps {
  onClose: () => void;
  onSuccess?: () => void; // 创建成功的回调
  targetSceneId?: string | null; // 目标场景ID
}

/**
 * 节点创建器组件 - 提供创建新节点的用户界面
 */
const NodeCreator: React.FC<NodeCreatorProps> = ({ onClose, onSuccess, targetSceneId }) => {
  // 获取当前选中的节点
  const selectedNode = getSelectedNodeInstance();
  
  // 获取目标场景
  const scenes = getAllScenes();
  const targetScene = targetSceneId ? scenes.find(s => s.getName() === targetSceneId) : null;
  
  // 节点类型列表
  const nodeTypes = getAvailableNodeTypes();
  
  // 状态
  const [nodeName, setNodeName] = useState('新节点');
  const [nodeTypeId, setNodeTypeId] = useState(nodeTypes.length > 0 ? nodeTypes[0].id : '');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  
  // 节点类型分类
  const categories = [...new Set(nodeTypes.map(type => type.category))];
  
  // 处理节点创建
  const handleCreateNode = async () => {
    if (!nodeName.trim()) {
      setError('节点名称不能为空');
      return;
    }
    
    if (!nodeTypeId) {
      setError('请选择节点类型');
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      // 根据情况创建节点
      let node;
      if (targetScene) {
        // 如果有指定的目标场景，则向该场景添加节点
        node = await createNodeInScene(targetScene, nodeTypeId, nodeName);
      } else {
        // 否则添加到选中的节点下
        node = await createNodeUnderSelected(nodeTypeId, nodeName);
      }
      console.log(node)
      if (node) {
        console.log('节点创建成功:', node.getName());
        onSuccess?.();
        onClose();
      } else {
        setError('创建节点失败');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('创建节点出错:', error);
      setError(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsCreating(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>创建新节点</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={isCreating}
            title="关闭"
          >
            ×
          </button>
        </div>
        
        {targetScene ? (
          <div className="parent-info">
            添加到场景: <strong>{targetScene.getName()}</strong>
          </div>
        ) : selectedNode ? (
          <div className="parent-info">
            添加到节点: <strong>{selectedNode.getName()}</strong>
          </div>
        ) : (
          <div className="parent-info warning">
            未选择父节点，将添加到当前场景根节点
          </div>
        )}
        
        <div className="form-content">
          <div className="form-group">
            <label htmlFor="nodeName">节点名称:</label>
            <input
              id="nodeName"
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="输入节点名称"
              disabled={isCreating}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="nodeType">节点类型:</label>
            <select
              id="nodeType"
              value={nodeTypeId}
              onChange={(e) => setNodeTypeId(e.target.value)}
              disabled={isCreating}
            >
              {categories.map(category => (
                <optgroup key={category} label={category}>
                  {nodeTypes
                    .filter(type => type.category === category)
                    .map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.description}
                      </option>
                    ))
                  }
                </optgroup>
              ))}
            </select>
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
              type="button"
              className="submit-button"
              onClick={handleCreateNode}
              disabled={isCreating || !nodeTypeId}
            >
              {isCreating ? '创建中...' : '创建节点'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeCreator; 