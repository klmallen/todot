import Engine from '../../core/Engine';

// 项目信息接口
export interface ProjectInfo {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  scenes: string[];
}

// 场景数据接口
export interface SceneData {
  id: string;
  name: string;
  nodes: any[]; // 使用实际引擎的节点类型
  settings: any; // 场景设置
}

// 项目数据接口
export interface ProjectData {
  name: string;
  version: string;
  scenes: SceneData[];
  assets: any[]; // 资源列表
  settings: any; // 项目设置
}

class ProjectService {
  private static instance: ProjectService;
  private currentProject: ProjectInfo | null = null;
  
  // 添加项目状态事件
  private projectStateListeners: ((project: ProjectInfo | null) => void)[] = [];
  
  // 单例模式
  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }
  
  // 创建新项目
  public async createProject(name: string, path: string, engine: Engine): Promise<ProjectInfo> {
    try {
      // 解析路径获取父目录和项目文件夹名
      const pathParts = path.split('/');
      const projectFolderName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, pathParts.length - 1).join('/');
      
      // 创建项目数据
      const projectData: ProjectData = {
        name,
        version: '1.0.0',
        scenes: [{
          id: 'scene1',
          name: 'Main Scene',
          nodes: [],
          settings: { background: '#000000' }
        }],
        assets: [],
        settings: {}
      };
      
      // 保存项目文件到项目文件夹中
      await this.saveProjectFile(name, path, projectData);
      
      // 创建新项目信息
      const projectInfo: ProjectInfo = {
        id: Date.now().toString(),
        name,
        path,
        lastModified: new Date(),
        scenes: ['Main Scene']
      };
      
      this.currentProject = projectInfo;
      
      // 在引擎中创建一个默认场景
      engine.createDefaultScene('Main Scene');
      
      return projectInfo;
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  }
  
  // 打开项目
  public async openProject(project: ProjectInfo, engine: Engine): Promise<void> {
    try {
      // 读取项目文件
      const projectData = await this.loadProjectFile(project.path, project.name);
      
      // 重置引擎状态
      engine.reset();
      
      // 加载项目数据到引擎
      this.loadProjectDataToEngine(projectData, engine);
      
      // 更新当前项目
      this.currentProject = {
        ...project,
        lastModified: new Date()
      };
      
      console.log('项目加载成功:', project.name);
    } catch (error) {
      console.error('打开项目失败:', error);
      throw error;
    }
  }
  
  // 导入项目
  public async importProject(path: string, engine: Engine): Promise<ProjectInfo> {
    try {
      // 提取文件名和目录
      const parts = path.split('/');
      const fileName = parts[parts.length - 1];
      const projectName = fileName.split('.')[0];
      const directory = parts.slice(0, parts.length - 1).join('/');
      
      // 读取项目文件
      const projectData = await this.loadProjectFile(directory, projectName, fileName);
      
      // 重置引擎状态
      engine.reset();
      
      // 加载项目数据到引擎
      this.loadProjectDataToEngine(projectData, engine);
      
      // 创建项目信息
      const projectInfo: ProjectInfo = {
        id: Date.now().toString(),
        name: projectName,
        path: directory,
        lastModified: new Date(),
        scenes: projectData.scenes.map(s => s.name)
      };
      
      this.currentProject = projectInfo;
      
      return projectInfo;
    } catch (error) {
      console.error('导入项目失败:', error);
      throw error;
    }
  }
  
  // 保存项目
  public async saveProject(engine: Engine): Promise<void> {
    if (!this.currentProject) {
      throw new Error('没有打开的项目');
    }
    
    try {
      // 从引擎获取当前状态
      const projectData = this.getProjectDataFromEngine(engine);
      
      // 保存项目文件
      await this.saveProjectFile(
        this.currentProject.name,
        this.currentProject.path,
        projectData
      );
      
      // 更新最后修改时间
      this.currentProject.lastModified = new Date();
      
      console.log('项目已保存:', this.currentProject.name);
    } catch (error) {
      console.error('保存项目失败:', error);
      throw error;
    }
  }
  
  // 获取当前项目
  public getCurrentProject(): ProjectInfo | null {
    return this.currentProject;
  }
  
  // 私有方法：将项目数据加载到引擎
  private loadProjectDataToEngine(projectData: ProjectData, engine: Engine): void {
    // 加载场景
    projectData.scenes.forEach(scene => {
      // 使用引擎API创建场景
      const newScene = engine.createScene(scene.name);
      
      // 如果引擎有加载场景数据的方法
      if (typeof engine.loadSceneData === 'function') {
        engine.loadSceneData(newScene.id, scene);
      }
    });
    
    // 激活第一个场景
    if (projectData.scenes.length > 0) {
      engine.activateScene(projectData.scenes[0].name);
    }
    
    // 加载资源
    // 具体实现取决于引擎API
  }
  
  // 私有方法：从引擎中获取项目数据
  private getProjectDataFromEngine(engine: Engine): ProjectData {
    // 获取所有场景
    const scenes = engine.getAllScenes().map(scene => {
      return {
        id: scene.id,
        name: scene.name,
        nodes: scene.toJSON().nodes,
        settings: scene.settings || {}
      };
    });
    
    // 获取所有资源
    const assets = engine.getAssets ? engine.getAssets() : [];
    
    // 创建项目数据
    const projectData: ProjectData = {
      name: this.currentProject?.name || 'Untitled',
      version: '1.0.0',
      scenes,
      assets,
      settings: engine.getSettings ? engine.getSettings() : {}
    };
    
    return projectData;
  }
  
  // 私有方法：保存项目文件
  private async saveProjectFile(name: string, path: string, data: ProjectData): Promise<void> {
    try {
      // 解析路径获取父目录
      const pathParts = path.split('/');
      const projectFolderName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, pathParts.length - 1).join('/');
      
      // 请求父目录的文件系统权限
      const parentDirHandle = await window.showDirectoryPicker({
        id: 'projectDirectory',
        startIn: parentPath
      });
      
      // 创建或获取项目文件夹
      const projectDirHandle = await parentDirHandle.getDirectoryHandle(projectFolderName, { create: true });
      
      // 创建项目文件
      const fileHandle = await projectDirHandle.getFileHandle(`${name}.vfx`, { create: true });
      
      // 写入数据
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      
    } catch (error) {
      console.error('保存项目文件失败:', error);
      throw error;
    }
  }
  
  // 私有方法：加载项目文件
  private async loadProjectFile(path: string, name: string, fileName?: string): Promise<ProjectData> {
    try {
      // 请求文件系统权限
      const dirHandle = await window.showDirectoryPicker({
        id: 'projectDirectory',
        startIn: path
      });
      
      // 获取项目文件
      const fileHandle = await dirHandle.getFileHandle(fileName || `${name}.vfx`);
      
      // 读取文件内容
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      // 解析JSON
      return JSON.parse(content);
      
    } catch (error) {
      console.error('加载项目文件失败:', error);
      throw error;
    }
  }

  // 订阅项目状态变化
  public subscribeToProjectState(listener: (project: ProjectInfo | null) => void): void {
    this.projectStateListeners.push(listener);
    // 立即通知当前状态
    listener(this.currentProject);
  }

  // 取消订阅
  public unsubscribeFromProjectState(listener: (project: ProjectInfo | null) => void): void {
    this.projectStateListeners = this.projectStateListeners.filter(l => l !== listener);
  }

  // 更新当前项目状态时通知所有监听器
  private notifyProjectStateChange(): void {
    for (const listener of this.projectStateListeners) {
      listener(this.currentProject);
    }
  }

  // 修改设置currentProject的地方，添加通知
  public setCurrentProject(project: ProjectInfo | null): void {
    this.currentProject = project;
    this.notifyProjectStateChange();
  }
}

export default ProjectService; 