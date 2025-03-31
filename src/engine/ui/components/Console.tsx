import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  InputAdornment,
  Tooltip,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import FilterListIcon from '@mui/icons-material/FilterList';
import SettingsIcon from '@mui/icons-material/Settings';

// 日志条目类型
export type LogSeverity = 'info' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  severity: LogSeverity;
  details?: string;
  source?: string;
}

// 日志过滤器
interface LogFilter {
  severity: LogSeverity | 'all';
  source?: string;
  search?: string;
}

interface ConsoleProps {
  logs: LogEntry[];
  onClear?: () => void;
  onExecuteCommand?: (command: string) => void;
  onFilterChange?: (filter: LogFilter) => void;
}

export const Console: React.FC<ConsoleProps> = ({
  logs = [],
  onClear,
  onExecuteCommand,
  onFilterChange,
}) => {
  const [command, setCommand] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [filter, setFilter] = useState<LogFilter>({ severity: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // 自动滚动到最新日志
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  // 处理命令提交
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() === '') return;
    
    onExecuteCommand && onExecuteCommand(command);
    
    // 添加到命令历史
    commandHistoryRef.current = [command, ...commandHistoryRef.current.slice(0, 19)];
    setHistoryIndex(-1);
    setCommand('');
  };
  
  // 处理键盘导航历史命令
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, commandHistoryRef.current.length - 1);
      setHistoryIndex(newIndex);
      if (newIndex >= 0 && newIndex < commandHistoryRef.current.length) {
        setCommand(commandHistoryRef.current[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        setCommand(commandHistoryRef.current[newIndex]);
      } else {
        setCommand('');
      }
    }
  };
  
  // 处理过滤器变更
  const handleFilterChange = (newFilter: Partial<LogFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    onFilterChange && onFilterChange(updatedFilter);
  };
  
  // 过滤日志
  const getFilteredLogs = () => {
    return logs.filter(log => {
      // 按严重性过滤
      if (filter.severity !== 'all' && log.severity !== filter.severity) {
        return false;
      }
      
      // 按源过滤
      if (filter.source && log.source !== filter.source) {
        return false;
      }
      
      // 按搜索文本过滤
      if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };
  
  // 获取日志图标
  const getLogIcon = (severity: LogSeverity) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'info':
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };
  
  // 格式化时间戳
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // 渲染日志项
  const renderLogItem = (log: LogEntry) => {
    return (
      <ListItem 
        key={log.id}
        sx={{ 
          py: 0.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
        }}
      >
        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
          {getLogIcon(log.severity)}
        </Box>
        <Box sx={{ color: 'text.secondary', mr: 1, fontSize: '0.75rem' }}>
          {formatTimestamp(log.timestamp)}
        </Box>
        {log.source && (
          <Chip 
            label={log.source} 
            size="small" 
            sx={{ mr: 1, height: 20, fontSize: '0.7rem' }} 
          />
        )}
        <Box sx={{ flexGrow: 1, wordBreak: 'break-word' }}>
          {log.message}
        </Box>
      </ListItem>
    );
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 1, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)', 
        display: 'flex',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>控制台</Typography>
        <Tooltip title="过滤器">
          <IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="清空控制台">
          <IconButton size="small" onClick={onClear}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {showFilters && (
        <Box sx={{ p: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
          <Tabs 
            value={filter.severity === 'all' ? 0 : 
                  filter.severity === 'info' ? 1 : 
                  filter.severity === 'warning' ? 2 : 3}
            onChange={(_, newValue) => {
              const severityMap: Record<number, LogSeverity | 'all'> = {
                0: 'all',
                1: 'info',
                2: 'warning',
                3: 'error'
              };
              handleFilterChange({ severity: severityMap[newValue] });
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 0 }}
          >
            <Tab label="全部" sx={{ minHeight: 0, py: 1 }} />
            <Tab label="信息" sx={{ minHeight: 0, py: 1 }} />
            <Tab label="警告" sx={{ minHeight: 0, py: 1 }} />
            <Tab label="错误" sx={{ minHeight: 0, py: 1 }} />
          </Tabs>
          
          <TextField
            placeholder="搜索日志..."
            size="small"
            fullWidth
            margin="dense"
            value={filter.search || ''}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
          />
        </Box>
      )}
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: 'rgba(0, 0, 0, 0.2)' }}>
        <List disablePadding>
          {getFilteredLogs().map(renderLogItem)}
          <div ref={logsEndRef} />
        </List>
      </Box>
      
      <Box component="form" onSubmit={handleCommandSubmit} sx={{ p: 1 }}>
        <TextField
          placeholder="输入命令..."
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          fullWidth
          autoComplete="off"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  edge="end" 
                  type="submit"
                  disabled={command.trim() === ''}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

// 示例数据
export const exampleLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5000),
    message: '编辑器已初始化',
    severity: 'info',
    source: '系统'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 4000),
    message: '场景已加载',
    severity: 'info',
    source: '场景'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 3000),
    message: '纹理加载失败: brick.jpg',
    severity: 'warning',
    source: '资源'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 2000),
    message: '无法连接到WebRTC服务器',
    severity: 'error',
    source: '网络'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000),
    message: '用户脚本抛出未处理异常',
    severity: 'error',
    source: '脚本',
    details: 'TypeError: Cannot read property "position" of undefined'
  }
]; 