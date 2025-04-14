import { INodeFactory } from '../../core/factory/INodeFactory';
import { MouseNode } from '../MouseNode';
import { Node3dFactory } from '../../core/factory/Node3dFactory';

/**
 * 鼠标节点工厂类
 * 负责创建和序列化鼠标节点
 */
export class MouseNodeFactory implements INodeFactory {
  /**
   * 创建一个鼠标节点
   * @param data 节点数据
   * @returns 新创建的鼠标节点
   */
  createNode(data: any): MouseNode {
    const name = data?.name || '鼠标节点';
    const node = new MouseNode(name);
    
    // 应用变换属性
    if (data?.position) {
      node.position.set(
        data.position.x || 0,
        data.position.y || 0,
        data.position.z || 0
      );
    }
    
    if (data?.rotation) {
      node.rotation.set(
        data.rotation.x || 0,
        data.rotation.y || 0,
        data.rotation.z || 0
      );
    }
    
    if (data?.scale) {
      node.scale.set(
        data.scale.x !== undefined ? data.scale.x : 1,
        data.scale.y !== undefined ? data.scale.y : 1,
        data.scale.z !== undefined ? data.scale.z : 1
      );
    }
    
    // 设置鼠标节点特定属性
    if (data?.enabled !== undefined) {
      node.setEnabled(data.enabled);
    }
    
    // 设置双击检测相关属性
    if (data?.detectDoubleClick !== undefined) {
      (node as any).detectDoubleClick = data.detectDoubleClick;
    }
    
    if (data?.doubleClickTime !== undefined) {
      (node as any).doubleClickTime = data.doubleClickTime;
    }
    
    if (data?.doubleClickDistance !== undefined) {
      (node as any).doubleClickDistance = data.doubleClickDistance;
    }
    
    return node;
  }

  /**
   * 序列化鼠标节点
   * @param node 要序列化的鼠标节点
   * @returns 序列化后的数据对象
   */
  serializeNode(node: MouseNode): any {
    // 获取基本节点序列化数据
    const baseData = Node3dFactory.serializeBaseNode(node);
    
    // 添加鼠标节点特定的数据
    return {
      ...baseData,
      type: 'MouseNode',
      enabled: typeof (node as any).enabled === 'boolean' ? (node as any).enabled : true,
      detectDoubleClick: (node as any).detectDoubleClick !== undefined ? 
        (node as any).detectDoubleClick : true,
      doubleClickTime: (node as any).doubleClickTime || 300,
      doubleClickDistance: (node as any).doubleClickDistance || 10
    };
  }
} 