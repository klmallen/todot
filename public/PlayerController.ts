/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-14 23:44:28
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-15 17:56:27
 * @FilePath: \todot\src\scriptDemo\PlayerController.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Script } from "../src/engine/core/Script/Script";
import * as THREE from 'three';

export default class PlayerController extends Script {
    private animationNode  = null;
    private modelNode = null;
    private isMoving: boolean = false;
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    
    constructor(){
        super({
            path:'/src/scriptDemo/PlayerController.ts'
        });
    }
    onStart(): void {
      // 获取动画节点和模型节点
      this.animationNode = this.getNode()?.findNodeByName("玩家动画") ;
      this.modelNode = this.getNode()?.findNodeByName("玩家模型") ;
      // 设置动画节点的目标模型
      if (this.modelNode && this.animationNode) {
        this.modelNode.setOnLoaded((model) => {
          console.log("模型加载完成:", model);
          this.animationNode.setModel(this.modelNode);
          
          const animNames = this.animationNode.getAnimationNames();
          if (animNames.length > 0) {
            this.animationNode.play(animNames[2], {
              loop: true,
              speed: 1.0
            });
          }
        });
      }
      // 添加点击事件监听
    }
  
    onReady(): void {
      // 实现抽象方法
    }
  
    override update(deltaTime: number): void {
      // 处理玩家输入
      if (this.isMoving) {
        // 移动逻辑
        const moveSpeed = 5.0;
        const moveAmount = moveSpeed * deltaTime;
        
        // 更新位置
        const currentPosition = this.getNode()?.position.clone() || new THREE.Vector3();
        currentPosition.z += moveAmount;
        this.getNode()?.position.copy(currentPosition);
      }
    }
  
    // 处理键盘输入
    onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'w') {
        this.isMoving = true;
      }
    }
  
    onKeyUp(event: KeyboardEvent): void {
      if (event.key === 'w') {
        this.isMoving = false;
      }
    }
  
    override onDestroy(): void {
      // 移除事件监听
    }
  }
  