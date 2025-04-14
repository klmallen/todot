import * as THREE from 'three';
import Engine from './engine/core/Engine';
import { Scene } from './engine/core/Scene';
import { Node3d } from './engine/core/Node3d';
import { RaycastNode, RaycastFollowMode } from './engine/input/RaycastNode';

/**
 * 射线节点增强示例
 * 展示如何使用增强型射线节点的新功能
 */
export class RaycastExample {
  private engine: Engine;
  private scene: Scene;
  private raycastNode: RaycastNode;
  private sphereNode: Node3d;
  private cubeNode: Node3d;
  private capsuleNode: Node3d;
  private targetNode: Node3d;
  
  // 命中材质 (红色)
  private hitMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    roughness: 0.3,
    metalness: 0.5
  });
  
  // 保存原始材质
  private originalMaterials: Map<Node3d, THREE.Material | THREE.Material[]> = new Map();
  
  /**
   * 初始化示例
   */
  async initialize(): Promise<void> {
    // 创建引擎实例
    this.engine = new Engine();
    await this.engine.init({
      showDefaultUI: true,
      addDefaultLights: true,
      useWebGPU: false,
      showBoundingBoxes: true,
    });
    
    // 创建场景
    this.scene = new Scene('射线示例场景');
    this.engine.addScene(this.scene);
    
    // 设置相机位置
    const camera = this.engine.getCamera();
    camera.getThreeCamera().position.set(0, 5, 10);
    camera.getThreeCamera().lookAt(0, 0, 0);
    
    // 创建一个地板
    this.createFloor();
    
    // 创建测试物体
    this.sphereNode = this.createSphere();
    this.cubeNode = this.createCube();
    this.capsuleNode = this.createCapsule();
    this.targetNode = this.createTargetNode();
    
    this.scene.addNode(this.sphereNode);
    this.scene.addNode(this.cubeNode);
    this.scene.addNode(this.capsuleNode);
    this.scene.addNode(this.targetNode);
    
    // 保存原始材质
    this.saveOriginalMaterials();
    
    // 创建射线起点节点
    const raycastOrigin = new Node3d('射线起点');
    raycastOrigin.position.set(0, 0.1, 0);  // 降低射线起点高度，更容易观察
    this.scene.addNode(raycastOrigin);
    
    // 创建射线节点，并添加到射线起点下
    this.raycastNode = new RaycastNode('射线节点');
    this.raycastNode.setShowHelper(true);
    this.raycastNode.setMultipleHits(true)
    raycastOrigin.addChild(this.raycastNode);
    
    // 设置射线，朝指定方向，起点为原点，长度为5
    const testDirection = new THREE.Vector3(-1, 0, 0);  // 改为水平方向，沿X轴正方向
    this.raycastNode.setupRay(
      new THREE.Vector3(0, 0, 0),  // 起点偏移置为0，使用节点位置作为起点
      testDirection,                // 方向
      5,                           // 长度
      new THREE.Color('red'),      // 颜色
      false                         // 不使用节点朝向
    );
    
    // 输出debug信息
    console.log('设置的方向:', testDirection);
    console.log('节点四元数:', 
      this.raycastNode.getThreeObject().quaternion.x,
      this.raycastNode.getThreeObject().quaternion.y,
      this.raycastNode.getThreeObject().quaternion.z,
      this.raycastNode.getThreeObject().quaternion.w
    );
    
    // 添加一个测试按钮，直接设置方向不经过四元数转换
    setTimeout(() => {
      const testButton = document.createElement('button');
      testButton.textContent = '测试: 直接设置X轴方向';
      testButton.style.position = 'absolute';
      testButton.style.top = '10px';
      testButton.style.left = '10px';
      testButton.style.padding = '10px';
      testButton.style.zIndex = '1000';
      
      testButton.addEventListener('click', () => {
        console.log('===== 测试直接设置方向 =====');
        
        // 如果已经存在射线，先销毁
        if (this.raycastNode.isRaySetup()) {
          this.raycastNode.resetRay();
        }
        
        // 创建一个新的THREE.Line直接绘制路径
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(50, 0, 0) // 沿X轴50个单位
        ]);
        
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        
        // 获取射线节点的Three.js对象
        const raycastObj = this.raycastNode.getThreeObject();
        
        // 添加线到射线节点
        raycastObj.add(line);
        
        console.log('直接创建了一条沿X轴的线');
      });
      
      document.body.appendChild(testButton);
    }, 1000);
    
    // 默认情况下不设置射线，所以不会绘制和检测
    // 我们将在控制脚本中通过按钮触发设置
    
    // 设置事件监听
    this.setupEventListeners();
    
    // 添加示例控制脚本
    this.setupControlScript();
    
    // 创建UI控制面板
    this.createControlPanel();
    
    // 启动引擎
    this.engine.activateScene(this.scene.getName());
    this.engine.start();
    
    this.engine.setShowBoundingBoxes(true)
    console.log('射线节点示例已初始化');
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
   * 创建球体节点
   */
  private createSphere(): Node3d {
    const sphereNode = new Node3d('球体');
    
    // 创建一个球体网格
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3366ff,
      roughness: 0.3,
      metalness: 0.7
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // 将网格添加到节点
    sphereNode.getThreeObject().add(mesh);
    
    // 设置位置
    sphereNode.position.set(0, 1, 0);
    
    return sphereNode;
  }
  
  /**
   * 创建立方体节点
   */
  private createCube(): Node3d {
    const cubeNode = new Node3d('立方体');
    
    // 创建一个立方体网格
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6633,
      roughness: 0.2,
      metalness: 0.5
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // 将网格添加到节点
    cubeNode.getThreeObject().add(mesh);
    
    // 设置位置
    cubeNode.position.set(0, 0.75, -3);
    
    return cubeNode;
  }
  
  /**
   * 创建胶囊体节点
   */
  private createCapsule(): Node3d {
    const capsuleNode = new Node3d('胶囊体');
    
    // 创建一个胶囊体网格
    const geometry = new THREE.CapsuleGeometry(0.5, 2, 20, 20);
    const material = new THREE.MeshStandardMaterial({
      color: 0x66cc33,
      roughness: 0.4,
      metalness: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // 将网格添加到节点
    capsuleNode.getThreeObject().add(mesh);
    
    // 设置位置
    capsuleNode.position.set(-4, 1.5, 0);
    
    return capsuleNode;
  }
  
  /**
   * 创建目标节点
   */
  private createTargetNode(): Node3d {
    const targetNode = new Node3d('目标节点');
    
    // 添加一个八面体作为目标标记
    const geometry = new THREE.OctahedronGeometry(0.3, 0);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffcc00,
      emissive: 0x332200
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    // 将网格添加到节点
    targetNode.getThreeObject().add(mesh);
    
    // 设置位置
    targetNode.position.set(4, 3, -3);
    
    return targetNode;
  }
  
  /**
   * 保存原始材质
   */
  private saveOriginalMaterials(): void {
    // 保存每个对象的原始材质
    [this.sphereNode, this.cubeNode, this.capsuleNode].forEach(node => {
      if (!node) return;
      
      const obj = node.getThreeObject();
      if (obj.children[0] instanceof THREE.Mesh) {
        this.originalMaterials.set(node, (obj.children[0] as THREE.Mesh).material);
      }
    });
  }
  
  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.raycastNode) return;
    
    // 单个物体检测事件
    this.raycastNode.on('enter', (result: any) => {
      console.log('射线进入物体:', result.node?.name);
      this.changeNodeMaterial(result.node, this.hitMaterial);
      // 在射线命中点添加可视化标记
      const hitMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({color: 0xffff00})
      );
      hitMarker.position.copy(result.point);
    });
    
    this.raycastNode.on('exit', (result: any) => {
      console.log('射线离开物体:', result.node?.name);
      this.restoreNodeMaterial(result.node);
    });
    
    // 多物体检测事件
    this.raycastNode.on('hits', (results: any[]) => {
      console.log(`射线命中 ${results.length} 个物体`);
      
      // 显示命中的所有物体 (根据控制面板设置)
      const multipleHitsToggle = document.getElementById('multipleHitsToggle') as HTMLInputElement;
      if (multipleHitsToggle?.checked) {
        results.forEach(result => {
          this.changeNodeMaterial(result.node, this.hitMaterial);
        });
      }
    });
    
    this.raycastNode.on('enter:multiple', (data: any) => {
      const { result, index, total } = data;
      console.log(`射线进入物体 [${index + 1}/${total}]:`, result.node?.name);
    });
    
    this.raycastNode.on('exit:multiple', (data: any) => {
      console.log('射线离开物体:', data.node?.name);
      this.restoreNodeMaterial(data.node);
    });
  }
  
  /**
   * 设置控制脚本
   */
  private setupControlScript(): void {
    // 在场景根节点添加脚本
    this.scene.getRootNode().addScript(class RaycastControlScript extends Script {
      private targetNode: Node3d | null = null;
      private raycastNode: RaycastNode | null = null;
      private selectedDirection: string = '';
      
      override onStart(): void {
        // 获取节点引用
        this.targetNode = this.getNode().getChildByName('目标节点') as Node3d;
        const raycastOrigin = this.getNode().getChildByName('射线起点') as Node3d;
        this.raycastNode = raycastOrigin?.getChildByName('射线节点') as unknown as RaycastNode;
      }
      
      override update(deltaTime: number): void {
        // 旋转目标节点
        if (this.targetNode) {
          this.targetNode.getThreeObject().rotation.y += deltaTime * 0.5;
        }
        
        // 显示射线检测结果
        if (this.raycastNode && this.raycastNode.isRaySetup()) {
          const results = this.raycastNode.getLastResults();
          if (results.length > 0) {
            const resultText = results.map((result, index) => 
              `[${index + 1}] ${result.node?.name || '未知'}: ${result.distance.toFixed(2)}m`
            ).join('\n');
            this.updateInfo(resultText);
          } else {
            this.updateInfo('无命中');
          }
        } else {
          this.updateInfo('射线未设置');
        }
      }
      
      /**
       * 更新射线信息显示
       */
      private updateInfo(message: string): void {
        const infoElement = document.getElementById('raycastInfo');
        if (infoElement) {
          infoElement.textContent = message;
        }
      }
      
      // 添加必要的抽象方法实现
      override onReady(): void {
        // 空实现即可
      }
    });
  }
  
  /**
   * 更改节点材质
   */
  private changeNodeMaterial(node: Node3d | null, material: THREE.Material): void {
    if (!node) return;
    
    const obj = node.getThreeObject();
    if (obj.children[0] instanceof THREE.Mesh) {
      const mesh = obj.children[0] as THREE.Mesh;
      
      // 如果是单个材质，直接替换
      if (!Array.isArray(mesh.material)) {
        mesh.material = material;
      }
      // 如果是材质数组，将第一个材质替换为高亮材质
      else if (mesh.material.length > 0) {
        // 创建新的材质数组
        const newMaterials = [...mesh.material];
        newMaterials[0] = material;
        mesh.material = newMaterials;
      }
    }
  }
  
  /**
   * 恢复节点的原始材质
   */
  private restoreNodeMaterial(node: Node3d | null): void {
    if (!node) return;
    
    const originalMaterial = this.originalMaterials.get(node);
    if (originalMaterial) {
      const obj = node.getThreeObject();
      if (obj.children[0] instanceof THREE.Mesh) {
        const mesh = obj.children[0] as THREE.Mesh;
        mesh.material = originalMaterial;
      }
    }
  }
  
  /**
   * 恢复所有节点的原始材质
   */
  private restoreAllMaterials(): void {
    this.originalMaterials.forEach((material, node) => {
      const obj = node.getThreeObject();
      if (obj.children[0] instanceof THREE.Mesh) {
        const mesh = obj.children[0] as THREE.Mesh;
        mesh.material = material;
      }
    });
  }
  
  /**
   * 创建UI控制面板
   */
  private createControlPanel(): void {
    // 创建控制面板容器
    const panel = document.createElement('div');
    panel.style.position = 'absolute';
    panel.style.top = '10px';
    panel.style.right = '10px';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    panel.style.color = 'white';
    panel.style.padding = '10px';
    panel.style.borderRadius = '5px';
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.width = '200px';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = '射线节点示例';
    title.style.margin = '0 0 10px 0';
    panel.appendChild(title);
    
    // 添加跟随模式选择
    const modeSection = document.createElement('div');
    modeSection.style.marginBottom = '15px';
    
    const modeLabel = document.createElement('div');
    modeLabel.textContent = '跟随模式:';
    modeLabel.style.marginBottom = '5px';
    modeSection.appendChild(modeLabel);
    
    const modes = [
      { value: RaycastFollowMode.NONE, label: '不跟随' },
      { value: RaycastFollowMode.AUTO, label: '自动跟随' },
      { value: RaycastFollowMode.MANUAL, label: '手动更新' }
    ];
    
    const modeButtonsContainer = document.createElement('div');
    modeButtonsContainer.style.display = 'flex';
    modeButtonsContainer.style.gap = '5px';
    
    modes.forEach(mode => {
      const button = document.createElement('button');
      button.textContent = mode.label;
      button.style.flex = '1';
      button.style.padding = '5px';
      button.style.backgroundColor = mode.value === RaycastFollowMode.AUTO ? '#4CAF50' : '#333';
      button.style.border = 'none';
      button.style.color = 'white';
      button.style.borderRadius = '3px';
      button.style.cursor = 'pointer';
      
      button.addEventListener('click', () => {
        if (!this.raycastNode) return;
        
        
        // 设置跟随模式
        this.raycastNode.setFollowMode(mode.value);
        
        // 更新按钮样式
        const buttons = modeButtonsContainer.querySelectorAll('button');
        buttons.forEach(btn => {
          btn.style.backgroundColor = '#333';
        });
        button.style.backgroundColor = '#4CAF50';
        
        console.log('设置跟随模式:', mode.label);
      });
      
      modeButtonsContainer.appendChild(button);
    });
    
    modeSection.appendChild(modeButtonsContainer);
    panel.appendChild(modeSection);
    
    // 添加多物体检测开关
    const multipleHitsSection = document.createElement('div');
    multipleHitsSection.style.marginBottom = '15px';
    
    const multipleHitsLabel = document.createElement('div');
    multipleHitsLabel.textContent = '多物体检测:';
    multipleHitsLabel.style.marginBottom = '5px';
    multipleHitsSection.appendChild(multipleHitsLabel);
    
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    
    const multipleHitsToggle = document.createElement('input');
    multipleHitsToggle.type = 'checkbox';
    multipleHitsToggle.id = 'multipleHitsToggle';
    multipleHitsToggle.style.marginRight = '5px';
    
    multipleHitsToggle.addEventListener('change', (e) => {
      if (!this.raycastNode) return;
      
      const target = e.target as HTMLInputElement;
      this.raycastNode.setMultipleHits(target.checked);
      
      // 切换模式时，恢复所有材质
      this.restoreAllMaterials();
      
      console.log('设置多物体检测:', target.checked);
    });
    
    const toggleLabel = document.createElement('label');
    toggleLabel.htmlFor = 'multipleHitsToggle';
    toggleLabel.textContent = '启用';
    
    toggleContainer.appendChild(multipleHitsToggle);
    toggleContainer.appendChild(toggleLabel);
    multipleHitsSection.appendChild(toggleContainer);
    panel.appendChild(multipleHitsSection);
    
    // 添加射线控制区域
    const raySetupSection = document.createElement('div');
    raySetupSection.style.marginBottom = '15px';
    
    const raySetupLabel = document.createElement('div');
    raySetupLabel.textContent = '射线设置:';
    raySetupLabel.style.marginBottom = '5px';
    raySetupSection.appendChild(raySetupLabel);
    
    // 添加方向选择按钮
    const directionsContainer = document.createElement('div');
    directionsContainer.style.display = 'grid';
    directionsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    directionsContainer.style.gap = '5px';
    directionsContainer.style.marginBottom = '5px';
    
    // 预设的方向
    const directions = [
      { label: '上', vector: new THREE.Vector3(0, 1, 0) },
      { label: '下', vector: new THREE.Vector3(0, -1, 0) },
      { label: '前', vector: new THREE.Vector3(0, 0, -1) },
      { label: '后', vector: new THREE.Vector3(0, 0, 1) },
      { label: '左', vector: new THREE.Vector3(-1, 0, 0) },
      { label: '右', vector: new THREE.Vector3(1, 0, 0) }
    ];
    
    directions.forEach(dir => {
      const button = document.createElement('button');
      button.textContent = dir.label;
      button.style.padding = '5px';
      button.style.backgroundColor = '#333';
      button.style.border = 'none';
      button.style.color = 'white';
      button.style.borderRadius = '3px';
      button.style.cursor = 'pointer';
      
      button.addEventListener('click', () => {
        if (!this.raycastNode) return;
        
        // // 设置射线，朝指定方向，起点为原点，长度为5
        // this.raycastNode.setupRay(
        //   new THREE.Vector3(0, 0, 0),  // 起点偏移
        //   dir.vector,                  // 方向
        //   5,                           // 长度
        //   new THREE.Color(0xff0000),   // 颜色
        //   false                        // 不使用节点朝向，直接使用指定的方向
        // );
        
        // 更新所有按钮样式
        const allButtons = directionsContainer.querySelectorAll('button');
        allButtons.forEach(btn => {
          btn.style.backgroundColor = '#333';
        });
        button.style.backgroundColor = '#4CAF50';
        
        console.log(`设置射线方向: ${dir.label}`);
      });
      
      directionsContainer.appendChild(button);
    });
    
    raySetupSection.appendChild(directionsContainer);
    
    // 添加长度滑块
    const lengthContainer = document.createElement('div');
    lengthContainer.style.marginBottom = '10px';
    
    const lengthLabel = document.createElement('label');
    lengthLabel.textContent = '长度: 5';
    lengthLabel.style.display = 'block';
    lengthLabel.style.marginBottom = '3px';
    lengthContainer.appendChild(lengthLabel);
    
    const lengthSlider = document.createElement('input');
    lengthSlider.type = 'range';
    lengthSlider.min = '1';
    lengthSlider.max = '20';
    lengthSlider.value = '5';
    lengthSlider.style.width = '100%';
    
    lengthSlider.addEventListener('input', (e) => {
      if (!this.raycastNode || !this.raycastNode.isRaySetup()) return;
      
      const target = e.target as HTMLInputElement;
      const length = parseInt(target.value);
      lengthLabel.textContent = `长度: ${length}`;
      
      // 更新射线长度
      this.raycastNode.setMaxDistance(length);
      
      console.log(`设置射线长度: ${length}`);
    });
    
    lengthContainer.appendChild(lengthSlider);
    raySetupSection.appendChild(lengthContainer);
    
    // 添加重置按钮
    const resetButton = document.createElement('button');
    resetButton.textContent = '重置射线';
    resetButton.style.width = '100%';
    resetButton.style.padding = '5px';
    resetButton.style.backgroundColor = '#f44336';
    resetButton.style.border = 'none';
    resetButton.style.color = 'white';
    resetButton.style.borderRadius = '3px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.marginBottom = '10px';
    
    resetButton.addEventListener('click', () => {
      if (!this.raycastNode) return;
      
      // 重置射线
      this.raycastNode.resetRay();
      
      // 重置按钮样式
      const allButtons = directionsContainer.querySelectorAll('button');
      allButtons.forEach(btn => {
        btn.style.backgroundColor = '#333';
      });
      
      console.log('重置射线');
    });
    
    raySetupSection.appendChild(resetButton);
    panel.appendChild(raySetupSection);
    
    // 添加信息显示区域
    const infoSection = document.createElement('div');
    infoSection.style.marginTop = '10px';
    infoSection.style.padding = '5px';
    infoSection.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    infoSection.style.borderRadius = '3px';
    infoSection.style.fontSize = '12px';
    infoSection.style.height = '60px';
    infoSection.style.overflowY = 'auto';
    
    const infoText = document.createElement('div');
    infoText.id = 'raycastInfo';
    infoText.textContent = '等待射线检测...';
    infoSection.appendChild(infoText);
    panel.appendChild(infoSection);
    
    // 添加控制面板到文档
    document.body.appendChild(panel);
    
    // 添加清理函数
    window.addEventListener('beforeunload', () => {
      document.body.removeChild(panel);
    });
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    // 清理材质
    this.hitMaterial.dispose();
    this.originalMaterials.clear();
    
    // 移除控制面板
    const panel = document.querySelector('div h3');
    if (panel && panel.textContent === '射线节点示例') {
      const panelParent = panel.parentElement;
      if (panelParent && panelParent.parentElement) {
        panelParent.parentElement.removeChild(panelParent);
      }
    }
  }
}

// 导入脚本类
import { Script } from './engine/core/Script/Script';

// 创建并启动示例
document.addEventListener('DOMContentLoaded', () => {
  const example = new RaycastExample();
  example.initialize().catch(console.error);
});