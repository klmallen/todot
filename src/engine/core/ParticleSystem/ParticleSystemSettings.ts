import * as THREE from 'three';
import { Curve } from './Curves/Curve';
import { ColorCurve } from './Curves/ColorCurve';
import { MinMaxCurve } from './Curves/MinMaxCurve';
import { GradientCurve } from './Curves/GradientCurve';

/**
 * 发射器形状类型
 */
export type EmitterShapeType = 'Cone' | 'Sphere' | 'Box' | 'Circle' | 'Edge' | 'Point';

/**
 * 渲染模式类型
 */
export type RenderModeType = 'Billboard' | 'Mesh' | 'Trail' | 'StretchedBillboard';

/**
 * 发射器设置
 */
export interface EmissionSettings {
  // 发射率（每秒粒子数）
  rateOverTime: number;
  // 发射率随时间变化曲线
  rateOverTimeCurve?: MinMaxCurve;
  // 发射率随距离变化曲线
  rateOverDistanceCurve?: MinMaxCurve;
  // 爆发设置
  bursts?: Array<{
    time: number;
    count: number;
    cycles: number;
    interval: number;
  }>;
}

/**
 * 形状设置
 */
export interface ShapeSettings {
  // 形状类型
  type: EmitterShapeType;
  // 形状参数
  params: {
    // 圆锥体参数
    cone?: {
      angle: number;
      radius: number;
      length: number;
      emitFrom: 'Base' | 'Volume' | 'Shell';
    };
    // 球体参数
    sphere?: {
      radius: number;
      emitFrom: 'Volume' | 'Shell';
    };
    // 盒子参数
    box?: {
      width: number;
      height: number;
      depth: number;
      emitFrom: 'Volume' | 'Shell' | 'Edge';
    };
    // 圆形参数
    circle?: {
      radius: number;
      arc: number;
      emitFrom: 'Edge' | 'Inside';
    };
    // 边缘参数
    edge?: {
      length: number;
    };
  };
  // 是否从边缘发射
  randomizeDirection: boolean;
  // 方向缩放
  directionScale: number;
}

/**
 * 渲染器设置
 */
export interface RendererSettings {
  // 渲染模式
  renderMode: RenderModeType;
  // 自定义网格
  mesh?: THREE.BufferGeometry;
  // 自定义材质
  material?: THREE.Material;
  // 纹理
  texture?: THREE.Texture;
  // 是否添加混合
  blending: boolean;
  // 混合模式
  blendMode: THREE.BlendingDstFactor;
  // 是否启用光照
  enableLighting: boolean;
  // 是否投射阴影
  castShadows: boolean;
  // 是否接收阴影
  receiveShadows: boolean;
  // 排序模式
  sortMode: 'None' | 'Distance' | 'YoungestFirst' | 'OldestFirst';
  // 最大拉伸比例（用于StretchedBillboard模式）
  maxStretchFactor: number;
  // 速度缩放（用于StretchedBillboard模式）
  speedScale: number;
  // 是否面向速度方向
  alignToDirection: boolean;
}

/**
 * 粒子系统设置类
 */
export class ParticleSystemSettings {
  // 基本设置
  duration: number = 5.0;
  loop: boolean = true;
  prewarm: boolean = false;
  playbackSpeed: number = 1.0;
  maxParticles: number = 1000;
  playOnAwake: boolean = true;
  simulationSpace: 'Local' | 'World' = 'Local';
  
  // 发射设置
  emission: EmissionSettings = {
    rateOverTime: 10,
  };
  
  // 形状设置
  shape: ShapeSettings = {
    type: 'Cone',
    params: {
      cone: {
        angle: 25,
        radius: 1,
        length: 5,
        emitFrom: 'Base'
      }
    },
    randomizeDirection: true,
    directionScale: 1.0
  };
  
  // 生命周期设置
  startLifetime: MinMaxCurve = new MinMaxCurve(5.0, 5.0);
  startSpeed: MinMaxCurve = new MinMaxCurve(5.0, 5.0);
  startSize: MinMaxCurve = new MinMaxCurve(1.0, 1.0);
  startRotation: MinMaxCurve = new MinMaxCurve(0, 0);
  startColor: ColorCurve = new ColorCurve(new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1));
  
  // 随时间变化的属性
  sizeOverLifetime?: GradientCurve;
  colorOverLifetime?: ColorCurve;
  rotationOverLifetime?: MinMaxCurve;
  speedOverLifetime?: MinMaxCurve;
  
  // 物理设置
  useGravity: boolean = false;
  gravityModifier: number = 1.0;
  
  // 碰撞设置
  useCollision: boolean = false;
  collisionRadius: number = 0.1;
  collisionRestitution: number = 0.5;
  
  // 渲染设置
  renderer: RendererSettings = {
    renderMode: 'Billboard',
    blending: true,
    blendMode: THREE.AdditiveBlending,
    enableLighting: false,
    castShadows: false,
    receiveShadows: false,
    sortMode: 'None',
    maxStretchFactor: 3.0,
    speedScale: 0.5,
    alignToDirection: false
  };
  
  /**
   * 构造函数
   */
  constructor() {
    // 初始化曲线
    this.sizeOverLifetime = new GradientCurve([
      { time: 0, value: 0 },
      { time: 0.2, value: 1 },
      { time: 0.8, value: 1 },
      { time: 1, value: 0 }
    ]);
    
    this.colorOverLifetime = new ColorCurve(
      new THREE.Color(1, 1, 1),
      new THREE.Color(1, 1, 1, 0) // 透明度为0的白色
    );
  }
}
