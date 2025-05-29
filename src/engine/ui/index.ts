/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-27 15:20:49
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-06 16:34:37
 * @FilePath: \todot\src\engine\ui\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { EditorUI } from './EditorUI';
import { EditorToolbar } from './EditorToolbar';
import { PropertyPanel } from './PropertyPanel';
import Engine from '../core/Engine';
import { setEditorActive } from '../states/useEditorMode';
import * as ReactDOM from 'react-dom/client';
import React from 'react';
import { EditorUIElement } from './EditorUIElement';
// 导入PropertyPanelElement类型
import type { PropertyPanelElement } from './PropertyPanelElement';
/**
 * 初始化编辑器UI
 * @param container 容器元素
 * @param engine 引擎实例
 * @deprecated 使用 createEditorUI 替代，或直接使用 todot-editor-ui 元素
 */
export function initEditorUI(container: HTMLElement, engine: Engine): void {
  // 初始化编辑器模式
  engine.initEditorMode();
  setEditorActive(true);
  
  // 渲染编辑器UI
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(EditorUI, { engine }));
}

/**
 * 创建编辑器UI元素
 * @param engine 引擎实例
 * @returns 创建的编辑器UI元素
 */
export function createEditorUI(engine: Engine): EditorUIElement {
  // 创建自定义元素
  const editorUI = document.createElement('todot-editor-ui') as EditorUIElement;
  
  // 设置引擎实例
  editorUI.setEngine(engine);
  
  return editorUI;
}

/**
 * 创建属性面板元素
 * @returns 创建的属性面板元素
 */
export function createPropertyPanel(): HTMLElement {
  // 创建自定义元素
  const propertyPanel = document.createElement('todot-property-panel') as HTMLElement;
  return propertyPanel;
}

/**
 * 初始化默认引擎UI设置，包括属性面板快捷键支持
 * @param engine 引擎实例
 * @param options 选项
 */
export function initDefaultEngineUISettings(
  engine: any, 
  options: { 
    enablePropertyPanelShortcuts?: boolean;
    showPropertyPanel?: boolean;
  } = {}
): void {
  // 启用属性面板快捷键
  if (options.enablePropertyPanelShortcuts) {
    engine.initPropertyPanelShortcuts();
  }
  
  // 显示默认属性面板
  if (options.showPropertyPanel !== false) {
    // 如果属性面板不存在，创建一个
    if (!engine.getPropertyPanel()) {
      engine.createPropertyPanel();
    }
  } else if (options.showPropertyPanel === false) {
    // 如果明确设置为false，关闭属性面板
    engine.closePropertyPanel();
  }
}

// 导出UI组件
export { EditorUI, EditorToolbar, PropertyPanel, EditorUIElement };
export * from './PropertyPanel';
export * from './SceneTreeView';
export * from './SceneTreeContainer'; 