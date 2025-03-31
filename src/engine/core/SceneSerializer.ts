// src/engine/utils/SceneSerializer.ts

import { Scene } from '../core/Scene';
import { Node3d } from '../core/Node3d';
import * as THREE from 'three';
import Engine from '../core/Engine';
import { Script } from './Script/Script';
import { ScriptRegistry } from '../core/Script/ScriptRegistry';

// 导入所有可用的组件类，用于反序列化
import { CameraNode3D } from '../core/CameraNode3D';
import { MeshInstance3D } from '../core/MeshInstance3D';
import { ModelLoader3D } from '../core/ModelLoader3D';
import { TextureLoader3D } from '../core/Texture/TextureLoader3D';
import { TerrainSystem } from '../core/TerrainSystem/TerrainSystem';
import { VegetationSystem } from '../core/TerrainSystem/VegetationSystem';
// 其他组件...

// 组件类型映射，用于反序列化
const componentTypeMap: { [key: string]: any } = {
  'CameraNode3D': CameraNode3D,
  'MeshInstance3D': MeshInstance3D,
  'ModelLoader3D': ModelLoader3D,
  'TextureLoader3D': TextureLoader3D,
  'TerrainSystem': TerrainSystem,
  'VegetationSystem': VegetationSystem,
  'Node3d': Node3d,
  // 其他组件...
};

export class SceneSerializer {
  /**
   * 将场景序列化为JSON字符串
   * @param scene 要序列化的场景
   * @param prettyPrint 是否格式化输出
   * @returns JSON字符串
   */
  public static serializeScene(scene: Scene, prettyPrint: boolean = false): string {
    const sceneJSON = scene.toJSON();
    
    // 添加版本信息和时间戳
    const exportData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      engine: 'VFX-Editor',
      scene: sceneJSON
    };
    
    return JSON.stringify(exportData, null, prettyPrint ? 2 : 0);
  }
  
  /**
   * 从JSON字符串反序列化场景
   * @param jsonStr JSON字符串
   * @returns 新的场景实例
   */
  public static deserializeScene(jsonStr: string): Scene {
    const data = JSON.parse(jsonStr);
    const sceneData = data.scene;
    
    // 创建新场景
    const scene = new Scene(sceneData.name);
    
    // 清除默认的根节点子节点
    const rootNode = scene.getRootNode();
    const children = [...rootNode.getChildren()];
    children.forEach(child => rootNode.removeChild(child));
    
    // 反序列化根节点的子节点
    if (sceneData.rootNode.children && sceneData.rootNode.children.length > 0) {
      sceneData.rootNode.children.forEach((childData: any) => {
        const child = this.deserializeNode(childData);
        if (child) {
          rootNode.addChild(child);
        }
      });
    }
    
    // 设置场景激活状态
    if (sceneData.active) {
      scene.activate();
    }
    
    return scene;
  }
  
  /**
   * 反序列化节点
   * @param nodeData 节点数据
   * @returns 节点实例
   */
  private static deserializeNode(nodeData: any): Node3d | null {
    // 获取节点类型构造函数
    const NodeConstructor = componentTypeMap[nodeData.type] || Node3d;
    
    if (!NodeConstructor) {
      console.warn(`未知节点类型: ${nodeData.type}`);
      return null;
    }
    
    // 创建节点实例
    const node = new NodeConstructor(nodeData.name);
    
    // 设置位置、旋转和缩放
    if (nodeData.position) {
      node.position.set(
        nodeData.position.x,
        nodeData.position.y,
        nodeData.position.z
      );
    }
    
    if (nodeData.rotation) {
      node.rotation.set(
        nodeData.rotation.x,
        nodeData.rotation.y,
        nodeData.rotation.z
      );
    }
    
    if (nodeData.scale) {
      node.scale.set(
        nodeData.scale.x,
        nodeData.scale.y,
        nodeData.scale.z
      );
    }
    
    // 设置可见性
    if (nodeData.visible !== undefined) {
      node.getThreeObject().visible = nodeData.visible;
    }
    
    // 设置标签
    if (nodeData.tags && Array.isArray(nodeData.tags)) {
      nodeData.tags.forEach((tag: string) => node.addTag(tag));
    }
    
    // 处理特定组件数据
    this.deserializeComponentData(node, nodeData);
    
    // 添加脚本
    if (nodeData.scripts && Array.isArray(nodeData.scripts)) {
      nodeData.scripts.forEach((scriptData: any) => {
        this.deserializeScript(node, scriptData);
      });
    }
    
    // 递归处理子节点
    if (nodeData.children && Array.isArray(nodeData.children)) {
      nodeData.children.forEach((childData: any) => {
        const childNode = this.deserializeNode(childData);
        if (childNode) {
          node.addChild(childNode);
        }
      });
    }
    
    return node;
  }
  
  /**
   * 反序列化组件特定数据
   * @param node 节点实例
   * @param nodeData 节点数据
   */
  private static deserializeComponentData(node: Node3d, nodeData: any): void {
    // 处理TerrainSystem数据
    if (node instanceof TerrainSystem && nodeData.terrainData) {
      const terrainData = nodeData.terrainData;
      
      // 设置基本参数
      node.terrainSize.set(terrainData.terrainSize.x, terrainData.terrainSize.y);
      node.resolution = terrainData.resolution;
      node.maxHeight = terrainData.maxHeight;
      node.chunksX = terrainData.chunksX;
      node.chunksY = terrainData.chunksY;
      node.chunkSize.set(terrainData.chunkSize.x, terrainData.chunkSize.y);
      
      // 初始化（这将创建默认的高度场和材质）
      node.initialize();
      
      // 恢复高度场数据
      if (terrainData.heightData) {
        node.getHeightfield().deserialize(terrainData.heightData);
        node.update(); // 更新网格以反映高度变化
      }
      
      // 恢复材质层
      if (terrainData.materialLayers && Array.isArray(terrainData.materialLayers)) {
        // 清除现有材质层
        node.material.clearLayers();
        
        // 加载并应用材质层
        terrainData.materialLayers.forEach(async (layerInfo: any) => {
          try {
            // 加载纹理
            const textureLoader = new THREE.TextureLoader();
            const texture = await new Promise<THREE.Texture>((resolve, reject) => {
              textureLoader.load(layerInfo.texturePath, resolve, undefined, reject);
            });
            
            // 加载法线贴图（如果有）
            let normalMap: THREE.Texture | undefined;
            if (layerInfo.normalMapPath) {
              normalMap = await new Promise<THREE.Texture>((resolve, reject) => {
                textureLoader.load(layerInfo.normalMapPath, resolve, undefined, reject);
              });
            }
            
            // 添加材质层
            node.material.addLayer({
              texture,
              normalMap,
              tiling: layerInfo.tiling,
              minHeight: layerInfo.minHeight,
              maxHeight: layerInfo.maxHeight,
              minSlope: layerInfo.minSlope,
              maxSlope: layerInfo.maxSlope
            });
            
            // 更新材质
            node.material.updateLayers();
          } catch (error) {
            console.warn(`加载材质层纹理失败: ${error}`);
          }
        });
      }
    }
    
    // 处理VegetationSystem数据
    if (node instanceof VegetationSystem && nodeData.vegetationData) {
      const vegData = nodeData.vegetationData;
      
      // 设置风参数
      if (vegData.windParameters) {
        const wind = vegData.windParameters;
        node.updateWindParameters(
          wind.strength,
          wind.frequency,
          new THREE.Vector2(wind.direction.x, wind.direction.y)
        );
      }
      
      // 添加植被类型
      if (vegData.vegetationTypes && Array.isArray(vegData.vegetationTypes)) {
        vegData.vegetationTypes.forEach((typeInfo: any) => {
          node.addVegetationType(
            typeInfo.id,
            typeInfo.modelPath,
            new THREE.Vector3(typeInfo.scale.x, typeInfo.scale.y, typeInfo.scale.z),
            typeInfo.bendFactor,
            typeInfo.heightOffset
          );
        });
      }
      
      // 应用图层植被映射
      if (vegData.layerVegetationMap && Array.isArray(vegData.layerVegetationMap)) {
        vegData.layerVegetationMap.forEach((layerMapping: any) => {
          const layerIndex = layerMapping.layerIndex;
          const settings = layerMapping.settings;
          
          if (settings && Array.isArray(settings)) {
            settings.forEach((setting: any) => {
              // 为每个植被类型添加到对应图层
              node.addVegetationToLayer(
                layerIndex,
                setting.vegetationId,
                setting.weight,
                setting.density,
                setting.clustering,
                setting.minSlope,
                setting.maxSlope
              );
            });
          }
        });
        
        // 更新植被分布
        node.updateVegetationDistribution();
      }
    }
  }
  
  /**
   * 反序列化脚本
   * @param node 节点
   * @param scriptData 脚本数据
   */
  private static deserializeScript(node: Node3d, scriptData: any): void {
    // 从ScriptRegistry获取脚本类
    const ScriptConstructor = ScriptRegistry.getScript(scriptData.type);
    
    if (ScriptConstructor) {
      // 创建脚本实例
      const script = new ScriptConstructor();
      
      // 添加到节点
      node.addScript(script);
      
      // 设置脚本属性
      if (scriptData.properties && typeof scriptData.properties === 'object') {
        Object.keys(scriptData.properties).forEach(key => {
          try {
            (script as any)[key] = scriptData.properties[key];
          } catch (error) {
            console.warn(`为脚本设置属性 ${key} 失败:`, error);
          }
        });
      }
      
      // 设置启用状态
      if (scriptData.enabled !== undefined) {
        script.setEnabled(scriptData.enabled);
      }
    } else {
      console.warn(`未找到脚本类型: ${scriptData.type}，请确保已注册到ScriptRegistry`);
    }
  }
  
  /**
   * 应用组件特定属性
   * @param node 节点
   * @param properties 属性对象
   */
  private static applyProperties(node: Node3d, properties: any): void {
    // 获取可编辑属性
    const editableProps = node.getEditableProperties();
    
    // 应用属性
    Object.keys(properties).forEach(key => {
      if (key in editableProps) {
        try {
          (node as any)[key] = properties[key];
        } catch (error) {
          console.warn(`为节点 ${node.getName()} 设置属性 ${key} 失败:`, error);
        }
      }
    });
  }
  
  /**
   * 导出场景为文件
   * @param scene 场景
   * @param filename 文件名
   */
  public static exportSceneToFile(scene: Scene, filename: string = 'scene.json'): void {
    const jsonStr = this.serializeScene(scene, true);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
  
  /**
   * 从文件导入场景
   * @param file 文件对象
   * @returns Promise<Scene>
   */
  public static importSceneFromFile(file: File): Promise<Scene> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const jsonStr = e.target?.result as string;
          const scene = this.deserializeScene(jsonStr);
          resolve(scene);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      
      reader.readAsText(file);
    });
  }
}