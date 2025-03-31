import React, { useState, useEffect, useRef } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './styles/editor.css';

// 导入组件
import { DockablePanel } from './components/DockablePanel';
import { MenuBar } from './components/MenuBar';
import { ToolBar } from './components/ToolBar';
import { StatusBar } from './components/StatusBar';
import { SceneTreeView, exampleSceneNodes } from './components/SceneTreeView';
import { PropertyPanel, exampleProperties } from './components/PropertyPanel';
import { AssetBrowser, exampleAssets } from './components/AssetBrowser';
import { Console, exampleLogs, LogEntry } from './components/Console';

// 导入引擎相关类
import Engine from '../core/Engine';
import { Scene } from '../core/Scene';
import { Node3d } from '../core/Node3d';
import * as THREE from 'three';

// 导入集成模块
import { EditorEngineIntegration } from './EditorEngineIntegration';

// 导入缺少的图标组件
import { Close as CloseIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';

// 主题配置
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4c6ef5',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#1e1e1e',
      paper: '#2d2d2d',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Arial', sans-serif",
  },
});

enum PanelMode {
  DOCKED = 'docked',     // 固定在布局中
  HIDDEN = 'hidden',     // 隐藏
  DRAGGABLE = 'draggable', // 可拖动
  GROUPABLE = 'groupable'  // 可组合模式 - 新增
}

// 将类型定义保留在外部
interface PanelGroup {
  id: string;
  tabs: Panel[];
  activeTab: string;
  size?: number;
  direction?: 'horizontal' | 'vertical';
}

interface Panel {
  id: string;
  title: string;
  icon?: string;
  content: React.ReactNode;
  mode: PanelMode;
}

// 添加拖拽状态接口
interface DragState {
  panelId: string;
  sourceGroupId: string;
  isDragging: boolean;
}

// EditorComponent 组件
const EditorComponent: React.FC = () => {
  // 将 useState 移动到组件内部
  const [panelGroups, setPanelGroups] = useState([
    {
      id: 'leftGroup',
      region: 'left',
      tabs: [
        { 
          id: 'sceneTree', 
          title: '场景树', 
          mode: PanelMode.DOCKED,
        }
      ],
      activeTab: 'sceneTree',
      size: 250
    },
    {
      id: 'rightGroup',
      region: 'right',
      tabs: [
        { 
          id: 'properties', 
          title: '属性', 
          mode: PanelMode.DOCKED,
        }
      ],
      activeTab: 'properties',
      size: 250
    },
    {
      id: 'bottomGroup',
      region: 'bottom',
      tabs: [
        { 
          id: 'assets', 
          title: '资源', 
          mode: PanelMode.DOCKED,
        },
        { 
          id: 'console', 
          title: '控制台', 
          mode: PanelMode.DOCKED,
          locked: true  // 标记控制台为锁定状态，不能拖动
        }
      ],
      activeTab: 'assets',
      size: 200
    }
  ]);

  // 添加缺失的 setActiveTab 函数
  const setActiveTab = (groupId: string, tabId: string) => {
    setPanelGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.id === groupId) {
          return { ...group, activeTab: tabId };
        }
        return group;
      });
    });
  };

  // 添加缺失的 handleResizeStart 函数
  const handleResizeStart = (e: React.MouseEvent, groupId: string) => {
    const startX = e.clientX;
    const startSize = panelGroups[groupId]?.[0]?.size || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      resizeGroup(groupId, startSize + delta);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeName, setSelectedNodeName] = useState<string>('');
  const [panels, setPanels] = useState([
    { 
      id: 'sceneTree', 
      title: '场景树', 
      visible: true, 
      mode: PanelMode.DOCKED,
      dockedPosition: 'left'
    },
    { 
      id: 'properties', 
      title: '属性', 
      visible: true, 
      mode: PanelMode.DOCKED,
      dockedPosition: 'right'
    },
    { 
      id: 'assets', 
      title: '资源', 
      visible: true, 
      mode: PanelMode.DOCKED,
      dockedPosition: 'bottom'
    },
    { 
      id: 'console', 
      title: '控制台', 
      visible: true, 
      mode: PanelMode.DOCKED,
      dockedPosition: 'bottom'
    },
  ]);
  const [logs, setLogs] = useState<LogEntry[]>(exampleLogs);
  const [fps, setFps] = useState(60);
  const [objectCount, setObjectCount] = useState(10);
  const [triangleCount, setTriangleCount] = useState(1250);
  const [projectName, setProjectName] = useState('未命名项目');
  const [isModified, setIsModified] = useState(false);
  const [editorStatus, setEditorStatus] = useState('就绪');
  const sceneViewRef = useRef<HTMLDivElement>(null);
  const [engineInstance, setEngineInstance] = useState<Engine | null>(null);
  const [editorIntegration, setEditorIntegration] = useState<EditorEngineIntegration | null>(null);
  const [sceneNodes, setSceneNodes] = useState<SceneNode[]>(exampleSceneNodes);
  const [nodeProperties, setNodeProperties] = useState<PropertyCategory[]>(exampleProperties);
  const [projectAssets, setProjectAssets] = useState<Asset[]>(exampleAssets);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 添加面板管理相关的状态和方法（从Editor类中移植）
  const [panelSettings, setPanelSettings] = useState(new Map([
    ['sceneTree', {
      visible: true,
      position: { x: 10, y: 90 },
      size: { width: 250, height: 400 }
    }],
    ['properties', {
      visible: true,
      position: { x: window.innerWidth - 260, y: 90 },
      size: { width: 250, height: 400 }
    }],
    ['assets', {
      visible: true,
      position: { x: 10, y: window.innerHeight - 210 },
      size: { width: 500, height: 200 }
    }],
    ['console', {
      visible: true,
      position: { x: window.innerWidth - 510, y: window.innerHeight - 210 },
      size: { width: 500, height: 200 }
    }]
  ]));
  
  // FPS计时器
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateFps = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(updateFps);
    };
    
    const animationId = requestAnimationFrame(updateFps);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  // 初始化引擎
  useEffect(() => {
    // 确保DOM元素已经存在
    if (!sceneViewRef.current) return;
    
    // 不要手动创建canvas，让引擎使用已有的或自己创建
    const engine = new Engine(document.getElementById('scene-view-canvas') as HTMLCanvasElement);
    
    // 初始化引擎
    engine.init({
      useWebGPU: true,
      addDefaultLights: true,
      showHelpers: true
    }).then(() => {
      console.log('引擎初始化成功');
      
      // 创建默认场景
      const defaultScene = new Scene('默认场景');
      engine.addScene(defaultScene);
      engine.activateScene('默认场景');
      
      // 创建集成模块
      const integration = new EditorEngineIntegration(engine);
      integration.setActiveScene('默认场景');
      
      // 更新状态
      setEngineInstance(engine);
      setEditorIntegration(integration);
      
      // 从引擎加载数据
      updateEditorData(integration);
      
      // 启动引擎
      engine.start();
    }).catch(error => {
      console.error('引擎初始化失败:', error);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `引擎初始化失败: ${error.message}`,
        severity: 'error',
        source: '系统'
      });
    });
    
    // 组件卸载时清理
    return () => {
      if (engineInstance) {
        engineInstance.dispose();
      }
    };
  }, []);
  
  // 从引擎更新编辑器数据
  const updateEditorData = (integration: EditorEngineIntegration) => {
    // 更新场景树
    const sceneTreeData = integration.getSceneTreeData();
    setSceneNodes(sceneTreeData);
    
    // 更新资源数据（实际应用中需要实现）
    // const assets = integration.getProjectAssets();
    // setProjectAssets(assets);
    
    // 如果有选中节点，更新其属性
    if (selectedNodeId) {
      const properties = integration.getNodeProperties(selectedNodeId);
      setNodeProperties(properties);
    }
  };
  
  // 处理节点选择
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    
    // 获取节点名称
    if (editorIntegration) {
      const properties = editorIntegration.getNodeProperties(nodeId);
      setNodeProperties(properties);
      
      // 查找节点名称
      const findNodeName = (nodes: SceneNode[], id: string): string => {
        for (const node of nodes) {
          if (node.id === id) {
            return node.name;
          }
          if (node.children) {
            const name = findNodeName(node.children, id);
            if (name) return name;
          }
        }
        return '';
      };
      
      const nodeName = findNodeName(sceneNodes, nodeId);
      setSelectedNodeName(nodeName);
      
      // 添加日志
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `已选中节点: ${nodeName} (${nodeId})`,
        severity: 'info',
        source: '编辑器'
      });
    }
  };
  
  // 处理属性变更
  const handlePropertyChange = (property: Property) => {
    if (!editorIntegration || !selectedNodeId) return;
    
    // 更新引擎中的属性
    const success = editorIntegration.updateNodeProperty(
      selectedNodeId,
      property.id,
      property.value
    );
    
    if (success) {
      // 标记为已修改
      setIsModified(true);
      
      // 添加日志
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `属性已更改: ${property.name} = ${JSON.stringify(property.value)}`,
        severity: 'info',
        source: '属性'
      });
    }
  };
  
  // 处理资源选择
  const handleAssetSelect = (asset: Asset) => {
    if (!editorIntegration) return;
    
    // 加载资源
    editorIntegration.loadAsset(asset).then(success => {
      if (success) {
        addLog({
          id: Date.now().toString(),
          timestamp: new Date(),
          message: `已加载资源: ${asset.name}`,
          severity: 'info',
          source: '资源'
        });
      } else {
        addLog({
          id: Date.now().toString(),
          timestamp: new Date(),
          message: `加载资源失败: ${asset.name}`,
          severity: 'warning',
          source: '资源'
        });
      }
    });
  };
  
  // 面板控制功能（从Editor类移植）
  const togglePanel = (panelId: string, visible?: boolean) => {
    console.log(`切换面板 ${panelId} 可见性为 ${visible ?? 'toggle'}`);
    setPanels(prevPanels => prevPanels.map(panel => 
      panel.id === panelId 
        ? { ...panel, visible: visible !== undefined ? visible : !panel.visible } 
        : panel
    ));
  };
  
  // 其他面板控制功能
  const setPanelPosition = (panelId: string, position: { x: number, y: number }) => {
    // 在实际实现中，应该更新面板位置状态
    console.log(`设置面板 ${panelId} 位置为`, position);
  };
  
  const setPanelSize = (panelId: string, size: { width: number, height: number }) => {
    // 在实际实现中，应该更新面板大小状态
    console.log(`设置面板 ${panelId} 大小为`, size);
  };
  
  // 修改处理菜单操作的函数，确保正确调用togglePanel
  const handleMenuAction = (action: string, data?: any) => {
    // 添加日志
    addLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `菜单操作: ${action} ${data ? JSON.stringify(data) : ''}`,
      severity: 'info',
      source: '菜单'
    });
    
    // 处理特定的菜单动作
    if (action === 'save') {
      setIsModified(false);
      setEditorStatus('已保存');
      setTimeout(() => setEditorStatus('就绪'), 3000);
    } else if (action === 'new_project') {
      setProjectName('未命名项目');
      setIsModified(false);
    } else if (action === 'toggle_panel' && data?.panel) {
      // 确保正确调用我们定义的togglePanel函数
      togglePanel(data.panel);
    }
  };
  
  // 切换面板可见性 - 现在这个函数应该使用我们上面定义的togglePanel
  const togglePanelVisibility = (panelId: string) => {
    setPanels(prevPanels => prevPanels.map(panel => {
      if (panel.id === panelId) {
        const newPanel = { ...panel };
        // 如果面板是隐藏的，显示它并恢复之前的模式
        if (!panel.visible) {
          newPanel.visible = true;
          // 如果之前是隐藏模式，设为可拖动模式
          if (panel.mode === PanelMode.HIDDEN) {
            newPanel.mode = PanelMode.DRAGGABLE;
          }
        } else {
          // 如果面板是可见的，隐藏它
          newPanel.visible = false;
          newPanel.mode = PanelMode.HIDDEN;
        }
        return newPanel;
      }
      return panel;
    }));
  };
  
  // 关闭面板 - 使用togglePanel设置为false
  const closePanel = (panelId: string) => {
    togglePanel(panelId, false);
  };
  
  // 将闭包方法暴露给外部
  useEffect(() => {
    // 如果需要暴露方法给外部，可以挂载到window对象
    if (typeof window !== 'undefined') {
      (window as any).editorAPI = {
        togglePanel,
        setPanelPosition,
        setPanelSize
      };
    }
    
    return () => {
      // 清理
      if (typeof window !== 'undefined') {
        delete (window as any).editorAPI;
      }
    };
  }, []);
  
  // 修改getInitialPosition和getInitialSize来使用新的状态
  const getInitialPosition = (panelId: string) => {
    const panel = panelSettings.get(panelId);
    if (panel) {
      return panel.position;
    }
    
    // fallback到之前的默认值
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    switch (panelId) {
      case 'sceneTree':
        return { x: 10, y: 90 };
      case 'properties':
        return { x: width - 260, y: 90 };
      case 'assets':
        return { x: 10, y: height - 210 };
      case 'console':
        return { x: width - 510, y: height - 210 };
      default:
        return { x: 10, y: 10 };
    }
  };
  
  const getInitialSize = (panelId: string) => {
    const panel = panelSettings.get(panelId);
    if (panel) {
      return panel.size;
    }
    
    // fallback到之前的默认值
    switch (panelId) {
      case 'sceneTree':
      case 'properties':
        return { width: 250, height: 400 };
      case 'assets':
      case 'console':
        return { width: 500, height: 200 };
      default:
        return { width: 300, height: 300 };
    }
  };
  
  // 添加日志
  const addLog = (log: LogEntry) => {
    setLogs(prevLogs => [...prevLogs, log]);
  };
  
  // 清空日志
  const clearLogs = () => {
    setLogs([]);
  };
  
  // 执行命令
  const executeCommand = (command: string) => {
    // 在实际应用中，这里会解析和执行命令
    addLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `执行命令: ${command}`,
      severity: 'info',
      source: '控制台'
    });
    
    // 模拟一些简单的命令执行
    if (command === 'clear') {
      clearLogs();
    } else if (command.startsWith('rename ')) {
      const newName = command.substring(7);
      setProjectName(newName);
      setIsModified(true);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `项目已重命名为: ${newName}`,
        severity: 'info',
        source: '控制台'
      });
    } else if (command === 'save') {
      setIsModified(false);
      setEditorStatus('已保存');
      setTimeout(() => setEditorStatus('就绪'), 3000);
    }
  };
  
  // 处理工具栏操作
  const handleToolbarAction = (action: string) => {
    // 在实际应用中，这里会处理工具栏操作
    addLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `工具栏操作: ${action}`,
      severity: 'info',
      source: '工具栏'
    });
    
    if (action === 'play') {
      setEditorStatus('运行中...');
    } else if (action === 'stop') {
      setEditorStatus('就绪');
    }
  };
  
  // 处理工具选择
  const handleToolSelect = (tool: string) => {
    // 在实际应用中，这里会切换当前的编辑工具
    addLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `选择工具: ${tool}`,
      severity: 'info',
      source: '工具栏'
    });
  };
  
  // 处理状态栏操作
  const handleStatusBarAction = (action: string) => {
    // 处理状态栏按钮点击
    if (action === 'documentation') {
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: '打开文档',
        severity: 'info',
        source: '状态栏'
      });
    } else if (action === 'reportIssue') {
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: '报告问题',
        severity: 'info',
        source: '状态栏'
      });
    } else if (action === 'github') {
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: '访问GitHub仓库',
        severity: 'info',
        source: '状态栏'
      });
    }
  };

  // 切换面板模式
  const togglePanelMode = (panelId: string, mode: PanelMode) => {
    setPanels(prevPanels => prevPanels.map(panel => 
      panel.id === panelId 
        ? { ...panel, mode: mode, visible: mode !== PanelMode.HIDDEN } 
        : panel
    ));
  };

  // 渲染面板内容的辅助函数
  const renderPanelContent = (panel) => {
    switch (panel.id) {
      case 'sceneTree':
        return (
          <SceneTreeView 
            nodes={sceneNodes} 
            onNodeSelect={handleNodeSelect}
          />
        );
      case 'properties':
        return (
          <PropertyPanel 
            categories={nodeProperties}
            onPropertyChange={handlePropertyChange}
          />
        );
      case 'assets':
        return (
          <AssetBrowser 
            assets={projectAssets}
            onAssetSelect={handleAssetSelect}
          />
        );
      case 'console':
        return (
          <Console 
            logs={logs}
            onClear={clearLogs}
            onExecuteCommand={executeCommand}
          />
        );
      default:
        return null;
    }
  };

  // 添加拖拽状态
  const [dragState, setDragState] = useState<DragState | null>(null);
  
  // 添加编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);

  // 移除面板组中的标签
  const removeTab = (groupId: string, tabId: string) => {
    setPanelGroups(prevGroups => {
      // 找到对应的组和标签
      const newGroups = [...prevGroups];
      const groupIndex = newGroups.findIndex(g => g.id === groupId);
      
      if (groupIndex === -1) return prevGroups;
      
      const group = newGroups[groupIndex];
      const tabIndex = group.tabs.findIndex(t => t.id === tabId);
      
      if (tabIndex === -1) return prevGroups;
      
      // 如果是被锁定的标签（如控制台），不允许移除
      if (group.tabs[tabIndex].locked) {
        return prevGroups;
      }
      
      // 移除标签
      group.tabs.splice(tabIndex, 1);
      
      // 如果组内还有其他标签，设置一个新的活动标签
      if (group.tabs.length > 0 && group.activeTab === tabId) {
        group.activeTab = group.tabs[0].id;
      }
      
      // 如果组内没有标签了，移除该组
      if (group.tabs.length === 0) {
        newGroups.splice(groupIndex, 1);
      }
      
      return newGroups;
    });
  };

  // 调整面板组大小
  const resizeGroup = (groupId: string, newSize: number) => {
    setPanelGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.id === groupId) {
          return { ...group, size: Math.max(100, newSize) }; // 限制最小尺寸
        }
        return group;
      });
    });
  };

  // 修改处理拖拽开始函数
  const handleTabDragStart = (e: React.DragEvent, tabId: string, groupId: string) => {
    // 检查是否是锁定的标签
    const group = panelGroups.find(g => g.id === groupId);
    const tab = group?.tabs.find(t => t.id === tabId);
    
    if (tab?.locked) {
      // 如果是锁定的标签（如控制台），阻止拖拽
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', tabId);
    e.dataTransfer.setData('application/groupId', groupId);
    setDragState({ panelId: tabId, sourceGroupId: groupId, isDragging: true });
  };

  // 修改处理拖拽放下函数
  const handleTabDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (!dragState) return;

    const { panelId, sourceGroupId } = dragState;
    if (sourceGroupId !== targetGroupId) {
      // 找到源标签
      const sourceGroup = panelGroups.find(g => g.id === sourceGroupId);
      const sourceTab = sourceGroup?.tabs.find(t => t.id === panelId);
      
      if (sourceTab) {
        // 移除源组中的标签
        removeTab(sourceGroupId, panelId);
        
        // 添加到目标组
        setPanelGroups(prevGroups => {
          return prevGroups.map(group => {
            if (group.id === targetGroupId) {
              return {
                ...group,
                tabs: [...group.tabs, sourceTab],
                activeTab: sourceTab.id
              };
            }
            return group;
          });
        });
      }
    }
    setDragState(null);
  };

  // 修改面板组组件
  const PanelGroupComponent: React.FC<{
    group: any;
    region: 'left' | 'right' | 'bottom';
  }> = ({ group, region }) => {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: region === 'bottom' ? '100%' : group.size,
          height: region === 'bottom' ? group.size : '100%',
          position: 'relative'
        }}
      >
        {/* 标签栏 */}
        <Box sx={{ 
          display: 'flex', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          bgcolor: 'background.paper'
        }}>
          {group.tabs.map(tab => (
            <Box
              key={tab.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                cursor: tab.locked ? 'default' : 'move',
                bgcolor: group.activeTab === tab.id ? 'action.selected' : 'transparent',
                '&:hover': { 
                  bgcolor: 'action.hover',
                  '& .tab-actions': { visibility: 'visible' }
                }
              }}
              draggable={!tab.locked}
              onDragStart={(e) => handleTabDragStart(e, tab.id, group.id)}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderLeft = '2px solid #1976d2';
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderLeft = 'none';
              }}
              onDrop={(e) => handleTabDrop(e, group.id)}
              onClick={() => setActiveTab(group.id, tab.id)}
            >
              {tab.title}
              <Box className="tab-actions" sx={{ 
                ml: 1,
                visibility: 'hidden',
                display: 'flex',
                gap: 0.5
              }}>
                {!tab.locked && (
                  <IconButton size="small" onClick={(e) => {
                    e.stopPropagation();
                    removeTab(group.id, tab.id);
                  }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        {/* 面板内容 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {renderPanelContent(group.tabs.find(t => t.id === group.activeTab))}
        </Box>

        {/* 大小调整手柄 */}
        {region !== 'bottom' && (
          <Box
            sx={{
              position: 'absolute',
              [region === 'left' ? 'right' : 'left']: -3,
              top: 0,
              bottom: 0,
              width: 6,
              cursor: 'col-resize',
              '&:hover': { bgcolor: 'primary.main' }
            }}
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startSize = group.size;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const delta = moveEvent.clientX - startX;
                const newSize = region === 'left' ? 
                  startSize + delta : 
                  startSize - delta;
                resizeGroup(group.id, newSize);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        )}
        
        {region === 'bottom' && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: -3,
              height: 6,
              cursor: 'row-resize',
              '&:hover': { bgcolor: 'primary.main' }
            }}
            onMouseDown={(e) => {
              const startY = e.clientY;
              const startSize = group.size;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const delta = startY - moveEvent.clientY;
                resizeGroup(group.id, startSize + delta);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
        ref={containerRef}
      >
        {/* 菜单栏 */}
        <MenuBar onAction={handleMenuAction} />
        
        {/* 工具栏 */}
        <ToolBar 
          onAction={handleToolbarAction}
          onToolSelect={handleToolSelect}
          onTogglePanel={togglePanelVisibility}
          onChangePanelMode={(panelId, mode) => togglePanelMode(panelId, mode)}
        />
        
        {/* 主编辑区域 */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          flexGrow: 1, 
          overflow: 'hidden'
        }}>
          {/* 主内容区域：左中右布局 */}
          <Box sx={{ 
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden'
          }}>
            {/* 左侧区域 */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {panelGroups
                .filter(group => group.region === 'left')
                .map(group => (
                  <PanelGroupComponent 
                    key={group.id} 
                    group={group} 
                    region="left"
                  />
                ))}
            </Box>

            {/* 中间场景视图 */}
            <Box sx={{ 
              flexGrow: 1,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <Box 
                id="scene-view-container" 
                ref={sceneViewRef} 
                sx={{ 
                  width: '100%',
                  height: '100%'
                }}
              >
                <canvas id="scene-view-canvas" style={{ width: '100%', height: '100%' }} />
              </Box>
            </Box>

            {/* 右侧区域 */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {panelGroups
                .filter(group => group.region === 'right')
                .map(group => (
                  <PanelGroupComponent 
                    key={group.id} 
                    group={group} 
                    region="right"
                  />
                ))}
            </Box>
          </Box>

          {/* 底部区域 */}
          <Box sx={{ display: 'flex' }}>
            {panelGroups
              .filter(group => group.region === 'bottom')
              .map(group => (
                <PanelGroupComponent 
                  key={group.id} 
                  group={group} 
                  region="bottom"
                />
              ))}
          </Box>

          {/* 状态栏 */}
          <StatusBar 
            fps={fps}
            objectCount={objectCount}
            triangleCount={triangleCount}
            selectedObject={selectedNodeName}
            projectName={projectName}
            isModified={isModified}
            status={editorStatus}
            onAction={handleStatusBarAction}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

// 导出组件
export default EditorComponent; 