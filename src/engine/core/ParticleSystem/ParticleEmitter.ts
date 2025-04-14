import * as THREE from 'three';
import { ParticleData } from './ParticleData';
import { ParticleSystemSettings, EmitterShapeType } from './ParticleSystemSettings';

/**
 * 粒子发射器类 - 负责创建和发射粒子
 */
export class ParticleEmitter {
  private settings: ParticleSystemSettings;
  
  /**
   * 构造函数
   * @param settings 粒子系统设置
   */
  constructor(settings: ParticleSystemSettings) {
    this.settings = settings;
  }
  
  /**
   * 更新设置
   * @param settings 新的粒子系统设置
   */
  updateSettings(settings: ParticleSystemSettings): void {
    this.settings = settings;
  }
  
  /**
   * 发射一个新粒子
   * @returns 新创建的粒子
   */
  emitParticle(): ParticleData {
    const particle = new ParticleData();
    
    // 设置生命周期
    particle.lifetime = this.settings.startLifetime.evaluate(Math.random());
    
    // 设置初始位置
    this.setParticlePosition(particle);
    
    // 设置初始速度
    this.setParticleVelocity(particle);
    
    // 设置初始大小
    particle.startSize = this.settings.startSize.evaluate(Math.random());
    particle.size = particle.startSize;
    
    // 设置初始旋转
    particle.startRotation = this.settings.startRotation.evaluate(Math.random());
    particle.rotation = particle.startRotation;
    
    // 设置初始颜色
    particle.startColor.copy(this.settings.startColor.evaluate(Math.random()));
    particle.color.copy(particle.startColor);
    
    // 设置旋转速度
    if (this.settings.rotationOverLifetime) {
      particle.rotationSpeed = this.settings.rotationOverLifetime.evaluate(Math.random());
    }
    
    return particle;
  }
  
  /**
   * 设置粒子的初始位置
   * @param particle 粒子
   */
  private setParticlePosition(particle: ParticleData): void {
    const shape = this.settings.shape;
    
    switch (shape.type) {
      case 'Point':
        // 点发射器，位置为原点
        particle.position.set(0, 0, 0);
        break;
        
      case 'Sphere':
        // 球形发射器
        this.emitFromSphere(particle, shape.params.sphere?.radius || 1, 
                           shape.params.sphere?.emitFrom || 'Volume');
        break;
        
      case 'Cone':
        // 圆锥体发射器
        this.emitFromCone(particle, 
                         shape.params.cone?.angle || 25, 
                         shape.params.cone?.radius || 1,
                         shape.params.cone?.length || 5,
                         shape.params.cone?.emitFrom || 'Base');
        break;
        
      case 'Box':
        // 盒子发射器
        this.emitFromBox(particle, 
                        shape.params.box?.width || 1,
                        shape.params.box?.height || 1,
                        shape.params.box?.depth || 1,
                        shape.params.box?.emitFrom || 'Volume');
        break;
        
      case 'Circle':
        // 圆形发射器
        this.emitFromCircle(particle, 
                           shape.params.circle?.radius || 1,
                           shape.params.circle?.arc || 360,
                           shape.params.circle?.emitFrom || 'Edge');
        break;
        
      case 'Edge':
        // 边缘发射器
        this.emitFromEdge(particle, shape.params.edge?.length || 1);
        break;
        
      default:
        // 默认为点发射器
        particle.position.set(0, 0, 0);
        break;
    }
  }
  
  /**
   * 设置粒子的初始速度
   * @param particle 粒子
   */
  private setParticleVelocity(particle: ParticleData): void {
    const shape = this.settings.shape;
    const speed = this.settings.startSpeed.evaluate(Math.random());
    
    // 根据形状类型设置方向
    let direction = new THREE.Vector3();
    
    switch (shape.type) {
      case 'Cone':
        // 圆锥体方向
        if (shape.randomizeDirection) {
          // 随机方向，但在圆锥体角度范围内
          const angle = shape.params.cone?.angle || 25;
          const phi = Math.random() * Math.PI * 2;
          const theta = Math.random() * angle * Math.PI / 180;
          
          direction.x = Math.sin(theta) * Math.cos(phi);
          direction.y = Math.cos(theta);
          direction.z = Math.sin(theta) * Math.sin(phi);
        } else {
          // 从位置指向圆锥体轴线
          direction.copy(particle.position).normalize();
          direction.y = Math.abs(direction.y); // 确保向上
        }
        break;
        
      case 'Sphere':
        // 球形方向
        if (shape.randomizeDirection) {
          // 完全随机方向
          direction.x = Math.random() * 2 - 1;
          direction.y = Math.random() * 2 - 1;
          direction.z = Math.random() * 2 - 1;
          direction.normalize();
        } else {
          // 从中心向外
          direction.copy(particle.position).normalize();
        }
        break;
        
      case 'Box':
      case 'Circle':
      case 'Edge':
        // 默认向上方向
        if (shape.randomizeDirection) {
          // 半球随机方向
          const phi = Math.random() * Math.PI * 2;
          const theta = Math.acos(Math.random());
          
          direction.x = Math.sin(theta) * Math.cos(phi);
          direction.y = Math.cos(theta);
          direction.z = Math.sin(theta) * Math.sin(phi);
        } else {
          direction.set(0, 1, 0);
        }
        break;
        
      default:
        // 默认向上
        direction.set(0, 1, 0);
        break;
    }
    
    // 应用方向缩放
    direction.multiplyScalar(shape.directionScale);
    
    // 设置速度
    particle.velocity.copy(direction).multiplyScalar(speed);
  }
  
  /**
   * 从球体发射粒子
   */
  private emitFromSphere(particle: ParticleData, radius: number, emitFrom: 'Volume' | 'Shell'): void {
    // 生成随机方向
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    
    // 根据发射模式设置距离
    let distance: number;
    
    if (emitFrom === 'Shell') {
      // 从表面发射
      distance = radius;
    } else {
      // 从体积内部发射
      distance = radius * Math.cbrt(Math.random()); // 立方根确保均匀分布
    }
    
    // 设置位置
    particle.position.set(
      x * distance,
      y * distance,
      z * distance
    );
  }
  
  /**
   * 从圆锥体发射粒子
   */
  private emitFromCone(
    particle: ParticleData, 
    angle: number, 
    radius: number, 
    length: number, 
    emitFrom: 'Base' | 'Volume' | 'Shell'
  ): void {
    // 角度转弧度
    const angleRad = angle * Math.PI / 180;
    
    // 根据发射模式设置位置
    if (emitFrom === 'Base') {
      // 从底部圆形发射
      const r = radius * Math.sqrt(Math.random()); // 确保均匀分布
      const theta = Math.random() * Math.PI * 2;
      
      particle.position.set(
        r * Math.cos(theta),
        0,
        r * Math.sin(theta)
      );
    } else {
      // 从体积或表面发射
      // 首先在底部圆形上选一点
      const r = radius * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      
      const baseX = r * Math.cos(theta);
      const baseZ = r * Math.sin(theta);
      
      // 然后选择高度
      let height: number;
      
      if (emitFrom === 'Shell') {
        // 从表面发射，要么在底部圆，要么在侧面
        if (Math.random() < 0.5) {
          // 底部圆
          height = 0;
        } else {
          // 侧面
          height = length * Math.random();
          
          // 调整底部坐标，使其位于侧面
          const radiusAtHeight = radius * (1 - height / length);
          const normalizedR = r / radius;
          
          particle.position.set(
            baseX * (radiusAtHeight / radius),
            height,
            baseZ * (radiusAtHeight / radius)
          );
          return;
        }
      } else {
        // 从体积内部发射
        height = length * Math.random();
        
        // 调整半径，使其在当前高度的圆锥截面内
        const radiusAtHeight = radius * (1 - height / length);
        const adjustedR = radiusAtHeight * Math.sqrt(Math.random());
        
        particle.position.set(
          (baseX / r) * adjustedR,
          height,
          (baseZ / r) * adjustedR
        );
        return;
      }
      
      // 设置位置（用于底部圆的情况）
      particle.position.set(baseX, height, baseZ);
    }
  }
  
  /**
   * 从盒子发射粒子
   */
  private emitFromBox(
    particle: ParticleData, 
    width: number, 
    height: number, 
    depth: number, 
    emitFrom: 'Volume' | 'Shell' | 'Edge'
  ): void {
    if (emitFrom === 'Volume') {
      // 从体积内部发射
      particle.position.set(
        (Math.random() - 0.5) * width,
        (Math.random() - 0.5) * height,
        (Math.random() - 0.5) * depth
      );
    } else if (emitFrom === 'Edge') {
      // 从边缘发射
      // 选择一条边
      const edge = Math.floor(Math.random() * 12); // 12条边
      const t = Math.random(); // 边上的参数
      
      // 盒子的8个顶点
      const vertices = [
        new THREE.Vector3(-width/2, -height/2, -depth/2),
        new THREE.Vector3(width/2, -height/2, -depth/2),
        new THREE.Vector3(width/2, height/2, -depth/2),
        new THREE.Vector3(-width/2, height/2, -depth/2),
        new THREE.Vector3(-width/2, -height/2, depth/2),
        new THREE.Vector3(width/2, -height/2, depth/2),
        new THREE.Vector3(width/2, height/2, depth/2),
        new THREE.Vector3(-width/2, height/2, depth/2)
      ];
      
      // 12条边的索引对
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // 底部矩形
        [4, 5], [5, 6], [6, 7], [7, 4], // 顶部矩形
        [0, 4], [1, 5], [2, 6], [3, 7]  // 连接顶部和底部的边
      ];
      
      // 选择的边的两个端点
      const v1 = vertices[edges[edge][0]];
      const v2 = vertices[edges[edge][1]];
      
      // 在边上插值
      particle.position.copy(v1).lerp(v2, t);
    } else {
      // 从表面发射
      // 选择一个面
      const face = Math.floor(Math.random() * 6); // 6个面
      
      // 在选择的面上随机位置
      let x, y, z;
      
      switch (face) {
        case 0: // 前面
          x = (Math.random() - 0.5) * width;
          y = (Math.random() - 0.5) * height;
          z = -depth / 2;
          break;
        case 1: // 后面
          x = (Math.random() - 0.5) * width;
          y = (Math.random() - 0.5) * height;
          z = depth / 2;
          break;
        case 2: // 左面
          x = -width / 2;
          y = (Math.random() - 0.5) * height;
          z = (Math.random() - 0.5) * depth;
          break;
        case 3: // 右面
          x = width / 2;
          y = (Math.random() - 0.5) * height;
          z = (Math.random() - 0.5) * depth;
          break;
        case 4: // 底面
          x = (Math.random() - 0.5) * width;
          y = -height / 2;
          z = (Math.random() - 0.5) * depth;
          break;
        case 5: // 顶面
          x = (Math.random() - 0.5) * width;
          y = height / 2;
          z = (Math.random() - 0.5) * depth;
          break;
        default:
          x = y = z = 0;
      }
      
      particle.position.set(x, y, z);
    }
  }
  
  /**
   * 从圆形发射粒子
   */
  private emitFromCircle(
    particle: ParticleData, 
    radius: number, 
    arc: number, 
    emitFrom: 'Edge' | 'Inside'
  ): void {
    // 角度转弧度
    const arcRad = arc * Math.PI / 180;
    
    // 随机角度
    const theta = (Math.random() * arcRad) - (arcRad / 2) + Math.PI / 2; // 默认朝上，所以加90度
    
    // 根据发射模式设置半径
    let r: number;
    
    if (emitFrom === 'Edge') {
      // 从边缘发射
      r = radius;
    } else {
      // 从内部发射
      r = radius * Math.sqrt(Math.random()); // 确保均匀分布
    }
    
    // 设置位置（在XY平面上）
    particle.position.set(
      r * Math.cos(theta),
      r * Math.sin(theta),
      0
    );
  }
  
  /**
   * 从边缘发射粒子
   */
  private emitFromEdge(particle: ParticleData, length: number): void {
    // 在线段上随机位置
    const t = Math.random();
    const halfLength = length / 2;
    
    // 设置位置（在X轴上）
    particle.position.set(
      -halfLength + t * length,
      0,
      0
    );
  }
}
