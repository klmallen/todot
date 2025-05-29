import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import Engine from '../engine/core/Engine';
import Scene from '../engine/core/Scene';
import Node3d from '../engine/core/Node3d';
import { Script } from '../engine/core/Script/Script';
import { initEditorUI } from '../engine/ui/index';

/**
 * 物理物体脚本 - 将Three.js物体与Cannon物理体关联
 */
class PhysicsBody extends Script {
  private body: CANNON.Body | null = null;
  private world: CANNON.World | null = null;
  private mesh: THREE.Object3D | null = null;
  
  // 物理属性
  public mass: number = 1;
  public shape: 'box' | 'sphere' | 'plane' = 'box';
  
  onStart(): void {
    const engine = Engine.getInstance();
    const physics = engine.getPhysics() as any;
    
    if (!physics || !physics.world) {
      console.error('物理引擎未初始化');
      return;
    }
    
    this.world = physics.world;
    this.mesh = this.node.getThreeObject();
    
    // 根据形状创建对应的物理体
    if (!this.mesh) return;
    
    const position = new CANNON.Vec3(
      this.mesh.position.x,
      this.mesh.position.y,
      this.mesh.position.z
    );
    
    let shape: CANNON.Shape;
    
    // 创建形状
    switch (this.shape) {
      case 'box':
        // 获取物体的尺寸
        if (this.mesh instanceof THREE.Mesh && this.mesh.geometry instanceof THREE.BoxGeometry) {
          const size = new THREE.Vector3();
          this.mesh.geometry.computeBoundingBox();
          this.mesh.geometry.boundingBox?.getSize(size);
          size.multiplyScalar(0.5); // Half extents
          shape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
        } else {
          shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        }
        break;
        
      case 'sphere':
        // 获取球体半径
        if (this.mesh instanceof THREE.Mesh && this.mesh.geometry instanceof THREE.SphereGeometry) {
          const radius = this.mesh.geometry.parameters.radius;
          shape = new CANNON.Sphere(radius);
        } else {
          shape = new CANNON.Sphere(0.5);
        }
        break;
        
      case 'plane':
        shape = new CANNON.Plane();
        break;
        
      default:
        shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    }
    
    // 创建物理体
    this.body = new CANNON.Body({
      mass: this.mass,
      shape,
      position
    });
    
    // 如果是平面，旋转使其面朝上
    if (this.shape === 'plane') {
      this.body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    } else {
      // 复制对象的旋转
      this.body.quaternion.set(
        this.mesh.quaternion.x,
        this.mesh.quaternion.y,
        this.mesh.quaternion.z,
        this.mesh.quaternion.w
      );
    }
    
    // 将物理体添加到世界
    this.world.addBody(this.body);
  }
  
  onUpdate(): void {
    // 更新Three.js对象的位置和旋转，与物理体保持同步
    if (this.body && this.mesh) {
      this.mesh.position.copy(this.body.position as any);
      this.mesh.quaternion.copy(this.body.quaternion as any);
    }
  }
  
  onDestroy(): void {
    // 清理物理体
    if (this.body && this.world) {
      this.world.removeBody(this.body);
    }
  }
}

/**
 * 物理世界初始化
 */
class PhysicsWorld {
  private world: CANNON.World;
  
  constructor() {
    // 创建物理世界
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0) // 地球引力 (m/s²)
    });
    
    // 配置物理参数
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true; // 允许物体休眠以提高性能
    this.world.defaultContactMaterial.restitution = 0.3; // 弹性
    this.world.defaultContactMaterial.friction = 0.3; // 摩擦力
  }
  
  update(deltaTime: number): void {
    // 更新物理模拟
    // 固定时间步长，独立于帧率
    this.world.fixedStep(1/60, deltaTime, 3);
  }
  
  getWorld(): CANNON.World {
    return this.world;
  }
}

/**
 * 初始化Cannon物理引擎示例
 */
function initCannonExample(): void {
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  document.body.appendChild(container);
  
  // 初始化引擎
  const engine = new Engine(document.createElement('canvas'));
  
  // 初始化物理世界
  const physics = new PhysicsWorld();
  // 将物理世界附加到引擎上
  (engine as any).physics = {
    world: physics.getWorld(),
    update: physics.update.bind(physics)
  };
  
  // 创建场景
  const scene = new Scene("PhysicsScene");
  
  // 添加灯光
  const lightNode = new Node3d("DirectionalLight");
  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(5, 10, 7.5);
  light.castShadow = true;
  // 调整阴影参数
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 50;
  lightNode.setThreeObject(light);
  scene.addNode(lightNode);
  
  // 添加环境光
  const ambientNode = new Node3d("AmbientLight");
  const ambientLight = new THREE.AmbientLight(0x666666);
  ambientNode.setThreeObject(ambientLight);
  scene.addNode(ambientNode);
  
  // 创建地面平面
  const groundNode = new Node3d("Ground");
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x999999,
    roughness: 0.8,
    metalness: 0.2
  });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.receiveShadow = true;
  groundNode.setThreeObject(groundMesh);
  
  // 添加物理脚本
  const groundPhysics = new PhysicsBody();
  groundPhysics.mass = 0; // 质量为0代表静态物体
  groundPhysics.shape = 'plane';
  groundNode.addScript(groundPhysics);
  scene.addNode(groundNode);
  
  // 创建一些物体
  function createPhysicsObject(
    name: string, 
    shape: 'box' | 'sphere', 
    position: THREE.Vector3,
    size: number = 1, 
    color: number = Math.random() * 0xffffff
  ): Node3d {
    const node = new Node3d(name);
    
    let geometry: THREE.BufferGeometry;
    if (shape === 'box') {
      geometry = new THREE.BoxGeometry(size, size, size);
    } else {
      geometry = new THREE.SphereGeometry(size/2, 32, 32);
    }
    
    const material = new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.7,
      metalness: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.copy(position);
    node.setThreeObject(mesh);
    
    // 添加物理脚本
    const physics = new PhysicsBody();
    physics.mass = 1;
    physics.shape = shape;
    node.addScript(physics);
    
    return node;
  }
  
  // 添加一堆立方体
  for (let i = 0; i < 10; i++) {
    const y = 5 + i * 1.2;
    const x = (Math.random() - 0.5) * 2;
    const z = (Math.random() - 0.5) * 2;
    
    // 交替创建方块和球体
    const shape = i % 2 === 0 ? 'box' : 'sphere';
    const size = 0.8 + Math.random() * 0.4;
    
    const obj = createPhysicsObject(
      `PhysicsObject_${i}`,
      shape,
      new THREE.Vector3(x, y, z),
      size
    );
    
    scene.addNode(obj);
  }
  
  // 创建一堵墙
  for (let y = 0; y < 5; y++) {
    for (let x = -3; x <= 3; x += 1.05) {
      if ((x === 0 && y < 3) || Math.random() > 0.7) continue; // 在墙中间留一个门
      
      const obj = createPhysicsObject(
        `Wall_${x}_${y}`,
        'box',
        new THREE.Vector3(x, 0.5 + y * 1.05, -4),
        1,
        0xaaaaaa
      );
      
      scene.addNode(obj);
    }
  }
  
  // 设置相机位置
  const camera = engine.getCamera();
  camera.getThreeCamera().position.set(0, 5, 15);
  camera.getThreeCamera().lookAt(0, 0, 0);
  
  // 初始化引擎
  engine.init({
    useWebGPU: false,
    showDefaultUI: false
  }).then(() => {
    // 添加场景到引擎
    engine.addScene(scene);
    engine.activateScene(scene.getName());
    
    // 启动引擎
    engine.start();
    
    // 初始化编辑器UI
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '0';
    uiContainer.style.left = '0';
    uiContainer.style.width = '100%';
    uiContainer.style.height = '100%';
    uiContainer.style.pointerEvents = 'none';
    document.body.appendChild(uiContainer);
    
    initEditorUI(uiContainer, engine);
    
    console.log('Cannon物理引擎示例已初始化');
  }).catch(error => {
    console.error('引擎初始化失败:', error);
  });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initCannonExample);

// 导出示例函数
export { initCannonExample }; 