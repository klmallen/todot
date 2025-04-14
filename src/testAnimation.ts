import Engine from './engine/core/Engine'
import * as THREE from 'three';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { ModelLoader3D } from './engine/core/ModelLoader3D';
import { AnimationNode3D } from './engine/core/AnimationNode3D';
import { Script } from './engine/core/Script/Script';
import { CameraNode3D } from './engine/core/CameraNode3D';
import { MeshInstance3D } from './engine/core/MeshInstance3D';

// 创建引擎
const engine = await new Engine().init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true,
  useWebGPU: false  // 禁用 WebGPU，使用 WebGL
});

// 创建主场景
const mainScene = new Scene("主场景");
engine.addScene(mainScene);

// 添加环境光和方向光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
mainScene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
mainScene.add(directionalLight);

// 创建地板
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x808080,
  roughness: 0.8,
  metalness: 0.2,
  side: THREE.DoubleSide
});
const floor = new MeshInstance3D("地板", floorGeometry, floorMaterial);
floor.setRotation(-Math.PI / 2, 0, 0); // 旋转90度使其水平
floor.setPosition(0, -1, 0); // 稍微下移一点
mainScene.addNode(floor);

// 创建玩家节点
const playerNode = new Node3d("玩家");
mainScene.addNode(playerNode);

// 创建模型节点
const modelNode = new ModelLoader3D("玩家模型", '../public/models/toy_terror_chogath.glb');
modelNode.setScale(0.01,0.01,0.01)
playerNode.addChild(modelNode);

// 创建动画节点
const animationNode = new AnimationNode3D("玩家动画");
playerNode.addChild(animationNode);

// 创建相机节点
const cameraNode = new CameraNode3D("主相机", 75, 0.1, 1000, {
  position: new THREE.Vector3(0, 5, 10),
  rotation: new THREE.Euler(0, 0, 0)
});
mainScene.addNode(cameraNode);

// 设置相机参数
cameraNode.setFov(60);
cameraNode.setNear(0.5);
cameraNode.setFar(2000);  
cameraNode.setTarget(playerNode);

// 创建关闭按钮
const closeButton = document.createElement('button');
closeButton.textContent = '关闭';
closeButton.style.position = 'absolute';
closeButton.style.top = '10px';
closeButton.style.right = '10px';
closeButton.style.padding = '10px 20px';
closeButton.style.zIndex = '1000';
document.body.appendChild(closeButton);

// 创建玩家控制脚本
class PlayerController extends Script {
  private animationNode: AnimationNode3D | null = null;
  private modelNode: ModelLoader3D | null = null;
  private isMoving: boolean = false;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  onStart(): void {
    // 获取动画节点和模型节点
    this.animationNode = this.getNode()?.findNodeByName("玩家动画") as AnimationNode3D;
    this.modelNode = this.getNode()?.findNodeByName("玩家模型") as ModelLoader3D;
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
    document.addEventListener('click', this.onClick.bind(this));
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

  private onClick(event: MouseEvent): void {
    // 计算鼠标在归一化设备坐标中的位置
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 更新射线
    this.raycaster.setFromCamera(this.mouse, cameraNode.getCamera());
    
    // 获取所有可点击的模型
    const models = mainScene.getNodes().filter(node => 
      node instanceof ModelLoader3D && node !== this.modelNode
    );

    // 检查射线是否与任何模型相交
    const intersects = this.raycaster.intersectObjects(
      models.map(model => (model as ModelLoader3D).getModel() || new THREE.Object3D()),
      true
    );

    if (intersects.length > 0) {
      // 找到被点击的模型节点
      const clickedModel = models.find(model => 
        (model as ModelLoader3D).getModel()?.uuid === intersects[0].object.uuid
      );

      if (clickedModel) {
        // 隐藏其他模型
        models.forEach(model => {
          if (model !== clickedModel) {
            model.setVisible(false);
          }
        });
      }
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
    document.removeEventListener('click', this.onClick.bind(this));
  }
}

// 添加控制脚本到玩家节点
playerNode.addScript(PlayerController);
engine.activateScene("主场景");
// 启动引擎
engine.start();

// 添加键盘事件监听
document.addEventListener('keydown', (event) => {
  const script = playerNode.getScript(PlayerController);
  if (script) {
    script.onKeyDown(event);
  }
});

document.addEventListener('keyup', (event) => {
  const script = playerNode.getScript(PlayerController);
  if (script) {
    script.onKeyUp(event);
  }
});

// 关闭按钮点击事件
closeButton.addEventListener('click', () => {
  // 停止引擎
  engine.dispose();
  // 移除关闭按钮
  document.body.removeChild(closeButton);
}); 