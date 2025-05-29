/**
 * 节点类型
 */
export interface EditorNode {
  id: string;
  name: string;
  type: string;
  children: EditorNode[];
  // 其他节点属性...
}

/**
 * 可编辑属性信息
 */
export interface EditablePropertyInfo {
  name: string;
  displayName: string;
  description: string;
  type: string;
  min?: number;
  max?: number;
  step?: number;
  group?: string;
  options?: any[];
}

/**
 * 组件信息
 */
export interface ComponentInfo {
  id: string;
  type: string;
  name: string;
  properties: EditablePropertyInfo[];
}

/**
 * 资源类型
 */
export enum ResourceType {
  Texture = 'texture',
  Material = 'material',
  Mesh = 'mesh',
  Audio = 'audio',
  ParticleSystem = 'particleSystem',
}

/**
 * 资源信息
 */
export interface ResourceInfo {
  id: string;
  name: string;
  type: ResourceType;
  path: string;
  preview?: string; // 预览图URL
  // 其他资源属性...
}

/**
 * 编辑器场景数据
 */
export interface SceneData {
  id: string;
  name: string;
  nodes: EditorNode[];
  resources: ResourceInfo[];
  // 其他场景属性...
}

/**
 * 序列化属性
 */
export interface SerializedProperty {
  type: string;
  value: any;
}

/**
 * 序列化节点
 */
export interface SerializedNode {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  properties: Record<string, SerializedProperty>;
  children: SerializedNode[];
}

/**
 * 序列化资源
 */
export interface SerializedResource {
  id: string;
  name: string;
  type: ResourceType;
  data: any;
} 