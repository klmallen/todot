import * as THREE from 'three';
import { ParticleData } from './ParticleData';
import { ParticleSystemSettings, RenderModeType } from './ParticleSystemSettings';

/**
 * 粒子渲染器类 - 负责渲染粒子
 */
export class ParticleRenderer {
  private settings: ParticleSystemSettings;
  private mesh: THREE.Points | THREE.InstancedMesh | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.Material | null = null;
  private positions: Float32Array | null = null;
  private colors: Float32Array | null = null;
  private sizes: Float32Array | null = null;
  private rotations: Float32Array | null = null;
  private positionAttribute: THREE.BufferAttribute | null = null;
  private colorAttribute: THREE.BufferAttribute | null = null;
  private sizeAttribute: THREE.BufferAttribute | null = null;
  private rotationAttribute: THREE.BufferAttribute | null = null;
  private maxParticles: number = 1000;
  private particleCount: number = 0;
  
  /**
   * 构造函数
   * @param settings 粒子系统设置
   */
  constructor(settings: ParticleSystemSettings) {
    this.settings = settings;
    this.maxParticles = settings.maxParticles;
    this.initRenderer();
  }
  
  /**
   * 初始化渲染器
   */
  private initRenderer(): void {
    // 根据渲染模式创建不同的渲染器
    switch (this.settings.renderer.renderMode) {
      case 'Billboard':
        this.initBillboardRenderer();
        break;
      case 'Mesh':
        this.initMeshRenderer();
        break;
      case 'Trail':
        this.initTrailRenderer();
        break;
      case 'StretchedBillboard':
        this.initStretchedBillboardRenderer();
        break;
      default:
        this.initBillboardRenderer();
        break;
    }
  }
  
  /**
   * 初始化广告牌渲染器
   */
  private initBillboardRenderer(): void {
    // 创建几何体
    this.geometry = new THREE.BufferGeometry();
    
    // 创建属性数组
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 4);
    this.sizes = new Float32Array(this.maxParticles);
    this.rotations = new Float32Array(this.maxParticles);
    
    // 创建缓冲属性
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.colorAttribute = new THREE.BufferAttribute(this.colors, 4);
    this.sizeAttribute = new THREE.BufferAttribute(this.sizes, 1);
    this.rotationAttribute = new THREE.BufferAttribute(this.rotations, 1);
    
    // 设置几何体属性
    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('color', this.colorAttribute);
    this.geometry.setAttribute('size', this.sizeAttribute);
    this.geometry.setAttribute('rotation', this.rotationAttribute);
    
    // 创建材质
    if (this.settings.renderer.material) {
      // 使用自定义材质
      this.material = this.settings.renderer.material;
    } else {
      // 创建默认的点精灵材质
      const texture = this.settings.renderer.texture || this.createDefaultTexture();
      
      this.material = new THREE.PointsMaterial({
        size: 1.0,
        sizeAttenuation: true,
        map: texture,
        alphaTest: 0.01,
        transparent: true,
        vertexColors: true
      });
      
      // 设置混合模式
      if (this.settings.renderer.blending) {
        (this.material as THREE.PointsMaterial).blending = this.settings.renderer.blendMode;
      }
    }
    
    // 创建点云
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false; // 禁用视锥体剔除，确保粒子始终可见
  }
  
  /**
   * 初始化网格渲染器
   */
  private initMeshRenderer(): void {
    // 使用实例化网格渲染
    
    // 获取网格几何体
    const meshGeometry = this.settings.renderer.mesh || this.createDefaultMesh();
    
    // 创建材质
    if (this.settings.renderer.material) {
      // 使用自定义材质
      this.material = this.settings.renderer.material;
    } else {
      // 创建默认材质
      const texture = this.settings.renderer.texture || this.createDefaultTexture();
      
      this.material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        vertexColors: true
      });
      
      // 设置混合模式
      if (this.settings.renderer.blending) {
        (this.material as THREE.MeshBasicMaterial).blending = this.settings.renderer.blendMode;
      }
    }
    
    // 创建实例化网格
    this.mesh = new THREE.InstancedMesh(meshGeometry, this.material, this.maxParticles);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0; // 初始时没有实例
    
    // 创建颜色数组
    if (this.mesh.instanceColor === null) {
      this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(this.maxParticles * 3), 3
      );
    }
  }
  
  /**
   * 初始化拖尾渲染器
   */
  private initTrailRenderer(): void {
    // 拖尾渲染器使用线条渲染
    
    // 创建几何体
    this.geometry = new THREE.BufferGeometry();
    
    // 创建属性数组 - 每个粒子有两个点（当前位置和上一个位置）
    this.positions = new Float32Array(this.maxParticles * 6); // 每个粒子2个点，每个点3个坐标
    this.colors = new Float32Array(this.maxParticles * 8); // 每个粒子2个点，每个点4个颜色分量
    
    // 创建缓冲属性
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.colorAttribute = new THREE.BufferAttribute(this.colors, 4);
    
    // 设置几何体属性
    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('color', this.colorAttribute);
    
    // 创建材质
    if (this.settings.renderer.material) {
      // 使用自定义材质
      this.material = this.settings.renderer.material;
    } else {
      // 创建默认的线条材质
      this.material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true
      });
      
      // 设置混合模式
      if (this.settings.renderer.blending) {
        (this.material as THREE.LineBasicMaterial).blending = this.settings.renderer.blendMode;
      }
    }
    
    // 创建线条
    this.mesh = new THREE.LineSegments(this.geometry, this.material);
    this.mesh.frustumCulled = false; // 禁用视锥体剔除
  }
  
  /**
   * 初始化拉伸广告牌渲染器
   */
  private initStretchedBillboardRenderer(): void {
    // 拉伸广告牌使用实例化网格渲染
    
    // 创建平面几何体
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    
    // 创建材质
    if (this.settings.renderer.material) {
      // 使用自定义材质
      this.material = this.settings.renderer.material;
    } else {
      // 创建默认材质
      const texture = this.settings.renderer.texture || this.createDefaultTexture();
      
      this.material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        vertexColors: true,
        side: THREE.DoubleSide
      });
      
      // 设置混合模式
      if (this.settings.renderer.blending) {
        (this.material as THREE.MeshBasicMaterial).blending = this.settings.renderer.blendMode;
      }
    }
    
    // 创建实例化网格
    this.mesh = new THREE.InstancedMesh(planeGeometry, this.material, this.maxParticles);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0; // 初始时没有实例
    
    // 创建颜色数组
    if (this.mesh.instanceColor === null) {
      this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(this.maxParticles * 3), 3
      );
    }
  }
  
  /**
   * 创建默认纹理
   */
  private createDefaultTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法创建2D上下文');
    }
    
    // 创建径向渐变
    const gradient = context.createRadialGradient(
      32, 32, 0,
      32, 32, 32
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // 绘制圆形
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  /**
   * 创建默认网格
   */
  private createDefaultMesh(): THREE.BufferGeometry {
    return new THREE.SphereGeometry(0.5, 8, 8);
  }
  
  /**
   * 更新粒子
   * @param particles 粒子数组
   */
  update(particles: ParticleData[]): void {
    this.particleCount = Math.min(particles.length, this.maxParticles);
    
    // 根据渲染模式更新
    switch (this.settings.renderer.renderMode) {
      case 'Billboard':
        this.updateBillboard(particles);
        break;
      case 'Mesh':
        this.updateMesh(particles);
        break;
      case 'Trail':
        this.updateTrail(particles);
        break;
      case 'StretchedBillboard':
        this.updateStretchedBillboard(particles);
        break;
      default:
        this.updateBillboard(particles);
        break;
    }
  }
  
  /**
   * 更新广告牌渲染器
   * @param particles 粒子数组
   */
  private updateBillboard(particles: ParticleData[]): void {
    if (!this.positions || !this.colors || !this.sizes || !this.rotations || 
        !this.positionAttribute || !this.colorAttribute || !this.sizeAttribute || !this.rotationAttribute) {
      return;
    }
    
    // 更新每个粒子的属性
    for (let i = 0; i < this.particleCount; i++) {
      const particle = particles[i];
      
      // 更新位置
      this.positions[i * 3] = particle.position.x;
      this.positions[i * 3 + 1] = particle.position.y;
      this.positions[i * 3 + 2] = particle.position.z;
      
      // 更新颜色
      this.colors[i * 4] = particle.color.r;
      this.colors[i * 4 + 1] = particle.color.g;
      this.colors[i * 4 + 2] = particle.color.b;
      this.colors[i * 4 + 3] = 1.0 - (particle.age / particle.lifetime); // 透明度随生命周期变化
      
      // 更新大小
      this.sizes[i] = particle.size;
      
      // 更新旋转
      this.rotations[i] = particle.rotation;
    }
    
    // 标记属性需要更新
    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.sizeAttribute.needsUpdate = true;
    this.rotationAttribute.needsUpdate = true;
    
    // 更新几何体的绘制范围
    if (this.geometry) {
      this.geometry.setDrawRange(0, this.particleCount);
    }
  }
  
  /**
   * 更新网格渲染器
   * @param particles 粒子数组
   */
  private updateMesh(particles: ParticleData[]): void {
    if (!this.mesh || !(this.mesh instanceof THREE.InstancedMesh)) {
      return;
    }
    
    // 更新实例数量
    this.mesh.count = this.particleCount;
    
    // 临时矩阵和颜色
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    
    // 更新每个粒子的实例
    for (let i = 0; i < this.particleCount; i++) {
      const particle = particles[i];
      
      // 创建变换矩阵
      matrix.makeRotationZ(particle.rotation);
      matrix.scale(new THREE.Vector3(particle.size, particle.size, particle.size));
      matrix.setPosition(particle.position);
      
      // 设置实例矩阵
      this.mesh.setMatrixAt(i, matrix);
      
      // 设置实例颜色
      color.copy(particle.color);
      this.mesh.setColorAt(i, color);
    }
    
    // 标记实例矩阵和颜色需要更新
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }
  
  /**
   * 更新拖尾渲染器
   * @param particles 粒子数组
   */
  private updateTrail(particles: ParticleData[]): void {
    if (!this.positions || !this.colors || !this.positionAttribute || !this.colorAttribute) {
      return;
    }
    
    // 更新每个粒子的拖尾
    for (let i = 0; i < this.particleCount; i++) {
      const particle = particles[i];
      
      // 当前位置
      const currentPos = particle.position;
      
      // 上一个位置（根据速度计算）
      const prevPos = currentPos.clone().sub(particle.velocity.clone().multiplyScalar(0.1));
      
      // 设置线段的两个端点
      this.positions[i * 6] = prevPos.x;
      this.positions[i * 6 + 1] = prevPos.y;
      this.positions[i * 6 + 2] = prevPos.z;
      
      this.positions[i * 6 + 3] = currentPos.x;
      this.positions[i * 6 + 4] = currentPos.y;
      this.positions[i * 6 + 5] = currentPos.z;
      
      // 设置颜色
      const alpha = 1.0 - (particle.age / particle.lifetime);
      
      // 起点颜色（透明）
      this.colors[i * 8] = particle.color.r;
      this.colors[i * 8 + 1] = particle.color.g;
      this.colors[i * 8 + 2] = particle.color.b;
      this.colors[i * 8 + 3] = 0; // 完全透明
      
      // 终点颜色
      this.colors[i * 8 + 4] = particle.color.r;
      this.colors[i * 8 + 5] = particle.color.g;
      this.colors[i * 8 + 6] = particle.color.b;
      this.colors[i * 8 + 7] = alpha;
    }
    
    // 标记属性需要更新
    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    
    // 更新几何体的绘制范围
    if (this.geometry) {
      this.geometry.setDrawRange(0, this.particleCount * 2);
    }
  }
  
  /**
   * 更新拉伸广告牌渲染器
   * @param particles 粒子数组
   */
  private updateStretchedBillboard(particles: ParticleData[]): void {
    if (!this.mesh || !(this.mesh instanceof THREE.InstancedMesh)) {
      return;
    }
    
    // 更新实例数量
    this.mesh.count = this.particleCount;
    
    // 临时矩阵和颜色
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    
    // 相机位置（用于广告牌朝向）
    const cameraPosition = new THREE.Vector3(0, 0, 1); // 假设相机在z轴正方向
    
    // 更新每个粒子的实例
    for (let i = 0; i < this.particleCount; i++) {
      const particle = particles[i];
      
      // 计算拉伸因子
      const speed = particle.velocity.length();
      const stretchFactor = Math.min(
        speed * this.settings.renderer.speedScale,
        this.settings.renderer.maxStretchFactor
      );
      
      // 计算朝向
      let lookDirection: THREE.Vector3;
      
      if (this.settings.renderer.alignToDirection && speed > 0.1) {
        // 朝向速度方向
        lookDirection = particle.velocity.clone().normalize();
      } else {
        // 朝向相机
        lookDirection = new THREE.Vector3().subVectors(cameraPosition, particle.position).normalize();
      }
      
      // 创建旋转矩阵，使平面朝向相机或速度方向
      const upVector = new THREE.Vector3(0, 1, 0);
      const rightVector = new THREE.Vector3().crossVectors(lookDirection, upVector).normalize();
      
      // 重新计算上向量，确保正交
      upVector.crossVectors(rightVector, lookDirection).normalize();
      
      // 创建旋转矩阵
      const rotationMatrix = new THREE.Matrix4().makeBasis(
        rightVector,
        upVector,
        lookDirection.clone().negate()
      );
      
      // 创建缩放矩阵，根据速度拉伸
      const scaleMatrix = new THREE.Matrix4().makeScale(
        particle.size,
        particle.size * stretchFactor,
        1
      );
      
      // 创建平移矩阵
      const translationMatrix = new THREE.Matrix4().makeTranslation(
        particle.position.x,
        particle.position.y,
        particle.position.z
      );
      
      // 组合变换
      matrix.identity()
        .multiply(translationMatrix)
        .multiply(rotationMatrix)
        .multiply(scaleMatrix);
      
      // 设置实例矩阵
      this.mesh.setMatrixAt(i, matrix);
      
      // 设置实例颜色
      color.copy(particle.color);
      this.mesh.setColorAt(i, color);
    }
    
    // 标记实例矩阵和颜色需要更新
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }
  
  /**
   * 更新设置
   * @param settings 新的粒子系统设置
   */
  updateSettings(settings: ParticleSystemSettings): void {
    const oldRenderMode = this.settings.renderer.renderMode;
    this.settings = settings;
    
    // 如果渲染模式改变，重新初始化渲染器
    if (oldRenderMode !== settings.renderer.renderMode) {
      this.dispose();
      this.initRenderer();
    } else {
      // 更新材质
      if (settings.renderer.material && this.material !== settings.renderer.material) {
        if (this.mesh) {
          this.mesh.material = settings.renderer.material;
          this.material = settings.renderer.material;
        }
      }
      
      // 更新网格
      if (settings.renderer.renderMode === 'Mesh' && settings.renderer.mesh && this.mesh) {
        if (this.mesh instanceof THREE.InstancedMesh) {
          const newMesh = new THREE.InstancedMesh(
            settings.renderer.mesh,
            this.mesh.material,
            this.maxParticles
          );
          
          // 复制实例数据
          newMesh.count = this.mesh.count;
          newMesh.instanceMatrix.copy(this.mesh.instanceMatrix);
          
          if (this.mesh.instanceColor && newMesh.instanceColor) {
            newMesh.instanceColor.copy(this.mesh.instanceColor);
          }
          
          // 替换网格
          if (this.mesh.parent) {
            this.mesh.parent.add(newMesh);
            this.mesh.parent.remove(this.mesh);
          }
          
          this.mesh = newMesh;
        }
      }
    }
  }
  
  /**
   * 获取网格对象
   */
  getMesh(): THREE.Object3D | null {
    return this.mesh;
  }
  
  /**
   * 销毁渲染器
   */
  dispose(): void {
    // 释放几何体
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    
    // 释放材质
    if (this.material && this.material !== this.settings.renderer.material) {
      this.material.dispose();
      this.material = null;
    }
    
    // 移除网格
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    
    this.mesh = null;
    this.positions = null;
    this.colors = null;
    this.sizes = null;
    this.rotations = null;
    this.positionAttribute = null;
    this.colorAttribute = null;
    this.sizeAttribute = null;
    this.rotationAttribute = null;
  }
}
