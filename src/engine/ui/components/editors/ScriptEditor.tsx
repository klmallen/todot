import React, { useEffect, useRef } from 'react';
import { Box, Button, Toolbar } from '@mui/material';

// Monaco编辑器类型
declare global {
  interface Window {
    monaco: any;
  }
}

interface ScriptEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({
  content,
  onChange,
  onSave
}) => {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 初始化编辑器
  useEffect(() => {
    // 如果没有monaco，加载它
    if (!window.monaco) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/loader.js';
      script.async = true;
      
      script.onload = () => {
        // @ts-ignore
        require.config({
          paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs' }
        });
        
        // @ts-ignore
        require(['vs/editor/editor.main'], initEditor);
      };
      
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    } else {
      initEditor();
    }
    
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);
  
  // 当内容变化时更新编辑器
  useEffect(() => {
    if (editorRef.current && content) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== content) {
        editorRef.current.setValue(content);
      }
    }
  }, [content]);
  
  // 初始化编辑器
  const initEditor = () => {
    if (!containerRef.current || editorRef.current) return;
    
    editorRef.current = window.monaco.editor.create(containerRef.current, {
      value: content,
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {
        enabled: true
      },
      fontSize: 14,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      scrollbar: {
        alwaysConsumeMouseWheel: false
      }
    });
    
    // 内容变化时触发onChange
    editorRef.current.onDidChangeModelContent(() => {
      const newValue = editorRef.current.getValue();
      onChange(newValue);
    });
    
    // 添加键盘快捷键 Ctrl+S 保存
    editorRef.current.addCommand(
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_S,
      onSave
    );
  };
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%'
    }}>
      <Toolbar variant="dense" sx={{ 
        minHeight: 36, 
        bgcolor: '#252525',
        borderBottom: '1px solid #333'
      }}>
        <Button
          size="small"
          onClick={onSave}
          sx={{ 
            textTransform: 'none',
            bgcolor: '#333',
            color: '#fff',
            '&:hover': {
              bgcolor: '#444',
            }
          }}
        >
          保存
        </Button>
      </Toolbar>
      
      <Box
        ref={containerRef}
        sx={{ flexGrow: 1 }}
      />
    </Box>
  );
};

export default ScriptEditor; 