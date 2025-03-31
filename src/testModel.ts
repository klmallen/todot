import Engine from './engine/core/Engine'
import * as THREE from 'three';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { MeshInstance3D } from './engine/core/MeshInstance3D';
import { ModelLoader3D } from './engine/core/ModelLoader3D';
import { InstanceManager3D } from './engine/core/InstanceManager3D';
import { CameraNode3D } from './engine/core/CameraNode3D';
import { Script } from './engine/core/Script/Script';
import playerGlb from './engine/assets/player'

// 创建引擎
const engine = new Engine().init({
  showDefaultUI: true,
  showHelpers: true,
  addDefaultLights: true,
  useWebGPU: true
});

// 创建主场景
const mainScene = new Scene("实例化示例场景");
engine.addScene(mainScene);


// 创建相机节点
const cameraNode = new CameraNode3D("主相机", 75, 0.1, 1000, {
  position: new THREE.Vector3(0, 15, 30),
  rotation: new THREE.Euler(-0.3, 0, 0)
});
mainScene.addNode(cameraNode);

// 创建地面
const ground = new MeshInstance3D("地面",
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
ground.setRotation(Math.PI / 2, 0, 0);
ground.setPosition(0, -2, 0);
mainScene.addNode(ground);

const treeNode = new Node3d("树模型");

const treeTrunk = new MeshInstance3D("树干",
  new THREE.CylinderGeometry(0.2, 0.3, 2, 8),
  new THREE.MeshStandardMaterial({ color: 0x8B4513 })
);
treeTrunk.setPosition(0, 1, 0);

const treeTop = new MeshInstance3D("树冠",
  new THREE.ConeGeometry(1, 3, 8),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
treeTop.setPosition(0, 3, 0);

// 组装树
treeNode.addChild(treeTrunk);
treeNode.addChild(treeTop);

// 创建石头模型（用于第二种实例化）
const rockModel = new MeshInstance3D("石头",
  new THREE.DodecahedronGeometry(0.5, 1),
  new THREE.MeshStandardMaterial({ color: 0x777777 })
);

// 加载玩家模型（用于第三种实例化）
const playerModel = new ModelLoader3D("玩家模型",  '../src/engine/assets/player.glb');
playerModel.setScale(0.5, 0.5, 0.5);
playerModel.setRotation(-Math.PI / 2, 0, 0);

// 创建实例管理器
const treeInstancer = new InstanceManager3D("树实例管理器");
const rockInstancer = new InstanceManager3D("石头实例管理器");
const playerInstancer = new InstanceManager3D("玩家实例管理器");

// 将管理器添加到场景
mainScene.addNode(treeInstancer);
mainScene.addNode(rockInstancer);
mainScene.addNode(playerInstancer);

// 异步加载玩家模型和设置实例
function setupPlayerInstances() {
//   // 在模型加载完成后设置实例
//   setTimeout(() => {
//     if (playerModel.isLoaded()) {
  
      
//       console.log("玩家模型实例化完成");
//     } else {
//       console.log("玩家模型尚未加载，重试中...");
//       setTimeout(setupPlayerInstances, 500);
//     }
//   }, 1000); // 给模型加载一些时间
}

// 为实例管理器设置源对象
treeInstancer.setSourceObject(treeNode.getThreeObject());
rockInstancer.setSourceObject(rockModel.getThreeObject());
playerModel.setOnLoaded( (model) =>{
    playerInstancer.setSourceObject(playerModel.getThreeObject());
    console.log(playerInstancer,'playerInstancer')
    
    const playerCount = 1; // 要创建的玩家数量
    const areaSize = 1; // 随机分布的区域大小
    
    // 随机分布
    for (let i = 0; i < playerCount; i++) {
        // 生成随机位置
        const x = (Math.random() - 0.5) * areaSize;
        const z = (Math.random() - 0.5) * areaSize;
        const y = (Math.random() - 0.9) * areaSize;
        
        // 创建实例并设置位置
        const playerInstance = playerInstancer.createInstance();
        playerInstance.setPosition(new THREE.Vector3(x, y, z));
        
        // 随机旋转角度
        const randomAngle = Math.random() * Math.PI * 2;
        playerInstance.rotation.y = randomAngle;
        playerInstance.rotation.z = randomAngle;
    }
})
setupPlayerInstances();

// 更新实例数量
treeInstancer.updateInstanceCount(100);
rockInstancer.updateInstanceCount(200);

// 随机分布树实例
treeInstancer.distributeRandomly(
  new THREE.Vector3(-40, 0, -40),
  new THREE.Vector3(40, 0, 40)
);

// 沿网格分布石头实例
rockInstancer.distributeGrid([10, 1, 10], 4, true);

// 为实例管理器添加动画脚本
class TreeAnimator extends Script {
  private elapsedTime: number = 0;
  private instances: number[] = [];
  
  onStart(): void {
    // 获取所有实例ID
    this.instances = (this.getNode() as InstanceManager3D).getAllInstanceIds();
  }
  
  update(deltaTime: number): void {
    this.elapsedTime += deltaTime;
    
    // 为每个实例添加摆动动画
    for (let i = 0; i < this.instances.length; i++) {
      const instance = (this.getNode() as InstanceManager3D).getInstance(this.instances[i]);
      if (!instance) continue;
      
      // 根据实例索引和时间计算偏移，使每棵树有不同的摆动效果
      const offset = (i * 0.1) % (Math.PI * 2);
      const swayAmount = Math.sin(this.elapsedTime + offset) * 0.05;
      
      // 应用摆动
      instance.rotation.z = swayAmount;
    }
  }
}

// 为石头添加动画脚本
class RockAnimator extends Script {
  private elapsedTime: number = 0;
  private instances: number[] = [];
  
  onStart(): void {
    this.instances = (this.getNode() as InstanceManager3D).getAllInstanceIds();
  }
  
  update(deltaTime: number): void {
    this.elapsedTime += deltaTime;
    
    // 创建波浪效果
    for (let i = 0; i < this.instances.length; i++) {
      const instance = (this.getNode() as InstanceManager3D).getInstance(this.instances[i]);
      if (!instance) continue;
      
      const pos = instance.position.clone();
      const distanceFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
      
      // 波浪效果 - 基于到中心的距离和时间
      const waveHeight = Math.sin(distanceFromCenter - this.elapsedTime) * 0.5;
      instance.position.y = waveHeight;
      
      // 旋转
      instance.rotation.y += deltaTime * 0.5;
    }
  }
}

// 为玩家模型添加动画脚本
class PlayerAnimator extends Script {
  private elapsedTime: number = 0;
  private instances: number[] = [];
  private centerPoint: THREE.Vector3 = new THREE.Vector3(0, 20, 0); // 沙尘暴中心点
  private stormRadius: number = 20; 
  private stormHeight: number = 40; 
  private stormSpeed: number = 0.5; 
  
  onStart(): void {

    this.instances = (this.getNode() as InstanceManager3D).getAllInstanceIds();
    console.log(this.getNode().getAllInstanceIds(),'instance')
    // 初始化玩家位置为沙尘暴形状
    this.setEnabled(true)
    this.initializeStormFormation();
  }
  
  // 初始化沙尘暴形状
  private initializeStormFormation(): void {
    for (let i = 0; i < this.instances.length; i++) {
        console.log((this.getNode() as InstanceManager3D).getInstance(this.instances[i]),'(this.getNode() as InstanceManager3D).getInstance(this.instances[i])')
      const instance = (this.getNode() as InstanceManager3D).getInstance(this.instances[i]);
      if (!instance) continue;
      
      // 计算每个实例在沙尘暴中的位置
      const angle = Math.random() * Math.PI * 2;
      const heightRatio = Math.random(); // 0-1之间的高度比例
      
      // 半径随高度变化（上窄下宽）
      const radiusAtHeight = this.stormRadius * (1 - heightRatio * 0.7);
      
      // 设置位置 - 沙尘暴形状
      const x = this.centerPoint.x + Math.cos(angle) * radiusAtHeight;
      const z = this.centerPoint.z + Math.sin(angle) * radiusAtHeight;
      const y = this.centerPoint.y + heightRatio * this.stormHeight;
      
      instance.position.set(x, y, z);
      
      // 朝向旋转中心
      instance.rotation.y = Math.atan2(this.centerPoint.z - z, this.centerPoint.x - x);
    }
  }
  
  update(deltaTime: number): void {
   
    this.elapsedTime += deltaTime;
//    console.log(this.instances,'this.instances')
    // 沙尘暴动画效果
    for (let i = 0; i < this.instances.length; i++) {
      const instance = (this.getNode() as InstanceManager3D).getInstanceController(this.instances[i]);
     
      if (!instance) continue;
      
      // 获取当前位置
      const pos = instance.position;
      
      // 计算当前位置到中心点的角度
      const currentAngle = Math.atan2(pos.z - this.centerPoint.z, pos.x - this.centerPoint.x);
      
      // 计算到中心的距离
      const distToCenter = Math.sqrt(
        Math.pow(pos.x - this.centerPoint.x, 2) + 
        Math.pow(pos.z - this.centerPoint.z, 2)
      );
      
      // 相对高度比例
      const heightRatio = (pos.y - this.centerPoint.y) / this.stormHeight;
      
      // 旋转速度随高度变化（越高越快）
      const rotateSpeed = this.stormSpeed * (0.5 + heightRatio);
      
      // 计算新角度
      const newAngle = currentAngle + rotateSpeed * deltaTime;
      
      // 计算新位置
      const newX = this.centerPoint.x + Math.cos(newAngle) * distToCenter;
      const newZ = this.centerPoint.z + Math.sin(newAngle) * distToCenter;
      
      // 垂直方向缓慢上升
      let newY = pos.y + deltaTime * 0.5;
      
      // 如果超出最大高度，回到底部
      if (newY > this.centerPoint.y + this.stormHeight) {
        newY = this.centerPoint.y;
      }
      console.log(instance,'instance')
      // 应用新位置
      instance.position.set(newX, newY, newZ);
      
      // 朝向旋转方向
      instance.rotation.y = newAngle + Math.PI / 2;
      
      // 随机稍微倾斜，增加混乱感
      instance.rotation.x = Math.sin(this.elapsedTime * 2 + i) * 0.2;
      instance.rotation.z = Math.cos(this.elapsedTime * 3 + i) * 0.1;
      
      // 根据高度改变缩放，模拟远处变小的效果
      const scaleFactor = 0.5 + (1 - heightRatio) * 0.5;
      instance.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  }
}

// 添加脚本到实例管理器
treeInstancer.addScript(TreeAnimator);
rockInstancer.addScript(RockAnimator);

// PlayerAnimator.setEnabled(true)
// 使用DOM创建UI控制界面
const createUI = () => {
  // 创建容器
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '10px';
  container.style.left = '10px';
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.color = 'white';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '14px';
  
  // 添加说明文本
  const title = document.createElement('h3');
  title.textContent = '实例化管理器示例';
  title.style.margin = '0 0 10px 0';
  container.appendChild(title);
  
  const info = document.createElement('div');
  info.innerHTML = `
    <p>树木：100个实例</p>
    <p>石头：200个实例</p>
    <p>玩家：20个实例</p>
    <p>按键控制：</p>
    <ul style="padding-left: 20px; margin: 5px 0;">
      <li>空格键：切换所有实例的GPU实例化</li>
      <li>1键：切换树木的可见性</li>
      <li>2键：切换石头的可见性</li>
      <li>3键：切换玩家的可见性</li>
      <li>R键：重新分布所有实例</li>
    </ul>
  `;
  container.appendChild(info);
  
  // 添加按钮
  const gpuButton = document.createElement('button');
  gpuButton.textContent = 'GPU实例化：开';
  gpuButton.style.margin = '5px';
  gpuButton.style.padding = '5px 10px';
  gpuButton.style.backgroundColor = '#4CAF50';
  gpuButton.style.border = 'none';
  gpuButton.style.borderRadius = '3px';
  gpuButton.style.cursor = 'pointer';
  
  let useGPU = true;
  
  gpuButton.onclick = () => {
    useGPU = !useGPU;
    gpuButton.textContent = `GPU实例化：${useGPU ? '开' : '关'}`;
    gpuButton.style.backgroundColor = useGPU ? '#4CAF50' : '#f44336';
    
    // 切换GPU实例化
    treeInstancer.setUseGPUInstancing(useGPU);
    rockInstancer.setUseGPUInstancing(useGPU);
    playerInstancer.setUseGPUInstancing(useGPU);
    
    console.log(`切换GPU实例化: ${useGPU}`);
  };
  
  container.appendChild(gpuButton);
  
  document.body.appendChild(container);
};

// 创建UI
createUI();

// 添加键盘事件处理
let treeVisible = true;
let rocksVisible = true;
let playersVisible = true;

document.addEventListener('keydown', (event) => {
  switch(event.key) {
    case ' ': // 空格键 - 切换GPU实例化
      const button = document.querySelector('button');
      if (button) button.click();
      break;
      
    case '1': // 切换树木可见性
      treeVisible = !treeVisible;
      const treeIds = treeInstancer.getAllInstanceIds();
      treeIds.forEach(id => {
        const instance = treeInstancer.getInstance(id);
        if (instance) instance.setVisible(treeVisible);
      });
      console.log(`树木可见性: ${treeVisible}`);
      break;
      
    case '2': // 切换石头可见性
      rocksVisible = !rocksVisible;
      const rockIds = rockInstancer.getAllInstanceIds();
      rockIds.forEach(id => {
        const instance = rockInstancer.getInstance(id);
        if (instance) instance.setVisible(rocksVisible);
      });
      console.log(`石头可见性: ${rocksVisible}`);
      break;
      
    case '3': // 切换玩家可见性
      playersVisible = !playersVisible;
      const playerIds = playerInstancer.getAllInstanceIds();
      playerIds.forEach(id => {
        const instance = playerInstancer.getInstance(id);
        if (instance) instance.setVisible(playersVisible);
      });
      console.log(`玩家可见性: ${playersVisible}`);
      break;
      
    case 'r': // 重新分布所有实例
    case 'R':
      // 随机分布树
      treeInstancer.distributeRandomly(
        new THREE.Vector3(-40, 0, -40),
        new THREE.Vector3(40, 0, 40)
      );
      
      // 重新分布石头 - 这次用随机方式
      rockInstancer.distributeRandomly(
        new THREE.Vector3(-20, 0, -20),
        new THREE.Vector3(20, 0, 20)
      );
      
      // 重新排列玩家实例 - 随机圆形阵列
      const pIds = playerInstancer.getAllInstanceIds();
      pIds.forEach((id, index) => {
        const instance = playerInstancer.getInstance(id);
        if (instance) {
          const angle = (index / pIds.length) * Math.PI * 2;
          const radius = 5 + Math.random() * 10;
          instance.position.x = Math.cos(angle) * radius;
          instance.position.z = Math.sin(angle) * radius;
          instance.position.y = 0;
          instance.rotation.y = angle + Math.PI;
         
        }
      });
      
      console.log("重新分布所有实例");
      break;
  }
});

setTimeout(()=>{
    playerInstancer.addScript(PlayerAnimator);
    engine.activateScene("实例化示例场景");
    // 启动引擎
    engine.start();

    console.log('实例化管理器示例已启动');
},100)
