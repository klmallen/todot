import { Clock } from './Clock';
import { IRenderer } from './IRenderer';
import { IPhysics } from './IPhysics';
import { Scene } from './Scene';
import { Camera } from './Camera';
import { GameObject } from './GameObject';
import { Script } from './Script/Script';
import * as THREE  from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Node3d } from './Node3d';
import { SceneSerializer } from './SceneSerializer';

export default class Engine {
  private static instance: Engine | null = null;

  private clock: Clock;
  private renderer: THREE.WebGLRenderer | IRenderer;
  private physics: IPhysics | null;
  private threeScene: THREE.Scene;  // 引擎唯一的THREE场景
  private scenes: Map<string, Scene> = new Map();  // 场景管理器
  private camera: Camera;
  private orbitControls: OrbitControls | null = null;
  private uiComponents: Map<string, HTMLElement> = new Map();
  private canvas: HTMLCanvasElement;
  private boundOnWindowResize: () => void;
  private activeScenes: Set<string> = new Set();  // 存储激活的场景名称
  private showBoundingBoxes: boolean = false;
  private boundingBoxHelpers: Map<THREE.Object3D, THREE.BoxHelper> = new Map();

  constructor(canvas?: HTMLCanvasElement, physics: IPhysics | null = null) {
    // 确保单例实现
    if (Engine.instance) {
      return Engine.instance;
    }

    Engine.instance = this;
    this.clock = new Clock();
    this.canvas = canvas || document.createElement('canvas');
    this.threeScene = new THREE.Scene();

    this.physics = physics;
    this.camera = new Camera();

    // 预绑定事件处理函数，避免多次绑定创建多个函数实例
    this.boundOnWindowResize = this.onWindowResize.bind(this);
  }
  public getPhysics(): IPhysics | null {
    return this.physics;
  }
  // 添加静态方法获取实例
  public static getInstance(): Engine {
    if (!Engine.instance) {
      throw new Error('引擎实例尚未创建');
    }
    return Engine.instance;
  }

  private async initRenderer(useWebGPU: boolean): Promise<void> {
    try {
      if (useWebGPU) {
        // 尝试创建WebGPU渲染器
        const { WebGPURenderer } = await import('./WebGPURenderer');
        this.renderer = new WebGPURenderer({
          canvas: this.canvas,
          alpha: true
        });

        // 等待WebGPU渲染器初始化完成
        if (!this.renderer.isInitialized()) {
          console.warn('WebGPU渲染器尚未初始化完成，等待初始化...');
          // 这里可以添加等待逻辑，但WebGPURenderer的构造函数已经调用了init
        }

        console.log('成功创建WebGPU渲染器');
      } else {
        // 创建WebGL渲染器
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          alpha: true
        });

        // 设置WebGL渲染器的基本属性
        const webglRenderer = this.renderer as THREE.WebGLRenderer;
        webglRenderer.setPixelRatio(window.devicePixelRatio);
        webglRenderer.setSize(window.innerWidth, window.innerHeight);
        webglRenderer.shadowMap.enabled = true;
        webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 如果没有提供canvas，将渲染器的canvas添加到文档中
        if (!this.canvas.parentElement) {
          document.body.appendChild(webglRenderer.domElement);
        }

        console.log('成功创建WebGL渲染器');
      }

      // 移除可能存在的旧监听器
      window.removeEventListener('resize', this.boundOnWindowResize);
      // 添加窗口大小变化的监听
      window.addEventListener('resize', this.boundOnWindowResize);

      this.canvas.style.pointerEvents = 'auto';
      // 确保渲染器的canvas不会阻止事件传播
      const domElement = this.renderer instanceof THREE.WebGLRenderer
        ? this.renderer.domElement
        : (this.renderer as any).getNativeRenderer().domElement;

      if (domElement) {
        domElement.style.pointerEvents = 'auto';
      }
    } catch (error) {
      console.error('渲染器初始化失败:', error);

      // 如果WebGPU初始化失败，回退到WebGL
      if (useWebGPU) {
        console.warn('WebGPU不受支持或初始化失败，回退到WebGL渲染器');
        return this.initRenderer(false);
      }

      throw new Error(`渲染器初始化失败: ${error.message}`);
    }
  }

  // 修改 start 方法以确保生命周期调用
  public async start(): Promise<void> {
    // 初始化轨道控制器 - 可选择在这里初始化或由用户手动调用
    this.initOrbitControls();

    // 初始化场景中所有节点的 onReady
    this.scenes.forEach(scene => {
      const rootNode = scene.getRootNode();
      rootNode.onReady();
    });

    // 激活默认场景
    for (const [name, scene] of this.scenes.entries()) {
      if (scene.isActive()) {
        scene.activate(); // 这将触发 onEnterScene
      }
    }

    this.clock.start();
    this.update();
  }

  private onWindowResize(): void {
    if (this.camera) {
      const camera = this.camera.getThreeCamera() as THREE.PerspectiveCamera;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    // 根据渲染器类型调用不同的setSize方法
    if (this.renderer instanceof THREE.WebGLRenderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    } else {
      // 假设其他渲染器通过getNativeRenderer()获取原生渲染器
      const nativeRenderer = (this.renderer as any).getNativeRenderer();
      if (nativeRenderer && typeof nativeRenderer.setSize === 'function') {
        nativeRenderer.setSize(window.innerWidth, window.innerHeight);
      }
    }
  }

  // 初始化轨道控制器，确保不会拦截其他DOM事件
  private initOrbitControls(): void {
    if (this.camera && this.renderer) {
      // 先移除旧的控制器
      if (this.orbitControls) {
        this.orbitControls.dispose();
      }

      // 获取适当的DOM元素
      const domElement = this.renderer instanceof THREE.WebGLRenderer
        ? this.renderer.domElement
        : (this.renderer as any).getNativeRenderer().domElement;

      this.orbitControls = new OrbitControls(this.camera.getThreeCamera(), domElement);
      console.log(domElement, 'domElement for OrbitControls');

      // 设置控制器默认属性
      this.orbitControls.enableDamping = true; // 添加阻尼效果
      this.orbitControls.dampingFactor = 0.25;
      this.orbitControls.enableZoom = true;
      this.orbitControls.minDistance = 1;
      this.orbitControls.maxDistance = 1000;

      // 确保控制器只在用户按下特定键时才响应，比如按住Alt键
      // this.orbitControls.keyPanSpeed = 0;  // 禁用键盘平移
      // this.orbitControls.keys = {
      //   LEFT: 'KeyA', RIGHT: 'KeyD', UP: 'KeyW', BOTTOM: 'KeyS'
      // };
    }
  }

  // 更新 update 方法以包含轨道控制器更新
  private update(): void {
    const deltaTime = this.clock.getDelta();

    // 更新物理系统
    if (this.physics) {
      this.physics.update(deltaTime);
    }

    // 更新轨道控制器
    if (this.orbitControls) {
      this.orbitControls.update();
    }

    // 更新所有场景，但只有激活的场景会实际更新其节点
    this.scenes.forEach(scene => {
      scene.update(deltaTime);
    });

    // 使用渲染器进行渲染
    this.renderer.render(this.threeScene, this.camera.getThreeCamera());

    // 更新包围盒辅助器
    this.updateBoundingBoxHelpers();

    requestAnimationFrame(() => this.update());
  }

  // 获取轨道控制器
  public getOrbitControls(): OrbitControls | null {
    return this.orbitControls;
  }

  // 设置轨道控制器的配置
  public configureOrbitControls(config: Partial<OrbitControls>): void {
    if (this.orbitControls) {
      Object.assign(this.orbitControls, config);
    }
  }

  // 获取渲染器
  public getRenderer(): THREE.WebGLRenderer | IRenderer {
    return this.renderer;
  }

  // 获取原生渲染器
  public getNativeRenderer(): THREE.WebGLRenderer | any {
    if (this.renderer instanceof THREE.WebGLRenderer) {
      return this.renderer;
    } else {
      return (this.renderer as any).getNativeRenderer();
    }
  }

  // 修改 dispose 方法确保正确清理事件监听器
  public dispose(): void {
    // 停止动画循环
    this.clock.stop();

    // 清理渲染器
    if (this.renderer instanceof THREE.WebGLRenderer) {
      this.renderer.dispose();
    } else {
      this.renderer.dispose();
    }

    // 移除事件监听
    window.removeEventListener('resize', this.boundOnWindowResize);

    // 清理场景
    this.scenes.forEach(scene => {
      scene.dispose();
    });
    this.scenes.clear();

    // 清理 UI 组件
    this.uiComponents.forEach(component => {
      if (component.parentElement) {
        component.parentElement.removeChild(component);
      }
    });
    this.uiComponents.clear();

    // 重置实例
    Engine.instance = null;
  }

  public setScene(scene: Scene): void {
    this.scene = scene;
  }

  public getScene(): Scene | null {
    return this.scene;
  }

  public setCamera(camera: Camera): void {
    this.camera = camera;
  }

  public getCamera(): Camera {
    return this.camera;
  }
  public getELementRender(): HTMLElement {
    return this.renderer.domElement;
  }


  // 修改 init 方法以选择渲染器类型
  async init(options: {
    showDefaultUI?: boolean,
    showHelpers?: boolean,
    addDefaultLights?: boolean,
    useWebGPU?: boolean, // 新增选项
    showBoundingBoxes?: boolean, // 新增选项
  } = {}) {
    // 核心引擎初始化
    const useWebGPU = options.useWebGPU ?? false;
    // 初始化渲染器，确保在init阶段就创建渲染器
    await this.initRenderer(useWebGPU).catch(error => {
      console.error('渲染器初始化失败:', error);
      throw new Error('渲染器初始化失败');
    });

    // 添加默认灯光
    if (options.addDefaultLights) {
      this.setupDefaultLights();
    }
    if (options.showBoundingBoxes) {
      this.setShowBoundingBoxes(true);
    }
    // 添加辅助工具
    if (options.showHelpers) {
      this.setupHelpers();
    }

    // 只有在需要时才初始化UI
    if (options.showDefaultUI) {
      this.initDefaultUI();
    }

    return this;
  }

  // 设置默认灯光
  private setupDefaultLights(): void {
    // 使用更亮的环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.threeScene.add(ambientLight);

    // 添加半球光 - 提供更自然的环境光照
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    this.threeScene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    // 优化阴影设置
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.threeScene.add(directionalLight);
  }

  // 设置辅助工具
  private setupHelpers(): void {
    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(100, 100);
    this.threeScene.add(gridHelper);

    // 添加坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(5);
    this.threeScene.add(axesHelper);
  }

  // 添加UI组件，确保事件处理正确
  addUIComponent(id: string, component: HTMLElement, container?: HTMLElement) {
    const targetContainer = container || document.body;
    component.style.pointerEvents = 'auto'; // 确保组件可以接收事件
    targetContainer.appendChild(component);
    this.uiComponents.set(id, component);
    return this;
  }

  // 移除UI组件
  removeUIComponent(id: string) {
    const component = this.uiComponents.get(id);
    if (component && component.parentNode) {
      component.parentNode.removeChild(component);
      this.uiComponents.delete(id);
    }
    return this;
  }

  // 添加游戏对象到场景
  addGameObject(gameObject: GameObject) {
    console.log(gameObject,' 引擎 - gameObject')
    this.scene.addGameObject(gameObject);
    return gameObject;
  }

  // 从场景移除游戏对象
  removeGameObject(gameObject: GameObject) {
    this.scene.removeGameObject(gameObject);
    return this;
  }

  // 初始化默认UI，确保事件处理正确
  private initDefaultUI() {
    // 创建左侧面板
    const leftPanel = document.createElement('div');
    leftPanel.id = 'left_panel';
    leftPanel.className = 'editor-panel left-panel';
    leftPanel.style.pointerEvents = 'auto'; // 确保面板可以接收事件
    document.body.appendChild(leftPanel);

    // 创建右侧面板
    const rightPanel = document.createElement('div');
    rightPanel.id = 'right_panel';
    rightPanel.className = 'editor-panel right-panel';
    rightPanel.style.pointerEvents = 'auto'; // 确保面板可以接收事件
    document.body.appendChild(rightPanel);

    // 添加场景树视图
    const sceneTreeView = document.createElement('sodot-tree-view');
    sceneTreeView.style.pointerEvents = 'auto'; // 确保组件可以接收事件
    this.addUIComponent('sceneTreeView', sceneTreeView, leftPanel);

    // 添加其他默认UI组件...
  }

  // 添加场景到引擎并处理生命周期
  public addScene(scene: Scene): void {
    if (this.scenes.has(scene.getName())) {
      throw new Error(`场景 ${scene.getName()} 已存在`);
    }

    this.scenes.set(scene.getName(), scene);

    // 确保根节点的 onReady 被调用
    const rootNode = scene.getRootNode();
    rootNode.onReady();
  }

  /**
   * 激活场景
   * @param name 场景名称
   * @param exclusive 是否独占激活（停用其他场景）
   */
  public activateScene(name: string, exclusive: boolean = false): void {
    const scene = this.scenes.get(name);
    if (scene) {
      if (exclusive) {
        // 停用所有其他场景
        this.scenes.forEach((otherScene, sceneName) => {
          if (sceneName !== name && otherScene.isActive()) {
            otherScene.deactivate();
            this.activeScenes.delete(sceneName);
            this.threeScene.remove(otherScene.getThreeObject());
          }
        });
      }

      scene.activate();
      this.activeScenes.add(name);
      this.threeScene.add(scene.getThreeObject());
    }
  }

  /**
   * 停用场景
   * @param name 场景名称
   */
  public deactivateScene(name: string): void {
    const scene = this.scenes.get(name);
    if (scene) {
      scene.deactivate();
      this.activeScenes.delete(name);
      this.threeScene.remove(scene.getThreeObject());
    }
  }

  /**
   * 检查场景是否激活
   * @param name 场景名称
   */
  public isSceneActive(name: string): boolean {
    return this.activeScenes.has(name);
  }

  /**
   * 获取所有激活的场景
   */
  public getActiveScenes(): Scene[] {
    return Array.from(this.activeScenes).map(name => this.scenes.get(name)).filter(Boolean) as Scene[];
  }

  /**
   * 导出引擎状态
   */
  public exportEngineState(): any {
    const scenes: { [name: string]: any } = {};

    // 序列化所有场景
    this.scenes.forEach((scene, name) => {
      scenes[name] = scene.toJSON();
    });

    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      scenes,
      activeScenes: Array.from(this.activeScenes),
      settings: {
        // 可以添加引擎级别的设置
      }
    };
  }

  /**
   * 导入引擎状态
   * @param state 引擎状态
   */
  public importEngineState(state: any): void {
    // 验证版本
    if (state.version !== '1.0.0') {
      console.warn('引擎状态版本不匹配');
    }

    // 清除现有状态
    this.reset();

    // 导入场景
    Object.entries(state.scenes).forEach(([name, sceneData]) => {
      const scene = SceneSerializer.deserializeScene(JSON.stringify(sceneData));
      this.addScene(scene);
    });

    // 激活场景
    state.activeScenes.forEach((name: string) => {
      this.activateScene(name, false);
    });
  }

  // 获取场景
  public getScene(name: string): Scene | undefined {
    return this.scenes.get(name);
  }

  // 删除场景
  public removeScene(name: string): void {
    const scene = this.scenes.get(name);
    if (scene) {
      if (scene.isActiveScene()) {
        this.threeScene.remove(scene.getThreeObject());
      }
      this.scenes.delete(name);
    }
  }

  // 根据ID获取节点
  public getNodeById(id: string): Node3d | null {
    for (const scene of this.scenes.values()) {
      const node = scene.getNodeById(id);
      if (node) return node;
    }
    return null;
  }

  // 根据名称获取节点（可能有多个同名节点）
  public getNodesByName(name: string): Node3d[] {
    const result: Node3d[] = [];
    for (const scene of this.scenes.values()) {
      const nodes = scene.getNodesByName(name);
      result.push(...nodes);
    }
    return result;
  }

  // 根据类型获取节点
  public getNodesByType<T extends Node3d>(type: new (...args: any[]) => T): T[] {
    const result: T[] = [];
    for (const scene of this.scenes.values()) {
      const nodes = scene.getNodesByType(type);
      result.push(...nodes);
    }
    return result;
  }

  // 在所有场景中查找节点
  public findNodes(predicate: (node: Node3d) => boolean): Node3d[] {
    const result: Node3d[] = [];
    for (const scene of this.scenes.values()) {
      const nodes = scene.findNodes(predicate);
      result.push(...nodes);
    }
    return result;
  }

  /**
   * 保存场景为 JSON 文件
   * @param sceneName 场景名称
   * @param filename 文件名
   */
  public saveSceneToFile(sceneName: string, filename?: string): void {
    const scene = this.scenes.get(sceneName);
    if (!scene) {
      console.error(`场景 ${sceneName} 不存在`);
      return;
    }

    const actualFilename = filename || `${sceneName}.json`;
    SceneSerializer.exportSceneToFile(scene, actualFilename);
  }

  /**
   * 从 JSON 文件加载场景
   * @param file JSON 文件
   * @returns Promise<string> 加载的场景名称
   */
  public async loadSceneFromFile(file: File): Promise<string> {
    try {
      const scene = await SceneSerializer.importSceneFromFile(file);
      const sceneName = scene.getName();

      // 如果场景已存在，先移除
      if (this.scenes.has(sceneName)) {
        this.removeScene(sceneName);
      }

      // 添加新场景
      this.addScene(scene);
      return sceneName;
    } catch (error) {
      console.error('加载场景失败:', error);
      throw error;
    }
  }

  /**
   * 将场景导出为JSON对象
   * @param sceneName 场景名称
   * @returns 场景的JSON表示
   */
  public exportSceneToJSON(sceneName: string): any {
    const scene = this.scenes.get(sceneName);
    if (!scene) {
      console.error(`场景 ${sceneName} 不存在`);
      return null;
    }

    const jsonStr = SceneSerializer.serializeScene(scene, false);
    return JSON.parse(jsonStr);
  }

  /**
   * 从JSON对象导入场景
   * @param jsonData 场景的JSON表示
   * @returns 加载的场景名称
   */
  public importSceneFromJSON(jsonData: any): string {
    try {
      // 如果传入的是对象，转换为字符串
      const jsonStr = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);

      const scene = SceneSerializer.deserializeScene(jsonStr);
      const sceneName = scene.getName();

      // 如果场景已存在，先移除
      if (this.scenes.has(sceneName)) {
        this.removeScene(sceneName);
      }

      // 添加新场景
      this.addScene(scene);
      return sceneName;
    } catch (error) {
      console.error('从JSON导入场景失败:', error);
      throw error;
    }
  }

  // 重置引擎状态
  public reset(): void {
    // 清除所有场景
    this.scenes.clear();

    // 重置其他状态
    this.activeScenes.clear();

    // 重置渲染器状态
    this.renderer.setSize(this.canvas.width, this.canvas.height);
    this.renderer.clear();
  }

  // 创建默认场景
  public createDefaultScene(name: string = 'Default Scene'): Scene {
    const scene = new Scene(name);

    // 添加一些默认对象
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // 添加地板网格
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // 添加一个默认立方体
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x3080ff });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    scene.add(cube);

    // 将场景添加到引擎
    this.addScene(scene);
    this.activateScene(name);

    return scene;
  }

  // 获取所有场景
  public getAllScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  // 加载场景数据
  public loadSceneData(sceneId: string, data: any): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene not found: ${sceneId}`);
    }

    // 清除现有对象
    scene.clear();

    // 解析和添加节点
    if (data.nodes && Array.isArray(data.nodes)) {
      this.parseNodes(scene, data.nodes);
    }

    // 应用场景设置
    if (data.settings) {
      scene.settings = { ...data.settings };

      // 应用背景色
      if (data.settings.background) {
        scene.background = new THREE.Color(data.settings.background);
      }

      // 应用其他设置...
    }
  }

  // 解析节点数据并重建场景
  private parseNodes(scene: Scene, nodes: any[]): void {
    // 实现节点数据解析和重建逻辑
    // 这个函数需要根据你的节点结构进行实现
  }

  /**
   * 设置是否显示所有物体的包围盒
   * @param show 是否显示
   */
  public setShowBoundingBoxes(show: boolean): void {
    this.showBoundingBoxes = show;

    if (show) {
      this.createBoundingBoxHelpers();
    } else {
      this.removeBoundingBoxHelpers();
    }
  }

  /**
   * 为所有场景中的对象创建包围盒辅助器
   */
  private createBoundingBoxHelpers(): void {
    // 先清除现有的包围盒辅助器
    this.removeBoundingBoxHelpers();
    // 为每个场景中的每个对象创建包围盒辅助器
    console.log(this.getAllScenes(),'getAllScenes')
    this.getAllScenes().forEach(scene => {
      scene.getAllNodes().forEach(node => {
        const obj = node.getThreeObject();
        if (obj && obj.visible) {
          // 创建包围盒辅助器
          const boxHelper = new THREE.BoxHelper(obj, 0xffff00);
          this.boundingBoxHelpers.set(obj, boxHelper);
          // 添加到场景
          scene.threeScene.add(boxHelper);
        }
      });
    });
  }

  /**
   * 移除所有包围盒辅助器
   */
  private removeBoundingBoxHelpers(): void {
    // 从场景中移除所有包围盒辅助器
    this.boundingBoxHelpers.forEach((helper, obj) => {
      const scene = this.findSceneByObject(obj);
      if (scene) {
        scene.getThreeScene().remove(helper);
      }
    });

    // 清空映射
    this.boundingBoxHelpers.clear();
  }

  /**
   * 更新所有包围盒辅助器
   * 在每帧调用
   */
  public updateBoundingBoxHelpers(): void {
    if (!this.showBoundingBoxes) return;

    this.boundingBoxHelpers.forEach((helper, obj) => {
      helper.update();
    });
  }

  /**
   * 根据对象查找其所在的场景
   * @param obj 要查找的对象
   * @returns 包含该对象的场景，如果未找到则返回null
   */
  private findSceneByObject(obj: THREE.Object3D): Scene | null {
    for (const scene of this.getAllScenes()) {
      for (const node of scene.getAllNodes()) {
        if (node.getThreeObject() === obj) {
          return scene;
        }
      }
    }
    return null;
  }
}
