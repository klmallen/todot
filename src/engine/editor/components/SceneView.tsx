/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:33:27
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 14:23:58
 * @FilePath: \todot\src\engine\editor\components\SceneView.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useRef, useEffect } from 'react';
import { initEngine, updateEngineSize } from '../logic/EngineManager';
import { setCanvasContainerWithCallback, setNodeSelectorOpen, getEngineInitialized, getActiveScene } from '../states/useEditorState';

/**
 * 场景视图组件 - 显示3D场景
 */
const SceneView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 设置容器引用和初始化尺寸监听
  useEffect(() => {
    if (!containerRef.current) return;
    
    console.log("SceneView设置canvas容器");
    
    // 保存容器引用
    setCanvasContainerWithCallback(containerRef.current);
    
    // 创建MutationObserver监听DOM变化
    const mutationObserver = new MutationObserver(() => {
      // updateEngineSize();
    });
    
    // 监听DOM结构变化
    mutationObserver.observe(document.body, { 
      attributes: true, 
      childList: true, 
      subtree: true 
    });
    
    // 创建ResizeObserver监听容器尺寸变化
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        // updateEngineSize();
      });
      
      // 监听容器和它的所有父元素
      let element: HTMLElement | null = containerRef.current;
      while (element) {
        resizeObserver.observe(element);
        element = element.parentElement;
      }
    }
    
    // 添加窗口大小监听器作为后备
    const handleWindowResize = () => {
      updateEngineSize();
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    // 触发初始尺寸更新
    updateEngineSize();
    
    // 定期检查尺寸变化（作为后备机制）
    const intervalId = setInterval(updateEngineSize, 1000);
    
    // 组件卸载时清理
    return () => {
      setCanvasContainerWithCallback(null);
      window.removeEventListener('resize', handleWindowResize);
      
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      
      clearInterval(intervalId);
    };
  }, []);
  
  // 点击添加节点按钮
  const handleAddNode = () => {
    setNodeSelectorOpen(true);
  };
  
  // 检查是否可以添加节点（已初始化且有活动场景）
  const canAddNodes = getEngineInitialized() && getActiveScene() !== null;
  
  return (
    <div className="simple-scene-view">
      <div className="scene-content" ref={containerRef}>
        {/* 加号按钮，只有在有活动场景时才启用 */}
        <button 
          className={`add-node-button ${!canAddNodes ? 'disabled' : ''}`}
          onClick={handleAddNode}
          disabled={!canAddNodes}
          title={canAddNodes ? '添加节点' : '请先创建场景'}
        >
          <span className="icon">+</span>
        </button>
      </div>
    </div>
  );
};

export default SceneView; 