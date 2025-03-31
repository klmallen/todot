import Engine from './engine/core/Engine'
import * as THREE from 'three';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { MeshInstance3D } from './engine/core/MeshInstance3D';
import { Script } from './engine/core/Script/Script';
import { CameraNode3D } from './engine/core/CameraNode3D';
import Stats from 'stats.js';

// 创建引擎
const engine = new Engine().init({
  showDefaultUI: true,
  showHelpers: false,
  addDefaultLights: true,
  useWebGPU: true
});

// 创建测试场景
const regularScene = new Scene("常规网格场景");
const instancedScene = new Scene("实例化网格场景");

// 添加场景到引擎
engine.addScene(regularScene);
engine.addScene(instancedScene);

// 创建相机
const createCamera = (name: string) => {
  const camera = new CameraNode3D(name, 75, 0.1, 1000, {
    position: new THREE.Vector3(0, 10, 30),
    rotation: new THREE.Euler(-0.3, 0, 0)
  });
  return camera;
};

const regularCamera = createCamera("常规场景相机");
const instancedCamera = createCamera("实例化场景相机");

regularScene.addNode(regularCamera);
instancedScene.addNode(instancedCamera);

// 创建性能监控器
const stats = {
  regular: new Stats(),
  instanced: new Stats()
};

// 设置性能监控器位置
stats.regular.dom.style.position = 'absolute';
stats.regular.dom.style.top = '0px';
stats.regular.dom.style.left = '0px';
document.body.appendChild(stats.regular.dom);

stats.instanced.dom.style.position = 'absolute';
stats.instanced.dom.style.top = '0px';
stats.instanced.dom.style.right = '0px';
document.body.appendChild(stats.instanced.dom);

// 创建信息显示
const createInfoDisplay = () => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.bottom = '10px';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.textAlign = 'center';
  container.style.color = 'white';
  container.style.backgroundColor = 'rgba(0,0,0,0.5)';
  container.style.padding = '10px';
  container.style.fontSize = '16px';
  document.body.appendChild(container);
  return container;
};

const infoDisplay = createInfoDisplay();

// 创建控制面板
const createControlPanel = () => {
  const panel = document.createElement('div');
  panel.style.position = 'absolute';
  panel.style.top = '50px';
  panel.style.left = '10px';
  panel.style.backgroundColor = 'rgba(0,0,0,0.7)';
  panel.style.color = 'white';
  panel.style.padding = '10px';
  panel.style.borderRadius = '5px';
  document.body.appendChild(panel);
  
  // 对象数量滑块
  const countContainer = document.createElement('div');
  countContainer.innerHTML = '<label>对象数量: <span id="countValue">1000</span></label>';
  panel.appendChild(countContainer);
  
  const countSlider = document.createElement('input');
  countSlider.type = 'range';
  countSlider.min = '100';
  countSlider.max = '10000';
  countSlider.step = '100';
  countSlider.value = '1000';
  countSlider.id = 'objectCount';
  countSlider.style.width = '200px';
  panel.appendChild(countSlider);
  
  // 切换场景按钮
  const regularButton = document.createElement('button');
  regularButton.textContent = '常规渲染';
  regularButton.style.marginRight = '10px';
  regularButton.style.marginTop = '10px';
  regularButton.onclick = () => engine.activateScene("常规网格场景");
  panel.appendChild(regularButton);
  
  const instancedButton = document.createElement('button');
  instancedButton.textContent = '实例化渲染';
  instancedButton.onclick = () => engine.activateScene("实例化网格场景");
  panel.appendChild(instancedButton);
  
  // 重新生成按钮
  const regenerateButton = document.createElement('button');
  regenerateButton.textContent = '重新生成对象';
  regenerateButton.style.marginTop = '10px';
  regenerateButton.style.width = '100%';
  regenerateButton.onclick = () => {
    const count = parseInt(countSlider.value);
    // document.getElementById('countValue')!.textContent = count.toString();
    alert(count)
    regenerateObjects(count);
  };
  panel.appendChild(regenerateButton);
  
  return panel;
};

const controlPanel = createControlPanel();

// 常规渲染容器
const regularContainer = new Node3d("常规渲染容器");
regularScene.addNode(regularContainer);

// 实例化渲染容器
const instancedContainer = new Node3d("实例化渲染容器");
instancedScene.addNode(instancedContainer);

// 共享几何体和材质
const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x3388ff });

// 生成随机位置、旋转和缩放
const generateRandomTransform = () => {
  const position = new THREE.Vector3(
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * 40
  );
  
  const rotation = new THREE.Euler(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  );
  
  const scale = new THREE.Vector3(
    0.5 + Math.random() * 1.5,
    0.5 + Math.random() * 1.5,
    0.5 + Math.random() * 1.5
  );
  
  return { position, rotation, scale };
};

// 生成对象函数
let regularMeshes: MeshInstance3D[] = [];
let instancedMesh: MeshInstance3D | null = null;
let objectCount = 10000;

const regenerateObjects = (count: number) => {
  // 清除当前对象
  regularMeshes.forEach(mesh => {
    regularContainer.removeChild(mesh);
    mesh.destroy();
  });
  regularMeshes = [];
  
  if (instancedMesh) {
    instancedContainer.removeChild(instancedMesh);
    instancedMesh.destroy();
    instancedMesh = null;
  }
  
  // 记录当前对象数量
  objectCount = count;
  // 更新信息显示
  infoDisplay.innerHTML = `
    <div>测试对象数量: ${count}</div>
    <div>左侧: 常规渲染 (${count}个独立网格) | 右侧: 实例化渲染 (1个实例化网格包含${count}个实例)</div>
    <div>使用场景切换按钮来比较两种渲染方式的性能</div>
  `;
  
  // 生成常规网格
  console.time("生成常规网格");
  for (let i = 0; i < count; i++) {
    const { position, rotation, scale } = generateRandomTransform();
    
    const mesh = new MeshInstance3D(`常规盒子${i}`, 
      boxGeometry.clone(),
      boxMaterial.clone()
    );
    
    mesh.setPosition(position.x, position.y, position.z);
    mesh.setRotation(rotation.x, rotation.y, rotation.z);
    mesh.setScale(scale.x, scale.y, scale.z);
    
    regularContainer.addChild(mesh);
    regularMeshes.push(mesh);
  }
  console.timeEnd("生成常规网格");
  
  // 生成实例化网格
  console.time("生成实例化网格");
  instancedMesh = new MeshInstance3D("实例化盒子",
    boxGeometry,
    boxMaterial.clone()
  );
  
  // 启用实例化渲染
  instancedMesh.setUseInstancing(true, count);
  
  // 设置实例矩阵
  for (let i = 0; i < count; i++) {
    const { position, rotation, scale } = generateRandomTransform();
    
    const matrix = new THREE.Matrix4();
    matrix.compose(
      position, 
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z)), 
      scale
    );
    
    instancedMesh.updateInstanceMatrix(i, matrix);
    
    // 设置随机颜色
    instancedMesh.setInstanceColor(i, new THREE.Color(
      Math.random(),
      Math.random(),
      Math.random()
    ));
  }
  
  instancedContainer.addChild(instancedMesh);
  console.timeEnd("生成实例化网格");
};

// 性能测量脚本
class PerformanceScript extends Script {
  private frameCount: number = 0;
  private lastTime: number = 0;
  private currentFPS: number = 0;
  private sceneName: string = '';
  private fpsHistory: number[] = [];
  private readonly maxHistoryLength = 60;
  
  onStart(): void {
    console.log(this.getNode(),'this.getNode()?')
    this.sceneName = this.getNode()?.getScene()?.getName() || '';
    this.lastTime = performance.now();
  }
  
  update(deltaTime: number): void {
    const currentTime = performance.now();
    this.frameCount++;
    
    // 每秒计算一次FPS
    if (currentTime - this.lastTime >= 1000) {
      this.currentFPS = this.frameCount * 1000 / (currentTime - this.lastTime);
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // 添加到历史记录
      this.fpsHistory.push(this.currentFPS);
      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }
      
      // 计算平均FPS
      const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
      
      // 更新显示
      const statsElement = document.getElementById(`${this.sceneName.includes('常规') ? 'regular' : 'instanced'}-stats`);
      if (statsElement) {
        statsElement.textContent = `${this.sceneName}: ${this.currentFPS.toFixed(1)} FPS (平均: ${avgFPS.toFixed(1)})`;
      }
    }
    
    // 更新对应的stats.js实例
    if (this.sceneName.includes('常规')) {
      stats.regular.update();
    } else {
      stats.instanced.update();
    }
  }
}

// 添加性能监控脚本
const regularPerformance = new Node3d("常规性能监控");
regularPerformance.addScript(PerformanceScript);
regularScene.addNode(regularPerformance);

const instancedPerformance = new Node3d("实例化性能监控");
instancedPerformance.addScript(PerformanceScript);
instancedScene.addNode(instancedPerformance);

// 添加自定义FPS显示
const createFPSDisplay = (id: string, top: string) => {
  const display = document.createElement('div');
  display.id = id;
  display.style.position = 'absolute';
  display.style.top = top;
  display.style.left = '10px';
  display.style.backgroundColor = 'rgba(0,0,0,0.7)';
  display.style.color = 'white';
  display.style.padding = '5px';
  display.style.borderRadius = '3px';
  display.style.fontSize = '14px';
  document.body.appendChild(display);
};

createFPSDisplay('regular-stats', '80px');
createFPSDisplay('instanced-stats', '110px');

// 添加动画效果
class AnimationScript extends Script {
  update(deltaTime: number): void {
    const time = Date.now() * 0.001;
    
    // 为常规网格添加动画
    regularMeshes.forEach((mesh, index) => {
      if (index % 10 === 0) { // 只为10%的对象添加动画以减轻负担
        const position = mesh.position;
        mesh.setPosition(
          position.x,
          position.y + Math.sin(time + index * 0.1) * 0.01,
          position.z
        );
      }
    });
    
    // 为实例化网格添加动画
    if (instancedMesh && instancedMesh.getMesh() instanceof THREE.InstancedMesh) {
      for (let i = 0; i < objectCount; i++) {
        if (i % 10 === 0) { // 同样只为10%的实例添加动画
          const matrix = new THREE.Matrix4();
          instancedMesh.getMesh().getMatrixAt(i, matrix);
          
          const position = new THREE.Vector3();
          const quaternion = new THREE.Quaternion();
          const scale = new THREE.Vector3();
          
          matrix.decompose(position, quaternion, scale);
          
          position.y += Math.sin(time + i * 0.1) * 0.01;
          
          matrix.compose(position, quaternion, scale);
          instancedMesh.updateInstanceMatrix(i, matrix);
        }
      }
    }
  }
}

// 添加动画脚本
const regularAnimation = new Node3d("常规动画");
regularAnimation.addScript(AnimationScript);
regularScene.addNode(regularAnimation);

const instancedAnimation = new Node3d("实例化动画");
instancedAnimation.addScript(AnimationScript);
instancedScene.addNode(instancedAnimation);

// 初始生成对象
regenerateObjects(objectCount);

// 默认激活常规场景
engine.activateScene("常规网格场景");

// 启动引擎
engine.start();

// 添加键盘控制切换场景
document.addEventListener('keydown', (event) => {
  if (event.key === '1') {
    engine.activateScene("常规网格场景");
  } else if (event.key === '2') {
    engine.activateScene("实例化网格场景");
  }
});

// 创建场景切换按钮
const createSceneSwitchButton = (text: string, sceneName: string, bottom: string) => {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.position = 'absolute';
  button.style.bottom = bottom;
  button.style.left = '50%';
  button.style.transform = 'translateX(-50%)';
  button.style.padding = '10px 20px';
  button.style.fontSize = '16px';
  button.onclick = () => engine.activateScene(sceneName);
  document.body.appendChild(button);
};

createSceneSwitchButton('切换到常规渲染（按键1）', "常规网格场景", '70px');
createSceneSwitchButton('切换到实例化渲染（按键2）', "实例化网格场景", '120px');