import { INodeFactory } from './NodeFactory';
import { AnimationNode3D } from '../AnimationNode3D';
import * as THREE from 'three';
import { nodeFactory } from '../decorators/nodeDecorators';
import { Node3dFactory } from './Node3dFactory';

@nodeFactory()
export class AnimationNode3DFactory extends Node3dFactory {
  createNode(data: any): AnimationNode3D {
    const node = new AnimationNode3D(data.name);
    
    // 设置基本属性
    if (data.position) {
      node.position.set(
        data.position.x,
        data.position.y,
        data.position.z
      );
    }
    
    if (data.rotation) {
      node.rotation.set(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z
      );
    }
    
    if (data.scale) {
      node.scale.set(
        data.scale.x,
        data.scale.y,
        data.scale.z
      );
    }
    
    // 设置动画属性
    if (data.animationSpeed !== undefined) {
      node.setAnimationSpeed(data.animationSpeed);
    }
    
    if (data.animationNames) {
      data.animationNames.forEach((name: string) => {
        node.addAnimationName(name);
      });
    }
    
    return node;
  }
  
  serializeNode(node: AnimationNode3D): any {
    return {
      type: 'AnimationNode3D',
      name: node.getName(),
      position: {
        x: node.position.x,
        y: node.position.y,
        z: node.position.z
      },
      rotation: {
        x: node.rotation.x,
        y: node.rotation.y,
        z: node.rotation.z
      },
      scale: {
        x: node.scale.x,
        y: node.scale.y,
        z: node.scale.z
      },
      animationSpeed: node.getAnimationSpeed(),
      animationNames: node.getAnimationNames()
    };
  }
} 