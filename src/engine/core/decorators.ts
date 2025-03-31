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
      order: options.order || 0
    };
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