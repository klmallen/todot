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
import { AnimationNode3D } from '../core/AnimationNode3D';
import { ParticleSystem } from '../core/ParticleSystem/ParticleSystem';
import { LightNode3D } from '../core/Light/LightNode3D';
import { SwordTrailParticle } from '../core/ParticleSystem/SwordTrailParticle';
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
  'AnimationNode3D': AnimationNode3D,
  'ParticleSystem': ParticleSystem,
  'LightNode3D': LightNode3D,
  'SwordTrailParticle': SwordTrailParticle
};

export class SceneSerializer {
  // 存储已加载的脚本
  private static scriptsMap = new Map<string, any>();
  // 项目根路径
  private static projectRoot: string = '';

  /**
   * 设置项目根路径
   * @param root 项目根路径
   */
  public static setProjectRoot(root: string) {
    this.projectRoot = root;
    console.log('Set project root:', root);
  }

  /**
   * 初始化并加载所有脚本
   * @returns Promise<void>
   */
  public static async initializeScripts(): Promise<void> {
    try {
    

      // 使用完整路径进行加载
      const scriptPattern = `${this.projectRoot}/src/demoScript/**/*.ts`;
      console.log('Loading scripts from:', scriptPattern);

      const modules = import.meta.glob('/src/demoScript/**/*.ts', {
        eager: false
      });

      for (const path in modules) {
        try {
          const module = await modules[path]();
          // 将绝对路径转换为项目相对路径
          const relativePath = path.replace(/^\/src\/demoScript\//, '').replace(/\.ts$/, '');
          
          if (module.default) {
            this.scriptsMap.set(relativePath, module.default);
            ScriptRegistry.registerScript(relativePath, module.default);
            console.log(`Loaded script: ${relativePath}`);
          }
        } catch (error) {
          console.error(`Failed to load script at ${path}:`, error);
        }
      }

      console.log('All scripts loaded:', Array.from(this.scriptsMap.keys()));
    } catch (error) {
      console.error('Script initialization failed:', error);
    }
  }

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
    const sceneData = JSON.parse(jsonStr);
    
    console.log(sceneData, 'sceneData')
    // 创建新场景
    const scene = new Scene(sceneData.scene.name);
    
    // 清除默认的根节点子节点
    const rootNode = scene.getRootNode();
    const children = [...rootNode.getChildren()];
    children.forEach(child => rootNode.removeChild(child));
    
    // 反序列化根节点的直接子节点
    if (sceneData.scene.rootNode.children && sceneData.scene.rootNode.children.length > 0) {
      sceneData.scene.rootNode.children.forEach((childData: any) => {
        const child = this.deserializeNode(childData, scene);
        if (child) {
          // 对于根节点的直接子节点，使用 scene.addNode
          scene.addNode(child);
        }
      });
    }
    
    // 设置场景激活状态
    scene.activate();
    
    return scene;
  }
  
  /**
   * 反序列化节点
   * @param nodeData 节点数据
   * @param scene 场景实例，仅用于根节点的直接子节点
   * @returns 节点实例
   */
  private static deserializeNode(nodeData: any, scene?: Scene): Node3d | null {
    // 创建节点实例
    const node = this.createNodeInstance(nodeData);
    
    if(!node) return null;

    // 处理特定组件数据
    this.deserializeComponentData(node, nodeData);
    
    // 添加脚本
    if(nodeData.scripts && Array.isArray(nodeData.scripts)) {
      console.log(nodeData.scripts,'nodeData.scripts 996')
      nodeData.scripts.forEach((scriptData: any) => {
        this.deserializeScript(node, scriptData);
      });
    }
    
    // 递归处理子节点
    if(nodeData.children && Array.isArray(nodeData.children)) {
      nodeData.children.forEach((childData: any) => {
        const childNode = this.deserializeNode(childData);
        if(childNode) {
          node.addChild(childNode);
        }
      });
    }
    
    return node;
  }
  
  /**
   * 创建节点实例
   * @param nodeData 节点数据
   * @returns 节点实例
   */
  private static createNodeInstance(nodeData: any): Node3d | null {
    const NodeConstructor = componentTypeMap[nodeData.type] || Node3d;
    
    if (!NodeConstructor) {
      console.warn(`未知节点类型: ${nodeData.type}`);
      return null;
    }

    let node: Node3d;
    
    switch(nodeData.type) {
      case 'MeshInstance3D':
        node = new NodeConstructor(
          nodeData.name,
          this.createGeometry(nodeData.geometry),
          this.createMaterial(nodeData.material)
        );
        break;
        
      case 'ModelLoader3D':
        node = new NodeConstructor(nodeData.name);
        if(nodeData.modelPath) {
          (node as ModelLoader3D).loadModel(nodeData.modelPath);
        }
        break;
        
      case 'TerrainSystem':
        node = new NodeConstructor(nodeData.name);
        // TerrainSystem的特殊初始化可以在deserializeComponentData中处理
        break;
        
      case 'VegetationSystem':
        node = new NodeConstructor(nodeData.name);
        // VegetationSystem的特殊初始化可以在deserializeComponentData中处理
        break;
        
      case 'CameraNode3D':
        node = new NodeConstructor(nodeData.name);
        // 相机的特殊属性设置
        break;
        
      default:
        node = new NodeConstructor(nodeData.name);
    }

    // 设置基本属性
    if(nodeData.position) {
      node.setPosition(
        nodeData.position.x,
        nodeData.position.y,
        nodeData.position.z
      );
    }
    
    if(nodeData.rotation) {
      node.setRotation(
        nodeData.rotation.x,
        nodeData.rotation.y,
        nodeData.rotation.z
      );
    }
    
    if(nodeData.scale) {
      node.setScale(
        nodeData.scale.x,
        nodeData.scale.y,
        nodeData.scale.z
      );
    }

    // 设置可见性
    if(nodeData.visible !== undefined) {
      node.getThreeObject().visible = nodeData.visible;
    }

    // 设置标签
    if(nodeData.tags && Array.isArray(nodeData.tags)) {
      nodeData.tags.forEach((tag: string) => node.addTag(tag));
    }

    return node;
  }

  public deserializeGeometry(data: any): THREE.BufferGeometry | null {
    if (!data) return null;

    // 使用 Three.js 的 BufferGeometryLoader 来加载几何体
    const loader = new THREE.BufferGeometryLoader();
    try {
      return loader.parse(data);
    } catch (error) {
      console.warn('几何体反序列化失败:', error);
      return new THREE.BufferGeometry();
    }
  }

  public deserializeMaterial(data: any): THREE.Material | null {
    if (!data) return null;

    // 使用 Three.js 的 MaterialLoader 来加载材质
    const loader = new THREE.MaterialLoader();
    try {
      return loader.parse(data);
    } catch (error) {
      console.warn('材质反序列化失败:', error);
      return new THREE.MeshBasicMaterial();
    }
  }
  /**
   * 反序列化组件特定数据
   * @param node 节点实例
   * @param nodeData 节点数据
   */
  private static deserializeComponentData(node: Node3d, nodeData: any): void {
    if(node instanceof MeshInstance3D){
      (node as MeshInstance3D).geometry = this.createGeometry(nodeData.geometry) || undefined;
      (node as MeshInstance3D).material = this.createMaterial(nodeData.material) || undefined;
      console.log(node.getThreeObject(),'node.getThreeObject()')
    }
    if (node instanceof ModelLoader3D) {
      (node as ModelLoader3D).loadModel(nodeData.modelPath);
    }
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

    // 处理AnimationNode3D数据
    if (node instanceof AnimationNode3D && nodeData.animationData) {
      const animNode = node as AnimationNode3D;
      const animData = nodeData.animationData;

      // 设置动画速度
      if (typeof animData.animationSpeed === 'number') {
        animNode.setSpeed(animData.animationSpeed);
      }

      // 设置过渡时间
      if (typeof animData.transitionDuration === 'number') {
        animNode.setTransitionDuration(animData.transitionDuration);
      }

      // 如果有模型数据，设置模型
      if (animData.model) {
        // 如果是ModelLoader3D实例
        if (animData.model.type === 'ModelLoader3D') {
          const modelLoader = new ModelLoader3D(animData.model.name);
          modelLoader.loadModel(animData.model.path).then(() => {
            animNode.setModel(modelLoader);
            
            // 恢复动画状态
            if (animData.currentAnimation && animData.isPlaying) {
              animNode.play(animData.currentAnimation, {
                loop: animData.loop,
                speed: animData.animationSpeed
              });
            }
          });
        } 
        // 如果是普通THREE.Object3D
        else {
          const object = new THREE.Object3D();
          // 设置基本属性
          object.position.copy(animData.model.position);
          object.rotation.copy(animData.model.rotation);
          object.scale.copy(animData.model.scale);
          
          // 如果有动画数据，创建动画剪辑
          if (animData.animations) {
            const animations = animData.animations.map((clipData: any) => {
              return THREE.AnimationClip.parse(clipData);
            });
            
            // 将动画添加到对象
            (object as any).animations = animations;
          }
          
          animNode.setModel(object);
          
          // 恢复动画状态
          if (animData.currentAnimation && animData.isPlaying) {
            animNode.play(animData.currentAnimation, {
              loop: animData.loop,
              speed: animData.animationSpeed
            });
          }
        }
      }
    }

    // 处理 ParticleSystem 数据
    if (node instanceof ParticleSystem && nodeData.particleSystemData) {
      const particleSystem = node as ParticleSystem;
      particleSystem.fromJSON(nodeData);
    }

    // 处理 LightNode3D 数据
    if (node instanceof LightNode3D) {
      const lightNode = node as LightNode3D;
      lightNode.fromJSON(nodeData);
    }
  }
  
  /**
   * 反序列化脚本
   */
  private static async deserializeScript(node: Node3d, scriptData: any): Promise<void> {

    let ScriptConstructor = ScriptRegistry.getScript(scriptData.type);
    
    if (!ScriptConstructor && scriptData.path) {
      try {
        // 将完整路径转换为相对路径
        const fullPath = scriptData.path;
        const relativePath = fullPath
          .replace(/\.ts$/, '');

        ScriptConstructor = this.scriptsMap.get(relativePath);
        console.log(ScriptConstructor,'ScriptConstructor')
        if (!ScriptConstructor) {
          console.log(`Attempting to dynamically load script: ${relativePath}`);
          const importPath = `../../../src/scriptDemo/PlayerController`;
         console.log(importPath,'importPath')
          const module = await import(
            importPath
          );
          ScriptConstructor = module.default;

          if (ScriptConstructor) {
            this.scriptsMap.set(relativePath, ScriptConstructor);
            ScriptRegistry.registerScript(relativePath, ScriptConstructor);
          }
        }
      } catch (error) {
        console.error(`Failed to load script: ${scriptData.path}`, error);
      }
    }

    if (ScriptConstructor) {
      try {
        // alert(node.name)
        node.addScript(ScriptConstructor);
      } catch (error) {
        console.error(`Failed to instantiate script: ${scriptData.type}`, error);
      }
    } else {
      console.warn(`Script not found: ${scriptData.type}`);
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
   * 将场景导出为JSON对象
   * @param scene 要导出的场景
   * @returns JSON对象
   */
  public static exportSceneToObject(scene: Scene): any {
    const jsonStr = this.serializeScene(scene, false);
    return JSON.parse(jsonStr);
  }
  
  /**
   * 从JSON对象导入场景
   * @param jsonObj JSON对象
   * @returns 场景实例
   */
  public static importSceneFromObject(jsonObj: any): Scene {
    const jsonStr = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj);
    return this.deserializeScene(jsonStr);
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

  /**
   * 序列化引擎状态
   * @param engine 引擎实例
   */
  public static serializeEngineState(engine: Engine): string {
    return JSON.stringify(engine.exportEngineState());
  }

  /**
   * 反序列化引擎状态
   * @param json 引擎状态JSON字符串
   * @param engine 引擎实例
   */
  public static deserializeEngineState(json: string, engine: Engine): void {
    const state = JSON.parse(json);
    engine.importEngineState(state);
  }

  private serializeNode(node: Node3d): any {
    const data: any = {
      id: node.id,
      name: node.name,
      type: node.type,
      position: node.getPosition(),
      rotation: node.getRotation(),
      scale: node.getScale(),
      visible: node.isVisible,
      tags: node.tags,
      children: node.children.map(child => this.serializeNode(child)),
      scripts: node.scripts.map(script => this.serializeScript(script))
    };

    // 处理 AnimationNode3D 的特殊情况
    if (node instanceof AnimationNode3D) {
      const animNode = node as AnimationNode3D;
      data.animationData = {
        animationSpeed: animNode.getAnimationSpeed(),
        transitionDuration: animNode.transitionDuration,
        isPlaying: animNode.isPlaying,
        currentAnimation: null, // 将在下面设置
        loop: true, // 默认值，实际应该从当前动画状态获取
        
        // 序列化模型数据
        model: null, // 将在下面设置
        
        // 序列化动画剪辑
        animations: Array.from(animNode.animations.values()).map(clip => {
          return clip.toJSON();
        })
      };

      // 获取当前播放的动画名称
      if (animNode.currentAction) {
        data.animationData.currentAnimation = animNode.currentAction.getClip().name;
        data.animationData.loop = animNode.currentAction.loop === THREE.LoopRepeat;
      }

      // 序列化模型
      const model = animNode.model;
      if (model) {
        if (model instanceof ModelLoader3D) {
          data.animationData.model = {
            type: 'ModelLoader3D',
            name: model.name,
            path: model.modelPath
          };
        } else {
          data.animationData.model = {
            type: 'Object3D',
            position: model.position.toArray(),
            rotation: model.rotation.toArray(),
            scale: model.scale.toArray()
          };
        }
      }
    }

    // 处理 ModelLoader3D 的特殊情况
    if (node instanceof ModelLoader3D) {
    
      data.modelPath = node.modelPath;
      // alert(node.modelPath)
    }

    // 处理 Mesh 的特殊情况
    if (node instanceof THREE.Mesh) {
      data.geometry = this.serializeGeometry(node.geometry);
      data.material = this.serializeMaterial(node.material);
    }

    return data;
  }

  private serializeGeometry(geometry: THREE.BufferGeometry): any {
    if (!geometry) return null;

    const data: any = {
      type: geometry.type,
      attributes: {}
    };

    // 序列化几何体的属性
    for (const name in geometry.attributes) {
      const attribute = geometry.attributes[name];
      data.attributes[name] = {
        array: Array.from(attribute.array),
        itemSize: attribute.itemSize,
        normalized: attribute.normalized
      };
    }

    return data;
  }

  private serializeMaterial(material: THREE.Material): any {
    if (!material) return null;

    const data: any = {
      type: material.type,
      uuid: material.uuid,
      name: material.name,
      color: material.color?.getHex(),
      opacity: material.opacity,
      transparent: material.transparent,
      side: material.side,
      depthWrite: material.depthWrite,
      depthTest: material.depthTest
    };

    // 处理不同类型的材质
    if (material instanceof THREE.MeshStandardMaterial) {
      data.roughness = material.roughness;
      data.metalness = material.metalness;
      data.envMapIntensity = material.envMapIntensity;
    }

    return data;
  }

  // 几何体工厂方法
  static createGeometry(geoData: any): THREE.BufferGeometry {
    const { type, parse } = geoData;
    
    switch(type) {
      case 'PlaneGeometry':
        return new THREE.PlaneGeometry(
          parse.width,
          parse.height, 
          parse.widthSegments,
          parse.heightSegments
        );
        
      case 'BoxGeometry':
        return new THREE.BoxGeometry(
          parse.width,
          parse.height,
          parse.depth,
          parse.widthSegments, 
          parse.heightSegments,
          parse.depthSegments
        );
        
      case 'SphereGeometry':
        return new THREE.SphereGeometry(
          parse.radius,
          parse.widthSegments,
          parse.heightSegments,
          parse.phiStart,
          parse.phiLength,
          parse.thetaStart, 
          parse.thetaLength
        );

      case 'CircleGeometry':
        return new THREE.CircleGeometry(
          parse.radius,
          parse.segments,
          parse.thetaStart,
          parse.thetaLength
        );

      case 'ConeGeometry':
        return new THREE.ConeGeometry(
          parse.radius,
          parse.height,
          parse.radialSegments,
          parse.heightSegments,
          parse.openEnded,
          parse.thetaStart,
          parse.thetaLength
        );

      case 'CylinderGeometry':
        return new THREE.CylinderGeometry(
          parse.radiusTop,
          parse.radiusBottom,
          parse.height,
          parse.radialSegments,
          parse.heightSegments,
          parse.openEnded,
          parse.thetaStart,
          parse.thetaLength
        );

      case 'DodecahedronGeometry':
        return new THREE.DodecahedronGeometry(
          parse.radius,
          parse.detail
        );

      case 'IcosahedronGeometry':
        return new THREE.IcosahedronGeometry(
          parse.radius,
          parse.detail
        );

      case 'OctahedronGeometry':
        return new THREE.OctahedronGeometry(
          parse.radius,
          parse.detail
        );

      case 'RingGeometry':
        return new THREE.RingGeometry(
          parse.innerRadius,
          parse.outerRadius,
          parse.thetaSegments,
          parse.phiSegments,
          parse.thetaStart,
          parse.thetaLength
        );

      case 'TetrahedronGeometry':
        return new THREE.TetrahedronGeometry(
          parse.radius,
          parse.detail
        );

      case 'TorusGeometry':
        return new THREE.TorusGeometry(
          parse.radius,
          parse.tube,
          parse.radialSegments,
          parse.tubularSegments,
          parse.arc
        );

      case 'TorusKnotGeometry':
        return new THREE.TorusKnotGeometry(
          parse.radius,
          parse.tube,
          parse.tubularSegments,
          parse.radialSegments,
          parse.p,
          parse.q
        );

      case 'TubeGeometry':
        // 注意: 这个需要特殊处理,因为需要路径
        console.warn('TubeGeometry需要自定义路径,请单独处理');
        return new THREE.BufferGeometry();

      case 'ExtrudeGeometry':
        // 注意: 这个需要特殊处理,因为需要形状
        console.warn('ExtrudeGeometry需要自定义形状,请单独处理');
        return new THREE.BufferGeometry();

      case 'LatheGeometry':
        // 注意: 这个需要特殊处理,因为需要点数组
        console.warn('LatheGeometry需要自定义点数组,请单独处理');
        return new THREE.BufferGeometry();

      case 'ShapeGeometry':
        // 注意: 这个需要特殊处理,因为需要形状
        console.warn('ShapeGeometry需要自定义形状,请单独处理');
        return new THREE.BufferGeometry();
        
      default:
        console.warn(`未支持的几何体类型: ${type}`);
        return new THREE.BufferGeometry();
    }
  }

  // 材质工厂方法 
  static createMaterial(matData: any): THREE.Material {
    const { type, parse } = matData;
    
    switch(type) {
      case 'MeshStandardMaterial':
        return new THREE.MeshStandardMaterial({
          color: parse.color,
          roughness: parse.roughness,
          metalness: parse.metalness,
          emissive: parse.emissive,
          emissiveIntensity: parse.emissiveIntensity,
          side: parse.side,
          envMapIntensity: parse.envMapIntensity,
          transparent: parse.transparent,
          opacity: parse.opacity,
          alphaTest: parse.alphaTest,
          wireframe: parse.wireframe
        });
        
      case 'MeshBasicMaterial':
        return new THREE.MeshBasicMaterial({
          color: parse.color,
          side: parse.side,
          transparent: parse.transparent,
          opacity: parse.opacity,
          alphaTest: parse.alphaTest,
          wireframe: parse.wireframe
        });

      case 'MeshPhongMaterial':
        return new THREE.MeshPhongMaterial({
          color: parse.color,
          emissive: parse.emissive,
          specular: parse.specular,
          shininess: parse.shininess,
          side: parse.side,
          transparent: parse.transparent,
          opacity: parse.opacity,
          wireframe: parse.wireframe
        });

      case 'MeshLambertMaterial':
        return new THREE.MeshLambertMaterial({
          color: parse.color,
          emissive: parse.emissive,
          side: parse.side,
          transparent: parse.transparent,
          opacity: parse.opacity,
          wireframe: parse.wireframe
        });

      case 'MeshToonMaterial':
        return new THREE.MeshToonMaterial({
          color: parse.color,
          emissive: parse.emissive,
          side: parse.side,
          transparent: parse.transparent,
          opacity: parse.opacity,
          wireframe: parse.wireframe
        });

      case 'MeshNormalMaterial':
        return new THREE.MeshNormalMaterial({
          side: parse.side,
          transparent: parse.transparent,
          opacity: parse.opacity,
          wireframe: parse.wireframe
        });

      case 'MeshDepthMaterial':
        return new THREE.MeshDepthMaterial({
          side: parse.side,
          transparent: parse.transparent,
          opacity: parse.opacity,
          wireframe: parse.wireframe
        });

      case 'MeshMatcapMaterial':
        return new THREE.MeshMatcapMaterial({
          color: parse.color,
          side: parse.side,
          transparent: parse.transparent,
          opacity: parse.opacity,
          wireframe: parse.wireframe
        });

      case 'LineBasicMaterial':
        return new THREE.LineBasicMaterial({
          color: parse.color,
          linewidth: parse.linewidth,
          linecap: parse.linecap,
          linejoin: parse.linejoin
        });

      case 'LineDashedMaterial':
        return new THREE.LineDashedMaterial({
          color: parse.color,
          linewidth: parse.linewidth,
          scale: parse.scale,
          dashSize: parse.dashSize,
          gapSize: parse.gapSize
        });

      case 'PointsMaterial':
        return new THREE.PointsMaterial({
          color: parse.color,
          size: parse.size,
          sizeAttenuation: parse.sizeAttenuation
        });

      case 'SpriteMaterial':
        return new THREE.SpriteMaterial({
          color: parse.color,
          transparent: parse.transparent,
          opacity: parse.opacity
        });

      case 'ShaderMaterial':
        // 注意: 这个需要特殊处理,因为需要自定义着色器
        console.warn('ShaderMaterial需要自定义着色器,请单独处理');
        return new THREE.MeshBasicMaterial();

      case 'RawShaderMaterial':
        // 注意: 这个需要特殊处理,因为需要自定义着色器
        console.warn('RawShaderMaterial需要自定义着色器,请单独处理');
        return new THREE.MeshBasicMaterial();
        
      default:
        console.warn(`未支持的材质类型: ${type}`);
        return new THREE.MeshBasicMaterial();
    }
  }

  // 创建网格
  static createMesh(data: any): THREE.Mesh {
    const geometry = this.createGeometry(data.geometry);
    const material = this.createMaterial(data.material);
    return new THREE.Mesh(geometry, material);
  }

  // 序列化网格为JSON
  static serializeMesh(mesh: THREE.Mesh) {
    return {
      geometry: {
        type: mesh.geometry.type,
        parse: mesh.geometry.toJSON()
      },
      material: {
        type: mesh.material.type,
        parse: mesh.material.toJSON()
      }
    };
  }

  // 处理纹理
  static handleTexture(textureData: any): THREE.Texture | null {
    if (!textureData) return null;
    
    const texture = new THREE.TextureLoader().load(textureData.image);
    texture.wrapS = textureData.wrapS;
    texture.wrapT = textureData.wrapT;
    texture.repeat.set(textureData.repeat.x, textureData.repeat.y);
    texture.offset.set(textureData.offset.x, textureData.offset.y);
    texture.rotation = textureData.rotation;
    texture.center.set(textureData.center.x, textureData.center.y);
    
    return texture;
  }

  /**
   * 序列化脚本时获取脚本路径
   */
  private static getScriptPath(script: any): string | null {
    if (!this.projectRoot) {
      console.warn('Project root not set! Please call setProjectRoot first.');
      return null;
    }

    for (const [relativePath, constructor] of this.scriptsMap.entries()) {
      if (script instanceof constructor) {
        return `${this.projectRoot}/src/demoScript/${relativePath}.ts`;
      }
    }
    return null;
  }

  /**
   * 序列化脚本
   */
  private static serializeScript(script: any): any {
    const scriptPath = this.getScriptPath(script);
    if (!scriptPath) {
      console.warn('Unable to determine script path for:', script);
      return null;
    }

    return {
      type: script.constructor.name,
      path: scriptPath,
      enabled: script.isEnabled?.(),
      properties: script.getSerializableProperties?.() || {}
    };
  }
}