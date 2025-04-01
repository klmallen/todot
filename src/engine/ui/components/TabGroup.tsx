import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// 定义标签类型
export interface TabItem {
  id: string;
  title: string;
  content: React.ReactNode;
  locked?: boolean;
}

// 定义标签组属性
export interface TabGroupProps {
  id: string;
  tabs: TabItem[];
  activeTabId: string;
  size?: number;
  region: 'left' | 'right' | 'bottom';
  onActiveTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabDragStart: (tabId: string, groupId: string) => void;
  onTabDrop: (targetGroupId: string, dragData: any) => void;
  onResize: (newSize: number) => void;
}

// 拖拽数据类型
interface DragData {
  tabId: string;
  sourceGroupId: string;
}

const TabGroup: React.FC<TabGroupProps> = ({
  id: groupId,
  tabs,
  activeTabId,
  size = 250,
  region,
  onActiveTabChange,
  onTabClose,
  onTabDragStart,
  onTabDrop,
  onResize
}) => {
  // 标签组拖拽状态
  const [isDragOver, setIsDragOver] = useState(false);
  // 是否正在调整大小
  const [isResizing, setIsResizing] = useState(false);
  
  // 获取活动标签的内容
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  
  // 处理标签拖拽开始
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    // 检查是否是锁定的标签
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.locked) {
      e.preventDefault();
      return;
    }
    
    // 设置拖拽数据
    const dragData = { tabId, sourceGroupId: groupId };
    e.dataTransfer.setData('application/tab-data', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    // 设置拖拽视觉效果
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
      e.currentTarget.classList.add('dragging');
    }
    
    // 通知父组件
    onTabDragStart(tabId, groupId);
    
    console.log(`开始拖拽标签: ${tabId} 从组: ${groupId}`);
  };
  
  // 处理标签拖拽结束
  const handleDragEnd = (e: React.DragEvent) => {
    // 清除拖拽视觉效果
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.classList.remove('dragging');
    }
    
    console.log(`结束拖拽标签`);
  };
  
  // 处理标签组拖拽悬停
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };
  
  // 处理标签组拖拽离开
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  
  // 处理标签组拖拽放置
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    console.log(`拖放到组: ${groupId}`);
    
    // 尝试获取拖拽数据
    try {
      const dataStr = e.dataTransfer.getData('application/tab-data');
      const dragData = JSON.parse(dataStr);
      
      // 确认是有效的拖拽数据
      if (dragData && dragData.tabId && dragData.sourceGroupId) {
        // 如果不是同一组，则处理拖放
        if (dragData.sourceGroupId !== groupId) {
          onTabDrop(groupId, dragData);
        }
      }
    } catch (err) {
      console.error('解析拖拽数据失败:', err);
    }
  };
  
  // 处理单个标签的拖拽悬停
  const handleTabDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // 添加视觉提示
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.borderLeft = '3px solid #1976d2';
    }
  };
  
  // 处理单个标签的拖拽离开
  const handleTabDragLeave = (e: React.DragEvent) => {
    // 移除视觉提示
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.borderLeft = '';
    }
  };
  
  // 处理单个标签的拖拽放置
  const handleTabDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 移除视觉提示
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.borderLeft = '';
    }
    
    // 委托给标签组的拖放处理
    handleDrop(e);
  };
  
  // 处理尺寸调整
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const startPosition = region === 'bottom' ? e.clientY : e.clientX;
    const startSize = size;
    const isLeft = region === 'left';
    const isBottom = region === 'bottom';
    
    // 设置正在调整大小状态
    setIsResizing(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      
      const currentPosition = isBottom ? moveEvent.clientY : moveEvent.clientX;
      let delta = currentPosition - startPosition;
      
      // 根据区域调整增量方向 - 修复左右方向
      if (isLeft) {
        // 左侧区域：向右拖动增加宽度，向左减少宽度
        delta = delta; // 正确方向，不需要取反
      } else if (region === 'right') {
        // 右侧区域：向左拖动增加宽度，向右减少宽度
        delta = -delta; // 取反
      }
      
      if (isBottom) {
        // 底部区域：向上拖动增加高度，向下减少高度
        delta = -delta;
      }
      
      const newSize = Math.max(100, startSize + delta);
      onResize(newSize);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  useEffect(() => {
    // 检查活动标签的内容
    const activeTabContent = activeTab?.content;
    console.log(`组 ${groupId} 活动标签 ${activeTabId} 内容:`, activeTabContent);
  }, [activeTab, activeTabId, groupId]);
  
  return (
    <Box
      className={`tab-group ${isDragOver ? 'drag-over' : ''} ${isResizing ? 'resizing' : ''}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: region === 'bottom' ? '100%' : size,
        height: region === 'bottom' ? size : '100%',
        position: 'relative',
        borderRight: region === 'left' ? '1px solid rgba(255, 255, 255, 0.12)' : undefined,
        borderLeft: region === 'right' ? '1px solid rgba(255, 255, 255, 0.12)' : undefined,
        borderTop: region === 'bottom' ? '1px solid rgba(255, 255, 255, 0.12)' : undefined,
        transition: isResizing ? 'none' : 'box-shadow 0.2s, background-color 0.2s',
        ...(isDragOver ? {
          boxShadow: 'inset 0 0 0 2px #1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.05)'
        } : {})
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 标签栏 */}
      <Box
        className="tab-bar"
        sx={{
          display: 'flex',
          overflow: 'auto',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          bgcolor: 'background.paper',
          '&::-webkit-scrollbar': {
            height: 6
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 3
          }
        }}
      >
        {tabs.map(tab => (
          <Box
            key={tab.id}
            className={`tab-item ${activeTabId === tab.id ? 'active' : ''}`}
            draggable={!tab.locked}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              cursor: tab.locked ? 'default' : 'grab',
              bgcolor: activeTabId === tab.id ? 'action.selected' : 'transparent',
              borderBottom: activeTabId === tab.id ? '2px solid #1976d2' : 'none',
              borderLeft: '3px solid transparent', // 用于拖拽提示
              whiteSpace: 'nowrap',
              minWidth: '100px',  // 确保标签有最小宽度
              '&:hover': {
                bgcolor: 'action.hover',
                '& .tab-actions': { visibility: 'visible' }
              },
              '&.active': {
                color: 'primary.main'
              },
              '&:active': {
                cursor: tab.locked ? 'default' : 'grabbing'
              },
              // 增强拖拽时的视觉反馈
              '&.dragging': {
                opacity: 0.5,
                boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)'
              }
            }}
            onDragStart={e => handleDragStart(e, tab.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleTabDragOver}
            onDragLeave={handleTabDragLeave}
            onDrop={handleTabDrop}
            onClick={() => onActiveTabChange(tab.id)}
          >
            {/* 拖动手柄 */}
            {!tab.locked && (
              <Box
                className="drag-handle"
                sx={{
                  mr: 1,
                  opacity: 0.6,
                  '&:hover': { opacity: 1 }
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M3,15V13H5V15H3M3,11V9H5V11H3M7,15V13H9V15H7M7,11V9H9V11H7M11,15V13H13V15H11M11,11V9H13V11H11M15,15V13H17V15H15M15,11V9H17V11H15M19,15V13H21V15H19M19,11V9H21V11H19Z"
                  />
                </svg>
              </Box>
            )}
            
            {/* 标签标题 */}
            <Typography variant="body2" noWrap sx={{ flex: 1 }}>
              {tab.title}
            </Typography>
            
            {/* 关闭按钮 */}
            {!tab.locked && (
              <Box
                className="tab-actions"
                sx={{
                  ml: 1,
                  visibility: 'hidden',
                  display: 'flex'
                }}
              >
                <IconButton
                  size="small"
                  sx={{ padding: 0.5 }}
                  onClick={e => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        ))}
      </Box>
      
      {/* 标签内容 */}
      <Box
        className="tab-content"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          position: 'relative',
          height: '100%',
          minHeight: 0, // 确保flex子项不会溢出
        }}
      >
        {activeTab && activeTab.content ? (
          // 确保内容能正确显示
          <Box sx={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            minHeight: 0 // 确保flex子项不会溢出
          }}>
            {activeTab.content}
          </Box>
        ) : (
          <Box sx={{ p: 2, color: 'text.secondary' }}>
            找不到内容：{activeTabId}
          </Box>
        )}
      </Box>
      
      {/* 调整大小的手柄 - 增强视觉效果 */}
      {region !== 'bottom' ? (
        <Box
          className="resize-handle horizontal"
          sx={{
            position: 'absolute',
            [region === 'left' ? 'right' : 'left']: -3,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'col-resize',
            zIndex: 10,
            // 移除默认的小蓝点，只在悬停时显示
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 2,
              height: '60%',
              // 初始状态下几乎不可见
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              transition: 'background-color 0.2s'
            },
            '&:hover::after': {
              backgroundColor: '#1976d2'
            },
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)'
            }
          }}
          onMouseDown={handleResizeStart}
        />
      ) : (
        <Box
          className="resize-handle vertical"
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: -3,
            height: 6,
            cursor: 'row-resize',
            zIndex: 10,
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              height: 2,
              width: '60%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transition: 'background-color 0.2s'
            },
            '&:hover::after': {
              backgroundColor: '#1976d2'
            },
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.1)'
            }
          }}
          onMouseDown={handleResizeStart}
        />
      )}
    </Box>
  );
};

export default TabGroup; 