import React, { useState, useEffect } from 'react';
import { ProjectManager, ProjectConfig } from '../core/project/ProjectManager';

// 定义最近项目接口
interface RecentProject {
  name: string;
  path: string;
  lastOpened: string;
  thumbnail?: string;
}

// 项目卡片样式
const cardStyle: React.CSSProperties = {
  background: '#2a2a2a',
  borderRadius: '6px',
  padding: '15px',
  marginBottom: '12px',
  cursor: 'pointer',
  transition: 'background 0.2s',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
};

// 项目缩略图样式
const thumbnailStyle: React.CSSProperties = {
  width: '80px',
  height: '60px',
  borderRadius: '3px',
  background: '#1a1a1a',
  marginRight: '15px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '24px',
  color: '#555'
};

// 欢迎页面组件
interface ProjectWelcomeProps {
  onCreateProject: () => void;
  onOpenProject: (config: ProjectConfig, files: FileList) => void;
}

const ProjectWelcome: React.FC<ProjectWelcomeProps> = ({ onCreateProject, onOpenProject }) => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const projectManager = ProjectManager.getInstance();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // 加载最近项目列表
  useEffect(() => {
    // 从本地存储加载最近项目
    const loadRecentProjects = () => {
      try {
        const recentProjectsJson = localStorage.getItem('recentProjects');
        if (recentProjectsJson) {
          const projects = JSON.parse(recentProjectsJson) as RecentProject[];
          // 按最后打开时间排序
          projects.sort((a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime());
          setRecentProjects(projects.slice(0, 10)); // 最多显示10个
        }
      } catch (error) {
        console.error('加载最近项目失败:', error);
      }
    };
    
    loadRecentProjects();
  }, []);
  
  // 处理创建新项目
  const handleCreateProject = () => {
    onCreateProject();
  };
  
  // 处理打开现有项目
  const handleOpenProject = async () => {
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
      
      // 添加到最近项目
      addToRecentProjects({
        name: config.name,
        path: projectPath,
        lastOpened: new Date().toISOString()
      });
      
      // 调用回调
      onOpenProject(config, files);
    } catch (error) {
      console.error('打开项目失败:', error);
      alert('项目加载失败，请确认选择了正确的项目目录。');
    }
  };
  
  // 处理点击最近项目
  const handleRecentProjectClick = async (project: RecentProject) => {
    try {
      // 尝试打开存储的目录
      // 注意：由于安全限制，我们无法直接重用存储的目录句柄
      // 需要用户重新选择目录
      // alert(`请重新选择项目目录: ${project.path}`);
      await handleOpenProject();
    } catch (error) {
      console.error('打开最近项目失败:', error);
    }
  };
  
  // 添加到最近项目列表
  const addToRecentProjects = (project: RecentProject) => {
    setRecentProjects(prev => {
      // 移除同名项目
      const filtered = prev.filter(p => p.name !== project.name);
      // 添加到开头
      const updated = [project, ...filtered].slice(0, 10);
      // 保存到本地存储
      localStorage.setItem('recentProjects', JSON.stringify(updated));
      return updated;
    });
  };
  
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1e1e1e',
      color: '#e0e0e0',
      fontFamily: 'Arial, sans-serif'
    }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <div style={{
        width: '80%',
        maxWidth: '800px',
        padding: '30px',
        background: '#252525',
        borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ margin: '0 0 30px 0', textAlign: 'center', color: '#ffffff' }}>
          欢迎使用 3D 编辑器
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          {/* 创建新项目 */}
          <button 
            onClick={handleCreateProject}
            style={{
              width: '48%',
              padding: '15px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            创建新项目
          </button>
          
          {/* 打开项目 */}
          <button 
            onClick={handleOpenProject}
            style={{
              width: '48%',
              padding: '15px',
              fontSize: '16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            打开现有项目
          </button>
        </div>
        
        {/* 最近项目 */}
        {recentProjects.length > 0 && (
          <div>
            <h2 style={{ 
              fontSize: '18px', 
              marginBottom: '15px', 
              borderBottom: '1px solid #444',
              paddingBottom: '8px'
            }}>
              最近项目
            </h2>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {recentProjects.map((project, index) => (
                <div
                  key={index}
                  style={cardStyle}
                  onClick={() => handleRecentProjectClick(project)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#333';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#2a2a2a';
                  }}
                >
                  <div style={thumbnailStyle}>
                    {project.thumbnail ? (
                      <img 
                        src={project.thumbnail} 
                        alt={project.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span>3D</span>
                    )}
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{project.name}</div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                      路径: {project.path}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                      上次打开: {new Date(project.lastOpened).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectWelcome; 