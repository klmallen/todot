/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-08 16:08:27
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 18:04:43
 * @FilePath: \todot\src\engine\editor\components\SceneHierarchy\index.tsx
 * @Description: 场景层级面板组件
 */
import React, { useEffect, useState } from 'react';
import TreeView from './TreeView';
import SceneCreator from './SceneCreator';
import NodeCreator from './NodeCreator';
import { 
  getAllScenes, 
  getCurrentActiveScene,
  getActiveScenes,
  refreshScenes,
  switchScene,
  deleteScene 
} from '../../../editor/logic/SceneManager';
import { 
  selectNodeById, 
  deleteNodeById,
  createNodeInScene
} from '../../../editor/logic/NodeManager';
import { 
  getSelectedNodeId 
} from '../../../states/selectedNodeState';
import { 
  getActiveSceneIds,
  setActiveSceneIds 
} from '../../../states/activeSceneState';
import './styles.css';

/**
 * 场景层级面板组件
 */
const SceneHierarchy: React.FC = () => {
  // 状态
  const [showSceneCreator, setShowSceneCreator] = useState(false);
  const [showNodeCreator, setShowNodeCreator] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [scenes, setScenes] = useState(getAllScenes());
  
  // 获取当前选中的节点ID
  const selectedNodeId = getSelectedNodeId();
  
  // 场景和活动场景状态
  const activeSceneIds = getActiveSceneIds();
  
  // 初始化和刷新
  useEffect(() => {
    const init = async () => {
      await refreshScenes();
      setRefreshTrigger(prev => prev + 1);
    };
    
    init();
    
    // 定期刷新
    const intervalId = setInterval(() => {
      refreshScenes().then(() => setRefreshTrigger(prev => prev + 1));
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // 手动刷新
  const handleRefresh = async () => {
    await refreshScenes();
    
    // 直接更新场景列表，而不是通过刷新触发器
    const updatedScenes = getAllScenes();
    setScenes(updatedScenes);
    
    // 可以使用requestAnimationFrame确保界面平滑更新
    requestAnimationFrame(() => {
      setRefreshTrigger(prev => prev + 1);
    });
  };
  
  // 选择节点
  const handleNodeSelect = (nodeId: string | null) => {
    selectNodeById(nodeId);
    // 重置选中的场景
    setSelectedSceneId(null);
  };
  
  // 选择场景
  const handleSceneSelect = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    // 清除选中的节点
    selectNodeById(null);
  };
  
  // 激活/停用场景
  const handleSceneToggleActive = (sceneId: string, exclusive: boolean) => {
    const isActive = activeSceneIds.has(sceneId);
    
    // 如果为活动状态且当前只有一个活动场景，不允许停用
    if (isActive && activeSceneIds.size <= 1 && !exclusive) {
      console.warn('至少需要保持一个场景处于活动状态');
      return;
    }
    
    // 设置活动状态
    if (exclusive) {
      // 独占模式：停用其他场景，只激活当前场景
      setActiveSceneIds(new Set([sceneId]));
      switchScene(sceneId, true);
    } else {
      // 多选模式：切换当前场景的活动状态
      const newActiveIds = new Set(activeSceneIds);
      if (isActive) {
        newActiveIds.delete(sceneId);
      } else {
        newActiveIds.add(sceneId);
      }
      setActiveSceneIds(newActiveIds);
      
      if (!isActive) {
        switchScene(sceneId, false);
      }
    }
  };
  
  // 删除节点
  const handleNodeDelete = async (nodeId: string) => {
    return await deleteNodeById(nodeId);
  };
  
  // 删除场景
  const handleSceneDelete = async (sceneId: string) => {
    // 获取场景名称
    const scene = scenes.find(s => s.getName() === sceneId);
    if (!scene) return false;
    
    // 确认删除
    if (scenes.length <= 1) {
      alert('无法删除唯一的场景');
      return false;
    }
    
    return await deleteScene(scene.getName());
  };
  
  // 处理添加节点按钮
  const handleAddNode = () => {
    // 如果有选中的场景，则向该场景添加节点
    if (selectedSceneId) {
      const targetScene = scenes.find(s => s.getName() === selectedSceneId);
      if (targetScene) {
        setShowNodeCreator(true);
      }
    } else if (selectedNodeId) {
      // 如果选中了节点，则向该节点添加子节点
      setShowNodeCreator(true);
    } else {
      // 如果没有选中场景或节点，默认添加到当前活动场景
      const activeScene = getCurrentActiveScene();
      if (activeScene) {
        setSelectedSceneId(activeScene.getName());
        setShowNodeCreator(true);
      }
    }
  };
  
  // 处理节点创建成功
  const handleNodeCreationSuccess = async () => {
    // 节点已经在NodeCreator组件中创建，这里只需要刷新视图
    await handleRefresh();
  };
  
  return (
    <div className="scene-hierarchy">
      <div className="scene-hierarchy-header">
        <h2>场景层级</h2>
        <div className="header-actions">
          <button
            onClick={() => setShowSceneCreator(true)}
            title="创建新场景"
          >
            + 场景
          </button>
          <button
            onClick={handleAddNode}
            disabled={!selectedNodeId && !selectedSceneId}
            title={selectedNodeId || selectedSceneId ? "添加新节点" : "请先选择一个场景或节点"}
          >
            + 节点
          </button>
          <button
            onClick={handleRefresh}
            title="刷新场景列表"
          >
            ↻
          </button>
        </div>
      </div>
      
      <div className="scene-hierarchy-content">
        {scenes.length === 0 ? (
          <div className="empty-state">
            <p>暂无场景，请创建新场景</p>
            <button onClick={() => setShowSceneCreator(true)}>
              创建场景
            </button>
          </div>
        ) : (
          <TreeView
            key={refreshTrigger} // 确保组件在数据变化时重新渲染
            scenes={scenes}
            activeSceneIds={activeSceneIds}
            selectedNodeId={selectedNodeId}
            selectedSceneId={selectedSceneId}
            onNodeSelect={handleNodeSelect}
            onSceneSelect={handleSceneSelect}
            onSceneToggleActive={handleSceneToggleActive}
            onNodeDelete={handleNodeDelete}
            onSceneDelete={handleSceneDelete}
          />
        )}
      </div>
      
      {/* 场景创建对话框 */}
      {showSceneCreator && (
        <SceneCreator
          onClose={() => setShowSceneCreator(false)}
          onSuccess={handleRefresh}
        />
      )}
      
      {/* 节点创建对话框 */}
      {showNodeCreator && (
        <NodeCreator
          onClose={() => setShowNodeCreator(false)}
          onSuccess={handleNodeCreationSuccess}
          targetSceneId={selectedSceneId}
        />
      )}
    </div>
  );
};

export default SceneHierarchy; 