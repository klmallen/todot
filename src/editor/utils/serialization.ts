import * as THREE from 'three';
import { SerializedNode, SerializedProperty, SerializedResource, ResourceType } from '../types';

/**
 * 序列化THREE.Vector3
 * @param vector 三维向量
 * @returns 序列化后的属性
 */
export function serializeVector3(vector: THREE.Vector3): SerializedProperty {
  return {
    type: 'Vector3',
    value: [vector.x, vector.y, vector.z]
  };
}

/**
 * 反序列化THREE.Vector3
 * @param property 序列化后的属性
 * @returns 三维向量
 */
export function deserializeVector3(property: SerializedProperty): THREE.Vector3 {
  const [x, y, z] = property.value as [number, number, number];
  return new THREE.Vector3(x, y, z);
}

/**
 * 序列化THREE.Color
 * @param color 颜色
 * @returns 序列化后的属性
 */
export function serializeColor(color: THREE.Color): SerializedProperty {
  return {
    type: 'Color',
    value: [color.r, color.g, color.b]
  };
}

/**
 * 反序列化THREE.Color
 * @param property 序列化后的属性
 * @returns 颜色
 */
export function deserializeColor(property: SerializedProperty): THREE.Color {
  const [r, g, b] = property.value as [number, number, number];
  return new THREE.Color(r, g, b);
}

/**
 * 序列化材质
 * @param material 材质
 * @param resourceMap 资源映射
 * @returns 序列化后的属性
 */
export function serializeMaterial(material: THREE.Material, resourceMap: Map<string, SerializedResource>): SerializedProperty {
  // 为材质生成唯一ID
  const id = `material_${material.uuid}`;
  
  // 根据材质类型提取特定属性
  let materialData: any = {
    type: material.type,
    name: material.name,
    transparent: material.transparent,
    opacity: material.opacity,
    side: material.side,
  };
  
  // 针对不同类型的材质提取特定属性
  if (material instanceof THREE.MeshBasicMaterial) {
    materialData.color = [material.color.r, material.color.g, material.color.b];
    materialData.wireframe = material.wireframe;
  } else if (material instanceof THREE.MeshStandardMaterial) {
    materialData.color = [material.color.r, material.color.g, material.color.b];
    materialData.roughness = material.roughness;
    materialData.metalness = material.metalness;
    
    // 处理贴图
    if (material.map) {
      materialData.map = serializeTexture(material.map, resourceMap).value;
    }
  }
  
  // 将材质添加到资源映射
  resourceMap.set(id, {
    id,
    name: material.name || id,
    type: ResourceType.Material,
    data: materialData
  });
  
  return {
    type: 'Material',
    value: id
  };
}

/**
 * 序列化纹理
 * @param texture 纹理
 * @param resourceMap 资源映射
 * @returns 序列化后的属性
 */
export function serializeTexture(texture: THREE.Texture, resourceMap: Map<string, SerializedResource>): SerializedProperty {
  // 为纹理生成唯一ID
  const id = `texture_${texture.uuid}`;
  
  // 提取纹理属性
  const textureData = {
    name: texture.name,
    wrapS: texture.wrapS,
    wrapT: texture.wrapT,
    repeat: [texture.repeat.x, texture.repeat.y],
    offset: [texture.offset.x, texture.offset.y],
    rotation: texture.rotation,
    source: texture.source?.data ? texture.source.data.src : null
  };
  
  // 将纹理添加到资源映射
  resourceMap.set(id, {
    id,
    name: texture.name || id,
    type: ResourceType.Texture,
    data: textureData
  });
  
  return {
    type: 'Texture',
    value: id
  };
}

/**
 * 序列化粒子系统
 * @param particleSystem 粒子系统
 * @param resourceMap 资源映射
 * @returns 序列化后的属性
 */
export function serializeParticleSystem(particleSystem: any, resourceMap: Map<string, SerializedResource>): SerializedProperty {
  // 为粒子系统生成唯一ID
  const id = `particleSystem_${particleSystem.getId()}`;
  
  // 获取粒子系统设置
  const settings = particleSystem.getSettings();
  
  // 提取粒子系统属性
  const particleSystemData = {
    name: particleSystem.getName(),
    duration: settings.duration,
    loop: settings.loop,
    prewarm: settings.prewarm,
    playbackSpeed: settings.playbackSpeed,
    maxParticles: settings.maxParticles,
    playOnAwake: settings.playOnAwake,
    simulationSpace: settings.simulationSpace,
    
    // 发射设置
    emission: {
      rateOverTime: settings.emission.rateOverTime,
    },
    
    // 形状设置
    shape: {
      type: settings.shape.type,
      params: settings.shape.params,
      randomizeDirection: settings.shape.randomizeDirection,
      directionScale: settings.shape.directionScale
    },
    
    // 生命周期设置
    startLifetime: settings.startLifetime,
    startSpeed: settings.startSpeed,
    startSize: settings.startSize,
    startRotation: settings.startRotation,
    startColor: settings.startColor,
    
    // 物理设置
    useGravity: settings.useGravity,
    gravityModifier: settings.gravityModifier,
    
    // 渲染设置
    renderer: {
      renderMode: settings.renderer.renderMode,
      blending: settings.renderer.blending,
      blendMode: settings.renderer.blendMode,
      enableLighting: settings.renderer.enableLighting,
      castShadows: settings.renderer.castShadows,
      receiveShadows: settings.renderer.receiveShadows,
      sortMode: settings.renderer.sortMode
    }
  };
  
  // 将粒子系统添加到资源映射
  resourceMap.set(id, {
    id,
    name: particleSystem.getName() || id,
    type: ResourceType.ParticleSystem,
    data: particleSystemData
  });
  
  return {
    type: 'ParticleSystem',
    value: id
  };
}

/**
 * 序列化场景节点
 * @param node 场景节点
 * @param resourceMap 资源映射
 * @returns 序列化后的节点
 */
export function serializeNode(node: any, resourceMap: Map<string, SerializedResource>): SerializedNode {
  // 提取基本信息
  const position = node.getPosition();
  const rotation = node.getRotation();
  const scale = node.getScale();
  
  // 创建序列化节点
  const serializedNode: SerializedNode = {
    id: node.getId(),
    name: node.getName(),
    type: node.getType(),
    position: [position.x, position.y, position.z],
    rotation: [rotation.x, rotation.y, rotation.z],
    scale: [scale.x, scale.y, scale.z],
    properties: {},
    children: []
  };
  
  // 序列化特定类型的属性
  if (node.getType() === 'ParticleSystem') {
    serializedNode.properties['particleSystem'] = serializeParticleSystem(node, resourceMap);
  }
  
  // 处理子节点
  const children = node.getChildren();
  if (children && children.length > 0) {
    for (const child of children) {
      serializedNode.children.push(serializeNode(child, resourceMap));
    }
  }
  
  return serializedNode;
}

/**
 * 序列化整个场景
 * @param scene 场景对象
 * @returns 序列化后的场景数据
 */
export function serializeScene(scene: any): { nodes: SerializedNode[], resources: SerializedResource[] } {
  // 资源映射
  const resourceMap = new Map<string, SerializedResource>();
  
  // 序列化根节点
  const rootNode = serializeNode(scene, resourceMap);
  
  return {
    nodes: [rootNode],
    resources: Array.from(resourceMap.values())
  };
}

/**
 * 将场景数据导出为JSON字符串
 * @param scene 场景对象
 * @returns JSON字符串
 */
export function exportSceneToJSON(scene: any): string {
  const sceneData = serializeScene(scene);
  return JSON.stringify(sceneData, null, 2);
}

/**
 * 从JSON字符串导入场景数据
 * @param jsonString JSON字符串
 * @returns 场景数据
 */
export function importSceneFromJSON(jsonString: string): { nodes: SerializedNode[], resources: SerializedResource[] } {
  return JSON.parse(jsonString);
} 