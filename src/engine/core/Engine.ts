import { Clock } from "./Clock";
import { IRenderer } from "./IRenderer";
import { IPhysics } from "./IPhysics";
import { Scene } from "./Scene";
import { Camera } from "./Camera";
import { Script } from "./Script/Script";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SceneSerializer } from "./SceneSerializer";
import { PostProcessingManager } from "./postprocessing/PostProcessingManager";
import { PostProcessingEffect } from "./postprocessing/PostProcessingEffect";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import {
  setEditorActive,
  getEditorActive,
  setIsPlaying,
  getIsPlaying,
  getSelectedObject,
  setSelectedObject,
  setIsDragging,
  setSelectedNode,
} from "../states/useEditorMode";
import { ObjectSelector } from "../input/ObjectSelector";
import { createEditorUI } from "../ui/index";
import EventLoopItem from "../utils/EventLoopItem";
import { PropertyPanel } from "../ui/PropertyPanel";
import SceneTreePanel from '../ui/SceneTreePanel';
import { IEngine } from "./interfaces"; // 导入接口
import { WebGPURenderer } from 'three/webgpu';
import { CameraNode3D } from "./CameraNode3D";
import { NodeCreatorUI } from './UINode/NodeCreatorUI';

export default class Engine extends EventLoopItem implements IEngine {
  private static instance: Engine | null = null;
  private isInitialized: boolean = false;  // 添加初始化完成标志
  private allscenes: Map<string, Scene> = new Map(); // 场景管理器
  private clock: Clock;
  private renderer: THREE.WebGLRenderer | WebGPURenderer | IRenderer;
  private physics: IPhysics | null;
  private threeScene: THREE.Scene; // 引擎唯一的THREE场景
  // 编辑器专用场景 - 包含辅助工具和编辑器UI元素
  private editorScene: THREE.Scene;
  // 游戏专用场景 - 仅包含游戏相关元素
  private gameScene: THREE.Scene;
  // 当前活动场景 - 根据模式切换
  private activeThreeScene: THREE.Scene;
  private camera: Camera;  // 当前活动相机
  private editorCamera: Camera | null = null;  // 编辑器相机
  private gameCamera: Camera | null = null;    // 游戏相机
  private orbitControls: OrbitControls | null = null;
  private uiComponents: Map<string, HTMLElement> = new Map();
  private canvas: HTMLCanvasElement;
  private boundOnWindowResize: () => void;
  private activeScenes: Set<string> = new Set(); // 存储激活的场景名称
  private showBoundingBoxes: boolean = false;
  private boundingBoxHelpers: Map<THREE.Object3D, THREE.BoxHelper> = new Map();
  private postProcessingManager: PostProcessingManager;

  // 编辑器相关属性
  private editorMode: boolean = false;
  private transformControls: TransformControls | null = null;
  private objectSelector: ObjectSelector | null = null;
  private scriptsEnabled: boolean = false;
  private propertyPanel: PropertyPanel | null = null; // 存储属性面板引用
  private propertyPanelContainer: HTMLElement | null = null; // 属性面板容器

  // 场景树相关属性
  private sceneTreePanel: SceneTreePanel | null = null;
  private sceneTreeContainer: HTMLElement | null = null;

  // 新增属性
  private nodeCreatorUI: NodeCreatorUI | null = null;

  constructor(canvas?: HTMLCanvasElement, physics: IPhysics | null = null) {
    super();
    // 确保单例实现
    if (Engine.instance) {
      return Engine.instance;
    }

    Engine.instance = this;
    this.clock = new Clock();
    console.log(canvas, "canvas");
    this.canvas = canvas || document.createElement("canvas");
    
    // 初始化三个场景
    this.threeScene = new THREE.Scene();
    this.editorScene = new THREE.Scene();
    this.gameScene = new THREE.Scene();
    
    // 默认使用主场景作为活动场景
    this.activeThreeScene = this.threeScene;

    this.physics = physics;
    
    // 初始化编辑器相机
    this.editorCamera = new Camera();
    this.camera = this.editorCamera; // 默认使用编辑器相机

    // 预绑定事件处理函数，避免多次绑定创建多个函数实例
    this.boundOnWindowResize = this.onWindowResize.bind(this);
  }

  public getPhysics(): IPhysics | null {
    return this.physics;
  }

  // 添加静态方法获取实例
  public static getInstance(): Engine {
    if (!Engine.instance) {
      throw new Error("引擎实例尚未创建");
    }
    return Engine.instance;
  }

  private async initRenderer(useWebGPU: boolean): Promise<void> {
    try {
      if (useWebGPU) {
        try {
          let initialWidth = window.innerWidth;
          let initialHeight = window.innerHeight;
          
          if (this.canvas.parentElement) {
            initialWidth = this.canvas.parentElement.clientWidth;
            initialHeight = this.canvas.parentElement.clientHeight;
          }
          
          // 尝试动态导入WebGPU渲染器
          // 注意：这里使用了动态导入，因为WebGPURenderer可能在某些环境中不可用
          // 创建WebGPU渲染器
          this.renderer = new WebGPURenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
          });

          // 设置WebGPU渲染器的基本属性
          const webgpuRenderer = this.renderer as any;
          webgpuRenderer.setPixelRatio(window.devicePixelRatio);
          webgpuRenderer.setSize(initialWidth, initialHeight, false);
          webgpuRenderer.shadowMap.enabled = true;
          webgpuRenderer.toneMappingExposure = 1.0;
        } catch (error) {
          console.error("WebGPU渲染器初始化失败，回退到WebGL:", error);
          return this.initRenderer(false);
        }

        // 如果没有提供canvas，将渲染器的canvas添加到文档中
        if (!this.canvas.parentElement) {
          const domElement = (this.renderer as any).domElement;
          if (domElement) {
            document.body.appendChild(domElement);
          }
        }

        console.log("成功创建WebGPU渲染器");
      } else {
        // 计算初始尺寸 - 优先使用父容器尺寸
        let initialWidth = window.innerWidth;
        let initialHeight = window.innerHeight;
        
        if (this.canvas.parentElement) {
          initialWidth = this.canvas.parentElement.clientWidth;
          initialHeight = this.canvas.parentElement.clientHeight;
        }
        
        // 创建WebGL渲染器
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          alpha: true,
        });

        // 设置WebGL渲染器的基本属性
        const webglRenderer = this.renderer as THREE.WebGLRenderer;
        webglRenderer.setPixelRatio(window.devicePixelRatio);
        webglRenderer.setSize(initialWidth, initialHeight, false);
        webglRenderer.shadowMap.enabled = true;
        webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 如果没有提供canvas，将渲染器的canvas添加到文档中
        if (!this.canvas.parentElement) {
          document.body.appendChild(webglRenderer.domElement);
        }

        console.log("成功创建WebGL渲染器");
      }

      // 移除可能存在的旧监听器
      window.removeEventListener("resize", this.boundOnWindowResize);
      // 添加窗口大小变化的监听
      window.addEventListener("resize", this.boundOnWindowResize);

      this.canvas.style.pointerEvents = "auto";
      // 确保渲染器的canvas不会阻止事件传播
      // 获取渲染器的DOM元素
      let domElement: HTMLElement | null = null;
      if (this.renderer instanceof THREE.WebGLRenderer) {
        domElement = this.renderer.domElement;
      } else {
        // 尝试作为WebGPU渲染器访问
        const webgpuRenderer = this.renderer as any;
        if (webgpuRenderer.domElement) {
          domElement = webgpuRenderer.domElement;
        } else {
          // 尝试获取原生渲染器
          const nativeRenderer = (this.renderer as any).getNativeRenderer?.();
          if (nativeRenderer?.domElement) {
            domElement = nativeRenderer.domElement;
          }
        }
      }

      if (domElement) {
        domElement.style.pointerEvents = "auto";
      }
    } catch (error) {
      console.error("渲染器初始化失败:", error);

      // 如果WebGPU初始化失败，回退到WebGL
      if (useWebGPU) {
        console.warn("WebGPU不受支持或初始化失败，回退到WebGL渲染器");
        return this.initRenderer(false);
      }

      throw new Error(`渲染器初始化失败: ${error.message}`);
    }

    this.createEffect(() => {
      console.log(getSelectedObject(), "9980");
      if(getSelectedObject()){
        
        this.transformControls.attach(getSelectedObject());
      }
      return () => {};
    }, [getSelectedObject]);
  }

  // 修改 start 方法以确保生命周期调用
  public async start(): Promise<void> {
    // 初始化轨道控制器 - 可选择在这里初始化或由用户手动调用
    this.initOrbitControls();

    // 初始化场景中所有节点的 onReady
    this.scenes.forEach((scene) => {
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
      
      // 获取canvas的父容器尺寸
      let width = window.innerWidth;
      let height = window.innerHeight;
      
      // 如果canvas有父元素，优先使用父元素尺寸
      if (this.canvas.parentElement) {
        width = this.canvas.parentElement.clientWidth;
        height = this.canvas.parentElement.clientHeight;
      }
      
      // 更新相机纵横比
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    // 根据渲染器类型调用不同的setSize方法
    // 调整渲染器大小
    if (this.renderer instanceof THREE.WebGLRenderer) {
      // 获取canvas父容器尺寸
      let width = window.innerWidth;
      let height = window.innerHeight;
      
      if (this.canvas.parentElement) {
        width = this.canvas.parentElement.clientWidth;
        height = this.canvas.parentElement.clientHeight;
      }
      
      // false参数避免自动设置canvas.style
      this.renderer.setSize(width, height, false);
    } else {
      // 尝试作为WebGPU渲染器访问
      const webgpuRenderer = this.renderer as any;
      if (typeof webgpuRenderer.setSize === "function") {
        // 获取canvas父容器尺寸
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        if (this.canvas.parentElement) {
          width = this.canvas.parentElement.clientWidth;
          height = this.canvas.parentElement.clientHeight;
        }
        
        webgpuRenderer.setSize(width, height, false);
      } else {
        // 假设其他渲染器通过getNativeRenderer()获取原生渲染器
        const nativeRenderer = (this.renderer as any).getNativeRenderer();
        if (nativeRenderer && typeof nativeRenderer.setSize === "function") {
          // 获取canvas父容器尺寸
          let width = window.innerWidth;
          let height = window.innerHeight;
          
          if (this.canvas.parentElement) {
            width = this.canvas.parentElement.clientWidth;
            height = this.canvas.parentElement.clientHeight;
          }
          
          nativeRenderer.setSize(width, height, false);
        }
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
      // 获取渲染器的DOM元素
      let domElement: HTMLElement | null = null;
      if (this.renderer instanceof THREE.WebGLRenderer) {
        domElement = this.renderer.domElement;
      } else {
        // 尝试作为WebGPU渲染器访问
        const webgpuRenderer = this.renderer as any;
        if (webgpuRenderer.domElement) {
          domElement = webgpuRenderer.domElement;
        } else {
          // 尝试获取原生渲染器
          const nativeRenderer = (this.renderer as any).getNativeRenderer?.();
          if (nativeRenderer?.domElement) {
            domElement = nativeRenderer.domElement;
          }
        }
      }

      if (!domElement) {
        console.warn("无法获取渲染器的DOM元素，轨道控制器初始化失败");
        return;
      }

      this.orbitControls = new OrbitControls(
        this.camera.getThreeCamera(),
        domElement
      );
      console.log(domElement, "domElement for OrbitControls");

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

    // 获取播放状态
    const isPlaying = getIsPlaying();

    // 更新所有场景，但只有激活的场景会实际更新其节点
    // 如果在编辑模式且非播放状态，则传递skipScripts=true
    const skipScripts = this.editorMode && !isPlaying;
    this._activeScenes.forEach((scene) => {
      console.log(scene, "scene");
      // scene.update(deltaTime, skipScripts);
    });

    // 根据当前模式选择要渲染的场景
    const renderScene = this.editorMode ? this.editorScene : this.gameScene;
    
    // 使用渲染器进行渲染
    if(this.camera instanceof Camera){
      this.renderer.render(renderScene, this.camera.getThreeCamera());
    }else{
      this.renderer.render(renderScene, this.camera);
    }

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
  public getRenderer(): THREE.WebGLRenderer | WebGPURenderer | IRenderer {
    return this.renderer;
  }

  // 获取原生渲染器
  public getNativeRenderer(): THREE.WebGLRenderer | any {
    if (this.renderer instanceof THREE.WebGLRenderer) {
      return this.renderer;
    } else {
      // 尝试作为WebGPU渲染器访问
      const webgpuRenderer = this.renderer as any;
      if (webgpuRenderer.domElement) {
        return webgpuRenderer;
      } else {
        // 尝试获取原生渲染器
        return (this.renderer as any).getNativeRenderer?.() || this.renderer;
      }
    }
  }

  // 停止引擎循环
  public stop(): void {
    console.log("停止引擎循环");
    // 停止动画循环
    if (this.clock) {
      try {
        this.clock.stop();
      } catch (e) {
        console.warn("停止时钟失败:", e);
      }
    }

    // 标记引擎已停止
    // 注意：这里应该有一个isRunning属性，但当前类中没有定义
    // this.isRunning = false;
  }

  // 设置当前活动场景
  public setActiveScene(scene: Scene): void {
    const sceneName = scene.getName();
    this.activateScene(sceneName, true);
  }

  // 获取当前活动场景
  public getActiveScene(): Scene | null {
    const activeSceneNames = Array.from(this.activeScenes);
    if (activeSceneNames.length > 0) {
      return this.scenes.get(activeSceneNames[0]) || null;
    }
    return null;
  }

  public setCamera(camera: Camera): void {
    // 如果在编辑器模式下，优先使用编辑器相机
    if (this.editorMode && this.editorCamera) {
      this.camera = this.editorCamera;
      return;
    }

    // 如果不在编辑器模式下，检查是否有活动场景的相机节点
    const activeScene = this.getActiveScene();
    if (!this.editorMode && activeScene) {
      const sceneCameras = activeScene.findNodes((node) => node instanceof CameraNode3D) as CameraNode3D[];
      if (sceneCameras.length > 0) {
        // 使用找到的第一个相机节点
        const sceneCamera = sceneCameras[0];
        sceneCamera.setAsEngineCamera();
        return;
      }
    }

    // 如果没有特殊情况，使用传入的相机
    this.camera = camera;
  }
  public get scenes (){
    return this.allscenes;
  }

  public set scenes (value: Map<string, Scene>) {
    this.allscenes = value;
    
  }

  public get _activeScenes (){
    return this.activeScenes;
  }

  public set _activeScenes (value: Set<string>) {
    this.activeScenes = value;
  }

  public getCamera(): Camera {
    return this.camera;
  }
  public getELementRender(): HTMLElement | null {
    if (this.renderer instanceof THREE.WebGLRenderer) {
      return this.renderer.domElement;
    } else {
      // 尝试作为WebGPU渲染器访问
      const webgpuRenderer = this.renderer as any;
      if (webgpuRenderer.domElement) {
        return webgpuRenderer.domElement;
      } else {
        // 尝试获取原生渲染器
        const nativeRenderer = (this.renderer as any).getNativeRenderer?.();
        return nativeRenderer?.domElement || null;
      }
    }
  }

  // 修改 init 方法以选择渲染器类型
  async init(
    options: {
      showDefaultUI?: boolean;
      showHelpers?: boolean;
      addDefaultLights?: boolean;
      isEditorMode?: boolean;
      useWebGPU?: boolean; // 新增选项
      showBoundingBoxes?: boolean; // 新增选项
      enablePropertyPanelShortcuts?: boolean; // 属性面板快捷键选项
      showPropertyPanel?: boolean; // 是否显示属性面板
      showSceneTreePanel?: boolean;
    } = {}
  ): Promise<Engine> {
    await this.initialize();  // 确保先完成初始化
    
    // 核心引擎初始化
    const useWebGPU = options.useWebGPU ?? false;
    // 初始化渲染器，确保在init阶段就创建渲染器
    await this.initRenderer(useWebGPU).catch((error) => {
      console.error("渲染器初始化失败:", error);
      throw new Error("渲染器初始化失败");
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

    // // 只有在需要时才初始化UI
    // if (options.showDefaultUI) {
    //   this.initDefaultUI();
    // }

    // // 初始化属性面板快捷键
    // if (options.enablePropertyPanelShortcuts) {
    //   this.initPropertyPanelShortcuts();
    // }

    // // 显示属性面板（默认显示）
    // if (options.showPropertyPanel !== false) {
    //   this.createPropertyPanel();
    // }

    // 显示场景树面板
    if (options.showSceneTreePanel) {
      this.createSceneTreePanel(undefined, {
        left: '10px',
        top: '50px'
      });
    }

    // 初始化后处理
    this.initPostProcessing();

    if (options.isEditorMode) {
      this.initEditorMode();
    }
    return this;
  }

  // 设置默认灯光
  private setupDefaultLights(): void {
    // 创建灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    
    // 添加到编辑器场景
    this.editorScene.add(ambientLight.clone());
    this.editorScene.add(hemisphereLight.clone());
    this.editorScene.add(directionalLight.clone());
    
    // 添加到游戏场景
    this.gameScene.add(ambientLight);
    this.gameScene.add(hemisphereLight);
    this.gameScene.add(directionalLight);
  }

  // 设置辅助工具
  private setupHelpers(): void {
    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(100, 100);
    this.editorScene.add(gridHelper);

    // 添加坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(5);
    this.editorScene.add(axesHelper);
  }

  // 添加UI组件，确保事件处理正确
  addUIComponent(id: string, component: HTMLElement, container?: HTMLElement) {
    const targetContainer = container || document.body;
    component.style.pointerEvents = "auto"; // 确保组件可以接收事件
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
    console.log(gameObject, " 引擎 - gameObject");
    const activeScene = this.getActiveScene();
    if (activeScene) {
      activeScene.addGameObject(gameObject);
    } else {
      console.warn("没有活动场景，无法添加游戏对象");
    }
    return gameObject;
  }

  // 从场景移除游戏对象
  removeGameObject(gameObject: GameObject) {
    const activeScene = this.getActiveScene();
    if (activeScene) {
      activeScene.removeGameObject(gameObject);
    } else {
      console.warn("没有活动场景，无法移除游戏对象");
    }
    return this;
  }

  // 初始化默认UI，确保事件处理正确
  private initDefaultUI() {
    // 创建左侧面板
    const leftPanel = document.createElement("div");
    leftPanel.id = "left_panel";
    leftPanel.className = "editor-panel left-panel";
    leftPanel.style.pointerEvents = "auto"; // 确保面板可以接收事件
    document.body.appendChild(leftPanel);

    // 创建右侧面板
    const rightPanel = document.createElement("div");
    rightPanel.id = "right_panel";
    rightPanel.className = "editor-panel right-panel";
    rightPanel.style.pointerEvents = "auto"; // 确保面板可以接收事件
    document.body.appendChild(rightPanel);

    // 添加场景树视图
    const sceneTreeView = document.createElement("sodot-tree-view");
    sceneTreeView.style.pointerEvents = "auto"; // 确保组件可以接收事件
    this.addUIComponent("sceneTreeView", sceneTreeView, leftPanel);

    // 添加其他默认UI组件...
  }

  // 添加场景到引擎并处理生命周期
  public addScene(scene: Scene, isActive: boolean = false): void {
    const sceneName = scene.getName();

    // 如果场景已存在，先尝试移除
    if (this.scenes.has(sceneName)) {
      console.warn(`场景 ${sceneName} 已存在，尝试移除并重新创建`);
      try {
        // 如果场景已激活，先停用
        if (this.activeScenes.has(sceneName)) {
          this.deactivateScene(sceneName);
        }

        // 移除场景
        this.removeScene(sceneName);
      } catch (error) {
        console.error(`移除现有场景 ${sceneName} 失败:`, error);
        throw new Error(`场景 ${sceneName} 已存在且无法移除`);
      }
    }

    // 添加新场景
    this.scenes.set(sceneName, scene);

    if (isActive) {
      this._activeScenes.add(sceneName);
    }
    // 确保根节点的 onReady 被调用
    const rootNode = scene.getRootNode();
    rootNode.onReady();

    console.log(`场景 ${sceneName} 添加成功`);
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
            
            // 从当前活动的THREE场景中移除
            const threeObject = otherScene.getThreeObject();
            if (threeObject) {
              if (this.editorMode) {
                this.editorScene.remove(threeObject);
              } else {
                this.gameScene.remove(threeObject);
              }
            }
          }
        });
      }

      scene.activate();
      this.activeScenes.add(name);
      
      // 根据当前模式添加到相应的THREE场景
      const threeObject = scene.getThreeObject();
      if (threeObject) {
        if (this.editorMode) {
          this.editorScene.add(threeObject);
        } else {
          this.gameScene.add(threeObject);
        }
      }
      
      console.log(scene, " 引擎 - scene.getThreeScene()");
      // 初始化后处理
      if (this.camera && scene.getThreeScene()) {
        this.postProcessingManager.init(
          scene.getThreeScene(),
          this.camera.getThreeCamera()
        );
      }
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
      
      // 从当前活动的THREE场景中移除
      const threeObject = scene.getThreeObject();
      if (threeObject) {
        if (this.editorMode) {
          this.editorScene.remove(threeObject);
        } else {
          this.gameScene.remove(threeObject);
        }
      }
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
    return Array.from(this.activeScenes)
      .map((name) => this.scenes.get(name))
      .filter(Boolean) as Scene[];
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
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      scenes,
      activeScenes: Array.from(this.activeScenes),
      settings: {
        // 可以添加引擎级别的设置
      },
    };
  }

  /**
   * 导出所有场景的JSON数据
   * 与exportEngineState不同，该方法专注于场景数据，更适合用于保存和恢复场景
   * @param prettyPrint 是否美化输出的JSON格式，默认为false
   * @returns 包含所有场景详细数据的JSON对象
   */
  public exportAllScenesJSON(prettyPrint: boolean = false): any {
    const result: { 
      version: string;
      timestamp: string;
      scenes: { [key: string]: any };
      activeScenes: string[];
    } = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      scenes: {},
      activeScenes: Array.from(this.activeScenes)
    };

    // 导出每个场景的详细数据
    this.scenes.forEach((scene, name) => {
      try {
        // 使用SceneSerializer获取更完整的场景数据
        const sceneJsonStr = SceneSerializer.serializeScene(scene, prettyPrint);
        result.scenes[name] = JSON.parse(sceneJsonStr);
      } catch (error) {
        console.error(`导出场景 ${name} 失败:`, error);
        // 在出错时使用基本数据
        result.scenes[name] = scene.toJSON();
      }
    });

    return prettyPrint ? JSON.stringify(result, null, 2) : result;
  }

  /**
   * 导出所有场景为JSON字符串
   * @param prettyPrint 是否美化JSON输出格式，默认为true
   * @returns 所有场景的JSON字符串表示
   */
  public exportAllScenesJSONString(prettyPrint: boolean = true): string {
    const data = this.exportAllScenesJSON(false); // 获取原始数据对象
    return JSON.stringify(data, null, prettyPrint ? 2 : 0);
  }

  /**
   * 导出引擎中的所有场景并下载为JSON文件
   * @param filename 下载的文件名，默认为"engine_scenes.json"
   */
  public downloadAllScenesJSON(filename: string = "engine_scenes.json"): void {
    try {
      // 获取JSON字符串（美化格式）
      const jsonString = this.exportAllScenesJSONString(true);
      
      // 创建Blob对象
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`所有场景已导出到文件: ${filename}`);
    } catch (error) {
      console.error("导出场景失败:", error);
      throw error;
    }
  }

  /**
   * 导入引擎状态
   * @param state 引擎状态
   */
  public importEngineState(state: any): void {
    // 验证版本
    if (state.version !== "1.0.0") {
      console.warn("引擎状态版本不匹配");
    }

    // 清除现有状态
    this.reset();

    // 导入场景
    Object.entries(state.scenes).forEach(([name, sceneData]) => {
      const scene = SceneSerializer.deserializeScene(JSON.stringify(sceneData));
      console.log(scene, 'scene')
      this.addScene(scene);
    });

    // 激活场景
    state.activeScenes.forEach((name: string) => {
      console.error(name, 'name')
      this.activateScene(name, false);
    });
    
    console.log(this.exportAllScenesJSON(true), 'this.scenes')
    console.log(this.scenes, 'this.scenes')
  }

  // 根据名称获取场景
  public getSceneByName(name: string): Scene | undefined {
    return this.scenes.get(name);
  }

  // 删除场景
  public removeScene(name: string): void {
    const scene = this.scenes.get(name);
    if (scene) {
      if (this.isSceneActive(name)) {
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
      // 如果场景有getNodesByName方法，则调用它
      const nodes =
        typeof scene.getNodesByName === "function"
          ? scene.getNodesByName(name)
          : [];
      result.push(...nodes);
    }
    return result;
  }

  // 根据类型获取节点
  public getNodesByType<T extends Node3d>(
    type: new (...args: any[]) => T
  ): T[] {
    const result: T[] = [];
    for (const scene of this.scenes.values()) {
      // 如果场景有getNodesByType方法，则调用它
      const nodes =
        typeof scene.getNodesByType === "function"
          ? scene.getNodesByType(type)
          : [];
      result.push(...nodes);
    }
    return result;
  }

  // 在所有场景中查找节点
  public findNodes(predicate: (node: Node3d) => boolean): Node3d[] {
    const result: Node3d[] = [];
    for (const scene of this.scenes.values()) {
      // 如果场景有findNodes方法，则调用它
      const nodes =
        typeof scene.findNodes === "function" ? scene.findNodes(predicate) : [];
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
      console.error("加载场景失败:", error);
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
      const jsonStr =
        typeof jsonData === "string" ? jsonData : JSON.stringify(jsonData);

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
      console.error("从JSON导入场景失败:", error);
      throw error;
    }
  }

  public exportEngine():void {
    console.log(this.scenes,'scenes')
  }

  /**
   * 重置引擎状态
   * 清除所有场景和资源
   */
  public reset(): void {
    console.log("重置引擎状态");

    try {
      // 停止所有活动场景
      this.activeScenes.forEach((sceneName) => {
        try {
          this.deactivateScene(sceneName);
        } catch (e) {
          console.warn(`停用场景 ${sceneName} 失败:`, e);
        }
      });

      // 清除所有场景
      this.scenes.clear();

      // 重置其他状态
      this.activeScenes.clear();

      // 重置渲染器状态
      if (this.renderer) {
        try {
          if (typeof this.renderer.setSize === "function") {
            this.renderer.setSize(this.canvas.width, this.canvas.height);
          }
          if (typeof this.renderer.clear === "function") {
            this.renderer.clear();
          }
        } catch (e) {
          console.warn("重置渲染器失败:", e);
        }
      }

      // 清除包围盒辅助器
      this.removeBoundingBoxHelpers();

      console.log("引擎重置成功");
    } catch (error) {
      console.error("重置引擎状态失败:", error);
    }
  }

  /**
   * 释放引擎资源
   * 在不再需要引擎时调用此方法清理所有资源
   */
  public dispose(): void {
    console.log("开始释放引擎资源");

    try {
      // 关闭属性面板
      this.closePropertyPanel();
      
      // 停止引擎循环
      this.stop();

      // 重置引擎状态
      this.reset();

      // 清理物理引擎
      if (this.physics) {
        try {
          // 安全地检查物理引擎是否有dispose方法
          const physicsAny = this.physics as any;
          if (physicsAny && typeof physicsAny.dispose === "function") {
            physicsAny.dispose();
          }
        } catch (e) {
          console.warn("清理物理引擎失败:", e);
        }
      }

      // 清理渲染器
      if (this.renderer) {
        try {
          // 安全地检查渲染器是否有dispose方法
          const rendererAny = this.renderer as any;
          if (rendererAny && typeof rendererAny.dispose === "function") {
            rendererAny.dispose();
          } else if (this.renderer instanceof THREE.WebGLRenderer) {
            this.renderer.dispose();
          }
        } catch (e) {
          console.warn("清理渲染器失败:", e);
        }
      }

      // 清理事件监听器
      try {
        // 安全地移除事件监听器
        if (this.boundOnWindowResize) {
          window.removeEventListener("resize", this.boundOnWindowResize);
        }
      } catch (e) {
        console.warn("清理事件监听器失败:", e);
      }

      // 清理UI组件
      this.uiComponents.forEach((component) => {
        if (component.parentElement) {
          component.parentElement.removeChild(component);
        }
      });
      this.uiComponents.clear();

      // 清理DOM中的引擎相关元素
      const engineUIs = document.querySelectorAll(".engine-ui");
      engineUIs.forEach((ui) => {
        if (ui.parentElement) {
          ui.parentElement.removeChild(ui);
        }
      });

      // 重置引擎实例
      if (typeof Engine.instance !== "undefined") {
        Engine.instance = null;
      }

      console.log("引擎资源释放成功");
    } catch (error) {
      console.error("释放引擎资源失败:", error);
    }
  }

  // 创建默认场景
  public createDefaultScene(name: string = "Default Scene"): Scene {
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
    if (typeof scene.clear === "function") {
      scene.clear();
    } else {
      console.warn("场景没有clear方法，无法清除对象");
    }

    // 解析和添加节点
    if (data.nodes && Array.isArray(data.nodes)) {
      this.parseNodes(scene, data.nodes);
    }

    // 应用场景设置
    if (data.settings) {
      // 如果场景有settings属性，则设置它
      if ("settings" in scene) {
        (scene as any).settings = { ...data.settings };
      }

      // 应用背景色
      if (data.settings.background) {
        // 如果场景有background属性，则设置它
        if ("background" in scene) {
          (scene as any).background = new THREE.Color(data.settings.background);
        }
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
    console.log(this.getAllScenes(), "getAllScenes");
    this.getAllScenes().forEach((scene) => {
      scene.getAllNodes().forEach((node) => {
        const obj = node.getThreeObject();
        if (obj && obj.visible) {
          // 创建包围盒辅助器
          const boxHelper = new THREE.BoxHelper(obj, 0xffff00);
          this.boundingBoxHelpers.set(obj, boxHelper);
          // 添加到场景
          // 尝试获取场景的Three.js场景对象
          const threeScene = scene.getThreeScene
            ? scene.getThreeScene()
            : this.threeScene;
          threeScene.add(boxHelper);
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
        // 尝试获取场景的Three.js场景对象
        const threeScene = scene.getThreeScene
          ? scene.getThreeScene()
          : this.threeScene;
        threeScene.remove(helper);
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

  // 初始化后处理
  private initPostProcessing(): void {
    // 假设this.renderer已经在Engine.init()中初始化
    this.postProcessingManager = new PostProcessingManager(this.renderer);

    // 假设已经有了activateScene方法
    // 在activateScene方法末尾添加这行代码
    if (this.getActiveScene() && this.camera) {
      this.postProcessingManager.init(
        this.threeScene,
        this.camera.getThreeCamera()
      );
    }
  }

  // 添加一个后处理效果
  public addPostProcessingEffect(
    effect: PostProcessingEffect,
    enabled: boolean = true
  ): void {
    this.postProcessingManager.addEffect(effect, enabled);
  }

  // 移除一个后处理效果
  public removePostProcessingEffect(name: string): void {
    this.postProcessingManager.removeEffect(name);
  }

  // 启用/禁用一个后处理效果
  public setPostProcessingEffectEnabled(name: string, enabled: boolean): void {
    this.postProcessingManager.setEffectEnabled(name, enabled);
  }

  // 应用后处理预设
  public applyPostProcessingPreset(presetType: any): void {
    this.postProcessingManager.applyPreset(presetType);
  }

  // 获取后处理管理器
  public getPostProcessingManager(): PostProcessingManager {
    return this.postProcessingManager;
  }

  // 修改渲染循环
  // 在Engine类的渲染方法中添加这段代码
  private renderWithPostProcessing(): void {
    // 更新场景、相机等...

    // 使用后处理渲染
    if (this.postProcessingManager) {
      this.postProcessingManager.update(this.clock.getDelta());
      this.postProcessingManager.render();
    } else {
      // 原始渲染逻辑
      this.renderer.render(this.threeScene, this.camera.getThreeCamera());
    }
  }

  // 窗口大小调整
  // 在Engine类的resize方法中添加这行代码
  private resizePostProcessing(width: number, height: number): void {
    if (this.postProcessingManager) {
      this.postProcessingManager.resize(width, height);
    }
  }

  /**
   * 初始化编辑器模式
   */
  public initEditorMode(): void {
    if (this.editorMode) return;

    this.editorMode = true;
    setEditorActive(true);

    // 切换到编辑器相机
    if (this.editorCamera) {
      this.camera = this.editorCamera;
      // 初始化轨道控制器
      this.initOrbitControls();
    }

    // 将当前激活的场景从游戏场景移动到编辑器场景
    this.activeScenes.forEach((sceneName) => {
      const scene = this.scenes.get(sceneName);
      if (scene) {
        const threeObject = scene.getThreeObject();
        if (threeObject) {
          this.gameScene.remove(threeObject);
          this.editorScene.add(threeObject);
        }
      }
    });

    // 初始化变换控制器（仅在编辑器模式下可用）
    if (!this.transformControls) {
      this.initTransformControls();
    } else if (this.transformControls) {
      // 如果已经存在，确保它是可见的
      this.transformControls.visible = true;
    }

    // 启用辅助工具（网格和坐标轴）
    this.editorScene.children.forEach(child => {
      // 查找网格和坐标轴辅助工具
      if (child instanceof THREE.GridHelper || child instanceof THREE.AxesHelper) {
        child.visible = true;
      }
    });

    // 初始化节点创建器UI
    if (!this.nodeCreatorUI) {
      this.nodeCreatorUI = new NodeCreatorUI(this);
      this.nodeCreatorUI.initialize();
    }
  }

  /**
   * 关闭编辑器模式
   */
  public exitEditorMode(): void {
    if (!this.editorMode) return;

    this.editorMode = false;
    setEditorActive(false);

    // 切换到游戏相机
    if (this.gameCamera) {
      this.camera = this.gameCamera;
    }

    // 将当前激活的场景从编辑器场景移动到游戏场景
    this.activeScenes.forEach((sceneName) => {
      const scene = this.scenes.get(sceneName);
      if (scene) {
        const threeObject = scene.getThreeObject();
        if (threeObject) {
          this.editorScene.remove(threeObject);
          this.gameScene.add(threeObject);
        }
      }
    });

    // 禁用变换控制器（在游戏模式下不可用）
    if (this.transformControls) {
      this.transformControls.visible = false;
      if (this.transformControls.object) {
        this.transformControls.detach();
      }
    }

    // 禁用辅助工具（网格和坐标轴）
    this.editorScene.children.forEach(child => {
      // 查找网格和坐标轴辅助工具
      if (child instanceof THREE.GridHelper || child instanceof THREE.AxesHelper) {
        child.visible = false;
      }
    });

    // 清理节点创建器UI
    if (this.nodeCreatorUI) {
      this.nodeCreatorUI.destroy();
      this.nodeCreatorUI = null
    }
  }

  /**
   * 初始化变换控制器
   */
  private initTransformControls(): void {
    if (!this.camera) {
      console.error("无法初始化变换控制器：缺少相机");
      return;
    }

    const threeCamera = this.camera.getThreeCamera();
    const domElement = this.getELementRender();

    console.log("初始化变换控制器参数:", {
      camera: threeCamera,
      domElement: domElement,
      scene: this.activeThreeScene,
    });

    if (!threeCamera) {
      console.error("无法获取Three.js相机");
      return;
    }

    if (!domElement) {
      console.error("无法获取渲染器DOM元素");
      return;
    }

    // 确保DOM元素已添加到文档中
    if (!domElement.parentElement) {
      console.warn("渲染器DOM元素未添加到文档中，尝试添加到body");
      document.body.appendChild(domElement);
    }

    // 确保DOM元素可以接收事件
    domElement.style.pointerEvents = "auto";

    // 创建变换控制器
    this.transformControls = new TransformControls(threeCamera, domElement);

    console.log("变换控制器创建成功:", this.transformControls);

    // 设置变换控制器大小
    this.transformControls.setSize(0.8);

    // 设置变换控制器的模式
    this.transformControls.setMode("translate");

    // 添加到场景
    this.editorScene.add(this.transformControls.getHelper());
    console.log("变换控制器已添加到场景:", {
      controls: this.transformControls,
      scene: this.editorScene,
      sceneChildren: this.editorScene.children,
    });

    // 在拖动时禁用轨道控制器
    this.transformControls.addEventListener("dragging-changed", (event) => {
      console.log("拖动状态改变:", event.value);
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value;
      }
    });

    // 添加鼠标事件监听
    this.transformControls.addEventListener("mouseDown", (event) => {
      console.log("鼠标按下");
      // 立即设置拖动状态
      setIsDragging(true);
    });

    this.transformControls.addEventListener("mouseUp", (event) => {
      console.log("鼠标释放");
      // 立即设置拖动状态
      setIsDragging(false);
    });

    // 添加键盘事件监听
    this.transformControls.addEventListener("keydown", (event) => {
      console.log("键盘事件:", event);
      switch (event.key) {
        case "t":
          this.transformControls?.setMode("translate");
          break;
        case "r":
          this.transformControls?.setMode("rotate");
          break;
        case "s":
          this.transformControls?.setMode("scale");
          break;
      }
    });

    console.log("变换控制器已初始化");
  }

  /**
   * 开始执行脚本
   */
  public startScripts(): void {
    if (this.scriptsEnabled) return;

    this.scriptsEnabled = true;
    setIsPlaying(true);

    // 触发场景中所有脚本的onStart方法
    this.scenes.forEach((scene) => {
      if (scene.isActive()) {
        scene.startScripts();
      }
    });

    console.log("开始执行脚本");
  }

  /**
   * 停止执行脚本
   */
  public stopScripts(): void {
    if (!this.scriptsEnabled) return;

    this.scriptsEnabled = false;
    setIsPlaying(false);

    // 可以添加停止脚本的逻辑
    this.scenes.forEach((scene) => {
      if (scene.isActive()) {
        scene.stopScripts();
      }
    });

    console.log("停止执行脚本");
  }

  /**
   * 检查脚本是否启用
   */
  public areScriptsEnabled(): boolean {
    return this.scriptsEnabled;
  }

  /**
   * 检查是否处于编辑器模式
   */
  public isEditorMode(): boolean {
    return this.editorMode;
  }

  /**
   * 设置变换控制器模式
   */
  public setTransformControlsMode(
    mode: "translate" | "rotate" | "scale"
  ): void {
    if (this.transformControls) {
      this.transformControls.setMode(mode);
    }
  }

  /**
   * 创建并添加编辑器UI到引擎渲染容器
   * 简化编辑器UI的初始化过程
   * @returns 创建的编辑器UI元素
   */
  public createEditorUI(): HTMLElement {
    // 创建编辑器UI
    const editorUI = createEditorUI(this);

    // 获取渲染器DOM元素的父容器
    const renderer = this.getRenderer();
    let container: HTMLElement | null = null;

    if (renderer instanceof THREE.WebGLRenderer) {
      container = renderer.domElement.parentElement;
    } else {
      const nativeRenderer = (renderer as any).getNativeRenderer?.();
      if (nativeRenderer?.domElement?.parentElement) {
        container = nativeRenderer.domElement.parentElement;
      }
    }

    // 添加到容器或body
    if (container) {
      container.appendChild(editorUI);
    } else {
      document.body.appendChild(editorUI);
    }

    return editorUI;
  }

  /**
   * 创建属性面板并添加到指定容器或引擎容器的右侧
   * @param container 可选的容器元素，如果不提供则添加到渲染器容器
   * @param position 面板位置，格式为 {top, right, width}，默认右上角
   * @param node 可选的初始要显示属性的节点
   * @returns 创建的属性面板容器元素
   */
  public createPropertyPanel(
    container?: HTMLElement,
    position?: { top?: string, right?: string, width?: string },
    node?: Node3d
  ): HTMLElement {
    // 如果已存在面板，先移除它
    if (this.propertyPanel) {
      this.closePropertyPanel();
    }

    try {
      // 创建容器元素
      const panelContainer = document.createElement('div');
      panelContainer.style.position = 'absolute';
      
      // 设置样式
      if (position) {
        if (position.top) panelContainer.style.top = position.top;
        if (position.right) panelContainer.style.right = position.right;
        if (position.width) panelContainer.style.width = position.width;
      } else {
        // 默认位置 - 右侧
        panelContainer.style.top = '50px';
        panelContainer.style.right = '10px';
        // panelContainer.style.width = '280px';
      }
      
      // 添加其他样式
      panelContainer.style.zIndex = '1000';
      panelContainer.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
      panelContainer.style.borderRadius = '4px';
      panelContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
      panelContainer.style.overflow = 'auto';
      panelContainer.style.maxHeight = 'calc(100vh - 100px)';
      panelContainer.style.pointerEvents = 'auto';
      
      // 确定添加到哪个容器
      let targetContainer = container;
      
      if (!targetContainer) {
        // 获取渲染器DOM元素的父容器
        const renderer = this.getRenderer();
        
        if (renderer instanceof THREE.WebGLRenderer) {
          targetContainer = renderer.domElement.parentElement;
        } else {
          const nativeRenderer = (renderer as any).getNativeRenderer?.();
          if (nativeRenderer?.domElement?.parentElement) {
            targetContainer = nativeRenderer.domElement.parentElement;
          }
        }
        
        // 如果还没找到容器，使用body
        if (!targetContainer) {
          targetContainer = document.body;
        }
      }
      
      // 添加到容器
      targetContainer.appendChild(panelContainer);
      
      // 创建属性面板
      const propertyPanel = new PropertyPanel(panelContainer);
      
      // 如果提供了节点，显示其属性
      if (node) {
        propertyPanel.showNodeProperties(node);
      }
      
      // 存储引用
      this.propertyPanel = propertyPanel;
      this.propertyPanelContainer = panelContainer;
      
      // 存储UI组件
      this.addUIComponent('propertyPanel', panelContainer);
      
      return panelContainer;
    } catch (error) {
      console.error('创建属性面板失败:', error);
      throw error;
    }
  }

  /**
   * 关闭并移除属性面板
   * @returns 是否成功关闭
   */
  public closePropertyPanel(): boolean {
    // 销毁属性面板
    if (this.propertyPanel) {
      this.propertyPanel.dispose();
      this.propertyPanel = null;
    }
    
    // 移除容器
    if (this.propertyPanelContainer) {
      // 从DOM中移除
      if (this.propertyPanelContainer.parentElement) {
        this.propertyPanelContainer.parentElement.removeChild(this.propertyPanelContainer);
      }
      
      // 从UI组件中移除
      this.removeUIComponent('propertyPanel');
      
      // 清除引用
      this.propertyPanelContainer = null;
      
      return true;
    }
    
    return false;
  }

  /**
   * 获取当前属性面板容器元素
   * @returns 属性面板容器元素，如果不存在则返回null
   */
  public getPropertyPanelContainer(): HTMLElement | null {
    return this.propertyPanelContainer;
  }

  /**
   * 获取当前属性面板实例
   * @returns 属性面板实例，如果不存在则返回null
   */
  public getPropertyPanel(): PropertyPanel | null {
    return this.propertyPanel;
  }

  /**
   * 更新属性面板显示的节点
   * @param node 要显示的节点
   * @returns 是否成功更新
   */
  public updatePropertyPanelNode(node: Node3d): boolean {
    if (this.propertyPanel) {
      this.propertyPanel.showNodeProperties(node);
      return true;
    }
    return false;
  }
  
  /**
   * 初始化属性面板的快捷键支持
   * 默认使用 Ctrl+P 切换属性面板显示状态
   */
  public initPropertyPanelShortcuts(): void {
    window.addEventListener('keydown', (event) => {
      // Ctrl+P 切换默认属性面板
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault(); // 阻止浏览器默认行为
        this.closePropertyPanel();
      }
    });
  }

  /**
   * 创建场景树面板
   * @param container 可选，自定义容器元素
   * @param style 可选，面板样式
   * @returns 场景树面板容器
   */
  public createSceneTreePanel(
    container?: HTMLElement,
    style: {
      top?: string;
      left?: string;
      width?: string;
      height?: string;
    } = {}
  ): HTMLElement {
    // 如果已有面板，先销毁
    this.closeSceneTreePanel();
    
    // 创建或使用容器
    const panelContainer = container || document.createElement('div');
    
    // 设置样式
    if (!container) {
      Object.assign(panelContainer.style, {
        position: 'absolute',
        top: style.top || '50px',
        left: style.left || '10px',
        width: style.width || '280px',
        maxHeight: style.height || 'calc(100vh - 100px)',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        zIndex: '1000',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        overflow: 'auto'
      });
      
      // 添加到DOM
      document.body.appendChild(panelContainer);
    }
    
    // // 创建场景树面板
    // this.sceneTreePanel = new SceneTreePanel(panelContainer);
    // this.sceneTreeContainer = panelContainer;
    
    // return panelContainer;
  }

  /**
   * 关闭场景树面板
   */
  public closeSceneTreePanel(): void {
    if (this.sceneTreePanel) {
      this.sceneTreePanel.dispose();
      this.sceneTreePanel = null;
      
      // 移除容器
      if (this.sceneTreeContainer && this.sceneTreeContainer.parentNode) {
        this.sceneTreeContainer.parentNode.removeChild(this.sceneTreeContainer);
      }
      this.sceneTreeContainer = null;
    }
  }

  /**
   * 获取场景树面板
   * @returns 场景树面板实例或null
   */
  public getSceneTreePanel(): SceneTreePanel | null {
    return this.sceneTreePanel;
  }

  /**
   * 获取场景树面板容器
   * @returns 场景树面板容器或null
   */
  public getSceneTreePanelContainer(): HTMLElement | null {
    return this.sceneTreeContainer;
  }

  /**
   * 是否显示场景树面板
   * @param show 是否显示
   */
  public showSceneTreePanel(show: boolean): void {
    if (this.sceneTreeContainer) {
      this.sceneTreeContainer.style.display = show ? 'block' : 'none';
    } else if (show) {
      this.createSceneTreePanel();
    }
  }

  // 添加getScene方法实现IEngine接口
  public getScene(): Scene | undefined {
    // 返回激活的场景，如果有多个激活场景，返回第一个
    const activeScenes = this.getActiveScenes();
    return activeScenes.length > 0 ? activeScenes[0] : undefined;
  }

  // 添加initialize方法，显式设置引擎实例到Node3d
  public async initialize(): Promise<void> {
    try {
      // 设置到Node3d的静态引用
      const NodeClass = await import('./Node3d').then(module => module.Node3d);
      NodeClass.setEngineInstance(this);
      this.isInitialized = true;  // 标记初始化完成
      console.log('Engine initialization completed');
    } catch (error) {
      console.error('Engine initialization failed:', error);
      throw error;
    }
  }

  // 添加检查初始化状态的方法
  public isEngineInitialized(): boolean {
    return this.isInitialized;
  }

  // 添加新方法：设置游戏相机
  public setGameCamera(camera: Camera | CameraNode3D): void {
    if (camera instanceof CameraNode3D) {
      this.gameCamera = camera.getCamera();
    } else {
      this.gameCamera = camera;
    }
    
    // 如果不在编辑器模式，立即切换到游戏相机
    if (!this.editorMode) {
      this.camera = this.gameCamera;
    }
  }

  // 添加新方法：切换相机模式
  public toggleEditorMode(): void {
    if (this.editorMode) {
      this.exitEditorMode();
    } else {
      this.initEditorMode();
    }
  }

  // 添加获取编辑器相机方法
  public getEditorCamera(): Camera | null {
    return this.editorCamera;
  }

  // 添加获取游戏相机方法
  public getGameCamera(): Camera | null {
    return this.gameCamera;
  }

  /**
   * 切换编辑器场景
   * @param sceneName 场景名称
   */
  public switchEditorScene(sceneName: string): void {
    if (!this.editorMode) {
      console.warn('switchEditorScene只能在编辑器模式下使用');
      return;
    }

    if (!this.scenes.has(sceneName)) {
      console.error(`场景 ${sceneName} 不存在`);
      return;
    }

    // 获取要切换到的场景
    const targetScene = this.scenes.get(sceneName);

    // 停用当前所有激活的场景（除了要切换到的场景）
    for (const [name, scene] of this.scenes.entries()) {
      if (scene.isActive && name !== sceneName) {
        this.deactivateScene(name);
      }
    }

    // 激活目标场景
    this.activateScene(sceneName);
    
    // 重置变换控制器
    if (this.transformControls) {
      this.transformControls.detach();
    }
    
    // 默认选择场景中的第一个节点（如果有）
    const scene = this.scenes.get(sceneName);
    if (scene && scene.nodes.size > 0) {
      const firstNodeId = Array.from(scene.nodes.keys())[0];
      const firstNode = scene.getNodeById(firstNodeId);
      if (firstNode) {
        // 如果有变换控制器，附加到第一个节点
        if (this.transformControls && firstNode.object3D) {
          this.transformControls.attach(firstNode.object3D);
        }
        
        // 触发节点选择事件
        this.eventBus.emit('node:selected', { nodeId: firstNodeId, node: firstNode });
      }
    } else { 
      // 如果场景为空，触发清空选择事件
      this.eventBus.emit('node:selected', { nodeId: null, node: null });
    }
  }

  // 添加获取NodeCreatorUI的方法
  public getNodeCreatorUI(): NodeCreatorUI | null {
    return this.nodeCreatorUI;
  }
}
