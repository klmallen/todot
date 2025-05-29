import * as THREE from 'three';
import Engine from '../Engine';
import { Scene } from '../Scene';
import { SceneSerializer } from '../SceneSerializer';

// 扩展 FileSystemDirectoryHandle 类型
declare global {
  interface FileSystemDirectoryHandle {
    requestPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
  }
}

/**
 * 项目配置接口
 */
export interface ProjectConfig {
  name: string;
  version: string;
  description?: string;
  created: string;
  lastModified: string;
  scenes: string[];
  activeScenes: string[]; // 已激活的场景列表
  defaultScene?: string;
  thumbnailPath?: string;
  sceneLoadOrder?: string[]; // 场景加载顺序
  settings: {
    defaultScene?: string;
    useWebGPU?: boolean;
    showHelpers?: boolean;
    showGrid?: boolean;
    showGizmos?: boolean;
    addDefaultLights?: boolean;
    autoSave?: boolean; // 是否启用自动保存
    autoSaveInterval?: number; // 自动保存间隔（秒）
    [key: string]: any;
  };
  dependencies?: {
    // 场景之间的依赖关系
    [sceneId: string]: string[]; // 场景ID到其依赖的场景ID列表的映射
  };
}

/**
 * 项目管理器类 - 负责处理项目的创建、加载、保存等操作
 */
export class ProjectManager {
  private static instance: ProjectManager | null = null;
  private engine: Engine | null = null;
  private projectConfig: ProjectConfig | null = null;
  private projectFiles: FileList | null = null;
  private projectPath: string | null = null;
  private temporaryConfig: Partial<ProjectConfig> | null = null;

  private static readonly LAST_PROJECT_KEY = 'todot_last_project';

  /**
   * 构造函数
   */
  private constructor() {
    // 初始化
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  /**
   * 设置引擎实例
   */
  public setEngine(engine: Engine): void {
    this.engine = engine;
  }

  /**
   * 设置项目文件列表
   */
  public setTemporaryFiles(files: FileList): void {
    this.projectFiles = files;
    if (files.length > 0) {
      // 获取项目根目录名称
      this.projectPath = files[0].webkitRelativePath.split('/')[0];
    }
  }

  /**
   * 获取项目文件列表
   */
  public getProjectFiles(): FileList | null {
    return this.projectFiles;
  }

  /**
   * 从文件列表中读取文件内容
   */
  private async readFileFromList(relativePath: string): Promise<string | null> {
    if (!this.projectFiles || !this.projectPath) return null;

    const fullPath = `${this.projectPath}/${relativePath}`;
    
    // 在文件列表中查找匹配的文件
    for (let i = 0; i < this.projectFiles.length; i++) {
      const file = this.projectFiles[i];
      if (file.webkitRelativePath === fullPath) {
        return await file.text();
      }
    }

    return null;
  }

  /**
   * 打开项目
   */
  public async openProject(): Promise<boolean> {
    
      if (!this.engine || !this.projectFiles || !this.projectPath) {
        console.error('项目未初始化');
        return false;
      }

      // 读取项目配置文件
      const configContent = await this.readFileFromList('project.json');
      if (!configContent) {
        console.error('无法读取项目配置文件');
        return false;
      }

      // 解析配置
      this.projectConfig = JSON.parse(configContent);

      // 清除当前引擎状态
      this.engine.reset();

      // 加载场景
      for (const sceneName of this.projectConfig.scenes) {
        try {
          const sceneContent = await this.readFileFromList(`scenes/${sceneName}.json`);
          if (sceneContent) {
            this.engine.importSceneFromJSON(sceneContent);
          }
        } catch (error) {
          console.error(`加载场景 ${sceneName} 失败:`, error);
        }
      }

      // 激活场景
      if (this.projectConfig.activeScenes && this.projectConfig.activeScenes.length > 0) {
        for (const sceneName of this.projectConfig.activeScenes) {
          const scene = this.engine.getSceneByName(sceneName);
          if (scene) {
            this.engine.setActiveScene(scene);
          }
        }
      } else if (this.projectConfig.scenes.length > 0) {
        const firstScene = this.engine.getSceneByName(this.projectConfig.scenes[0]);
        if (firstScene) {
          this.engine.setActiveScene(firstScene);
          this.projectConfig.activeScenes = [this.projectConfig.scenes[0]];
        }
      }

      // 保存项目信息
      await this.saveLastProjectInfo();

      return true;
 
  }

  /**
   * 保存最后打开的项目信息
   */
  private async saveLastProjectInfo(): Promise<void> {
    if (this.projectConfig && this.projectPath) {
      try {
        // 保存项目信息
        const projectInfo = {
          name: this.projectConfig.name,
          path: this.projectPath,
          lastOpened: new Date().toISOString()
        };
        localStorage.setItem(ProjectManager.LAST_PROJECT_KEY, JSON.stringify(projectInfo));
      } catch (error) {
        console.warn('无法保存最后打开的项目信息:', error);
      }
    }
  }

  /**
   * 获取最后打开的项目信息
   */
  public async getLastProjectInfo(): Promise<{ name: string; path: string; lastOpened: string } | null> {
    try {
      const savedInfo = localStorage.getItem(ProjectManager.LAST_PROJECT_KEY);
      if (savedInfo) {
        return JSON.parse(savedInfo);
      }
    } catch (error) {
      console.warn('无法获取最后打开的项目信息:', error);
    }
    return null;
  }

  /**
   * 清除最后打开的项目信息
   */
  public clearLastProjectInfo(): void {
    try {
      localStorage.removeItem(ProjectManager.LAST_PROJECT_KEY);
    } catch (error) {
      console.warn('无法清除最后打开的项目信息:', error);
    }
  }

  /**
   * 获取项目配置
   */
  public getProjectConfig(): ProjectConfig | null {
    return this.projectConfig;
  }

  /**
   * 获取项目路径
   */
  public getProjectPath(): string | null {
    return this.projectPath;
  }

  /**
   * 设置临时项目配置
   */
  public setTemporaryConfig(config: Partial<ProjectConfig>): void {
    this.temporaryConfig = config;
  }

  /**
   * 获取临时项目配置
   */
  public getTemporaryConfig(): Partial<ProjectConfig> | null {
    return this.temporaryConfig;
  }

  /**
   * 创建新项目
   */
  public async createProject(): Promise<boolean> {
    try {
      if (!this.engine || !this.temporaryConfig || !this.projectFiles) {
        console.error('引擎未初始化或项目配置未设置');
        return false;
      }

      // 获取项目根目录名称
      this.projectPath = this.projectFiles[0].webkitRelativePath.split('/')[0];

      // 创建完整的项目配置
      const now = new Date().toISOString();
      this.projectConfig = {
        name: this.temporaryConfig.name || '新项目',
        version: '1.0.0',
        description: this.temporaryConfig.description || '',
        created: now,
        lastModified: now,
        scenes: [],
        activeScenes: [],
        settings: {
          ...this.temporaryConfig.settings,
          useWebGPU: this.temporaryConfig.settings?.useWebGPU ?? true,
          showHelpers: this.temporaryConfig.settings?.showHelpers ?? true,
          showGrid: this.temporaryConfig.settings?.showGrid ?? true,
          showGizmos: this.temporaryConfig.settings?.showGizmos ?? true,
          addDefaultLights: this.temporaryConfig.settings?.addDefaultLights ?? true
        }
      };

      // 创建默认场景
      const defaultScene = new Scene('默认场景');
      
      // 添加默认光源
      const ambientLight = new THREE.AmbientLight(0x404040);
      defaultScene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7.5);
      defaultScene.add(directionalLight);

      // 添加到引擎
      this.engine.addScene(defaultScene);
      this.engine.setActiveScene(defaultScene);

      // 更新项目配置
      this.projectConfig.scenes.push(defaultScene.getName());
      this.projectConfig.activeScenes.push(defaultScene.getName());
      this.projectConfig.settings.defaultScene = defaultScene.getName();

      // 保存项目信息
      await this.saveLastProjectInfo();

      // 清除临时配置
      this.temporaryConfig = null;

      return true;
    } catch (error) {
      console.error('创建项目失败:', error);
      return false;
    }
  }
} 