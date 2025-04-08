import Engine from './engine/core/Engine'
import * as THREE from 'three';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { MeshInstance3D } from './engine/core/MeshInstance3D';
import { ModelLoader3D} from './engine/core/ModelLoader3D'
import { Script } from './engine/core/Script/Script';
import { 
  texture, 
  tslFn, 
  uv, 
  float, 
  vec2, 
  vec3, 
  vec4, 
  uniform, 
  sin, 
  cos, 
  mix,
  modelViewProjection,
  positionLocal,
  normalLocal,
  varying
} from 'three/tsl';
import { MeshBasicNodeMaterial, ModelNode } from 'three/webgpu';
import { CameraNode3D } from './engine/core/CameraNode3D';
import { MoveNode } from './engine/core/MoveNode';
import { ScriptRegistry } from './engine/core/Script/ScriptRegistry';

// 创建引擎
const engine = await new Engine().init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true,
  useWebGPU: true
});

// 添加导入按钮
const importButton = document.createElement('button');
importButton.textContent = '导入游戏状态';
importButton.style.position = 'absolute';
importButton.style.top = '10px';
importButton.style.right = '10px';
importButton.style.zIndex = '1000';
importButton.style.padding = '8px 12px';
document.body.appendChild(importButton);

// 导入按钮点击事件
importButton.addEventListener('click', () => {
  // 创建文件输入元素
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    
    const file = target.files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        // 导入引擎状态
        if (jsonData.engineState) {
          engine.importEngineState(jsonData.engineState);
        }
        
        // 批量导入所有场景
        if (jsonData.scenes) {
          Object.entries(jsonData.scenes).forEach(([sceneName, sceneData]) => {
            try {
              engine.importSceneFromJSON(sceneData);
              console.log(`成功导入场景: ${sceneName}`);
            } catch (error) {
              console.error(`导入场景 ${sceneName} 失败:`, error);
            }
          });
        }
        
        console.log("成功导入游戏状态");
        
        // 启动引擎
        engine.start();
        
      } catch (error) {
        console.error("导入失败:", error);
      }
    };
    
    reader.readAsText(file);
  });
  
  // 触发文件选择
  input.click();
});

// 启动引擎
engine.start(); 