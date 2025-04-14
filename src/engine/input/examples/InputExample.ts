import * as THREE from 'three';
import Engine from '../../core/Engine';
import { Scene } from '../../core/Scene';
import { InputNode } from '../InputNode';
import { MouseNode } from '../MouseNode';
import { RaycastNode } from '../RaycastNode';
import { Node3d } from '../../core/Node3d';

/**
 * 输入系统示例
 * 展示如何使用输入节点、鼠标节点和射线节点
 */
export class InputExample {
  private engine: Engine;
  private scene: Scene;
  private inputNode: InputNode;
  private mouseNode: MouseNode;
  private raycastNode: RaycastNode;
  private cube: Node3d;
  
  /**
   * 初始化示例
   */
  async initialize(): Promise<void> {
    // 创建引擎实例
    this.engine = new Engine();
    await this.engine.init({
      showDefaultUI: true,
      addDefaultLights: true,
      useWebGPU: false
    });
    
    // 创建场景
    this.scene = new Scene('输入示例场景');
    this.engine.addScene(this.scene);
    
    // 设置相机位置
    const camera = this.engine.getCamera();
    camera.getThreeCamera().position.set(0, 5, 10);
    camera.getThreeCamera().lookAt(0, 0, 0);
    
    // 创建一个地板
    this.createFloor();
    
    // 创建一个可交互的立方体
    this.cube = this.createCube();
    this.scene.addNode(this.cube);
    
    // 创建输入节点
    this.inputNode = new InputNode('键盘输入');
    this.scene.addNode(this.inputNode);
    
    // 创建鼠标节点
    this.mouseNode = new MouseNode('鼠标输入');
    this.scene.addNode(this.mouseNode);
    
    // 创建射线节点
    this.raycastNode = new RaycastNode('射线');
    this.raycastNode.position.set(0, 2, 5);
    this.scene.addNode(this.raycastNode);
    
    // 设置事件监听
    this.setupEventListeners();
    
    // 启动引擎
    this.engine.activateScene(this.scene.getName());
    this.engine.start();
    
    console.log('输入示例已初始化');
  }
  
  /**
   * 创建地板
   */
  private createFloor(): void {
    const floor = new Node3d('地板');
    
    // 创建一个平面几何体作为地板
    const geometry = new THREE.PlaneGeometry(20, 20);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // 旋转平面使其水平
    mesh.rotation.x = -Math.PI / 2;
    
    floor.getThreeObject().add(mesh);
    this.scene.addNode(floor);
  }
  
  /**
   * 创建一个交互式立方体
   */
  private createCube(): Node3d {
    const cube = new Node3d('立方体');
    
    // 创建一个立方体网格
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    
    // 将网格添加到节点
    cube.getThreeObject().add(mesh);
    
    // 设置位置
    cube.position.set(0, 0.5, 0);
    
    return cube;
  }
  
  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 添加输入事件监听
    this.inputNode.onAction('moveForward', 'pressed', () => {
      console.log('向前移动开始');
    });
    
    this.inputNode.onAction('moveForward', 'released', () => {
      console.log('向前移动结束');
    });
    
    // 在每一帧中检查输入状态
    this.scene.getRootNode().addScript(class InputScript extends Script {
      update(deltaTime: number): void {
        const inputNode = this.getNode().getChildByName('键盘输入') as InputNode;
        if (!inputNode) return;
        
        // 检查是否按下了向前移动键
        if (inputNode.isActionPressed('moveForward')) {
          const cube = this.getNode().getChildByName('立方体');
          if (cube) {
            // 移动立方体
            cube.position.z -= 2 * deltaTime;
          }
        }
        
        // 检查是否按下了向后移动键
        if (inputNode.isActionPressed('moveBackward')) {
          const cube = this.getNode().getChildByName('立方体');
          if (cube) {
            // 移动立方体
            cube.position.z += 2 * deltaTime;
          }
        }
      }
    });
    
    // 添加鼠标点击事件监听
    this.mouseNode.on('click', (result) => {
      if (result.node === this.cube) {
        console.log('立方体被点击!');
        
        // 改变立方体颜色
        const mesh = this.cube.getThreeObject().children[0] as THREE.Mesh;
        if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.color.setHex(Math.random() * 0xffffff);
        }
      }
    });
    
    // 添加鼠标悬停事件监听
    this.mouseNode.on('hoverin', (result) => {
      if (result.node === this.cube) {
        console.log('鼠标移入立方体');
        
        // 放大立方体
        this.cube.scale.set(1.2, 1.2, 1.2);
      }
    });
    
    this.mouseNode.on('hoverout', (result) => {
      if (result.node === this.cube) {
        console.log('鼠标移出立方体');
        
        // 恢复立方体大小
        this.cube.scale.set(1, 1, 1);
      }
    });
    
    // 添加射线事件监听
    this.raycastNode.on('enter', (result) => {
      if (result.node === this.cube) {
        console.log('射线进入立方体');
        
        // 改变立方体颜色
        const mesh = this.cube.getThreeObject().children[0] as THREE.Mesh;
        if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.color.setHex(0xff0000);
        }
      }
    });
    
    this.raycastNode.on('exit', (result) => {
      if (result.node === this.cube) {
        console.log('射线离开立方体');
        
        // 恢复立方体颜色
        const mesh = this.cube.getThreeObject().children[0] as THREE.Mesh;
        if (mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.color.setHex(0x00ff00);
        }
      }
    });
  }
}

// 导入脚本类
import { Script } from '../../core/Script/Script';

// 创建并启动示例
document.addEventListener('DOMContentLoaded', () => {
  const example = new InputExample();
  example.initialize().catch(console.error);
}); 