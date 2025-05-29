import { EditablePropertyInfo } from '../types';

/**
 * 从对象中提取被@editable装饰器标记的属性
 * @param obj 要提取属性的对象
 * @returns 可编辑属性信息数组
 */
export function getEditableProperties(obj: any): EditablePropertyInfo[] {
  if (!obj || typeof obj !== 'object') return [];
  
  const prototype = Object.getPrototypeOf(obj);
  const properties: EditablePropertyInfo[] = [];
  
  // 获取类上的元数据(由装饰器设置)
  // 假设装饰器在类上添加了__editableProps属性
  const editableProps = prototype?.constructor?.__editableProps || {};
  
  for (const propName in editableProps) {
    const propInfo = editableProps[propName];
    
    // 确保有getter和setter或属性存在于对象上
    const descriptor = Object.getOwnPropertyDescriptor(prototype, propName) || 
                     Object.getOwnPropertyDescriptor(obj, propName);
    
    if (descriptor && (descriptor.get || propName in obj)) {
      properties.push({
        name: propName,
        displayName: propInfo.displayName || propName,
        description: propInfo.description || '',
        type: propInfo.type || typeof obj[propName],
        min: propInfo.min,
        max: propInfo.max,
        step: propInfo.step,
        group: propInfo.group,
        options: propInfo.options
      });
    }
  }
  
  return properties;
}

/**
 * 按组对可编辑属性进行分组
 * @param properties 可编辑属性数组
 * @returns 分组后的属性对象
 */
export function groupEditableProperties(properties: EditablePropertyInfo[]): { [group: string]: EditablePropertyInfo[] } {
  const groups: { [group: string]: EditablePropertyInfo[] } = {};
  
  // 默认组名
  const defaultGroup = '基本属性';
  
  properties.forEach(prop => {
    const groupName = prop.group || defaultGroup;
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    
    groups[groupName].push(prop);
  });
  
  return groups;
}

/**
 * 获取包含装饰器信息的组件类型
 * @param component 组件对象
 * @returns 组件类型信息
 */
export function getComponentMetadata(component: any): { displayName: string, description: string, icon: string, category: string } {
  if (!component) return { displayName: '', description: '', icon: '', category: '' };
  
  const prototype = Object.getPrototypeOf(component);
  const metadata = prototype?.constructor?.__componentMetadata || {};
  
  return {
    displayName: metadata.displayName || '',
    description: metadata.description || '',
    icon: metadata.icon || '',
    category: metadata.category || ''
  };
}

/**
 * 解析编辑器组件标记
 * @param component 组件类或组件实例
 */
export function isEditableComponent(component: any): boolean {
  if (!component) return false;
  
  // 如果是实例，获取其构造函数
  const ctor = typeof component === 'function' ? component : component.constructor;
  
  // 检查是否有__componentMetadata标记
  return !!ctor.__componentMetadata;
} 