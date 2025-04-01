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
import AssetBrowser from './components/AssetBrowser';
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

// 导入新的组件
import TabGroupManager, { TabGroupData } from './components/TabGroupManager';
import ProjectManager, { ProjectInfo } from './components/ProjectManager';
import ProjectService from './services/ProjectService';
import TabEditor from './components/editors/TabEditor';

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
  locked?: boolean;
}

// 添加拖拽状态接口
interface DragState {
  panelId: string;
  sourceGroupId: string;
  isDragging: boolean;
}

// 1. 确保有默认的属性面板数据
// 在组件顶部添加默认数据
const defaultNodeProperties = [
  {
    name: '基本属性',
    expanded: true,
    properties: [
      {
        id: 'name',
        name: '名称',
        type: 'string',
        value: '未选择对象'
      }
    ]
  }
];

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
          mode: PanelMode.GROUPABLE,
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
          mode: PanelMode.DRAGGABLE,
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
          mode: PanelMode.GROUPABLE,
        },
        { 
          id: 'console', 
          title: '控制台', 
          mode: PanelMode.GROUPABLE,
          locked: true  // 控制台设为锁定
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
  const [nodeProperties, setNodeProperties] = useState<PropertyCategory[]>(exampleProperties || defaultNodeProperties);
  const [projectAssets, setProjectAssets] = useState<Asset[]>();
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
  
  // 在EditorComponent中添加项目管理状态
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null);
  const projectService = ProjectService.getInstance();

  // 初始化时检查是否有上次打开的项目
  useEffect(() => {
    const lastProject = localStorage.getItem('lastOpenedProject');
    if (lastProject) {
      try {
        const project = JSON.parse(lastProject);
        setCurrentProject(project);
        // 不自动打开，等用户手动操作
      } catch (error) {
        console.error('Failed to parse last project', error);
      }
    } else {
      // 如果没有上次打开的项目，显示项目管理器
      setProjectManagerOpen(true);
    }
  }, []);

  // 创建新项目
  const handleCreateProject = async (name: string, path: string) => {
    if (!engineInstance) {
      alert('引擎未初始化');
      return;
    }
    
    try {
      const project = await projectService.createProject(name, path, engineInstance);
      setCurrentProject(project);
      localStorage.setItem('lastOpenedProject', JSON.stringify(project));
      setProjectName(name);
      setIsModified(false);
      setProjectManagerOpen(false);
      
      // 更新场景树和其他状态
      if (editorIntegration) {
        updateEditorData(editorIntegration);
      }
      
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `创建项目: ${name}`,
        severity: 'info',
        source: '项目'
      });
    } catch (error) {
      console.error('创建项目失败:', error);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `创建项目失败: ${(error as Error).message}`,
        severity: 'error',
        source: '项目'
      });
    }
  };

  // 打开项目
  const handleOpenProject = async (project: ProjectInfo) => {
    if (!engineInstance) {
      alert('引擎未初始化');
      return;
    }
    
    try {
      await projectService.openProject(project, engineInstance);
      setCurrentProject(project);
      localStorage.setItem('lastOpenedProject', JSON.stringify(project));
      setProjectName(project.name);
      setIsModified(false);
      setProjectManagerOpen(false);
      
      // 更新场景树和其他状态
      if (editorIntegration) {
        updateEditorData(editorIntegration);
      }
      
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `打开项目: ${project.name}`,
        severity: 'info',
        source: '项目'
      });
    } catch (error) {
      console.error('打开项目失败:', error);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `打开项目失败: ${(error as Error).message}`,
        severity: 'error',
        source: '项目'
      });
    }
  };

  // 导入项目
  const handleImportProject = async (path: string) => {
    if (!engineInstance) {
      alert('引擎未初始化');
      return;
    }
    
    try {
      const project = await projectService.importProject(path, engineInstance);
      setCurrentProject(project);
      localStorage.setItem('lastOpenedProject', JSON.stringify(project));
      setProjectName(project.name);
      setIsModified(false);
      setProjectManagerOpen(false);
      
      // 更新场景树和其他状态
      if (editorIntegration) {
        updateEditorData(editorIntegration);
      }
      
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `导入项目: ${project.name}`,
        severity: 'info',
        source: '项目'
      });
    } catch (error) {
      console.error('导入项目失败:', error);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `导入项目失败: ${(error as Error).message}`,
        severity: 'error',
        source: '项目'
      });
    }
  };

  // 保存项目
  const saveProject = async () => {
    if (!engineInstance || !currentProject) {
      alert('没有打开的项目或引擎未初始化');
      return;
    }
    
    try {
      await projectService.saveProject(engineInstance);
      setIsModified(false);
      setEditorStatus('已保存');
      setTimeout(() => setEditorStatus('就绪'), 3000);
      
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `保存项目: ${currentProject.name}`,
        severity: 'info',
        source: '项目'
      });
    } catch (error) {
      console.error('保存项目失败:', error);
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `保存项目失败: ${(error as Error).message}`,
        severity: 'error',
        source: '项目'
      });
    }
  };

  // 修改handleMenuAction函数处理项目操作
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
    switch (action) {
      case 'new_project':
        setProjectManagerOpen(true);
        break;
      
      case 'open_project':
        setProjectManagerOpen(true);
        break;
      
      case 'save':
        saveProject();
        break;
      
      case 'save_as':
        // 未实现另存为功能
        alert('另存为功能尚未实现');
        break;
      
      case 'close_project':
        if (isModified) {
          if (confirm('项目有未保存的更改，是否保存？')) {
            saveProject().then(() => {
              setCurrentProject(null);
              localStorage.removeItem('lastOpenedProject');
              setProjectName('未命名项目');
            });
          } else {
            setCurrentProject(null);
            localStorage.removeItem('lastOpenedProject');
            setProjectName('未命名项目');
          }
        } else {
          setCurrentProject(null);
          localStorage.removeItem('lastOpenedProject');
          setProjectName('未命名项目');
        }
        break;
      
      case 'toggle_panel':
        if (data?.panel) {
          togglePanel(data.panel);
        }
        break;
        
      default:
        console.log('未处理的菜单操作:', action);
        break;
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

  // 初始化标签组
  const initialTabGroups: TabGroupData[] = [
    {
      id: 'leftGroup',
      region: 'left',
      tabs: [
        { 
          id: 'sceneTree', 
          title: '场景树',
          content: null // 这里的null将被renderTabContent替换
        }
      ],
      activeTabId: 'sceneTree',
      size: 250
    },
    {
      id: 'rightGroup',
      region: 'right',
      tabs: [
        { 
          id: 'properties', 
          title: '属性',
          content: null
        }
      ],
      activeTabId: 'properties',
      size: 250
    },
    {
      id: 'bottomGroup',
      region: 'bottom',
      tabs: [
        { 
          id: 'assets', 
          title: '资源',
          content: null
        },
        { 
          id: 'console', 
          title: '控制台',
          content: null,
          locked: true // 控制台设为锁定
        }
      ],
      activeTabId: 'assets',
      size: 200
    }
  ];
  
  // 使用useEffect确保在组件挂载后更新TabGroupManager的状态
  useEffect(() => {
    // 此处可以添加调试信息，帮助排查问题
    console.log('属性面板内容:', nodeProperties);
  }, [nodeProperties]); // 监听属性数据变化
  
  // 3. 修改renderTabContent函数，确保属性面板始终有内容
  const renderTabContent = (tabId: string) => {
    console.log(`渲染标签内容: ${tabId}`);
    
    switch (tabId) {
      case 'sceneTree':
        return (
          <SceneTreeView 
            nodes={sceneNodes} 
            onNodeSelect={handleNodeSelect}
          />
        );
      case 'properties':
        // 确保nodeProperties有值
        const properties = nodeProperties && nodeProperties.length > 0 
          ? nodeProperties 
          : exampleProperties; // 使用示例属性作为后备
        
        console.log('使用属性数据:', properties);
        
        return (
          <PropertyPanel 
            categories={properties}
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
        return <Box sx={{ p: 2 }}>未知面板: {tabId}</Box>;
    }
  };

  // 4. 添加效果钩子来调试和确保内容更新
  useEffect(() => {
    console.log('当前所有标签组:', initialTabGroups);
    console.log('属性面板数据:', nodeProperties);
    
    // 如果属性面板数据为空，设置默认值
    if (!nodeProperties || nodeProperties.length === 0) {
      setNodeProperties(defaultNodeProperties);
    }
  }, []);

  // 在EditorComponent中添加状态
  const [editorViewActive, setEditorViewActive] = useState(false);

  // 添加处理资源双击的方法
  const handleAssetDoubleClick = (asset: AssetItem) => {
    // 只处理可编辑的资源类型
    if (
      asset.type === AssetType.SCRIPT ||
      asset.type === AssetType.MATERIAL ||
      asset.type === AssetType.SCENE
    ) {
      setEditorViewActive(true);
      // 如果TabEditor组件引用可用，调用其openFile方法
      if (tabEditorRef.current) {
        tabEditorRef.current.openFile(asset);
      }
    }
  };

  // 添加保存文件的方法
  const handleSaveFile = async (asset: AssetItem, content: string) => {
    const currentProject = projectService.getCurrentProject();
    if (!currentProject) {
      throw new Error('没有打开的项目');
    }
    
    try {
      // 获取目录句柄
      const parts = asset.path.split('/');
      const fileName = parts.pop() || '';
      const dirPath = parts.join('/');
      const fullPath = `${currentProject.path}/${dirPath}`;
      
      const dirHandle = await window.showDirectoryPicker({
        id: 'projectDirectory',
        startIn: fullPath
      });
      
      // 获取文件句柄
      const fileHandle = await dirHandle.getFileHandle(fileName);
      
      // 写入内容
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      // 标记项目为已修改
      setIsModified(true);
      
    } catch (error) {
      console.error('保存文件失败:', error);
      throw error;
    }
  };

  // 创建对TabEditor的引用
  const tabEditorRef = useRef<any>(null);

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
        />
        
        {/* 主编辑区域 - 使用新的TabGroupManager */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <TabGroupManager
            initialGroups={initialTabGroups}
            renderTabContent={renderTabContent}
            centerContent={
              editorViewActive ? (
                <TabEditor
                  ref={tabEditorRef}
                  onSave={handleSaveFile}
                />
              ) : (
                <Box
                  id="scene-view-container"
                  sx={{
                    position: 'relative',
                    flexGrow: 1,
                    backgroundColor: '#1a1a1a',
                    overflow: 'hidden'
                  }}
                >
                  <canvas
                    id="scene-view-canvas"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%'
                    }}
                  />
                </Box>
              )
            }
          />
          
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
        
        {/* 项目管理器对话框 */}
        <ProjectManager
          open={projectManagerOpen}
          onClose={() => setProjectManagerOpen(false)}
          onCreateProject={handleCreateProject}
          onOpenProject={handleOpenProject}
          onImportProject={handleImportProject}
        />
      </Box>
    </ThemeProvider>
  );
};

// 导出组件
export default EditorComponent; 