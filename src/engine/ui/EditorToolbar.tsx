import React, { useEffect, useState } from 'react';
import { setIsPlaying, getIsPlaying } from '../states/useEditorMode';
import { setTransformMode, getTransformMode } from '../states/useEditorMode';
import Engine from '../core/Engine';

interface EditorToolbarProps {
  className?: string;
}

// 定义一个全局变量来存储场景树控制器的引用
let globalSceneTreeContainer: any = null;

// 设置场景树控制器的引用
export const setSceneTreeContainer = (container: any) => {
  globalSceneTreeContainer = container;
};

// 获取场景树控制器的引用
export const getSceneTreeContainer = () => {
  return globalSceneTreeContainer;
};

/**
 * 编辑器顶部工具栏组件
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({ className = '' }) => {
  // 监听播放状态
  const [isPlaying, setPlayingState] = useState(getIsPlaying());
  const [transformMode, setTransformModeState] = useState(getTransformMode());
  const [sceneTreeVisible, setSceneTreeVisible] = useState(true); // 场景树默认可见
  
  useEffect(() => {
    // 手动更新状态
    const updateStates = () => {
      setPlayingState(getIsPlaying());
      setTransformModeState(getTransformMode());
    };
    
    // 设置定时器定期检查状态
    const intervalId = setInterval(updateStates, 100);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // 处理播放/停止按钮点击
  const handlePlayToggle = () => {
    const engine = Engine.getInstance();
    if (isPlaying) {
      engine.stopScripts();
      setIsPlaying(false);
    } else {
      engine.startScripts();
      setIsPlaying(true);
    }
  };
  
  // 处理变换模式切换
  const handleTransformModeChange = (mode: 'translate' | 'rotate' | 'scale') => {
    setTransformMode(mode);
  };
  
  // 处理场景树显示切换
  const handleSceneTreeToggle = () => {
    const sceneTreeContainer = getSceneTreeContainer();
    if (sceneTreeContainer) {
      if (sceneTreeVisible) {
        sceneTreeContainer.hide();
      } else {
        sceneTreeContainer.show();
      }
      setSceneTreeVisible(!sceneTreeVisible);
    }
  };
  
  // 场景树图标 SVG
  const sceneTreeIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3H14M2 8H14M2 13H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="5" cy="3" r="1.5" fill="currentColor"/>
      <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="11" cy="13" r="1.5" fill="currentColor"/>
    </svg>
  );
  
  return (
    <div 
      className={`editor-toolbar ${className}`}
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px',
        background: 'rgba(30, 30, 30, 0.8)',
        padding: '5px 10px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        zIndex: 1000
      }}
    >
      {/* 播放/停止按钮 */}
      <button
        onClick={handlePlayToggle}
        style={{
          background: isPlaying ? '#ff4444' : '#44cc44',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '5px 15px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px'
        }}
      >
        {isPlaying ? '停止' : '播放'}
      </button>
      
      {/* 变换工具按钮组 */}
      <div style={{ display: 'flex', gap: '2px' }}>
        <button
          onClick={() => handleTransformModeChange('translate')}
          style={{
            background: transformMode === 'translate' ? '#666' : '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          移动
        </button>
        <button
          onClick={() => handleTransformModeChange('rotate')}
          style={{
            background: transformMode === 'rotate' ? '#666' : '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          旋转
        </button>
        <button
          onClick={() => handleTransformModeChange('scale')}
          style={{
            background: transformMode === 'scale' ? '#666' : '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          缩放
        </button>
      </div>
      
      {/* 场景树切换按钮 */}
      <button
        onClick={handleSceneTreeToggle}
        style={{
          background: sceneTreeVisible ? '#666' : '#444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '5px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="场景树"
      >
        {sceneTreeIcon}
      </button>
    </div>
  );
}; 