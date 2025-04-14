import { INodeFactory } from '../../core/factory/INodeFactory';
import { InputNode } from '../InputNode';
import { Node3dFactory } from '../../core/factory/Node3dFactory';
import { IInputMapping, DEFAULT_INPUT_MAPPING } from '../IInputMapping';

/**
 * 输入节点工厂类
 * 负责创建和序列化输入节点
 */
export class InputNodeFactory implements INodeFactory {
  /**
   * 创建一个输入节点
   * @param data 节点数据
   * @returns 新创建的输入节点
   */
  createNode(data: any): InputNode {
    const name = data?.name || '输入节点';
    const node = new InputNode(name);
    
    // 应用转换属性
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
    
    // 设置输入映射
    if (data?.mapping) {
      node.setMapping(data.mapping);
    }
    
    // 设置启用状态
    if (data?.enabled !== undefined) {
      node.setEnabled(data.enabled);
    }
    
    return node;
  }

  /**
   * 序列化输入节点
   * @param node 要序列化的输入节点
   * @returns 序列化后的数据对象
   */
  serializeNode(node: InputNode): any {
    // 获取基本节点序列化数据
    const baseData = Node3dFactory.serializeBaseNode(node);
    
    // 添加输入节点特定的数据
    return {
      ...baseData,
      type: 'InputNode',
      mapping: (node as any).mapping || DEFAULT_INPUT_MAPPING,
      enabled: typeof (node as any).enabled === 'boolean' ? (node as any).enabled : true
    };
  }
} 