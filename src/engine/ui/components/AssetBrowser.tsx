import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Collapse,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  styled
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Add as AddIcon,
  Create as CreateIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Texture as TextureIcon,
  ThreeDRotation as ModelIcon,
  MusicNote as AudioIcon,
  Close as CloseIcon,
  ViewInAr as SceneIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

// 项目服务导入
import ProjectService from '../services/ProjectService';

// 资源类型
export enum AssetType {
  FOLDER = 'folder',
  SCENE = 'scene',
  SCRIPT = 'script',
  MATERIAL = 'material',
  TEXTURE = 'texture',
  MODEL = 'model',
  AUDIO = 'audio',
  OTHER = 'other'
}

// 资源项接口
export interface AssetItem {
  id: string;
  name: string;
  path: string;
  type: AssetType;
  children?: AssetItem[];
  isExpanded?: boolean;
  metadata?: any;
}

// 组件属性
interface AssetBrowserProps {
  onAssetSelected?: (asset: AssetItem) => void;
  onAssetDoubleClick?: (asset: AssetItem) => void;
}

// 新建资源对话框属性
interface CreateAssetDialogProps {
  open: boolean;
  assetType: AssetType;
  parentPath: string;
  onClose: () => void;
  onConfirm: (name: string, type: AssetType) => void;
}

// 自定义样式组件
const AssetCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#2a2a2a',
  borderRadius: 4,
  transition: 'all 0.2s',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#3a3a3a',
    transform: 'translateY(-2px)',
  },
}));

const AssetIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: 80,
  backgroundColor: '#232323',
}));

// 新建资源对话框组件
const CreateAssetDialog: React.FC<CreateAssetDialogProps> = ({
  open,
  assetType,
  parentPath,
  onClose,
  onConfirm
}) => {
  const [assetName, setAssetName] = useState('');
  
  useEffect(() => {
    if (open) {
      // 根据资产类型设置默认名称
      let defaultName = '';
      switch (assetType) {
        case AssetType.SCENE:
          defaultName = 'NewScene';
          break;
        case AssetType.SCRIPT:
          defaultName = 'NewScript';
          break;
        case AssetType.MATERIAL:
          defaultName = 'NewMaterial';
          break;
        default:
          defaultName = 'NewAsset';
      }
      setAssetName(defaultName);
    } else {
      setAssetName('');
    }
  }, [open, assetType]);
  
  const getAssetExtension = () => {
    switch (assetType) {
      case AssetType.SCENE:
        return '.scene.json';
      case AssetType.SCRIPT:
        return '.js';
      case AssetType.MATERIAL:
        return '.material.json';
      default:
        return '';
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {`创建${assetType === AssetType.SCENE ? '场景' :
          assetType === AssetType.SCRIPT ? '脚本' :
          assetType === AssetType.MATERIAL ? '材质' : '资源'}`}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="名称"
          fullWidth
          variant="outlined"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          sx={{
            mt: 1,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
            },
            '& .MuiInputLabel-root': {
              color: '#9e9e9e',
            }
          }}
          helperText={`将在 ${parentPath} 创建 ${assetName}${getAssetExtension()}`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#9e9e9e' }}>
          取消
        </Button>
        <Button 
          onClick={() => onConfirm(assetName, assetType)}
          disabled={!assetName.trim()}
          sx={{ color: '#ffffff' }}
        >
          创建
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 主组件
const AssetBrowser: React.FC<AssetBrowserProps> = ({
  onAssetSelected,
  onAssetDoubleClick
}) => {
  // 状态
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    asset: AssetItem | null;
  } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createAssetType, setCreateAssetType] = useState<AssetType>(AssetType.SCENE);
  const [currentPath, setCurrentPath] = useState<string>('');
  
  const projectService = ProjectService.getInstance();
  
  // 在组件中使用事件监听
  useEffect(() => {
    // 订阅项目状态变化
    const handleProjectStateChange = (project: ProjectInfo | null) => {
      if (project) {
        setCurrentPath(project.path);
        loadAssets(project.path);
      } else {
        setAssets([]);
        setFilteredAssets([]);
        setCurrentPath('');
      }
    };
    
    projectService.subscribeToProjectState(handleProjectStateChange);
    
    // 清理函数
    return () => {
      projectService.unsubscribeFromProjectState(handleProjectStateChange);
    };
  }, []);
  
  // 刷新资源列表
  const loadAssets = async (path: string) => {
    if (!path) return;
    
    setIsLoading(true);
    
    try {
      // 获取文件系统目录句柄
      const dirHandle = await window.showDirectoryPicker({
        id: 'projectDirectory',
        startIn: path,
        mode: 'readwrite'
      });
      
      // 递归读取目录内容
      const assetTree = await readDirectoryContents(dirHandle, '');
      
      setAssets(assetTree);
      filterAssets(assetTree, searchQuery);
      
    } catch (error) {
      console.error('加载资源失败:', error);
      // 如果没有权限或发生错误，使用模拟数据
      const dummyAssets = createDummyAssets();
      setAssets(dummyAssets);
      filterAssets(dummyAssets, searchQuery);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 递归读取目录内容
  const readDirectoryContents = async (
    dirHandle: FileSystemDirectoryHandle,
    relativePath: string
  ): Promise<AssetItem[]> => {
    const items: AssetItem[] = [];
    
    for await (const [name, handle] of dirHandle.entries()) {
      const itemPath = relativePath ? `${relativePath}/${name}` : name;
      
      if (handle.kind === 'directory') {
        // 读取子目录 - 添加类型断言
        const children = await readDirectoryContents(handle as FileSystemDirectoryHandle, itemPath);
        
        items.push({
          id: itemPath,
          name,
          path: itemPath,
          type: AssetType.FOLDER,
          children,
          isExpanded: false
        });
      } else if (handle.kind === 'file') {
        // 确定文件类型
        const type = determineAssetType(name);
        
        items.push({
          id: itemPath,
          name,
          path: itemPath,
          type
        });
      }
    }
    
    // 按文件夹在前，文件在后排序
    return items.sort((a, b) => {
      if (a.type === AssetType.FOLDER && b.type !== AssetType.FOLDER) return -1;
      if (a.type !== AssetType.FOLDER && b.type === AssetType.FOLDER) return 1;
      return a.name.localeCompare(b.name);
    });
  };
  
  // 确定资源类型
  const determineAssetType = (fileName: string): AssetType => {
    const ext = fileName.toLowerCase().split('.').pop();
    
    if (fileName.endsWith('.scene.json')) return AssetType.SCENE;
    if (fileName.endsWith('.material.json')) return AssetType.MATERIAL;
    
    switch (ext) {
      case 'js':
      case 'ts':
        return AssetType.SCRIPT;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return AssetType.TEXTURE;
      case 'gltf':
      case 'glb':
      case 'obj':
      case 'fbx':
        return AssetType.MODEL;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return AssetType.AUDIO;
      default:
        return AssetType.OTHER;
    }
  };
  
  // 过滤资源
  const filterAssets = (allAssets: AssetItem[], query: string) => {
    if (!query) {
      setFilteredAssets([...allAssets]);
      return;
    }
    
    const filterRecursive = (items: AssetItem[]): AssetItem[] => {
      const result: AssetItem[] = [];
      
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          // 如果名称匹配，直接添加
          result.push({...item});
          continue;
        }
        
        // 如果是文件夹，检查子项
        if (item.children && item.children.length > 0) {
          const filteredChildren = filterRecursive(item.children);
          if (filteredChildren.length > 0) {
            result.push({
              ...item,
              children: filteredChildren,
              isExpanded: true
            });
          }
        }
      }
      
      return result;
    };
    
    setFilteredAssets(filterRecursive(allAssets));
  };
  
  // 处理资源选择
  const handleAssetSelect = (asset: AssetItem) => {
    setSelectedAsset(asset);
    onAssetSelected?.(asset);
  };
  
  // 处理资源双击
  const handleAssetDoubleClick = (asset: AssetItem) => {
    if (asset.type === AssetType.FOLDER) {
      // 切换文件夹展开状态
      toggleFolder(asset.id);
    } else {
      // 对于文件，触发双击事件
      onAssetDoubleClick?.(asset);
    }
  };
  
  // 切换文件夹展开状态
  const toggleFolder = (assetId: string) => {
    const toggleRecursive = (items: AssetItem[]): AssetItem[] => {
      return items.map(item => {
        if (item.id === assetId) {
          return { ...item, isExpanded: !item.isExpanded };
        }
        
        if (item.children) {
          return { ...item, children: toggleRecursive(item.children) };
        }
        
        return item;
      });
    };
    
    const updatedAssets = toggleRecursive(assets);
    setAssets(updatedAssets);
    filterAssets(updatedAssets, searchQuery);
  };
  
  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterAssets(assets, query);
  };
  
  // 切换视图模式
  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'grid' : 'list');
  };
  
  // 处理右键菜单打开
  const handleContextMenu = (
    event: React.MouseEvent,
    asset: AssetItem | null
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX,
            mouseY: event.clientY,
            asset
          }
        : null
    );
  };
  
  // 关闭右键菜单
  const handleContextMenuClose = () => {
    setContextMenu(null);
  };
  
  // 打开创建资源对话框
  const openCreateDialog = (type: AssetType) => {
    setCreateAssetType(type);
    setCreateDialogOpen(true);
    handleContextMenuClose();
  };
  
  // 处理创建资源
  const handleCreateAsset = async (name: string, type: AssetType) => {
    if (!name.trim()) return;
    
    const currentProject = projectService.getCurrentProject();
    if (!currentProject || !currentProject.path) {
      alert('请先打开项目');
      return;
    }
    
    // 构建资源路径
    const parentPath = contextMenu?.asset?.type === AssetType.FOLDER 
      ? contextMenu.asset.path 
      : '';
      
    const fullPath = `${currentProject.path}/${parentPath}`;
    
    try {
      // 获取目录句柄
      const dirHandle = await window.showDirectoryPicker({
        id: 'projectDirectory',
        startIn: fullPath
      });
      
      // 获取文件扩展名
      let fileName = name;
      switch (type) {
        case AssetType.SCENE:
          fileName = `${name}.scene.json`;
          break;
        case AssetType.SCRIPT:
          fileName = `${name}.js`;
          break;
        case AssetType.MATERIAL:
          fileName = `${name}.material.json`;
          break;
      }
      
      // 创建文件
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      
      // 写入默认内容
      let defaultContent = '';
      
      switch (type) {
        case AssetType.SCENE:
          defaultContent = JSON.stringify({
            id: name,
            name: name,
            nodes: [],
            settings: { background: '#000000' }
          }, null, 2);
          break;
        case AssetType.SCRIPT:
          defaultContent = `/**
 * ${name}
 * 
 * 脚本描述
 */

export default class ${name} {
  constructor() {
    // 初始化
  }
  
  // 更新方法 - 每帧调用
  update(deltaTime) {
    // 更新逻辑
  }
}`;
          break;
        case AssetType.MATERIAL:
          defaultContent = JSON.stringify({
            id: name,
            name: name,
            type: 'standard',
            parameters: {
              color: '#ffffff',
              metalness: 0.5,
              roughness: 0.5
            }
          }, null, 2);
          break;
      }
      
      await writable.write(defaultContent);
      await writable.close();
      
      // 刷新资源列表
      loadAssets(currentProject.path);
      
    } catch (error) {
      console.error('创建资源失败:', error);
      alert(`创建资源失败: ${(error as Error).message}`);
    } finally {
      setCreateDialogOpen(false);
    }
  };
  
  // 创建模拟资源（用于无权限时）
  const createDummyAssets = (): AssetItem[] => {
    return [
      {
        id: 'scripts',
        name: 'scripts',
        path: 'scripts',
        type: AssetType.FOLDER,
        children: [
          {
            id: 'scripts/Player.js',
            name: 'Player.js',
            path: 'scripts/Player.js',
            type: AssetType.SCRIPT
          },
          {
            id: 'scripts/Camera.js',
            name: 'Camera.js',
            path: 'scripts/Camera.js',
            type: AssetType.SCRIPT
          }
        ],
        isExpanded: false
      },
      {
        id: 'scenes',
        name: 'scenes',
        path: 'scenes',
        type: AssetType.FOLDER,
        children: [
          {
            id: 'scenes/Main.scene.json',
            name: 'Main.scene.json',
            path: 'scenes/Main.scene.json',
            type: AssetType.SCENE
          }
        ],
        isExpanded: false
      },
      {
        id: 'materials',
        name: 'materials',
        path: 'materials',
        type: AssetType.FOLDER,
        children: [
          {
            id: 'materials/Default.material.json',
            name: 'Default.material.json',
            path: 'materials/Default.material.json',
            type: AssetType.MATERIAL
          }
        ],
        isExpanded: false
      }
    ];
  };
  
  // 渲染单个资源项（树形视图）
  const renderAssetItem = (asset: AssetItem, depth = 0) => {
    const isFolder = asset.type === AssetType.FOLDER;
    
    return (
      <React.Fragment key={asset.id}>
        <ListItem
          sx={{
            pl: depth * 2 + 1,
            backgroundColor: selectedAsset?.id === asset.id ? '#3d3d3d' : 'transparent',
            '&:hover': {
              backgroundColor: '#333333',
            },
            cursor: 'pointer',
          }}
          onClick={() => handleAssetSelect(asset)}
          onDoubleClick={() => handleAssetDoubleClick(asset)}
          onContextMenu={(e) => handleContextMenu(e, asset)}
        >
          {isFolder && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(asset.id);
              }}
              sx={{ p: 0.5, mr: 1 }}
            >
              {asset.isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          )}
          <ListItemIcon sx={{ minWidth: 36 }}>
            {isFolder ? (
              <FolderIcon sx={{ color: '#e8b339' }} />
            ) : asset.type === AssetType.SCENE ? (
              <SceneIcon sx={{ color: '#42a5f5' }} />
            ) : asset.type === AssetType.SCRIPT ? (
              <CodeIcon sx={{ color: '#66bb6a' }} />
            ) : asset.type === AssetType.MATERIAL ? (
              <TextureIcon sx={{ color: '#ec407a' }} />
            ) : asset.type === AssetType.TEXTURE ? (
              <ImageIcon sx={{ color: '#ab47bc' }} />
            ) : asset.type === AssetType.MODEL ? (
              <ModelIcon sx={{ color: '#7e57c2' }} />
            ) : asset.type === AssetType.AUDIO ? (
              <AudioIcon sx={{ color: '#26a69a' }} />
            ) : (
              <FileIcon sx={{ color: '#bdbdbd' }} />
            )}
          </ListItemIcon>
          <ListItemText primary={asset.name} />
        </ListItem>
        
        {isFolder && asset.children && asset.isExpanded && (
          <Collapse in={asset.isExpanded} timeout="auto" unmountOnExit>
            {asset.children.map(child => renderAssetItem(child, depth + 1))}
          </Collapse>
        )}
      </React.Fragment>
    );
  };
  
  // 渲染网格视图中的单个资源
  const renderAssetCard = (asset: AssetItem) => {
    const isFolder = asset.type === AssetType.FOLDER;
    
    return (
      <Grid item xs={6} sm={4} md={3} key={asset.id}>
        <AssetCard
          onClick={() => handleAssetSelect(asset)}
          onDoubleClick={() => handleAssetDoubleClick(asset)}
          onContextMenu={(e) => handleContextMenu(e, asset)}
          sx={{
            border: selectedAsset?.id === asset.id ? '2px solid #0288d1' : 'none',
          }}
        >
          <AssetIcon>
            {isFolder ? (
              <FolderIcon sx={{ fontSize: 48, color: '#e8b339' }} />
            ) : asset.type === AssetType.SCENE ? (
              <SceneIcon sx={{ fontSize: 48, color: '#42a5f5' }} />
            ) : asset.type === AssetType.SCRIPT ? (
              <CodeIcon sx={{ fontSize: 48, color: '#66bb6a' }} />
            ) : asset.type === AssetType.MATERIAL ? (
              <TextureIcon sx={{ fontSize: 48, color: '#ec407a' }} />
            ) : asset.type === AssetType.TEXTURE ? (
              <ImageIcon sx={{ fontSize: 48, color: '#ab47bc' }} />
            ) : asset.type === AssetType.MODEL ? (
              <ModelIcon sx={{ fontSize: 48, color: '#7e57c2' }} />
            ) : asset.type === AssetType.AUDIO ? (
              <AudioIcon sx={{ fontSize: 48, color: '#26a69a' }} />
            ) : (
              <FileIcon sx={{ fontSize: 48, color: '#bdbdbd' }} />
            )}
          </AssetIcon>
          <CardContent sx={{ p: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                textAlign: 'center', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}
            >
              {asset.name}
            </Typography>
          </CardContent>
        </AssetCard>
      </Grid>
    );
  };
  
  // 获取上下文菜单选项
  const getContextMenuItems = () => {
    const isRootOrFolderContext = !contextMenu?.asset || contextMenu.asset.type === AssetType.FOLDER;
    
    return (
      <>
        {isRootOrFolderContext && (
          <>
            <MenuItem onClick={() => openCreateDialog(AssetType.FOLDER)}>
              <ListItemIcon>
                <FolderIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>新建文件夹</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => openCreateDialog(AssetType.SCENE)}>
              <ListItemIcon>
                <SceneIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>新建场景</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => openCreateDialog(AssetType.SCRIPT)}>
              <ListItemIcon>
                <CodeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>新建脚本</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => openCreateDialog(AssetType.MATERIAL)}>
              <ListItemIcon>
                <TextureIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>新建材质</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}
        
        {contextMenu?.asset && (
          <>
            <MenuItem onClick={handleContextMenuClose}>
              <ListItemIcon>
                <CreateIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>重命名</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleContextMenuClose}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>删除</ListItemText>
            </MenuItem>
          </>
        )}
      </>
    );
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        backgroundColor: '#1e1e1e',
        borderLeft: '1px solid #333333',
      }}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* 工具栏 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        p: 1, 
        borderBottom: '1px solid #333333',
      }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          资源
        </Typography>
        
        <Tooltip title="刷新">
          <IconButton 
            size="small" 
            onClick={() => {
              const currentProject = projectService.getCurrentProject();
              if (currentProject) {
                loadAssets(currentProject.path);
              }
            }}
            sx={{ color: '#9e9e9e' }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={showSearchBar ? "隐藏搜索" : "显示搜索"}>
          <IconButton 
            size="small" 
            onClick={() => setShowSearchBar(!showSearchBar)}
            sx={{ color: '#9e9e9e' }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={viewMode === 'list' ? "网格视图" : "列表视图"}>
          <IconButton 
            size="small" 
            onClick={toggleViewMode}
            sx={{ color: '#9e9e9e' }}
          >
            {viewMode === 'list' ? <ViewModuleIcon fontSize="small" /> : <ViewListIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="创建">
          <IconButton 
            size="small" 
            onClick={(e) => handleContextMenu(e, null)}
            sx={{ color: '#9e9e9e' }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {/* 搜索栏 */}
      <Collapse in={showSearchBar}>
        <Box sx={{ p: 1, borderBottom: '1px solid #333333' }}>
          <TextField
            fullWidth
            placeholder="搜索资源..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#9e9e9e' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchQuery('');
                      filterAssets(assets, '');
                    }}
                    sx={{ color: '#9e9e9e' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                backgroundColor: '#2a2a2a',
                borderRadius: 1,
                color: '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3d3d3d',
                }
              }
            }}
          />
        </Box>
      </Collapse>
      
      {/* 资源列表 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={24} sx={{ color: '#9e9e9e' }} />
          </Box>
        ) : filteredAssets.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? '没有匹配的资源' : '没有资源'}
            </Typography>
          </Box>
        ) : viewMode === 'list' ? (
          <List dense disablePadding>
            {filteredAssets.map(asset => renderAssetItem(asset))}
          </List>
        ) : (
          <Grid container spacing={1}>
            {filteredAssets.map(asset => renderAssetCard(asset))}
          </Grid>
        )}
      </Box>
      
      {/* 右键菜单 */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            backgroundColor: '#2d2d2d',
            color: '#ffffff',
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        {getContextMenuItems()}
      </Menu>
      
      {/* 创建资源对话框 */}
      <CreateAssetDialog
        open={createDialogOpen}
        assetType={createAssetType}
        parentPath={contextMenu?.asset?.path || ''}
        onClose={() => setCreateDialogOpen(false)}
        onConfirm={handleCreateAsset}
      />
    </Box>
  );
};

export default AssetBrowser; 