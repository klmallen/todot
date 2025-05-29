import React, { createContext, useReducer, useContext } from 'react';

// 编辑器状态类型
interface EditorState {
  // 选中的节点ID
  selectedNodeId: string | null;
  // 选中的组件ID
  selectedComponentId: string | null;
  // 编辑器面板布局状态
  layout: {
    // 是否显示属性面板
    showPropertyPanel: boolean;
    // 是否显示资源面板
    showResourcePanel: boolean;
    // 是否显示场景树
    showSceneTree: boolean;
  };
  // 添加其他需要的状态...
}

// 初始状态
const initialState: EditorState = {
  selectedNodeId: null,
  selectedComponentId: null,
  layout: {
    showPropertyPanel: true,
    showResourcePanel: true,
    showSceneTree: true,
  }
};

// 定义动作类型
type EditorAction = 
  | { type: 'SELECT_NODE', payload: string | null }
  | { type: 'SELECT_COMPONENT', payload: string | null }
  | { type: 'TOGGLE_PANEL', payload: { panel: 'property' | 'resource' | 'sceneTree', show: boolean } };

// 创建Reducer
const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'SELECT_NODE':
      return {
        ...state,
        selectedNodeId: action.payload
      };
    case 'SELECT_COMPONENT':
      return {
        ...state,
        selectedComponentId: action.payload
      };
    case 'TOGGLE_PANEL':
      return {
        ...state,
        layout: {
          ...state.layout,
          [action.payload.panel === 'property' ? 'showPropertyPanel' : 
           action.payload.panel === 'resource' ? 'showResourcePanel' : 'showSceneTree']: action.payload.show
        }
      };
    default:
      return state;
  }
};

// 创建上下文
interface EditorContextType {
  state: EditorState;
  selectNode: (nodeId: string | null) => void;
  selectComponent: (componentId: string | null) => void;
  togglePanel: (panel: 'property' | 'resource' | 'sceneTree', show: boolean) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

// 创建Provider
export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // 选择节点
  const selectNode = (nodeId: string | null) => {
    dispatch({ type: 'SELECT_NODE', payload: nodeId });
  };

  // 选择组件
  const selectComponent = (componentId: string | null) => {
    dispatch({ type: 'SELECT_COMPONENT', payload: componentId });
  };

  // 切换面板显示
  const togglePanel = (panel: 'property' | 'resource' | 'sceneTree', show: boolean) => {
    dispatch({ type: 'TOGGLE_PANEL', payload: { panel, show } });
  };

  const value = {
    state,
    selectNode,
    selectComponent,
    togglePanel
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

// 自定义Hook
export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}; 