import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent,
  Button, 
  TextField, 
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  InputAdornment,
  styled
} from '@mui/material';
import { 
  Add as AddIcon, 
  FolderOpen as FolderOpenIcon,
  Search as SearchIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  ImportExport as ImportIcon
} from '@mui/icons-material';

// 项目信息接口
export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  scenes: string[];
  favorite?: boolean;
}

// 组件属性
interface ProjectManagerProps {
  open: boolean;
  onClose: () => void;
  onCreateProject: (name: string, path: string) => Promise<void>;
  onOpenProject: (project: ProjectInfo) => Promise<void>;
  onImportProject: (path: string) => Promise<void>;
}

// 本地存储键
const PROJECTS_STORAGE_KEY = 'vfx-editor-projects';

// 自定义样式组件
const DarkDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    borderRadius: 4,
    minWidth: 800,
    maxWidth: 1000,
    height: 600,
  }
}));

const ProjectButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#2d2d2d',
  color: '#ffffff',
  borderRadius: 4,
  textTransform: 'none',
  padding: '8px 16px',
  margin: '0 8px',
  '&:hover': {
    backgroundColor: '#3d3d3d',
  }
}));

const SearchTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#2d2d2d',
    borderRadius: 4,
    color: '#ffffff',
    '& fieldset': {
      borderColor: '#3d3d3d',
    },
    '&:hover fieldset': {
      borderColor: '#4d4d4d',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#5d5d5d',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#9e9e9e',
  },
}));

const ProjectListItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: '#2d2d2d',
  borderRadius: 4,
  marginBottom: 8,
  '&:hover': {
    backgroundColor: '#3d3d3d',
  },
}));

const ProjectManager: React.FC<ProjectManagerProps> = ({
  open,
  onClose,
  onCreateProject,
  onOpenProject,
  onImportProject
}) => {
  // 状态
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // 加载已保存的项目列表
  useEffect(() => {
    const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        // 转换日期字符串回Date对象
        const projectsWithDates = parsedProjects.map((project: any) => ({
          ...project,
          lastModified: new Date(project.lastModified),
          favorite: project.favorite || false
        }));
        setProjects(projectsWithDates);
        filterProjects(projectsWithDates, searchQuery);
      } catch (error) {
        console.error('Failed to parse saved projects:', error);
        setProjects([]);
        setFilteredProjects([]);
      }
    }
  }, []);
  
  // 保存项目列表到本地存储
  const saveProjectsList = (projectsList: ProjectInfo[]) => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectsList));
    setProjects(projectsList);
    filterProjects(projectsList, searchQuery);
  };
  
  // 筛选项目
  const filterProjects = (allProjects: ProjectInfo[], query: string) => {
    let filtered = allProjects;
    
    // 如果有搜索词，过滤项目
    if (query) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.path.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // 排序
    if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered = [...filtered].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    }
    
    // 收藏的项目排在前面
    filtered = [...filtered].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return 0;
    });
    
    setFilteredProjects(filtered);
  };
  
  // 处理搜索变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterProjects(projects, query);
  };
  
  // 切换排序方式
  const toggleSortBy = () => {
    const newSortBy = sortBy === 'date' ? 'name' : 'date';
    setSortBy(newSortBy);
    filterProjects(projects, searchQuery);
  };
  
  // 切换收藏状态
  const toggleFavorite = (projectId: string) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {...project, favorite: !project.favorite};
      }
      return project;
    });
    saveProjectsList(updatedProjects);
  };
  
  // 删除项目
  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要从列表中删除此项目吗？这不会删除项目文件。')) {
      const updatedProjects = projects.filter(p => p.id !== projectId);
      saveProjectsList(updatedProjects);
    }
  };
  
  // 处理创建新项目
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('请输入项目名称');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // 使用file picker选择目录
      const directoryHandle = await window.showDirectoryPicker({
        id: 'projectDirectory',
        startIn: 'documents',
        mode: 'readwrite'
      });
      
      // 创建项目子文件夹
      const projectFolderHandle = await directoryHandle.getDirectoryHandle(newProjectName, { create: true });
      
      // 获取选择的路径
      const path = `${directoryHandle.name}/${newProjectName}`;
      
      // 调用创建项目函数
      await onCreateProject(newProjectName, path);
      
      // 添加到项目列表
      const newProject: ProjectInfo = {
        id: Date.now().toString(),
        name: newProjectName,
        path: path,
        lastModified: new Date(),
        scenes: ['Main Scene'],
        favorite: false
      };
      
      const updatedProjects = [...projects, newProject];
      saveProjectsList(updatedProjects);
      
      // 重置状态
      setNewProjectName('');
      onClose(); // 关闭对话框
    } catch (error) {
      console.error('创建项目失败:', error);
      alert('创建项目失败: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };
  
  // 处理导入项目
  const handleImportProject = async () => {
    setIsImporting(true);
    
    try {
      // 使用file picker选择项目文件
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'VFX Editor Project',
            accept: {
              'application/json': ['.vfx', '.json']
            }
          }
        ],
        excludeAcceptAllOption: false,
        multiple: false
      });
      
      const file = await fileHandle.getFile();
      const path = await fileHandle.getFilePath();
      
      // 调用导入项目函数
      await onImportProject(path);
      
      // 添加到项目列表
      const directoryPath = path.substring(0, path.lastIndexOf('/'));
      const projectName = file.name.split('.')[0];
      
      const newProject: ProjectInfo = {
        id: Date.now().toString(),
        name: projectName,
        path: directoryPath,
        lastModified: new Date(file.lastModified),
        scenes: ['Imported Scene'], // 实际场景会在导入时确定
        favorite: false
      };
      
      const updatedProjects = [...projects, newProject];
      saveProjectsList(updatedProjects);
      
      onClose(); // 关闭对话框
    } catch (error) {
      console.error('导入项目失败:', error);
      if ((error as Error).name !== 'AbortError') {
        alert('导入项目失败: ' + (error as Error).message);
      }
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <DarkDialog open={open} onClose={onClose} maxWidth={false}>
      <DialogContent sx={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 顶部工具栏 */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          padding: 2, 
          borderBottom: '1px solid #3d3d3d'
        }}>
          <Box sx={{ display: 'flex' }}>
            <ProjectButton
              startIcon={<AddIcon />}
              onClick={() => setIsCreating(true)}
            >
              创建
            </ProjectButton>
            
            <ProjectButton
              startIcon={<FolderOpenIcon />}
              onClick={handleImportProject}
              disabled={isImporting}
            >
              导入
            </ProjectButton>
            
            <ProjectButton
              startIcon={<SearchIcon />}
            >
              扫描项目
            </ProjectButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchTextField
              placeholder="筛选项目"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9e9e9e' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button 
              sx={{ ml: 1, color: '#ffffff', textTransform: 'none' }}
              onClick={toggleSortBy}
            >
              排序：{sortBy === 'date' ? '最近编辑' : '名称'}
            </Button>
          </Box>
        </Box>
        
        {/* 创建项目表单 */}
        {isCreating && (
          <Box sx={{ 
            padding: 3, 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#2d2d2d',
            borderRadius: 1,
            margin: 2
          }}>
            <Typography variant="h6" gutterBottom>
              创建新项目
            </Typography>
            
            <TextField
              label="项目名称"
              fullWidth
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#1e1e1e',
                  color: '#ffffff',
                  '& fieldset': { borderColor: '#3d3d3d' },
                },
                '& .MuiInputLabel-root': { color: '#9e9e9e' },
              }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                sx={{ color: '#ffffff', mr: 1 }}
                onClick={() => setIsCreating(false)}
              >
                取消
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                sx={{ 
                  backgroundColor: '#444444', 
                  '&:hover': { backgroundColor: '#555555' },
                  textTransform: 'none'
                }}
              >
                创建并编辑
              </Button>
            </Box>
          </Box>
        )}
        
        {/* 项目列表 */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          padding: 2,
          backgroundColor: '#1e1e1e'
        }}>
          {filteredProjects.length > 0 ? (
            <List sx={{ width: '100%' }}>
              {filteredProjects.map(project => (
                <ProjectListItem 
                  key={project.id}
                  onClick={() => onOpenProject(project).then(() => onClose())}
                  sx={{ cursor: 'pointer' }}
                >
                  <Box sx={{ 
                    width: 60, 
                    height: 60, 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1e1e1e',
                    borderRadius: 1,
                    mr: 2 
                  }}>
                    <img 
                      src="/path/to/project-icon.png" 
                      alt="项目图标"
                      style={{ width: 40, height: 40 }}
                    />
                  </Box>
                  
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ color: '#ffffff' }}>
                        {project.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                        {project.path}
                        <br />
                        {project.lastModified.toLocaleString()}
                      </Typography>
                    }
                  />
                  
                  <Box>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(project.id);
                      }}
                      sx={{ color: '#9e9e9e' }}
                    >
                      {project.favorite ? <StarIcon sx={{ color: '#f0c04c' }} /> : <StarBorderIcon />}
                    </IconButton>
                    
                    <IconButton 
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      sx={{ color: '#9e9e9e' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ProjectListItem>
              ))}
            </List>
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%'
              }}
            >
              <Typography variant="body1" sx={{ color: '#9e9e9e' }}>
                {searchQuery ? '没有匹配的项目' : '没有最近的项目'}
              </Typography>
              
              {!searchQuery && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setIsCreating(true)}
                  sx={{ 
                    mt: 2, 
                    color: '#ffffff',
                    textTransform: 'none',
                    backgroundColor: '#2d2d2d',
                    '&:hover': { backgroundColor: '#3d3d3d' },
                  }}
                >
                  创建新项目
                </Button>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
    </DarkDialog>
  );
};

export default ProjectManager; 