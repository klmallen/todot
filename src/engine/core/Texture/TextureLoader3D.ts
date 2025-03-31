import * as THREE from 'three';
import { Node3d } from '../Node3d';
import { editable, editableComponent } from '../decorators';
import { TextureTypes } from './TextureTypes';
// 使用TextureTypes.TextureType而不是直接的TextureType

/**
 * TextureLoader3D 类 - 用于加载和管理各种类型的纹理
 */
@editableComponent({
  displayName: '纹理加载器',
  description: '用于加载和管理各类纹理资源',
  icon: 'image',
  category: 'Assets'
})
export class TextureLoader3D extends Node3d {
  private textureLoader: THREE.TextureLoader;
  private loadedTextures: Map<TextureTypes.TextureType, THREE.Texture> = new Map();
  private isLoading: boolean = false;

  @editable({
    displayName: '纹理类型',
    description: '要加载的纹理类型',
    type: 'enum',
    options: Object.values(TextureTypes.TextureType),
    group: 'Texture Type'
  })
  private textureType: TextureTypes.TextureType = TextureTypes.TextureType.BASE_COLOR;

  @editable({
    displayName: '纹理路径',
    description: '纹理图像文件的路径',
    type: 'string',
    group: 'Texture Source'
  })
  private texturePath: string = '';

  @editable({
    displayName: '纹理重复X',
    description: 'X方向上的纹理重复次数',
    type: 'number',
    min: 0.1,
    max: 20,
    step: 0.1,
    group: 'Texture Properties'
  })
  private repeatX: number = 1;

  @editable({
    displayName: '纹理重复Y',
    description: 'Y方向上的纹理重复次数',
    type: 'number',
    min: 0.1,
    max: 20,
    step: 0.1,
    group: 'Texture Properties'
  })
  private repeatY: number = 1;

  @editable({
    displayName: 'S轴包裹模式',
    description: '纹理S轴(水平方向)的包裹模式',
    type: 'enum',
    options: ['ClampToEdge', 'Repeat', 'MirroredRepeat'],
    group: 'Texture Properties'
  })
  private wrapS: string = 'Repeat';

  @editable({
    displayName: 'T轴包裹模式',
    description: '纹理T轴(垂直方向)的包裹模式',
    type: 'enum',
    options: ['ClampToEdge', 'Repeat', 'MirroredRepeat'],
    group: 'Texture Properties'
  })
  private wrapT: string = 'Repeat';

  @editable({
    displayName: '放大过滤器',
    description: '纹理放大时的过滤模式',
    type: 'enum',
    options: ['Nearest', 'Linear'],
    group: 'Texture Properties'
  })
  private magFilter: string = 'Linear';

  @editable({
    displayName: '缩小过滤器',
    description: '纹理缩小时的过滤模式',
    type: 'enum',
    options: ['Nearest', 'Linear', 'NearestMipmapNearest', 'LinearMipmapNearest', 'NearestMipmapLinear', 'LinearMipmapLinear'],
    group: 'Texture Properties'
  })
  private minFilter: string = 'LinearMipmapLinear';

  @editable({
    displayName: '各向异性过滤',
    description: '各向异性过滤级别（提高斜视角度的纹理质量）',
    type: 'number',
    min: 1,
    max: 16,
    step: 1,
    group: 'Texture Properties'
  })
  private anisotropy: number = 1;

  @editable({
    displayName: '生成Mipmap',
    description: '是否为纹理生成Mipmap',
    type: 'boolean',
    group: 'Texture Properties'
  })
  private generateMipmaps: boolean = true;

  @editable({
    displayName: '翻转Y轴',
    description: '是否翻转Y轴（修正某些格式的纹理）',
    type: 'boolean',
    group: 'Texture Properties'
  })
  private flipY: boolean = true;

  @editable({
    displayName: '编码',
    description: '纹理编码方式',
    type: 'enum',
    options: ['Linear', 'sRGB', 'RGBE', 'RGBM7', 'RGBM16', 'RGBD', 'GAMMA'],
    group: 'Texture Properties'
  })
  private encoding: string = 'Linear';
  
  @editable({
    displayName: '强度系数',
    description: '纹理强度系数，用于某些特定类型的贴图',
    type: 'number',
    min: 0,
    max: 5,
    step: 0.01,
    group: 'Texture Properties'
  })
  private intensity: number = 1.0;
  
  constructor(name:String = '纹理节点') {
    super(name,{});
    this.textureLoader = new THREE.TextureLoader();
    this.setType('TextureLoader3D');
    this.addTag('texture');
  }

  /**
   * 初始化时调用
   */
  onReady(): void {
    super.onReady();
    
    if (this.texturePath) {
      this.loadTexture(this.texturePath, this.textureType);
    }
  }

  /**
   * 更新时调用
   */
  update(deltaTime: number): void {
    super.update(deltaTime);
    // 纹理加载完成后应用设置
    if (this.loadedTextures.size > 0 && !this.isLoading) {
      this.applyTextureSettings();
    }
  }

  /**
   * 加载纹理
   * @param path 纹理路径
   * @param type 纹理类型
   * @returns Promise<THREE.Texture>
   */
  loadTexture(path: string, type: TextureTypes.TextureType): Promise<THREE.Texture> {
    this.isLoading = true;
    this.texturePath = path;
    this.textureType = type;
    
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          this.loadedTextures.set(type, texture);
          this.applyTextureSettings();
          this.isLoading = false;
          
          // 为不同纹理类型设置默认属性
          this.setupTextureDefaults(texture, type);
          
          // this.emit('textureLoaded', { type, texture });
          resolve(texture);
        },
        (progress) => {
          // 加载进度回调
          // this.emit('textureProgress', {
          //   path,
          //   type,
          //   loaded: progress.loaded,
          //   total: progress.total
          // });
        },
        (error) => {
          console.error(`纹理加载失败 [${type}]: ${path}`, error);
          this.isLoading = false;
          // this.emit('textureError', { type, error });
          reject(error);
        }
      );
    });
  }

  /**
   * 为不同类型的纹理设置默认属性
   */
  private setupTextureDefaults(texture: THREE.Texture, type: TextureTypes.TextureType): void {
    // 根据纹理类型设置特定默认值
    switch (type) {
      case TextureTypes.TextureType.NORMAL:
        // 法线贴图不应该使用sRGB色彩空间
        texture.encoding = THREE.LinearEncoding;
        break;
        
      case TextureTypes.TextureType.ROUGHNESS:
      case TextureTypes.TextureType.METALNESS:
      case TextureTypes.TextureType.AMBIENT_OCCLUSION:
      case TextureTypes.TextureType.HEIGHT:
      case TextureTypes.TextureType.ALPHA:
        // 这些贴图通常是灰度数据，使用线性编码
        texture.encoding = THREE.LinearEncoding;
        break;
        
      case TextureTypes.TextureType.EMISSIVE:
        // 自发光贴图通常使用sRGB色彩空间
        texture.encoding = THREE.sRGBEncoding;
        break;
        
      case TextureTypes.TextureType.BASE_COLOR:
        // 颜色贴图使用sRGB色彩空间
        texture.encoding = THREE.sRGBEncoding;
        break;
        
      case TextureTypes.TextureType.ENVIRONMENT:
        // 环境贴图可能需要RGBE编码等特殊处理
        texture.mapping = THREE.EquirectangularReflectionMapping;
        break;
    }
  }

  /**
   * 应用纹理设置到所有加载的纹理
   */
  private applyTextureSettings(): void {
    for (const texture of this.loadedTextures.values()) {
      // 应用重复设置
      texture.repeat.set(this.repeatX, this.repeatY);
      
      // 应用包裹模式
      const wrapModes = {
        'ClampToEdge': THREE.ClampToEdgeWrapping,
        'Repeat': THREE.RepeatWrapping,
        'MirroredRepeat': THREE.MirroredRepeatWrapping
      };
      
      texture.wrapS = wrapModes[this.wrapS] || THREE.RepeatWrapping;
      texture.wrapT = wrapModes[this.wrapT] || THREE.RepeatWrapping;
      
      // 应用过滤器
      const filters = {
        'Nearest': THREE.NearestFilter,
        'Linear': THREE.LinearFilter,
        'NearestMipmapNearest': THREE.NearestMipmapNearestFilter,
        'LinearMipmapNearest': THREE.LinearMipmapNearestFilter,
        'NearestMipmapLinear': THREE.NearestMipmapLinearFilter,
        'LinearMipmapLinear': THREE.LinearMipmapLinearFilter
      };
      
      texture.magFilter = filters[this.magFilter] || THREE.LinearFilter;
      texture.minFilter = filters[this.minFilter] || THREE.LinearMipmapLinearFilter;
      
      // 应用各向异性过滤 - 添加更多防御性检查
      try {
        const renderer = this.getEngine()?.getRenderer();
        if (renderer && renderer.capabilities && typeof renderer.capabilities.getMaxAnisotropy === 'function') {
          const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
          texture.anisotropy = Math.min(this.anisotropy, maxAnisotropy);
        } else {
          // 如果无法获取渲染器或其功能，使用默认值
          texture.anisotropy = this.anisotropy;
          console.warn('无法获取渲染器的最大各向异性过滤级别，使用默认值:', this.anisotropy);
        }
      } catch (error) {
        // 出现任何错误时，使用默认值
        texture.anisotropy = this.anisotropy;
        console.warn('设置各向异性过滤时出错:', error);
      }
      
      // 应用其他设置
      texture.generateMipmaps = this.generateMipmaps;
      texture.flipY = this.flipY;
      
      // 编码需要根据纹理类型考虑，不应直接应用
      
      // 更新纹理
      texture.needsUpdate = true;
    }
  }

  /**
   * 获取指定类型的加载纹理
   */
  getTexture(type?: TextureTypes.TextureType): THREE.Texture | null {
    if (type) {
      return this.loadedTextures.get(type) || null;
    } else {
      return this.loadedTextures.get(this.textureType) || null;
    }
  }

  /**
   * 获取所有加载的纹理
   */
  getAllTextures(): Map<TextureTypes.TextureType, THREE.Texture> {
    return this.loadedTextures;
  }

  /**
   * 应用纹理到材质
   * @param material Three.js材质对象
   */
  applyToMaterial(material: THREE.Material): void {
    if (!material) return;
    
    for (const [type, texture] of this.loadedTextures.entries()) {
      switch(type) {
        case TextureTypes.TextureType.BASE_COLOR:
          if (material instanceof THREE.MeshStandardMaterial || 
              material instanceof THREE.MeshBasicMaterial || 
              material instanceof THREE.MeshPhongMaterial) {
            material.map = texture;
          }
          break;
          
        case TextureTypes.TextureType.NORMAL:
          if (material instanceof THREE.MeshStandardMaterial || 
              material instanceof THREE.MeshPhongMaterial) {
            material.normalMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.HEIGHT:
          if (material instanceof THREE.MeshStandardMaterial || 
              material instanceof THREE.MeshPhongMaterial) {
            material.displacementMap = texture;
            material.displacementScale = this.intensity;
          }
          break;
          
        case TextureTypes.TextureType.BUMP:
          if (material instanceof THREE.MeshStandardMaterial || 
              material instanceof THREE.MeshPhongMaterial) {
            material.bumpMap = texture;
            material.bumpScale = this.intensity;
          }
          break;
          
        case TextureTypes.TextureType.ROUGHNESS:
          if (material instanceof THREE.MeshStandardMaterial) {
            material.roughnessMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.METALNESS:
          if (material instanceof THREE.MeshStandardMaterial) {
            material.metalnessMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.AMBIENT_OCCLUSION:
          if (material instanceof THREE.MeshStandardMaterial) {
            material.aoMap = texture;
            material.aoMapIntensity = this.intensity;
          }
          break;
          
        case TextureTypes.TextureType.EMISSIVE:
          if (material instanceof THREE.MeshStandardMaterial || 
              material instanceof THREE.MeshPhongMaterial) {
            material.emissiveMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.ALPHA:
          if (material.transparent) {
            material.alphaMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.ENVIRONMENT:
          material.envMap = texture;
          break;
          
        case TextureTypes.TextureType.LIGHTMAP:
          material.lightMap = texture;
          material.lightMapIntensity = this.intensity;
          break;
          
        // 以下为物理渲染中的特殊贴图类型
        case TextureTypes.TextureType.CLEARCOAT:
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.clearcoatMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.CLEARCOAT_ROUGHNESS:
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.clearcoatRoughnessMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.CLEARCOAT_NORMAL:
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.clearcoatNormalMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.TRANSMISSION:
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.transmission = 1.0;
            material.transmissionMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.THICKNESS:
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.thicknessMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.SHEEN:
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.sheenRoughnessMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.SPECULAR:
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.specularColorMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.SPECULAR_INTENSITY:
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.specularIntensityMap = texture;
          }
          break;
          
        case TextureTypes.TextureType.ANISOTROPY:
          if (material instanceof THREE.MeshPhysicalMaterial) {
            material.anisotropyMap = texture;
          }
          break;
      }
    }
    
    // 确保材质更新标志设置为true
    material.needsUpdate = true;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    for (const texture of this.loadedTextures.values()) {
      texture.dispose();
    }
    this.loadedTextures.clear();
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    this.dispose();
    super.destroy();
  }

  /**
   * 序列化为JSON
   */
  toJSON(): any {
    const json = super.toJSON();
    json.textureSettings = {
      textureType: this.textureType,
      texturePath: this.texturePath,
      repeatX: this.repeatX,
      repeatY: this.repeatY,
      wrapS: this.wrapS,
      wrapT: this.wrapT,
      magFilter: this.magFilter,
      minFilter: this.minFilter,
      anisotropy: this.anisotropy,
      generateMipmaps: this.generateMipmaps,
      flipY: this.flipY,
      encoding: this.encoding,
      intensity: this.intensity
    };
    return json;
  }

 

  /**
   * 静态辅助方法：快速加载指定路径的纹理并返回
   * @param path 纹理路径
   * @param type 纹理类型
   * @param options 可选的纹理设置
   * @returns Promise<THREE.Texture>
   */
  static loadTextureAsync(path: string, type: TextureTypes.TextureType = TextureTypes.TextureType.BASE_COLOR, options?: {
    repeatX?: number,
    repeatY?: number,
    wrapS?: string,
    wrapT?: string,
    magFilter?: string,
    minFilter?: string,
    anisotropy?: number,
    generateMipmaps?: boolean,
    flipY?: boolean,
    encoding?: string,
    intensity?: number
  }): Promise<THREE.Texture> {
    const loader = new TextureLoader3D('临时纹理加载器');
    
    // 应用选项参数
    if (options) {
      if (options.repeatX !== undefined) loader.repeatX = options.repeatX;
      if (options.repeatY !== undefined) loader.repeatY = options.repeatY;
      if (options.wrapS !== undefined) loader.wrapS = options.wrapS;
      if (options.wrapT !== undefined) loader.wrapT = options.wrapT;
      if (options.magFilter !== undefined) loader.magFilter = options.magFilter;
      if (options.minFilter !== undefined) loader.minFilter = options.minFilter;
      if (options.anisotropy !== undefined) loader.anisotropy = options.anisotropy;
      if (options.generateMipmaps !== undefined) loader.generateMipmaps = options.generateMipmaps;
      if (options.flipY !== undefined) loader.flipY = options.flipY;
      if (options.encoding !== undefined) loader.encoding = options.encoding;
      if (options.intensity !== undefined) loader.intensity = options.intensity;
    }
    
    return loader.loadTexture(path, type)
      .then(texture => {
        // 完成后销毁临时加载器
        loader.destroy();
        return texture;
      })
      .catch(error => {
        loader.destroy();
        throw error;
      });
  }

  /**
   * 静态辅助方法：同步加载纹理
   * 返回一个预先配置好的纹理加载器，可以通过getTexture获取纹理
   * @param path 纹理路径
   * @param type 纹理类型
   * @param options 可选的纹理设置
   * @returns TextureLoader3D 实例
   */
  static loadTexture(path: string, type: TextureTypes.TextureType = TextureTypes.TextureType.BASE_COLOR, options?: {
    repeatX?: number,
    repeatY?: number,
    wrapS?: string,
    wrapT?: string,
    magFilter?: string,
    minFilter?: string,
    anisotropy?: number,
    generateMipmaps?: boolean,
    flipY?: boolean,
    encoding?: string,
    intensity?: number
  }): TextureLoader3D {
    const loader = new TextureLoader3D('纹理加载器');
    
    // 应用选项参数
    if (options) {
      if (options.repeatX !== undefined) loader.repeatX = options.repeatX;
      if (options.repeatY !== undefined) loader.repeatY = options.repeatY;
      if (options.wrapS !== undefined) loader.wrapS = options.wrapS;
      if (options.wrapT !== undefined) loader.wrapT = options.wrapT;
      if (options.magFilter !== undefined) loader.magFilter = options.magFilter;
      if (options.minFilter !== undefined) loader.minFilter = options.minFilter;
      if (options.anisotropy !== undefined) loader.anisotropy = options.anisotropy;
      if (options.generateMipmaps !== undefined) loader.generateMipmaps = options.generateMipmaps;
      if (options.flipY !== undefined) loader.flipY = options.flipY;
      if (options.encoding !== undefined) loader.encoding = options.encoding;
      if (options.intensity !== undefined) loader.intensity = options.intensity;
    }
    
    loader.loadTexture(path, type);
    return loader;
  }

  /**
   * 加载纹理并直接返回纹理对象
   * @param path 纹理路径
   * @param type 纹理类型
   * @returns Promise<THREE.Texture> 加载的纹理对象
   */
  async loadAndReturnTexture(path: string, type: TextureTypes.TextureType = TextureTypes.TextureType.BASE_COLOR): Promise<THREE.Texture> {
    // 加载纹理
    const texture = await this.loadTexture(path, type);
    
    // 直接返回纹理对象
    return texture;
  }
}