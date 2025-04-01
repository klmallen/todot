import React, { useState, useEffect } from 'react';
import {
  Box,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  styled
} from '@mui/material';
import {
  Close as CloseIcon,
  Code as CodeIcon,
  Texture as TextureIcon
} from '@mui/icons-material';

import ScriptEditor from './ScriptEditor';
import MaterialEditor from './MaterialEditor';
import { AssetItem, AssetType } from '../AssetBrowser';

// 标签页样式
const EditorTab = styled(Tab)(({ theme }) => ({
  minWidth: 100,
  maxWidth: 180,
  height: 36,
  color: '#bbbbbb',
  fontSize: '0.75rem',
  textTransform: 'none',
  backgroundColor: '#252525',
  borderRight: '1px solid #333',
  borderRadius: 0,
  '&.Mui-selected': {
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
  }
}));

// 编辑器类型
export enum EditorType {
  SCRIPT = 'script',
  MATERIAL = 'material',
  SCENE = 'scene'
}

// 打开的文件标签
interface EditorTab {
  id: string;
  title: string;
  asset: AssetItem;
  type: EditorType;
  isDirty: boolean;
}

// 组件属性
interface TabEditorProps {
  onSave?: (asset: AssetItem, content: string) => Promise<void>;
}

const TabEditor: React.FC<TabEditorProps> = ({ onSave }) => {
  // 状态
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  
  // 获取当前活动标签
  const activeTab = tabs.find(tab => tab.id === activeTabId) || null;
  
  // 打开文件
  const openFile = async (asset: AssetItem) => {
    // 检查是否已经打开
    const existingTab = tabs.find(tab => tab.asset.id === asset.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }
    
    // 确定编辑器类型
    let editorType: EditorType;
    switch (asset.type) {
      case AssetType.SCRIPT:
        editorType = EditorType.SCRIPT;
        break;
      case AssetType.MATERIAL:
        editorType = EditorType.MATERIAL;
        break;
      case AssetType.SCENE:
        editorType = EditorType.SCENE;
        break;
      default:
        alert('不支持的文件类型');
        return;
    }
    
    try {
      // 读取文件内容
      const fileContent = await readFileContent(asset.path);
      
      // 创建新标签
      const newTab: EditorTab = {
        id: `tab-${Date.now()}`,
        title: asset.name,
        asset,
        type: editorType,
        isDirty: false
      };
      
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
      setEditorContent(fileContent);
      
    } catch (error) {
      console.error('打开文件失败:', error);
      alert(`打开文件失败: ${(error as Error).message}`);
    }
  };
  
  // 模拟读取文件内容
  const readFileContent = async (path: string): Promise<string> => {
    // 实际项目中，这里应该使用File System Access API读取文件
    // 这里简单模拟一些内容
    if (path.endsWith('.js')) {
      return `/**
 * 脚本示例
 */
export default class MyScript {
  constructor() {
    // 初始化
  }
  
  update(deltaTime) {
    // 更新逻辑
  }
}`;
    } else if (path.endsWith('.material.json')) {
      return JSON.stringify({
        id: path.split('/').pop()?.split('.')[0] || 'material',
        name: path.split('/').pop()?.split('.')[0] || 'material',
        type: 'standard',
        parameters: {
          color: '#ffffff',
          metalness: 0.5,
          roughness: 0.5
        }
      }, null, 2);
    }
    
    return '';
  };
  
  // 关闭标签
  const closeTab = (tabId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;
    
    const tab = tabs[tabIndex];
    
    // 如果标签有未保存的更改，提示用户
    if (tab.isDirty) {
      const confirm = window.confirm(`${tab.title} 有未保存的更改，确定要关闭吗？`);
      if (!confirm) return;
    }
    
    // 移除标签
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    // 如果关闭的是当前活动标签，切换到其他标签
    if (activeTabId === tabId && newTabs.length > 0) {
      const newActiveTab = newTabs[tabIndex > 0 ? tabIndex - 1 : 0];
      setActiveTabId(newActiveTab.id);
    } else if (newTabs.length === 0) {
      setActiveTabId(null);
    }
  };
  
  // 处理标签变化
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTabId(newValue);
  };
  
  // 内容变化处理
  const handleContentChange = (content: string) => {
    setEditorContent(content);
    
    // 标记标签为已修改
    if (activeTabId) {
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, isDirty: true } 
          : tab
      ));
    }
  };
  
  // 保存文件
  const saveFile = async () => {
    if (!activeTabId || !activeTab) return;
    
    try {
      await onSave?.(activeTab.asset, editorContent);
      
      // 标记为已保存
      setTabs(tabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, isDirty: false } 
          : tab
      ));
      
    } catch (error) {
      console.error('保存文件失败:', error);
      alert(`保存文件失败: ${(error as Error).message}`);
    }
  };
  
  // 渲染编辑器内容
  const renderEditor = () => {
    if (!activeTab) return null;
    
    switch (activeTab.type) {
      case EditorType.SCRIPT:
        return (
          <ScriptEditor
            content={editorContent}
            onChange={handleContentChange}
            onSave={saveFile}
          />
        );
      case EditorType.MATERIAL:
        return (
          <MaterialEditor
            content={editorContent}
            onChange={handleContentChange}
            onSave={saveFile}
          />
        );
      default:
        return <Box sx={{ p: 2 }}>不支持的编辑器类型</Box>;
    }
  };
  
  // 如果没有标签，则返回null
  if (tabs.length === 0) {
    return null;
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: '#1e1e1e',
      borderLeft: '1px solid #333',
    }}>
      {/* 标签栏 */}
      <Box sx={{ borderBottom: 1, borderColor: '#333' }}>
        <Tabs
          value={activeTabId || false}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            minHeight: 36,
            '& .MuiTabs-indicator': {
              display: 'none',
            }
          }}
        >
          {tabs.map(tab => (
            <EditorTab
              key={tab.id}
              value={tab.id}
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  width: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {tab.type === EditorType.SCRIPT && (
                      <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    )}
                    {tab.type === EditorType.MATERIAL && (
                      <TextureIcon fontSize="small" sx={{ mr: 0.5 }} />
                    )}
                    <Box 
                      component="span" 
                      sx={{ 
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tab.title}{tab.isDirty ? ' *' : ''}
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => closeTab(tab.id, e)}
                    sx={{ 
                      ml: 0.5, 
                      p: 0.2,
                      color: 'inherit',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>
      
      {/* 编辑器内容 */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {renderEditor()}
      </Box>
    </Box>
  );
};

export default TabEditor; 