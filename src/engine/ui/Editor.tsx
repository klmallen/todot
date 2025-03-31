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

interface EditorProps {
  container: HTMLElement;
}

export class Editor {
  private container: HTMLElement;
  private panels: Map<string, {
    visible: boolean;
    position: { x: number, y: number };
    size: { width: number, height: number };
  }> = new Map();
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }
  
  private init() {
    // 初始化编辑器
    this.initDefaultLayout();
    this.renderEditor();
  }
  
  private initDefaultLayout() {
    // 设置默认布局
    const containerRect = this.container.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    // 默认面板配置
    this.panels.set('sceneTree', {
      visible: true,
      position: { x: 10, y: 90 },
      size: { width: 250, height: 400 }
    });
    
    this.panels.set('properties', {
      visible: true,
      position: { x: width - 260, y: 90 },
      size: { width: 250, height: 400 }
    });
    
    this.panels.set('assets', {
      visible: true,
      position: { x: 10, y: height - 210 },
      size: { width: 500, height: 200 }
    });
    
    this.panels.set('console', {
      visible: true,
      position: { x: width - 510, y: height - 210 },
      size: { width: 500, height: 200 }
    });
  }
  
  private renderEditor() {
    const editorApp = (
      <EditorComponent container={this.container} />
    );
    
    // 使用ReactDOM渲染到容器中
    const root = document.createElement('div');
    root.style.width = '100%';
    root.style.height = '100%';
    this.container.appendChild(root);
    
    // 这里应该调用ReactDOM.createRoot(root).render(editorApp)
    // 但由于这只是类定义，我们将在实例化时处理
  }
  
  // 公共方法：显示/隐藏面板
  public togglePanel(panelId: string, visible?: boolean) {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.visible = visible !== undefined ? visible : !panel.visible;
      // 在实际实现中，这里会触发UI更新
    }
  }
  
  // 公共方法：设置面板位置
  public setPanelPosition(panelId: string, position: { x: number, y: number }) {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.position = position;
      // 在实际实现中，这里会触发UI更新
    }
  }
  
  // 公共方法：设置面板大小
  public setPanelSize(panelId: string, size: { width: number, height: number }) {
    const panel = this.panels.get(panelId);
    if (panel) {
      panel.size = size;
      // 在实际实现中，这里会触发UI更新
    }
  }
  
  // 公共方法：销毁编辑器
  public dispose() {
    // 清理资源
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}

// 编辑器React组件（内部使用）
const EditorComponent: React.FC<EditorProps> = ({ container }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeName, setSelectedNodeName] = useState<string>('');
  const [panels, setPanels] = useState([
    { id: 'sceneTree', title: '场景树', visible: true },
    { id: 'properties', title: '属性', visible: true },
    { id: 'assets', title: '资源', visible: true },
    { id: 'console', title: '控制台', visible: true },
  ]);
  const [logs, setLogs] = useState<LogEntry[]>(exampleLogs);
  const [fps, setFps] = useState(60);
  const [objectCount, setObjectCount] = useState(10);
  const [triangleCount, setTriangleCount] = useState(1250);
  const [projectName, setProjectName] = useState('未命名项目');
  const [isModified, setIsModified] = useState(false);
  const [editorStatus, setEditorStatus] = useState('就绪');
  const sceneViewRef = useRef<HTMLDivElement>(null);
  
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
  
  // 切换面板可见性
  const togglePanelVisibility = (panelId: string) => {
    setPanels(panels.map(panel => 
      panel.id === panelId ? { ...panel, visible: !panel.visible } : panel
    ));
  };
  
  // 关闭面板
  const closePanel = (panelId: string) => {
    setPanels(panels.map(panel => 
      panel.id === panelId ? { ...panel, visible: false } : panel
    ));
  };
  
  // 计算初始位置
  const getInitialPosition = (panelId: string) => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    
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
  
  // 计算初始大小
  const getInitialSize = (panelId: string) => {
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
  
  // 处理场景节点选择
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    
    // 查找节点名称
    const findNodeName = (nodes: any[], id: string): string => {
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
    
    const nodeName = findNodeName(exampleSceneNodes, nodeId);
    setSelectedNodeName(nodeName);
    
    // 在实际应用中，这里会加载选中节点的属性
    addLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `已选中节点: ${nodeName} (${nodeId})`,
      severity: 'info',
      source: '编辑器'
    });
  };
  
  // 处理属性变更
  const handlePropertyChange = (property: any) => {
    // 模拟编辑状态变更
    setIsModified(true);
    
    // 在实际应用中，这里会更新场景中的对象属性
    addLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `属性已更改: ${property.name} = ${JSON.stringify(property.value)}`,
      severity: 'info',
      source: '属性'
    });
  };
  
  // 处理资源选择
  const handleAssetSelect = (asset: any) => {
    // 在实际应用中，这里会处理资源的选择逻辑
    addLog({
      id: Date.now().toString(),
      timestamp: new Date(),
      message: `已选择资源: ${asset.name}`,
      severity: 'info',
      source: '资源'
    });
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
      addLog({
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `项目已保存`,
        severity: 'info',
        source: '控制台'
      });
    }
  };
  
  // 处理菜单操作
  const handleMenuAction = (action: string, data?: any) => {
    // 在实际应用中，这里会处理菜单操作
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
      togglePanelVisibility(data.panel);
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
      >
        {/* 菜单栏 */}
        <MenuBar onAction={handleMenuAction} />
        
        {/* 工具栏 */}
        <ToolBar 
          onAction={handleToolbarAction}
          onToolSelect={handleToolSelect}
        />
        
        {/* 主编辑区域 */}
        <Box
          sx={{
            position: 'relative',
            flexGrow: 1,
            overflow: 'hidden',
          }}
        >
          {/* 场景视图（3D视图区域）*/}
          <Box
            id="scene-view-container"
            ref={sceneViewRef}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: '#1a1a1a',
            }}
          >
            {/* 3D场景视图将在这里渲染 */}
          </Box>
          
          {/* 可停靠面板 */}
          {panels.map(panel => 
            panel.visible && (
              <DockablePanel
                key={panel.id}
                id={panel.id}
                title={panel.title}
                initialPosition={getInitialPosition(panel.id)}
                initialSize={getInitialSize(panel.id)}
                onClose={() => closePanel(panel.id)}
              >
                {panel.id === 'sceneTree' && (
                  <SceneTreeView 
                    nodes={exampleSceneNodes} 
                    onNodeSelect={handleNodeSelect}
                  />
                )}
                {panel.id === 'properties' && (
                  <PropertyPanel 
                    categories={exampleProperties}
                    onPropertyChange={handlePropertyChange}
                  />
                )}
                {panel.id === 'assets' && (
                  <AssetBrowser 
                    assets={exampleAssets}
                    onAssetSelect={handleAssetSelect}
                  />
                )}
                {panel.id === 'console' && (
                  <Console 
                    logs={logs}
                    onClear={clearLogs}
                    onExecuteCommand={executeCommand}
                  />
                )}
              </DockablePanel>
            )
          )}
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
    </ThemeProvider>
  );
}; 