import React, { useState, useEffect, useRef } from 'react';
import ProjectWelcome from './engine/ui/ProjectWelcome';
import CreateProjectDialog from './engine/ui/CreateProjectDialog';
import SimpleEditor from './engine/editor/SimpleEditor';
import { ProjectManager, ProjectConfig } from './engine/core/project/ProjectManager';

/**
 * 应用程序的主状态
 */
enum AppState {
  LOADING = 'loading',        // 加载状态
  WELCOME = 'welcome',        // 欢迎页面
  CREATE_PROJECT = 'create',  // 创建项目对话框
  EDITOR = 'editor'          // 编辑器界面
}

/**
 * 应用程序主组件
 */
const App: React.FC = () => {
  // 应用状态
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  // 项目管理器
  const projectManager = ProjectManager.getInstance();
  // 文件选择器引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 临时存储项目配置
  const [tempProjectConfig, setTempProjectConfig] = useState<Partial<ProjectConfig> | null>(null);
  
  // 初始化时检查是否有上次打开的项目
  useEffect(() => {
    const checkLastProject = async () => {
      try {
        const lastProjectInfo = await projectManager.getLastProjectInfo();
        if (lastProjectInfo) {
          // 显示确认对话框
          if (window.confirm(`是否打开上次的项目"${lastProjectInfo.name}"？\n路径: ${lastProjectInfo.path}`)) {
            // 创建文件选择器
            if (fileInputRef.current) {
              fileInputRef.current.webkitdirectory = true;
              fileInputRef.current.click();
              
              // 监听文件选择
              fileInputRef.current.onchange = async (e) => {
                const input = e.target as HTMLInputElement;
                const files = input.files;
                
                if (files && files.length > 0) {
                  // 获取选择的目录路径
                  const selectedPath = files[0].webkitRelativePath.split('/')[0];
                  
                  // 验证是否选择了正确的项目目录
                  if (selectedPath === lastProjectInfo.path) {
                    // TODO: 这里需要实现一个方法来从文件列表创建项目
                    // 临时使用一个空的配置
                    const config: ProjectConfig = {
                      name: lastProjectInfo.name,
                      version: '1.0.0',
                      created: new Date().toISOString(),
                      lastModified: new Date().toISOString(),
                      scenes: [],
                      activeScenes: [],
                      settings: {}
                    };
                    
                    // 进入编辑器
                    handleOpenProject(config, files);
                    return;
                  } else {
                    alert('选择的目录与上次的项目目录不匹配');
                    projectManager.clearLastProjectInfo();
                  }
                }
                
                setAppState(AppState.WELCOME);
              };
            }
          } else {
            // 用户选择不打开上次的项目，清除记录
            projectManager.clearLastProjectInfo();
            setAppState(AppState.WELCOME);
          }
        } else {
          // 如果没有上次的项目，显示欢迎页面
          setAppState(AppState.WELCOME);
        }
      } catch (error) {
        console.error('检查上次项目失败:', error);
        setAppState(AppState.WELCOME);
      }
    };

    checkLastProject();
  }, []);

  // 处理点击创建项目按钮
  const handleCreateProjectClick = () => {
    setAppState(AppState.CREATE_PROJECT);
  };
  
  // 处理创建项目
  const handleCreateProject = async (config: Partial<ProjectConfig>) => {
    // 存储临时配置
    setTempProjectConfig(config);
    
    // 打开文件选择器选择项目目录
    if (fileInputRef.current) {
      fileInputRef.current.webkitdirectory = true;
      fileInputRef.current.click();
    }
  };

  // 处理文件选择
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      if (tempProjectConfig) {
        // 创建新项目
        projectManager.setTemporaryConfig(tempProjectConfig);
        projectManager.setTemporaryFiles(files);
        const success = await projectManager.createProject();
        if (success) {
          setAppState(AppState.EDITOR);
        } else {
          alert('创建项目失败');
          setAppState(AppState.WELCOME);
        }
        // 清除临时配置
        setTempProjectConfig(null);
      } else {
        // 打开现有项目
        // 获取项目根目录名称
        const projectPath = files[0].webkitRelativePath.split('/')[0];
        
        // 查找项目配置文件
        let configFile: File | null = null;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.webkitRelativePath === `${projectPath}/project.json`) {
            configFile = file;
            break;
          }
        }

        if (!configFile) {
          alert('所选目录不是有效的项目目录，请确认项目目录中包含project.json文件。');
          return;
        }

        // 读取配置文件
        const configText = await configFile.text();
        const config = JSON.parse(configText) as ProjectConfig;
        
        // 设置文件列表
        projectManager.setTemporaryFiles(files);
        
        // 打开项目
        const success = await projectManager.openProject();
        if (success) {
          // 切换到编辑器状态
          setAppState(AppState.EDITOR);
        } else {
          alert('打开项目失败');
          setAppState(AppState.WELCOME);
        }
      }
    } catch (error) {
      console.error('处理文件失败:', error);
      alert('操作失败，请重试');
      setAppState(AppState.WELCOME);
    }
  };
  
  // 处理取消创建项目
  const handleCancelCreateProject = () => {
    setTempProjectConfig(null);
    setAppState(AppState.WELCOME);
  };
  
  // 处理返回欢迎页面
  const handleBackToWelcome = async () => {
    // 清除最后打开的项目信息
    projectManager.clearLastProjectInfo();
    // 返回欢迎页面
    setAppState(AppState.WELCOME);
  };
  
  // 根据当前状态渲染不同的内容
  const renderContent = () => {
    switch (appState) {
      case AppState.LOADING:
        return (
          <>
            <div>正在检查项目...</div>
            <input 
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </>
        );
      case AppState.WELCOME:
        return (
          <>
            <ProjectWelcome 
              onCreateProject={handleCreateProjectClick}
              onOpenProject={(config, files) => {
                projectManager.setTemporaryFiles(files);
                projectManager.openProject().then(success => {
                  if (success) {
                    setAppState(AppState.EDITOR);
                  } else {
                    alert('打开项目失败');
                  }
                });
              }}
            />
            <input 
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </>
        );
      case AppState.CREATE_PROJECT:
        return (
          <>
            <CreateProjectDialog 
              onClose={handleCancelCreateProject}
              onCreateProject={handleCreateProject}
            />
            <input 
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </>
        );
      case AppState.EDITOR:
        return (
          <SimpleEditor 
            onBack={handleBackToWelcome}
          />
        );
      default:
        return <div>加载中...</div>;
    }
  };
  
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {renderContent()}
    </div>
  );
};

export default App; 