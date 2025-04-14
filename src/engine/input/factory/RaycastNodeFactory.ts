import { INodeFactory } from '../../core/factory/INodeFactory';
import { RaycastNode } from '../RaycastNode';
import { Node3dFactory } from '../../core/factory/Node3dFactory';
import * as THREE from 'three';

/**
 * 射线节点工厂类
 * 负责创建和序列化射线节点
 */
export class RaycastNodeFactory implements INodeFactory {
  /**
   * 创建一个射线节点
   * @param data 节点数据
   * @returns 新创建的射线节点
   */
  createNode(data: any): RaycastNode {
    const name = data?.name || '射线节点';
    const node = new RaycastNode(name);
    
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
    
    // 设置射线节点特定属性
    if (data?.originOffset) {
      const offset = new THREE.Vector3(
        data.originOffset.x || 0,
        data.originOffset.y || 0,
        data.originOffset.z || 0
      );
      node.setOriginOffset(offset);
    }
    
    if (data?.direction) {
      const direction = new THREE.Vector3(
        data.direction.x || 0,
        data.direction.y || 0,
        data.direction.z || -1
      ).normalize();
      node.setDirection(direction);
    }
    
    if (data?.maxDistance !== undefined) {
      node.setMaxDistance(data.maxDistance);
    }
    
    if (data?.enabled !== undefined) {
      node.setEnabled(data.enabled);
    }
    
    if (data?.showHelper !== undefined) {
      node.setShowHelper(data.showHelper);
    }
    
    if (data?.helperColor) {
      const color = new THREE.Color(data.helperColor);
      node.setHelperColor(color);
    }
    
    if (data?.useNodeOrientation !== undefined) {
      node.setUseNodeOrientation(data.useNodeOrientation);
    }
    
    if (data?.continuous !== undefined) {
      node.setContinuous(data.continuous);
    }
    
    return node;
  }

  /**
   * 序列化射线节点
   * @param node 要序列化的射线节点
   * @returns 序列化后的数据对象
   */
  serializeNode(node: RaycastNode): any {
    // 获取基本节点序列化数据
    const baseData = Node3dFactory.serializeBaseNode(node);
    
    // 获取射线节点特定属性
    // 注意：因为某些属性是私有的，我们需要将node视为any类型来访问
    const raycastNode = node as any;
    
    // 添加射线节点特定的数据
    return {
      ...baseData,
      type: 'RaycastNode',
      originOffset: {
        x: raycastNode.originOffset?.x || 0,
        y: raycastNode.originOffset?.y || 0,
        z: raycastNode.originOffset?.z || 0
      },
      direction: {
        x: raycastNode.direction?.x || 0,
        y: raycastNode.direction?.y || 0,
        z: raycastNode.direction?.z || -1
      },
      maxDistance: raycastNode.maxDistance || 100,
      enabled: raycastNode.enabled !== undefined ? raycastNode.enabled : true,
      showHelper: raycastNode.showHelper !== undefined ? raycastNode.showHelper : true,
      helperColor: raycastNode.helperColor ? '#' + raycastNode.helperColor.getHexString() : '#ff0000',
      useNodeOrientation: raycastNode.useNodeOrientation !== undefined ? 
        raycastNode.useNodeOrientation : true,
      continuous: raycastNode.continuous !== undefined ? raycastNode.continuous : true
    };
  }
} 