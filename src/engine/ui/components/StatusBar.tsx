import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import BugReportIcon from '@mui/icons-material/BugReport';
import InfoIcon from '@mui/icons-material/Info';
import TimerIcon from '@mui/icons-material/Timer';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

interface StatusBarProps {
  fps?: number;
  objectCount?: number;
  triangleCount?: number;
  selectedObject?: string;
  projectName?: string;
  isModified?: boolean;
  status?: string;
  onAction?: (action: string) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  fps = 60,
  objectCount = 0,
  triangleCount = 0,
  selectedObject = '',
  projectName = '未命名项目',
  isModified = false,
  status = '就绪',
  onAction,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 24,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        px: 1,
        fontSize: '0.75rem',
        color: 'text.secondary',
      }}
    >
      {/* 左侧状态区 */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="caption" component="span">
          {status}
        </Typography>
      </Box>
      
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      
      {/* 项目信息 */}
      <Tooltip title={isModified ? "文件已修改" : "文件无修改"}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isModified && (
            <FiberManualRecordIcon
              fontSize="small"
              color="primary"
              sx={{ mr: 0.5, fontSize: '0.6rem' }}
            />
          )}
          <Typography variant="caption" component="span">
            {projectName}
          </Typography>
        </Box>
      </Tooltip>
      
      <Box sx={{ flexGrow: 1 }} />
      
      {/* 中间部分 - 选中对象信息 */}
      {selectedObject && (
        <Tooltip title="当前选中对象">
          <Typography variant="caption" component="span">
            {selectedObject}
          </Typography>
        </Tooltip>
      )}
      
      <Box sx={{ flexGrow: 1 }} />
      
      {/* 右侧统计信息 */}
      <Tooltip title="场景对象数量">
        <Typography variant="caption" component="span" sx={{ mx: 1 }}>
          对象: {objectCount}
        </Typography>
      </Tooltip>
      
      <Tooltip title="场景三角形数量">
        <Typography variant="caption" component="span" sx={{ mx: 1 }}>
          三角形: {triangleCount.toLocaleString()}
        </Typography>
      </Tooltip>
      
      <Tooltip title="帧率">
        <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
          <TimerIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
          <Typography variant="caption" component="span">
            {fps} FPS
          </Typography>
        </Box>
      </Tooltip>
      
      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
      
      {/* 操作按钮 */}
      <Tooltip title="查看文档">
        <IconButton 
          size="small" 
          onClick={() => onAction && onAction('documentation')}
          sx={{ p: 0.5 }}
        >
          <InfoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="报告问题">
        <IconButton 
          size="small" 
          onClick={() => onAction && onAction('reportIssue')}
          sx={{ p: 0.5 }}
        >
          <BugReportIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="GitHub仓库">
        <IconButton 
          size="small" 
          onClick={() => onAction && onAction('github')}
          sx={{ p: 0.5 }}
        >
          <GitHubIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}; 