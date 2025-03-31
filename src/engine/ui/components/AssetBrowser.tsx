import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  IconButton,
  Breadcrumbs,
  Link,
  Grid,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import ImageIcon from '@mui/icons-material/Image';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import CodeIcon from '@mui/icons-material/Code';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import TextureIcon from '@mui/icons-material/Texture';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

// 资源类型
type AssetType = 'folder' | 'image' | 'model' | 'script' | 'audio' | 'texture';

// 资源项
interface Asset {
  id: string;
  name: string;
  type: AssetType;
  thumbnail?: string;
  path: string;
}

interface AssetBrowserProps {
  assets: Asset[];
  onAssetSelect?: (asset: Asset) => void;
  onAssetDrop?: (asset: Asset, targetFolder: string) => void;
  engine?: any;  // 添加引擎实例参数
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({
  assets,
  onAssetSelect,
  onAssetDrop,
  engine
}) => {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'date'>('name');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    asset: Asset | null;
  } | null>(null);

  // 获取当前路径下的资源
  const getCurrentAssets = () => {
    let filteredAssets = assets.filter(asset => {
      const assetDir = asset.path.split('/').slice(0, -1).join('/') || '/';
      return assetDir === currentPath;
    });
    
    // 如果有搜索查询，进行过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredAssets = filteredAssets.filter(asset => 
        asset.name.toLowerCase().includes(query)
      );
    }
    
    // 排序
    filteredAssets.sort((a, b) => {
      // 文件夹总是排在前面
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      
      // 根据排序条件
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    
    return filteredAssets;
  };

  // 渲染面包屑导航
  const renderBreadcrumbs = () => {
    const paths = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [
      <Link
        key="home"
        underline="hover"
        color="inherit"
        sx={{ display: 'flex', alignItems: 'center' }}
        onClick={() => setCurrentPath('/')}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
        资源
      </Link>
    ];
    
    let currentBuildPath = '';
    paths.forEach((path, index) => {
      currentBuildPath += `/${path}`;
      const pathToNavigate = currentBuildPath;
      breadcrumbs.push(
        <Link
          key={pathToNavigate}
          underline="hover"
          color="inherit"
          onClick={() => setCurrentPath(pathToNavigate)}
        >
          {path}
        </Link>
      );
    });
    
    return (
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 1 }}
      >
        {breadcrumbs}
      </Breadcrumbs>
    );
  };

  // 添加资源加载处理函数
  const handleAssetLoad = async (asset: Asset) => {
    if (!engine) return;
    
    try {
      // 根据资源类型处理
      if (asset.type === 'model') {
        // 使用Three.js加载模型
        const activeScene = engine.getScene(engine.getActiveSceneName());
        if (activeScene) {
          // 这里应该实现模型加载逻辑
          addLog({
            id: Date.now().toString(),
            timestamp: new Date(),
            message: `正在加载模型: ${asset.name}`,
            severity: 'info',
            source: '资源'
          });
        }
      } else if (asset.type === 'texture') {
        // 加载纹理资源
        // 实现纹理加载逻辑
      }
      // 处理其他资源类型...
      
      onAssetSelect && onAssetSelect(asset);
    } catch (error) {
      console.error(`加载资源 ${asset.name} 失败:`, error);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `加载资源失败: ${asset.name}`,
        severity: 'error',
        source: '资源'
      });
    }
  };

  // 修改资源点击处理函数
  const handleAssetClick = (asset: Asset) => {
    if (asset.type === 'folder') {
      // 导航到文件夹
      setCurrentPath(asset.path);
    } else {
      // 选择并加载资源
      handleAssetLoad(asset);
    }
  };

  // 处理上一级目录
  const handleGoUp = () => {
    if (currentPath === '/') return;
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    setCurrentPath(`/${pathParts.join('/')}`);
  };

  // 处理上下文菜单打开
  const handleContextMenu = (event: React.MouseEvent, asset: Asset) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      asset
    });
  };

  // 处理上下文菜单关闭
  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  // 获取资源图标
  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'folder':
        return <FolderIcon />;
      case 'image':
        return <ImageIcon />;
      case 'model':
        return <ModelTrainingIcon />;
      case 'script':
        return <CodeIcon />;
      case 'audio':
        return <AudioFileIcon />;
      case 'texture':
        return <TextureIcon />;
      default:
        return <FolderIcon />;
    }
  };

  // 渲染网格视图
  const renderGridView = () => {
    const currentAssets = getCurrentAssets();
    
    return (
      <Grid container spacing={1}>
        {currentAssets.map((asset) => (
          <Grid item xs={3} key={asset.id}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 1,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }}
              onClick={() => handleAssetClick(asset)}
              onContextMenu={(e) => handleContextMenu(e, asset)}
            >
              <Box sx={{ fontSize: 40, color: 'primary.main' }}>
                {getAssetIcon(asset.type)}
              </Box>
              <Typography 
                variant="caption" 
                align="center" 
                noWrap 
                sx={{ width: '100%' }}
              >
                {asset.name}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  };

  // 渲染列表视图
  const renderListView = () => {
    const currentAssets = getCurrentAssets();
    
    return (
      <List dense>
        {currentAssets.map((asset) => (
          <ListItem 
            key={asset.id}
            disablePadding
            onContextMenu={(e) => handleContextMenu(e, asset)}
          >
            <ListItemButton onClick={() => handleAssetClick(asset)}>
              <ListItemIcon>
                {getAssetIcon(asset.type)}
              </ListItemIcon>
              <ListItemText primary={asset.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Typography variant="subtitle2">资源浏览器</Typography>
        
        <Box sx={{ mt: 1, mb: 1 }}>
          <TextField
            placeholder="搜索资源..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            size="small" 
            onClick={handleGoUp}
            disabled={currentPath === '/'}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ ml: 1, flexGrow: 1, overflow: 'hidden' }}>
            {renderBreadcrumbs()}
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {view === 'grid' ? renderGridView() : renderListView()}
      </Box>
      
      <Menu
        open={!!contextMenu}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleContextMenuClose}>复制</MenuItem>
        <MenuItem onClick={handleContextMenuClose}>重命名</MenuItem>
        <MenuItem onClick={handleContextMenuClose}>删除</MenuItem>
      </Menu>
    </Box>
  );
};

// 示例数据 - 实际使用时将根据项目文件结构生成
export const exampleAssets: Asset[] = [
  { id: 'folder1', name: '模型', type: 'folder', path: '/模型' },
  { id: 'folder2', name: '纹理', type: 'folder', path: '/纹理' },
  { id: 'folder3', name: '脚本', type: 'folder', path: '/脚本' },
  { id: 'folder4', name: '音频', type: 'folder', path: '/音频' },
  { id: 'texture1', name: 'brick.jpg', type: 'texture', path: '/纹理/brick.jpg' },
  { id: 'texture2', name: 'metal.jpg', type: 'texture', path: '/纹理/metal.jpg' },
  { id: 'texture3', name: 'wood.jpg', type: 'texture', path: '/纹理/wood.jpg' },
  { id: 'model1', name: 'cube.glb', type: 'model', path: '/模型/cube.glb' },
  { id: 'model2', name: 'sphere.glb', type: 'model', path: '/模型/sphere.glb' },
  { id: 'script1', name: 'controller.ts', type: 'script', path: '/脚本/controller.ts' },
  { id: 'audio1', name: 'background.mp3', type: 'audio', path: '/音频/background.mp3' },
]; 