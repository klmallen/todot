import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Editor } from './engine/Editor';
import { PropertyPanel } from './engine/ui/PropertyPanel.tsx';
import { SceneTreeView } from './engine/ui/SceneTreeView/index';

const EditorApp: React.FC = () => {
  const [editorInstance, setEditorInstance] = React.useState<Editor | null>(null);

  useEffect(() => {
    const editorContainer = document.getElementById('editor-container');
    let editor: Editor | null = null;
    
    if (editorContainer) {
      editor = initEditor(editorContainer);
      setEditorInstance(editor);
    }

    return () => {
      // 清理编辑器实例
      if (editor) {
        editor.dispose(); // 假设你的 Editor 类有 dispose 方法
      }
    };
  }, []);

  return (
    <div className="editor-wrapper" style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <div id="editor-container" style={{ flex: 1, background: '#2c2c2c' }} />
      {editorInstance && <SceneTreeView />}
    </div>
  );
};

/**
 * 初始化编辑器
 * @param container 容器元素
 */
function initEditor(container: HTMLElement): Editor {
  console.log('初始化编辑器...');
  
  try {
    // 创建编辑器实例
    const editor = new Editor(container);
    
    // 保存到全局变量，方便调试
    (window as any).editor = editor;
    
    // 处理键盘快捷键
    // initKeyboardShortcuts(editor);
    
    console.log('编辑器初始化完成');
    return editor;
  } catch (error) {
    console.error('编辑器初始化失败:', error);
    
    // 显示错误信息
    container.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h2>编辑器初始化失败</h2>
        <p>${error}</p>
      </div>
    `;
    throw error;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <EditorApp />
); 