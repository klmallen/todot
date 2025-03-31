import * as THREE from 'three/webgpu';
import { 
  texture, uniform, mix, add, mul, div, sub, min, max, clamp, 
  positionLocal, normalLocal, uv, color, vec2, vec3, vec4, 
  float, normalMap
} from 'three/tsl';
import { TerrainLayerInfo } from './TerrainOptions';

export class TerrainMaterial {
  private material: THREE.MeshStandardNodeMaterial;
  private layers: TerrainLayerInfo[] = [];
  private splatMap: THREE.DataTexture | null = null;
  private splatResolution: number = 2048;
  
  constructor() {
    // 创建基础节点材质
    this.material = new THREE.MeshStandardNodeMaterial({
      side: THREE.FrontSide,
    });
    
    // 设置基础属性
    this.material.roughnessNode = uniform(0.8);
    this.material.metalnessNode = uniform(0.1);
    
    // 初始化贴花贴图
    this.initSplatMap();
    
    // 添加默认内置贴图作为第一层
    const defaultTexture = createPatternTexture();
    const defaultLayer: TerrainLayerInfo = {
      texture: defaultTexture,
      tiling: 10,
      minHeight: -1000,
      maxHeight: 2000,
      minSlope: 0,
      maxSlope: 1
    };
    this.addLayer(defaultLayer);
  }
  
  /**
   * 获取材质对象
   */
  getMaterial(): THREE.Material {
    return this.material;
  }
  
  /**
   * 初始化贴花贴图
   */
  private initSplatMap(): void {
    // 创建贴花贴图
    const size = this.splatResolution;
    const data = new Uint8Array(size * size * 4);
    
    // 默认将第一个通道(R)设为255，其他通道为0
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;    // R - 第一层权重
      data[i + 1] = 0;  // G - 第二层权重
      data[i + 2] = 0;  // B - 第三层权重
      data[i + 3] = 0;  // A - 第四层权重
    }
    
    // 使用临时Canvas创建贴图
    this.splatMap = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    
    this.splatMap.wrapS = THREE.ClampToEdgeWrapping;
    this.splatMap.wrapT = THREE.ClampToEdgeWrapping;
    this.splatMap.needsUpdate = true;
  }
  
  /**
   * 添加地形纹理层
   */
  addLayer(layer: TerrainLayerInfo): number {
    // 最多支持4层纹理
    if (this.layers.length >= 4) {
      console.warn('已达到最大支持的4层地形材质。图层未添加。');
      return -1;
    }
    
    // 确保纹理有效
    if (!layer.texture) {
      console.error('尝试添加无效纹理层');
      return -1;
    }
    
    // 添加到层数组
    this.layers.push(layer);
    
    // 更新着色器
    this.updateShader();
    
    return this.layers.length - 1;
  }
  
  /**
   * 删除纹理层
   */
  removeLayer(index: number): boolean {
    if (index < 0 || index >= this.layers.length) {
      return false;
    }
    
    this.layers.splice(index, 1);
    
    // 更新贴花贴图
    if (this.splatMap) {
      const data = this.splatMap.image.data;
      
      // 将移除层的权重设为0，并重新分配给剩余层
      for (let i = 0; i < data.length; i += 4) {
        // 如果被移除的层有权重，将其分配给第一层
        if (data[i + index] > 0) {
          data[i] += data[i + index];
          data[i + index] = 0;
        }
      }
      
      this.splatMap.needsUpdate = true;
    }
    
    // 更新着色器
    this.updateShader();
    
    return true;
  }
  
  /**
   * 更新TSL材质
   */
  private updateShader(): void {
    if (this.layers.length === 0) {
      // 如果没有层，使用默认材质
      this.material.colorNode = uniform(color('#333333'));
      return;
    }
    
    // 准备坡度计算节点 - 坡度是1减去法线的Y分量
    const slope = sub(float(1.0), normalLocal.y);
    const height = positionLocal.y;
    
    // 获取贴花贴图
    let splatMapNode;
    if (this.splatMap) {
      splatMapNode = texture(this.splatMap, uv());
    } else {
      // 提供一个默认的替代值
      splatMapNode = vec4(1, 0, 0, 0);
    }
    
    // 创建存储临时结果的数组
    const colorContributions = [];
    
    // 使用纹理或颜色，取决于层是否有贴图
    this.layers.forEach((layer, i) => {
      // 根据层是否有贴图来决定使用贴图还是固定颜色
      let layerColor;
      
      if (layer.texture) {
        // 如果有贴图，使用贴图
        const tiling = uniform(layer.tiling || 1);
        const offset = vec2(0, 0);
        const uvTransform = add(mul(uv(), tiling), offset);
        layerColor = texture(layer.texture, uvTransform);
      } else {
        // 如果没有贴图，使用固定颜色
        if (i === 0) {
          // 第一层为纯红色
          layerColor = vec4(1, 0, 0, 1);
        } else if (i === 1) {
          // 第二层为纯绿色
          layerColor = vec4(0, 1, 0, 1);
        } else if (i === 2) {
          // 第三层为纯蓝色
          layerColor = vec4(0, 0, 1, 1);
        } else {
          // 第四层为纯黄色
          layerColor = vec4(1, 1, 0, 1);
        }
      }
      
      // 计算高度和坡度因子
      const heightMin = uniform(layer.minHeight || 0);
      const heightMax = uniform(layer.maxHeight || 50);
      const slopeMin = uniform(layer.minSlope || 0);
      const slopeMax = uniform(layer.maxSlope || 1);
      
      // 计算高度因子 (0-1)
      const heightFactor = clamp(
        div(sub(height, heightMin), max(sub(heightMax, heightMin), float(0.001))),
        0, 1
      );
      
      // 计算坡度因子 (0-1)
      const slopeFactor = clamp(
        div(sub(slope, slopeMin), max(sub(slopeMax, slopeMin), float(0.001))),
        0, 1
      );
      
      // 组合高度和坡度因子计算自然权重
      const naturalBlend = mul(heightFactor, slopeFactor);
      
      // 从贴花贴图获取区域权重
      let splatWeight;
      if (i === 0) {
        splatWeight = splatMapNode.r;
      } else if (i === 1) {
        splatWeight = splatMapNode.g;
      } else if (i === 2) {
        splatWeight = splatMapNode.b;
      } else {
        splatWeight = splatMapNode.a;
      }
      
      // 结合自然权重和贴花贴图权重
      const finalWeight = mul(splatWeight, float(0.9));
      
      // 存储颜色和权重为一个对象
      colorContributions.push({
        color: layerColor,
        weight: finalWeight
      });
    });
    
    // 混合所有层的颜色
    let finalColorNode = vec4(0, 0, 0, 1.0);
    let remainingWeight = float(1.0);
    
    // 从顶层到底层进行混合
    for (let i = colorContributions.length - 1; i >= 0; i--) {
      const { color, weight } = colorContributions[i];
      // 使用当前层的颜色和权重混合
      finalColorNode = mix(finalColorNode, color, mul(weight, remainingWeight));
      // 减少剩余权重
      remainingWeight = mul(remainingWeight, sub(float(1.0), weight));
    }
    
    // 设置最终颜色
    this.material.colorNode = finalColorNode;
    this.material.needsUpdate = true;
    
    // 添加调试输出
  }
  
  /**
   * 绘制纹理
   */
  paintTexture(worldX: number, worldZ: number, radius: number, layerIndex: number, strength: number): void {
    if (layerIndex < 0 || layerIndex >= this.layers.length || !this.splatMap) {
      return;
    }
    
    // 获取贴花贴图数据
    const data = this.splatMap.image.data;
    const res = this.splatResolution;
    
    // 将世界坐标转换为UV坐标
    // 假设地形是居中的，从-0.5到0.5
    const terrainSize = 1000; // 根据实际地形大小调整
    const u = ((worldX + terrainSize/2) / terrainSize) * res;
    const v = ((worldZ + terrainSize/2) / terrainSize) * res;
    
    // 计算半径（像素）
    const pixelRadius = radius * res / 1000;
    
    // 定义区域边界
    const minX = Math.max(0, Math.floor(u - pixelRadius));
    const maxX = Math.min(res - 1, Math.floor(u + pixelRadius));
    const minY = Math.max(0, Math.floor(v - pixelRadius));
    const maxY = Math.min(res - 1, Math.floor(v + pixelRadius));
    
    // 遍历区域
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // 计算到中心的距离
        const dx = x - u;
        const dy = y - v;
        const distSq = dx * dx + dy * dy;
        
        // 如果在半径内
        if (distSq <= pixelRadius * pixelRadius) {
          // 计算强度衰减（基于距离）
          const dist = Math.sqrt(distSq);
          const falloff = 1.0 - Math.min(1.0, dist / pixelRadius);
          let intensity = strength * falloff;
          if (intensity > 0.8) {
            intensity = 1.0; // 让高强度区域更加明确
          }
          // 修改贴花贴图
          const pixelIdx = (y * res + x) * 4;
          
          // 存储当前权重
          const weights = [
            data[pixelIdx],
            data[pixelIdx + 1],
            data[pixelIdx + 2],
            data[pixelIdx + 3]
          ];
          
          // 增加当前层的权重
          weights[layerIndex] = Math.min(255, weights[layerIndex] + Math.floor(intensity * 255));
          
          // 更新贴花贴图
          data[pixelIdx] = weights[0];
          data[pixelIdx + 1] = weights[1];
          data[pixelIdx + 2] = weights[2];
          data[pixelIdx + 3] = weights[3];
        }
      }
    }
    
    // 标记贴花贴图需要更新
    this.splatMap.needsUpdate = true;
    
    // 更新着色器以反映贴花贴图的变化
    this.updateShader();
  }

  /**
   * 设置纯白色材质
   */
  setWhiteMaterial(): void {
    // 使用TSL创建纯白色材质
    this.material = new THREE.MeshStandardNodeMaterial();
    this.material.colorNode = vec4(1, 0, 0, 1);
    this.material.roughnessNode = uniform(0.8);
    this.material.metalnessNode = uniform(0.1);
    
    // 清空纹理层
    this.layers = [];
  }

  /**
   * 在指定索引处添加地形纹理层
   */
  addLayerAt(index: number, layer: TerrainLayerInfo): number {
    // 最多支持4层纹理
    if (this.layers.length >= 4) {
      console.warn('最多支持4层地形材质。无法添加新层。');
      return -1;
    }
    
    // 确保索引有效
    index = Math.max(0, Math.min(index, this.layers.length));
    
    // 在指定位置插入
    this.layers.splice(index, 0, layer);
    
    // 更新着色器
    this.updateShader();
    
    return index;
  }

  /**
   * 获取所有材质层
   */
  getLayers(): TerrainLayerInfo[] {
    return [...this.layers]; // 返回副本
  }

  /**
   * 获取指定索引的材质层
   */
  getLayerAt(index: number): TerrainLayerInfo | undefined {
    if (index >= 0 && index < this.layers.length) {
      return this.layers[index];
    }
    return undefined;
  }

  /**
   * 更新材质层设置
   */
  updateMaterialLayers(): void {
    this.updateShader();
  }

  /**
   * 获取贴花贴图数据
   */
  public getSplatmapData(): Uint8Array | null {
    if (this.splatMap) {
      return this.splatMap.image.data;
    }
    return null;
  }

  /**
   * 获取贴花贴图分辨率
   */
  public getSplatmapResolution(): number {
    return this.splatResolution;
  }
}

function createPatternTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  
  // 绘制渐变背景
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#553311');
  gradient.addColorStop(1, '#775533');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // 添加一些随机小点
  ctx.fillStyle = '#998877';
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
