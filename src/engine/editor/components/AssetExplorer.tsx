import React, { useState, useEffect } from 'react';
import { ProjectManager } from '../../core/project/ProjectManager';

// 资源类型
type AssetType = 'folder' | 'model' | 'texture' | 'sound' | 'script' | 'scene' | 'other';

// 资源项接口
interface Asset {
  id: string;
  name: string;
  type: AssetType;
  path: string;
  children?: Asset[];
  parentId?: string;
}

/**
 * 资源浏览器组件 - 显示项目资源
 */
const AssetExplorer: React.FC = () => {
  // 状态
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // 获取项目管理器实例
  const projectManager = ProjectManager.getInstance();
  
  // 加载当前目录的资源
  const loadAssets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: 实际项目中，这里应该调用项目管理器的方法获取真实的资源列表
      // 例如: const assetsData = await projectManager.getAssetsInDirectory(currentPath);
      
      // 模拟加载资源数据
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 根据当前路径生成模拟数据
      let assetsData: Asset[] = [];
      
      if (currentPath === '/') {
        // 根目录下显示主要资源文件夹
        assetsData = [
          { id: 'scenes', name: '场景', type: 'folder', path: '/scenes' },
          { id: 'models', name: '模型', type: 'folder', path: '/models' },
          { id: 'textures', name: '纹理', type: 'folder', path: '/textures' },
          { id: 'sounds', name: '音效', type: 'folder', path: '/sounds' },
          { id: 'scripts', name: '脚本', type: 'folder', path: '/scripts' }
        ];
      } else if (currentPath === '/scenes') {
        // 场景目录
        assetsData = [
          { id: 'scene1', name: '主场景.scene', type: 'scene', path: '/scenes/主场景.scene' },
          { id: 'scene2', name: '关卡1.scene', type: 'scene', path: '/scenes/关卡1.scene' },
          { id: 'scene3', name: '关卡2.scene', type: 'scene', path: '/scenes/关卡2.scene' }
        ];
      } else if (currentPath === '/models') {
        // 模型目录
        assetsData = [
          { id: 'model_folder1', name: '角色', type: 'folder', path: '/models/角色' },
          { id: 'model_folder2', name: '环境', type: 'folder', path: '/models/环境' },
          { id: 'model_folder3', name: '道具', type: 'folder', path: '/models/道具' },
          { id: 'model1', name: 'cube.glb', type: 'model', path: '/models/cube.glb' },
          { id: 'model2', name: 'sphere.glb', type: 'model', path: '/models/sphere.glb' }
        ];
      } else if (currentPath === '/models/角色') {
        // 角色模型目录
        assetsData = [
          { id: 'char1', name: '玩家.glb', type: 'model', path: '/models/角色/玩家.glb' },
          { id: 'char2', name: '敌人.glb', type: 'model', path: '/models/角色/敌人.glb' },
          { id: 'char3', name: 'NPC.glb', type: 'model', path: '/models/角色/NPC.glb' }
        ];
      } else if (currentPath === '/textures') {
        // 纹理目录
        assetsData = [
          { id: 'texture1', name: 'wood.jpg', type: 'texture', path: '/textures/wood.jpg' },
          { id: 'texture2', name: 'metal.jpg', type: 'texture', path: '/textures/metal.jpg' },
          { id: 'texture3', name: 'grass.png', type: 'texture', path: '/textures/grass.png' },
          { id: 'texture4', name: 'sky.hdr', type: 'texture', path: '/textures/sky.hdr' }
        ];
      } else if (currentPath === '/sounds') {
        // 音效目录
        assetsData = [
          { id: 'sound1', name: 'explosion.mp3', type: 'sound', path: '/sounds/explosion.mp3' },
          { id: 'sound2', name: 'background.mp3', type: 'sound', path: '/sounds/background.mp3' },
          { id: 'sound3', name: 'footstep.wav', type: 'sound', path: '/sounds/footstep.wav' }
        ];
      } else if (currentPath === '/scripts') {
        // 脚本目录
        assetsData = [
          { id: 'script1', name: 'Player.js', type: 'script', path: '/scripts/Player.js' },
          { id: 'script2', name: 'Enemy.js', type: 'script', path: '/scripts/Enemy.js' },
          { id: 'script3', name: 'GameManager.js', type: 'script', path: '/scripts/GameManager.js' }
        ];
      }
      
      setAssets(assetsData);
    } catch (err) {
      console.error('加载资源失败:', err);
      setError('加载资源失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始加载和路径变化时重新加载资源
  useEffect(() => {
    loadAssets();
  }, [currentPath]);
  
  // 处理点击资源项
  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
  };
  
  // 处理双击资源项
  const handleAssetDoubleClick = (asset: Asset) => {
    if (asset.type === 'folder') {
      // 如果是文件夹，导航到该文件夹
      setCurrentPath(asset.path);
    } else {
      // 如果是文件，根据类型执行相应操作
      console.log('打开文件:', asset.name);
      
      // TODO: 根据文件类型执行不同操作
      // 例如：打开场景、预览模型、播放音频等
    }
  };
  
  // 返回上一级目录
  const handleGoBack = () => {
    // 如果已经在根目录，则不做任何操作
    if (currentPath === '/') return;
    
    // 获取上一级路径
    const pathSegments = currentPath.split('/').filter(Boolean);
    const newPath = pathSegments.length > 1 
      ? `/${pathSegments.slice(0, -1).join('/')}`
      : '/';
    
    // 导航到上一级
    setCurrentPath(newPath);
    setSelectedAsset(null);
  };
  
  // 获取面包屑导航
  const getBreadcrumbs = () => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    
    return (
      <div className="asset-breadcrumbs">
        <span 
          className="breadcrumb-item home"
          onClick={() => setCurrentPath('/')}
        >
          根目录
        </span>
        {pathSegments.map((segment, index) => {
          // 构建到此段的路径
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          
          return (
            <React.Fragment key={path}>
              <span className="breadcrumb-separator">/</span>
              <span 
                className="breadcrumb-item"
                onClick={() => setCurrentPath(path)}
              >
                {segment}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  
  // 刷新当前目录
  const handleRefresh = () => {
    loadAssets();
  };
  
  return (
    <div className="simple-asset-explorer">
      <div className="panel-header">资源</div>
      
      <div className="asset-toolbar">
        <button 
          className="asset-toolbar-btn"
          onClick={handleGoBack}
          disabled={currentPath === '/'}
          title="返回上一级"
        >
          ↑
        </button>
        {getBreadcrumbs()}
        <button 
          className="asset-toolbar-btn refresh"
          onClick={handleRefresh}
          disabled={isLoading}
          title="刷新"
        >
          ↻
        </button>
      </div>
      
      <div className="panel-content">
        {isLoading ? (
          <div className="asset-loading">加载中...</div>
        ) : error ? (
          <div className="asset-error">{error}</div>
        ) : assets.length === 0 ? (
          <div className="asset-empty">此文件夹为空</div>
        ) : (
          <div className="asset-grid">
            {assets.map(asset => (
              <div 
                key={asset.id} 
                className={`asset-item ${selectedAsset?.id === asset.id ? 'selected' : ''}`}
                onClick={() => handleAssetClick(asset)}
                onDoubleClick={() => handleAssetDoubleClick(asset)}
              >
                <div className="asset-icon" data-type={asset.type}></div>
                <div className="asset-name">{asset.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetExplorer; 