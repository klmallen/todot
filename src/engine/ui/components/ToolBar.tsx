import React, { useState } from 'react';
import {
  Box,
  Divider,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SaveIcon from '@mui/icons-material/Save';
import CubeIcon from '@mui/icons-material/Save';
import SphereIcon from '@mui/icons-material/SportsBaseball';
import CylinderIcon from '@mui/icons-material/RadioButtonChecked';
import PlaneIcon from '@mui/icons-material/Straighten';
import MoveIcon from '@mui/icons-material/OpenWith';
import RotateIcon from '@mui/icons-material/RotateRight';
import ScaleIcon from '@mui/icons-material/ZoomOutMap';
import LightIcon from '@mui/icons-material/Lightbulb';
import CameraIcon from '@mui/icons-material/CameraAlt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import GridOnIcon from '@mui/icons-material/GridOn';
import ViewInArIcon from '@mui/icons-material/ViewInAr';

// 工具类型
type ToolType = 'select' | 'move' | 'rotate' | 'scale' | 'cube' | 'sphere' | 'cylinder' | 'plane' | 'light' | 'camera';

// 视图模式
type ViewMode = 'perspective' | 'orthographic' | 'wireframe' | 'textured' | 'shaded';

interface ToolBarProps {
  onToolSelect?: (tool: ToolType) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onAction?: (action: string) => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  onToolSelect,
  onViewModeChange,
  onAction,
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [viewMode, setViewMode] = useState<ViewMode>('perspective');
  const [transformMode, setTransformMode] = useState<'local' | 'world' | 'parent'>('local');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // 处理工具选择
  const handleToolChange = (
    event: React.MouseEvent<HTMLElement>,
    newTool: ToolType | null,
  ) => {
    if (newTool !== null) {
      setSelectedTool(newTool);
      onToolSelect && onToolSelect(newTool);
    }
  };

  // 处理视图模式变更
  const handleViewModeChange = (event: SelectChangeEvent) => {
    const mode = event.target.value as ViewMode;
    setViewMode(mode);
    onViewModeChange && onViewModeChange(mode);
  };

  // 处理变换坐标系变更
  const handleTransformModeChange = (event: SelectChangeEvent) => {
    setTransformMode(event.target.value as 'local' | 'world' | 'parent');
  };

  // 处理播放/停止
  const handlePlayStop = () => {
    setIsPlaying(!isPlaying);
    onAction && onAction(isPlaying ? 'stop' : 'play');
  };

  // 处理网格显示切换
  const handleGridToggle = () => {
    setShowGrid(!showGrid);
    onAction && onAction(showGrid ? 'hideGrid' : 'showGrid');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        p: 0.5,
      }}
    >
      {/* 基础操作工具 */}
      <Tooltip title="撤销 (Ctrl+Z)">
        <IconButton size="small" onClick={() => onAction && onAction('undo')}>
          <UndoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="重做 (Ctrl+Y)">
        <IconButton size="small" onClick={() => onAction && onAction('redo')}>
          <RedoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="保存 (Ctrl+S)">
        <IconButton size="small" onClick={() => onAction && onAction('save')}>
          <SaveIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* 变换工具 */}
      <ToggleButtonGroup
        size="small"
        value={selectedTool}
        exclusive
        onChange={handleToolChange}
        aria-label="变换工具"
      >
        <ToggleButton value="move" aria-label="移动工具">
          <Tooltip title="移动 (W)">
            <MoveIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="rotate" aria-label="旋转工具">
          <Tooltip title="旋转 (E)">
            <RotateIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="scale" aria-label="缩放工具">
          <Tooltip title="缩放 (R)">
            <ScaleIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ mx: 1 }}>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={transformMode}
            onChange={handleTransformModeChange}
            displayEmpty
            inputProps={{ 'aria-label': '变换坐标系' }}
            variant="outlined"
            sx={{ height: 28 }}
          >
            <MenuItem value="local">局部</MenuItem>
            <MenuItem value="world">世界</MenuItem>
            <MenuItem value="parent">父级</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* 创建工具 */}
      <ToggleButtonGroup
        size="small"
        value={selectedTool}
        exclusive
        onChange={handleToolChange}
        aria-label="创建工具"
      >
        <ToggleButton value="cube" aria-label="立方体工具">
          <Tooltip title="立方体">
            <CubeIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="sphere" aria-label="球体工具">
          <Tooltip title="球体">
            <SphereIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="cylinder" aria-label="圆柱体工具">
          <Tooltip title="圆柱体">
            <CylinderIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="plane" aria-label="平面工具">
          <Tooltip title="平面">
            <PlaneIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="light" aria-label="灯光工具">
          <Tooltip title="灯光">
            <LightIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="camera" aria-label="相机工具">
          <Tooltip title="相机">
            <CameraIcon fontSize="small" />
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* 视图设置 */}
      <Box sx={{ mx: 1 }}>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <Select
            value={viewMode}
            onChange={handleViewModeChange}
            displayEmpty
            inputProps={{ 'aria-label': '视图模式' }}
            variant="outlined"
            sx={{ height: 28 }}
          >
            <MenuItem value="perspective">透视</MenuItem>
            <MenuItem value="orthographic">正交</MenuItem>
            <MenuItem value="wireframe">线框</MenuItem>
            <MenuItem value="textured">纹理</MenuItem>
            <MenuItem value="shaded">着色</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Tooltip title={showGrid ? "隐藏网格" : "显示网格"}>
        <IconButton 
          size="small" 
          onClick={handleGridToggle}
          color={showGrid ? "primary" : "default"}
        >
          <GridOnIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      {/* 播放控制 */}
      <Tooltip title={isPlaying ? "停止 (Shift+F5)" : "运行 (F5)"}>
        <IconButton 
          size="small" 
          onClick={handlePlayStop}
          color={isPlaying ? "error" : "primary"}
        >
          {isPlaying ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}; 