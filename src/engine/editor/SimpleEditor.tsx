/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:28:55
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-14 20:52:49
 * @FilePath: \todot\src\engine\editor\SimpleEditor.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useEffect, useRef, useState } from 'react';
import SceneHierarchy from './components/SceneHierarchy';
import AssetExplorer from './components/AssetExplorer';
import SceneView from './components/SceneView';
import { NodeSelector } from './components/NodeSelector';
import { CreateSceneDialog } from './components/CreateSceneDialog';
import { refreshScenes } from './logic/SceneManager';
import { destroyEngine, updateEngineSize, initEngine } from './logic/EngineManager';
import { 
  getNodeSelectorOpen, 
  getCreateSceneDialogOpen, 
  setCreateSceneDialogOpen,
  getEngineInstance,
  getEngineInitialized,
  onCanvasContainerSet
} from './states/useEditorState';
import { PropertyPanel } from '../ui/PropertyPanel';
import { ProjectManager } from '../core/project/ProjectManager';
import './SimpleEditor.css';

// 修改接口定义
interface SimpleEditorProps {
  onBack?: () => void; // 返回按钮回调函数
  skipProjectSelection?: boolean; // 是否跳过项目选择
}

/**
 * 简单编辑器主组件 - 组织编辑器的整体布局
 */
const SimpleEditor: React.FC<SimpleEditorProps> = ({ onBack, skipProjectSelection = false }) => {
  // 创建对属性面板容器的引用
  const propertyPanelRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const initStartedRef = useRef(false);

  // 添加关闭项目的处理函数
  const handleCloseProject = () => {
    // 获取项目管理器实例
    const projectManager = ProjectManager.getInstance();
    
    // 清除最后打开的项目信息
    projectManager.clearLastProjectInfo();
    
    // 清理引擎状态
    destroyEngine();
    
    // 调用返回回调
    if (onBack) {
      onBack();
    }
  };

  // 修改初始化编辑器的函数
  const initializeEditor = async () => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;
    
    try {
      setIsInitializing(true);
      
      // 等待引擎初始化
      const engineInitSuccess = await initEngine();
      if (!engineInitSuccess) {
        setInitError('引擎初始化失败');
        setIsInitializing(false);
        return;
      }

      // 获取项目管理器和引擎实例
      const projectManager = ProjectManager.getInstance();
      const engine = getEngineInstance();
      
      if (!engine) {
        setInitError('获取引擎实例失败');
        setIsInitializing(false);
        return;
      }
      
      // 设置项目管理器中的引擎实例
      projectManager.setEngine(engine);

      let projectOpened = false;
      
      // 如果设置了跳过项目选择，直接尝试打开临时目录句柄中的项目
      if (skipProjectSelection) {
        const tempDirHandle = projectManager.getTemporaryDirectoryHandle?.();
        if (tempDirHandle) {
          const success = await projectManager.openProject(tempDirHandle);
          if (success) {
            projectOpened = true;
            projectManager.clearTemporaryData?.();
          } else {
            setInitError('打开项目失败');
          }
        }
      }
      
      // 如果没有打开项目，按正常流程处理
      if (!projectOpened) {
        // 优先处理临时配置或目录句柄
        const tempConfig = projectManager.getTemporaryConfig?.();
        const tempDirHandle = projectManager.getTemporaryDirectoryHandle?.();
        
        if (tempConfig) {
          const success = await projectManager.createProject(tempConfig);
          if (success) {
            projectOpened = true;
            projectManager.clearTemporaryData?.();
          } else {
            setInitError('创建项目失败');
          }
        } else if (tempDirHandle) {
          const success = await projectManager.openProject(tempDirHandle);
          if (success) {
            projectOpened = true;
            projectManager.clearTemporaryData?.();
          } else {
            setInitError('打开项目失败');
          }
        }
      }
      
      // 如果仍然没有打开项目，检查全局临时变量
      if (!projectOpened) {
        const globalTempConfig = (window as any).__tempProjectConfig;
        const globalTempDirHandle = (window as any).__tempDirectoryHandle;
        
        if (globalTempConfig) {
          await projectManager.createProject(globalTempConfig);
          delete (window as any).__tempProjectConfig;
        } else if (globalTempDirHandle) {
          await projectManager.openProject(globalTempDirHandle);
          delete (window as any).__tempDirectoryHandle;
        }
      }
      
      setIsInitializing(false);
    } catch (error) {
      console.error('编辑器初始化失败:', error);
      setInitError(`编辑器初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsInitializing(false);
    }
  };

  // 组件挂载时注册监听器
  useEffect(() => {
    console.log("SimpleEditor组件挂载");
    
    // 重置初始化状态，允许在组件重新挂载时再次初始化
    initStartedRef.current = false;
    
    // 设置canvas容器的监听器
    onCanvasContainerSet(initializeEditor);
    
    // 刷新场景列表
    refreshScenes();

    // 初始化属性面板
    let propertyPanel: PropertyPanel | null = null;
    
    // 如果引用有效，创建属性面板
    if (propertyPanelRef.current) {
      propertyPanel = new PropertyPanel(propertyPanelRef.current);
    }

    // 添加键盘快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+R 强制更新引擎尺寸
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        updateEngineSize();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    // 组件卸载时清理
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (propertyPanel) {
        propertyPanel.dispose();
      }
      destroyEngine();
      
      // 清理初始化状态和错误状态
      initStartedRef.current = false;
      setIsInitializing(false);
      setInitError(null);
    };
  }, []);

  // 打开创建场景对话框
  const handleCreateScene = () => {
    setCreateSceneDialogOpen(true);
  };

  // 如果正在初始化，显示加载状态
  if (isInitializing) {
    // return (
    //   <div className="loading-container">
    //     <div className="loading-spinner"></div>
    //     <p>初始化编辑器中...</p>
    //   </div>
    // );
  }

  // 如果初始化出错，显示错误信息
  if (initError) {
    return (
      <div className="error-container">
        <h3>初始化失败</h3>
        <p>{initError}</p>
        {onBack && (
          <button 
            className="back-btn" 
            onClick={onBack}
            title="返回到项目选择界面"
          >
            ← 返回
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="simple-editor">
      <div className="editor-header">
        <div className="header-left">
          {/* 返回按钮改为关闭项目按钮 */}
          {onBack && (
            <button 
              className="close-project-btn" 
              onClick={handleCloseProject}
              title="关闭当前项目并返回"
            >
              关闭项目
            </button>
          )}
          <span className="editor-title">简易3D编辑器</span>
        </div>
        <div className="header-right">
          <button className="create-scene-btn" onClick={handleCreateScene}>
            创建场景
          </button>
        </div>
      </div>
      <div className="editor-content">
        {/* 左侧面板 */}
        <div className="left-panel">
          <SceneHierarchy />
          <AssetExplorer />
        </div>
        
        {/* 中间场景视图 */}
        <div className="center-panel">
          <SceneView />
        </div>
        
        {/* 右侧属性面板 */}
        <div className="right-panel">
          <div ref={propertyPanelRef} className="property-panel-container"></div>
        </div>
      </div>

      {/* 节点选择器弹窗 */}
      {getNodeSelectorOpen() && <NodeSelector />}
      
      {/* 创建场景对话框 */}
      {getCreateSceneDialogOpen() && <CreateSceneDialog />}
    </div>
  );
};

export default SimpleEditor; 