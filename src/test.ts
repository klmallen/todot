/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-10 17:19:03
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-30 16:14:51
 * @FilePath: \todot\src\test.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Engine from './engine/core/Engine'
import * as THREE from 'three';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { MeshInstance3D } from './engine/core/MeshInstance3D';
import { ModelLoader3D} from './engine/core/ModelLoader3D'
import { Script } from './engine/core/Script/Script';
import playerGlb from './engine/assets/player'
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
  showDefaultUI: true ,
  showHelpers: true,
  addDefaultLights: true ,
  useWebGPU:true
});


// 直接创建场景 - 不再使用引擎的工厂方法
const mainScene = new Scene("主场景");
const monsterScene = new Scene("怪物场景");
const uiScene = new Scene("UI场景");

// 直接创建节点 - 不再使用引擎的工厂方法
const playerNode = new Node3d("玩家");
const playerNode2 = new Node3d("玩家2");

const enemyNode = new Node3d("敌人");
const uiNode = new Node3d("UI元素");


// 添加节点到场景
mainScene.addNode(playerNode);  
monsterScene.addNode(playerNode2);
mainScene.addNode(enemyNode);
uiScene.addNode(uiNode);


// 将场景添加到引擎
engine.addScene(mainScene);
engine.addScene(monsterScene);
engine.addScene(uiScene);

// 为节点添加脚本
// playerNode.addScript(PlayerController, { speed: 5 });
// enemyNode.addScript(EnemyAI, { difficulty: "hard" });

// 激活场景
engine.activateScene("主场景");
engine.activateScene("怪物场景");
// engine.activateScene("UI场景");
engine.start()