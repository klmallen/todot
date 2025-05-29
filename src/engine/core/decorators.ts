/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-08 10:25:47
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-28 17:29:13
 * @FilePath: \todot\src\engine\core\decorators.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 属性装饰器 - 标记可在编辑器中编辑的属性
 */
export function editable(options: {
  displayName?: string;       // 在编辑器中显示的名称
  description?: string;       // 属性描述
  type?: string;              // 属性类型 (number, string, color, vector3, etc)
  min?: number;               // 数值最小值
  max?: number;               // 数值最大值
  step?: number;              // 数值步长
  group?: string;             // 属性分组
  order?: number;             // 显示顺序
} = {}) {
  return function(target: any, propertyKey: string) {
    // 确保目标类有一个用于存储元数据的静态属性
    if (!target.constructor._editableProps) {
      target.constructor._editableProps = {};
    }
    
    // 存储属性元数据
    target.constructor._editableProps[propertyKey] = {
      displayName: options.displayName || propertyKey,
      description: options.description || '',
      type: options.type || 'string',
      min: options.min,
      max: options.max,
      step: options.step || 1,
      group: options.group || 'General',
      order: options.order || 0,
      isAccessor: false
    };
  };
}

/**
 * 属性装饰器 - 标记可在编辑器中编辑的 getter/setter 属性
 */
export function editableAccessor(options: {
  displayName?: string;       
  description?: string;       
  type?: string;              
  min?: number;               
  max?: number;               
  step?: number;              
  group?: string;             
  order?: number;             
} = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // 确保目标类有一个用于存储元数据的静态属性
    if (!target.constructor._editableProps) {
      target.constructor._editableProps = {};
    }
    
    // 存储属性元数据，标记这是一个访问器属性
    target.constructor._editableProps[propertyKey] = {
      displayName: options.displayName || propertyKey,
      description: options.description || '',
      type: options.type || 'string',
      min: options.min,
      max: options.max,
      step: options.step || 1,
      group: options.group || 'General',
      order: options.order || 0,
      isAccessor: true,
      get: descriptor.get,
      set: descriptor.set
    };

    return descriptor;
  };
}

/**
 * 类装饰器 - 标记可在编辑器中编辑的组件或节点
 */
export function editableComponent(options: {
  displayName?: string;
  description?: string;
  icon?: string;
  category?: string;
} = {}) {
  return function<T extends { new(...args: any[]): any }>(constructor: T) {
    constructor.prototype._editorMetadata = {
      displayName: options.displayName || constructor.name,
      description: options.description || '',
      icon: options.icon || 'cube',
      category: options.category || 'General'
    };
    return constructor;
  };
} 