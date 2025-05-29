/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:34:45
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-06 17:34:54
 * @FilePath: \todot\src\engine\editor\types.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 编辑器类型定义
 */

// 场景树节点类型
export interface SceneNode {
  id: string;
  name: string;
  type?: 'mesh' | 'light' | 'camera' | 'group' | 'other';
  visible?: boolean;
  children?: SceneNode[];
}

// 资源类型
export type AssetType = 'folder' | 'model' | 'texture' | 'sound' | 'script' | 'other';

// 资源项接口
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  path?: string;
  thumbnail?: string;
}

// 编辑器配置
export interface EditorConfig {
  showGrid?: boolean;
  showGizmos?: boolean;
  darkMode?: boolean;
}

// 编辑器状态
export interface EditorState {
  selectedNode?: string;
  expandedNodes?: string[];
  selectedAsset?: string;
  currentFolder?: string;
  config: EditorConfig;
} 