/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-27 15:20:30
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-06 16:51:59
 * @FilePath: \todot\src\engine\ui\EditorUI.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useEffect, useState, useRef } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { PropertyPanel } from './PropertyPanel';
import { getEditorActive } from '../states/useEditorMode';
import Engine from '../core/Engine';
import { SceneTreeContainer } from './SceneTreeContainer';

interface EditorUIProps {
  engine?: Engine;
}

/**
 * 编辑器UI组件，整合所有UI元素
 */
export const EditorUI: React.FC<EditorUIProps> = ({ engine }) => {
  const [active, setActive] = useState(getEditorActive());
  const sceneTreeContainerRef = useRef<SceneTreeContainer | null>(null);
  
  // 获取引擎实例
  const engineInstance = engine || Engine.getInstance();
  
  // 初始化场景树
  useEffect(() => {
    if (active && !sceneTreeContainerRef.current) {
      // 创建场景树容器
      const sceneTreeContainer = new SceneTreeContainer();
      sceneTreeContainer.init();
      sceneTreeContainer.show(); // 默认显示场景树
      
      // 保存引用
      sceneTreeContainerRef.current = sceneTreeContainer;
    }
    
    return () => {
      // 清理场景树
      if (sceneTreeContainerRef.current) {
        sceneTreeContainerRef.current.destroy();
        sceneTreeContainerRef.current = null;
      }
    };
  }, [active]);
  
  // 监听编辑器状态变化
  useEffect(() => {
    const unsubscribe = getEditorActive((isActive) => {
      setActive(isActive);
    });
    
    return () => unsubscribe();
  }, []);
  
  // 如果编辑器不活跃，不显示任何内容
  if (!active) return null;
  
  return (
    <div className="editor-ui">
      {/* 顶部工具栏 */}
      <EditorToolbar />
      
      {/* 属性面板 */}
      <PropertyPanel />
    </div>
  );
}; 