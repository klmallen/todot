import { Script } from '../engine/core/Script/Script';
import { Node3d } from '../engine/core/Node3d';
import * as THREE from 'three';
import { InputHandlerNode3D } from '../engine/core/InputHandlerNode3D';

/**
 * 键盘控制器脚本
 * 演示如何使用InputHandlerNode3D进行输入处理和物理交互
 */
export default class KeyboardController extends Script {
  private targetNode: Node3d | null = null;
  private inputHandler: InputHandlerNode3D | null = null;
  
  // 移动速度
  private moveSpeed: number = 5.0;
  // 旋转速度
  private rotateSpeed: number = 2.0;
  
  // 设置为true时显示碰撞体
  private showColliders: boolean = false;
  // 设置为true时显示骨骼
  private showSkeleton: boolean = false;

  // 输入系统接口 - 由InputHandlerNode3D注入
  private input: {
    isKeyPressed: (key: string) => boolean;
    getKeyPressDuration: (key: string) => number;
    isActionKeyPressed: (action: string) => boolean;
    getKeyboardConfig: () => any;
    addKeyHandler: (handler: any) => number;
    removeKeyHandler: (id: number) => void;
  } | null = null;
  
  /**
   * 脚本初始化时调用
   * 实现Script抽象类的onReady方法
   */
  override onReady(): void {
    console.log('键盘控制器就绪');
  }
  
  /**
   * 脚本附加到节点时调用
   */
  override onAttach(node: Node3d): void {
    this.targetNode = node;
    
    // 创建输入处理节点
    this.inputHandler = new InputHandlerNode3D('输入处理器');
    this.targetNode.addChild(this.inputHandler);
    
    // 连接脚本与输入处理器
    this.inputHandler.connectToScript(this);
    
    // 设置自定义键盘映射
    this.inputHandler.setKeyboardConfig({
      forward: 'KeyW',
      backward: 'KeyS',
      left: 'KeyA',
      right: 'KeyD',
      action1: 'KeyE',  // 用于切换碰撞体显示
      action2: 'KeyQ',  // 用于切换骨骼显示
      action3: 'KeyR',  // 用于旋转对象
      jump: 'Space'
    });
    
    // 注册按键事件
    this.inputHandler.addKeyboardEventHandler({
      onKeyDown: (key) => {
        if (key === 'KeyE') {
          this.toggleColliders();
        } else if (key === 'KeyQ') {
          this.toggleSkeleton();
        }
      }
    });
    
    console.log('键盘控制器已初始化');
  }
  
  /**
   * 脚本启动时调用
   */
  override onStart(): void {
    console.log('键盘控制器已启动');
  }
  
  /**
   * 切换碰撞体显示
   */
  private toggleColliders(): void {
    if (!this.targetNode) return;
    
    this.showColliders = !this.showColliders;
    
    // 查找物理节点并设置碰撞体可视化
    this.targetNode.traverse((node) => {
      // 检查节点是否有物理相关方法
      const physicsNode = node as any;
      if (physicsNode.setColliderVisualOptions && typeof physicsNode.setColliderVisualOptions === 'function') {
        physicsNode.setColliderVisualOptions({
          visible: this.showColliders,
          color: 0x00ff00,
          opacity: 0.5,
          wireframe: true
        });
      }
    });
    
    console.log(`碰撞体显示: ${this.showColliders ? '开启' : '关闭'}`);
  }
  
  /**
   * 切换骨骼显示
   */
  private toggleSkeleton(): void {
    if (!this.targetNode) return;
    
    this.showSkeleton = !this.showSkeleton;
    
    // 查找模型节点并设置骨骼显示
    this.targetNode.traverse((node) => {
      // 检查节点是否有模型相关方法
      const modelNode = node as any;
      if (modelNode.setSkeletonOptions && typeof modelNode.setSkeletonOptions === 'function') {
        modelNode.setSkeletonOptions({
          showSkeleton: this.showSkeleton,
          boneColor: 0xffffff,
          boneSize: 2.0
        });
      }
    });
    
    console.log(`骨骼显示: ${this.showSkeleton ? '开启' : '关闭'}`);
  }
  
  /**
   * 处理移动输入
   */
  private handleMovementInput(deltaTime: number): void {
    if (!this.targetNode || !this.input) return;
    
    // 计算移动增量
    const moveAmount = this.moveSpeed * deltaTime;
    
    // 获取目标朝向
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.targetNode.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.targetNode.quaternion);
    
    // 计算移动向量
    const moveVector = new THREE.Vector3();
    
    // 检查动作键是否被按下
    if (this.input.isActionKeyPressed('forward')) {
      moveVector.add(forward.clone().multiplyScalar(moveAmount));
    }
    if (this.input.isActionKeyPressed('backward')) {
      moveVector.sub(forward.clone().multiplyScalar(moveAmount));
    }
    if (this.input.isActionKeyPressed('left')) {
      moveVector.sub(right.clone().multiplyScalar(moveAmount));
    }
    if (this.input.isActionKeyPressed('right')) {
      moveVector.add(right.clone().multiplyScalar(moveAmount));
    }
    
    // 应用移动
    if (moveVector.lengthSq() > 0) {
      this.targetNode.position.add(moveVector);
      
      // 如果按下动作3键，则在移动时旋转对象
      if (this.input.isActionKeyPressed('action3')) {
        // 计算旋转量
        const rotateAmount = this.rotateSpeed * deltaTime;
        
        // 创建旋转四元数
        const rotation = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          rotateAmount
        );
        
        // 应用旋转
        this.targetNode.quaternion.premultiply(rotation);
      }
    }
    
    // 处理跳跃
    if (this.input.isActionKeyPressed('jump')) {
      // 在这里可以添加跳跃逻辑，例如应用向上的力
      // 如果对象有物理特性，可以这样应用力：
      const physicsNode = this.targetNode as any;
      if (physicsNode.applyForce && typeof physicsNode.applyForce === 'function') {
        physicsNode.applyForce(new THREE.Vector3(0, 10, 0));
      } else {
        // 否则直接更改位置
        this.targetNode.position.y += moveAmount * 2;
      }
    }
  }
  
  /**
   * 帧更新
   */
  override update(deltaTime: number): void {
    // 处理移动输入
    this.handleMovementInput(deltaTime);
  }
  
  /**
   * 脚本销毁时调用
   */
  override onDetach(): void {
    // 清理资源
    if (this.inputHandler) {
      this.inputHandler.dispose();
    }
    
    console.log('键盘控制器已销毁');
  }
} 