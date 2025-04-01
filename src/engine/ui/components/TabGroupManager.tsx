import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import TabGroup, { TabItem } from './TabGroup';

// TabGroup数据类型
export interface TabGroupData {
  id: string;
  tabs: TabItem[];
  activeTabId: string;
  size?: number;
  region: 'left' | 'right' | 'bottom';
}

// Props类型
interface TabGroupManagerProps {
  initialGroups: TabGroupData[];
  renderTabContent: (tabId: string) => React.ReactNode;
  centerContent?: React.ReactNode;
}

// 拖拽数据类型
interface DragState {
  tabId: string;
  sourceGroupId: string;
  isDragging: boolean;
}

const TabGroupManager: React.FC<TabGroupManagerProps> = ({
  initialGroups,
  renderTabContent,
  centerContent
}) => {
  // 定义标签组状态
  const [groups, setGroups] = useState<TabGroupData[]>(() => {
    // 确保每个tab都有content
    return initialGroups.map(group => ({
      ...group,
      tabs: group.tabs.map(tab => ({
        ...tab,
        content: renderTabContent(tab.id)
      }))
    }));
  });
  
  // 拖拽状态
  const [dragState, setDragState] = useState<DragState | null>(null);
  
  // 当渲染函数变化时，更新所有标签的内容
  useEffect(() => {
    setGroups(prev => prev.map(group => ({
      ...group,
      tabs: group.tabs.map(tab => ({
        ...tab,
        content: renderTabContent(tab.id)
      }))
    })));
  }, [renderTabContent]);
  
  // 处理标签激活
  const handleActiveTabChange = (groupId: string, tabId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId
        ? { ...group, activeTabId: tabId }
        : group
    ));
  };
  
  // 处理标签关闭
  const handleTabClose = (groupId: string, tabId: string) => {
    setGroups(prev => {
      // 找到要关闭标签的组
      const targetGroup = prev.find(g => g.id === groupId);
      
      // 如果找不到组或组中没有这个标签，不做任何改变
      if (!targetGroup || !targetGroup.tabs.find(t => t.id === tabId)) {
        return prev;
      }
      
      // 移除标签并更新组
      const updatedGroups = prev.map(group => {
        if (group.id === groupId) {
          // 移除标签
          const updatedTabs = group.tabs.filter(t => t.id !== tabId);
          
          // 如果组为空，稍后会过滤掉
          if (updatedTabs.length === 0) {
            return group;
          }
          
          // 如果关闭的是活动标签，选择新的活动标签
          let newActiveTabId = group.activeTabId;
          if (newActiveTabId === tabId && updatedTabs.length > 0) {
            newActiveTabId = updatedTabs[0].id;
          }
          
          return {
            ...group,
            tabs: updatedTabs,
            activeTabId: newActiveTabId
          };
        }
        return group;
      });
      
      // 过滤掉没有标签的组
      return updatedGroups.filter(group => group.tabs.length > 0);
    });
  };
  
  // 处理标签拖拽开始
  const handleTabDragStart = (tabId: string, groupId: string) => {
    setDragState({ tabId, sourceGroupId: groupId, isDragging: true });
  };
  
  // 处理标签放置
  const handleTabDrop = (targetGroupId: string, dragData: any) => {
    const { tabId, sourceGroupId } = dragData;
    
    // 如果是同一个组，不处理
    if (sourceGroupId === targetGroupId) {
      return;
    }
    
    setGroups(prev => {
      // 找到源组和目标组
      const sourceGroup = prev.find(g => g.id === sourceGroupId);
      
      // 如果找不到源组，不做任何改变
      if (!sourceGroup) {
        return prev;
      }
      
      // 找到要移动的标签
      const tabToMove = sourceGroup.tabs.find(t => t.id === tabId);
      
      // 如果找不到标签，不做任何改变
      if (!tabToMove) {
        return prev;
      }
      
      // 标签是否锁定
      if (tabToMove.locked) {
        return prev;
      }
      
      // 克隆标签，避免引用问题
      const clonedTab = { ...tabToMove };
      
      // 更新所有组
      const updatedGroups = prev.map(group => {
        if (group.id === sourceGroupId) {
          // 从源组移除标签
          const updatedTabs = group.tabs.filter(t => t.id !== tabId);
          
          // 如果组为空，稍后会过滤掉
          if (updatedTabs.length === 0) {
            return group;
          }
          
          // 如果移除的是活动标签，选择新的活动标签
          let newActiveTabId = group.activeTabId;
          if (newActiveTabId === tabId && updatedTabs.length > 0) {
            newActiveTabId = updatedTabs[0].id;
          }
          
          return {
            ...group,
            tabs: updatedTabs,
            activeTabId: newActiveTabId
          };
        }
        
        if (group.id === targetGroupId) {
          // 添加到目标组
          return {
            ...group,
            tabs: [...group.tabs, clonedTab],
            activeTabId: tabId // 设置为活动标签
          };
        }
        
        return group;
      });
      
      // 过滤掉没有标签的组
      return updatedGroups.filter(group => group.tabs.length > 0);
    });
    
    // 重置拖拽状态
    setDragState(null);
  };
  
  // 处理组尺寸调整
  const handleGroupResize = (groupId: string, newSize: number) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId
        ? { ...group, size: Math.max(100, newSize) }
        : group
    ));
  };
  
  // 渲染指定区域的组
  const renderRegion = (region: 'left' | 'right' | 'bottom') => {
    const regionGroups = groups.filter(g => g.region === region);
    
    return regionGroups.map(group => (
      <TabGroup
        key={group.id}
        id={group.id}
        tabs={group.tabs}
        activeTabId={group.activeTabId}
        size={group.size}
        region={region}
        onActiveTabChange={tabId => handleActiveTabChange(group.id, tabId)}
        onTabClose={tabId => handleTabClose(group.id, tabId)}
        onTabDragStart={handleTabDragStart}
        onTabDrop={handleTabDrop}
        onResize={newSize => handleGroupResize(group.id, newSize)}
      />
    ));
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* 主内容区域（左、中、右） */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }}
      >
        {/* 左侧区域 */}
        <Box sx={{ display: 'flex', flexDirection: 'column',  }}>
          {renderRegion('left')}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {renderRegion('right')}
        </Box>
        
        {/* 中间区域 - 现在使用传入的centerContent */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'background.default',
            position: 'relative'
          }}
        >
          {centerContent}
        </Box>
        
        {/* 右侧区域 */}
        
      </Box>
      
      {/* 底部区域 */}
      <Box sx={{ display: 'flex' }}>
        {renderRegion('bottom')}
      </Box>
    </Box>
  );
};

export default TabGroupManager; 