import * as THREE from 'three';
import { Node3d } from '../Node3d';
import { editable, editableComponent } from '../decorators';
import { ParticleEmitter } from './ParticleEmitter';
import { ParticleRenderer } from './ParticleRenderer';
import { ParticleSystemSettings } from './ParticleSystemSettings';
import { ParticleData } from './ParticleData';
import { ParticleSystemTSL, ParticleTSLEffectType, ParticleTSLEffectParams } from './ParticleSystemTSL';
import { EventEmitter } from '../../utils/EventEmitter';

/**
 * 粒子系统生命周期事件
 */
export enum ParticleLifecycleEvent {
  START = 'start',              // 开始播放
  PAUSE = 'pause',              // 暂停
  RESUME = 'resume',            // 恢复
  STOP = 'stop',                // 停止
  COMPLETE = 'complete',        // 完成一个生命周期
  LOOP = 'loop',                // 循环开始
  PROGRESS = 'progress',        // 进度更新
  PARTICLE_BORN = 'particleBorn', // 粒子产生
  PARTICLE_DIED = 'particleDied',  // 粒子消亡
  DESTROYED = 'destroyed',      // 粒子系统被销毁
  RESET = 'reset',              // 粒子系统被重置
}

/**
 * 粒子系统类 - 用于创建和管理粒子效果
 * 参考Unity的粒子系统设计
 */
@editableComponent({
  displayName: '粒子系统',
  description: '用于创建和管理粒子效果',
  icon: 'particle',
  category: 'Effects'
})
export class ParticleSystem extends Node3d {
  // 粒子系统设置
  @editable({
    displayName: '持续时间',
    description: '粒子系统的持续时间（秒）',
    type: 'number',
    min: 0.1,
    max: 100,
    step: 0.1,
    group: '基础设置'
  })
  private _duration: number = 3.0;

  @editable({
    displayName: '循环',
    description: '粒子系统是否循环播放',
    type: 'boolean',
    group: '基础设置'
  })
  private _loop: boolean = true;

  @editable({
    displayName: '预热',
    description: '是否在开始时预热粒子系统',
    type: 'boolean',
    group: '基础设置'
  })
  private _prewarm: boolean = false;

  @editable({
    displayName: '播放速度',
    description: '粒子系统的播放速度',
    type: 'number',
    min: 0.1,
    max: 10,
    step: 0.1,
    group: '基础设置'
  })
  private _playbackSpeed: number = 1.0;

  @editable({
    displayName: '最大粒子数',
    description: '粒子系统中的最大粒子数',
    type: 'number',
    min: 10,
    max: 10000,
    step: 10,
    group: '基础设置'
  })
  private _maxParticles: number = 1000;

  @editable({
    displayName: '启动时播放',
    description: '粒子系统是否在启动时自动播放',
    type: 'boolean',
    group: '基础设置'
  })
  private _playOnAwake: boolean = true;

  @editable({
    displayName: '模拟空间',
    description: '粒子系统的模拟空间',
    type: 'enum',
    options: ['Local', 'World'],
    group: '基础设置'
  })
  private _simulationSpace: string = 'Local';

  @editable({
    displayName: '启用重力',
    description: '粒子是否受重力影响',
    type: 'boolean',
    group: '物理'
  })
  private _useGravity: boolean = false;

  @editable({
    displayName: '重力系数',
    description: '重力对粒子的影响系数',
    type: 'number',
    min: -10,
    max: 10,
    step: 0.1,
    group: '物理',
    showIf: '_useGravity'
  })
  private _gravityModifier: number = 1.0;

  // 内部属性
  private _isPlaying: boolean = false;
  private _isPaused: boolean = false;
  private _time: number = 0;
  private _emissionTime: number = 0;
  private _particles: ParticleData[] = [];
  private _emitter: ParticleEmitter;
  private _renderer: ParticleRenderer;
  private _settings: ParticleSystemSettings;
  private _tslExtension: ParticleSystemTSL | null = null;
  private _autoDestroy: boolean = false; // 是否在完成后自动销毁
  private _isDestroyed: boolean = false; // 是否已被销毁

  // 事件回调
  private _onComplete: (() => void) | null = null;
  private _onProgress: ((progress: number) => void) | null = null;
  private _onDestroyed: (() => void) | null = null;
  private _onReset: (() => void) | null = null;

  // 事件发射器
  private _eventEmitter: EventEmitter = new EventEmitter();

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = '粒子系统') {
    super(name);
    this.setType('ParticleSystem');
    this.addTag('particle');

    // 创建默认设置
    this._settings = new ParticleSystemSettings();

    // 创建发射器和渲染器
    this._emitter = new ParticleEmitter(this._settings);
    this._renderer = new ParticleRenderer(this._settings);

    // 将渲染器的对象添加到节点
    this.getThreeObject().add(this._renderer.getMesh());

    // 如果设置为启动时播放，则自动播放
    if (this._playOnAwake) {
      this.play();
    }
  }

  /**
   * 当节点准备好时调用
   */
  onReady(): void {
    super.onReady();

    // 如果设置为预热，则预热粒子系统
    if (this._prewarm && this._playOnAwake) {
      this.prewarm();
    }
  }

  /**
   * 更新粒子系统
   * @param deltaTime 时间增量
   */
  override update(deltaTime: number): void {
    super.update(deltaTime);

    if (!this._isPlaying || this._isPaused || this._isDestroyed) {
      return;
    }

    // 应用播放速度
    const scaledDeltaTime = deltaTime * this._playbackSpeed;

    // 更新时间
    this._time += scaledDeltaTime;
    this._emissionTime += scaledDeltaTime;

    // 发送进度事件
    const progress = this.getProgress();
    this._eventEmitter.emit(ParticleLifecycleEvent.PROGRESS, progress);
    
    // 触发进度回调
    if (this._onProgress) {
      this._onProgress(progress);
    }

    // 检查是否完成一个循环
    if (this._time >= this._duration) {
      if (this._loop) {
        // 如果循环，重置时间
        this._time = this._time % this._duration;
        
        // 触发循环事件
        this._eventEmitter.emit(ParticleLifecycleEvent.LOOP);
      } else {
        // 如果不循环，停止粒子系统
        this.stop();

        // 调用完成回调
        if (this._onComplete) {
          this._onComplete();
        }
        
        // 触发完成事件
        this._eventEmitter.emit(ParticleLifecycleEvent.COMPLETE);
        
        // 如果设置了自动销毁，则销毁粒子系统
        if (this._autoDestroy) {
          this.destroy(true);
        }

        return;
      }
    }

    // 发射新粒子
    this.emitParticles(scaledDeltaTime);

    // 更新现有粒子
    this.updateParticles(scaledDeltaTime);

    // 更新渲染器
    this._renderer.update(this._particles);

    // 更新TSL扩展
    if (this._tslExtension) {
      this._tslExtension.update(deltaTime);
    }
  }

  /**
   * 发射粒子
   * @param deltaTime 时间增量
   */
  private emitParticles(deltaTime: number): void {
    // 根据发射率计算本帧应该发射的粒子数量
    const emissionRate = this._settings.emission.rateOverTime;
    const particlesToEmit = Math.floor(emissionRate * deltaTime);
    console.log( this._particles,' this._particles')
    if(this._particles.length >= this._settings.maxParticles) return
    // 发射粒子
    for (let i = 0; i < particlesToEmit; i++) {
      // 检查是否达到最大粒子数
      if (this._particles.length >= this._settings.maxParticles) {
        break;
      }

      // 创建新粒子
      const particle = this._emitter.emitParticle();
      
      // 触发粒子生成事件
      this._eventEmitter.emit(ParticleLifecycleEvent.PARTICLE_BORN, particle);

      // 如果在世界空间中模拟，转换粒子位置
      if (this._simulationSpace === 'World') {
        const worldMatrix = this.getThreeObject().matrixWorld;
        particle.position.applyMatrix4(worldMatrix);

        // 转换速度方向
        const direction = new THREE.Vector3().copy(particle.velocity).normalize();
        direction.applyMatrix4(new THREE.Matrix4().extractRotation(worldMatrix));
        particle.velocity.copy(direction.multiplyScalar(particle.velocity.length()));
      }

      // 添加到粒子列表
      this._particles.push(particle);
    }
  }

  /**
   * 更新现有粒子
   * @param deltaTime 时间增量
   */
  private updateParticles(deltaTime: number): void {
    // 重力向量
    const gravity = new THREE.Vector3(0, -9.8 * this._gravityModifier, 0);


    // console.log( this._particles,' this._particles')
    // 更新每个粒子
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const particle = this._particles[i];

      // 更新粒子生命周期
      particle.age += deltaTime;

      // 检查粒子是否已经死亡
      if (particle.age >= particle.lifetime) {
        // 触发粒子死亡事件
        this._eventEmitter.emit(ParticleLifecycleEvent.PARTICLE_DIED, particle);
        
        // 移除死亡粒子
        this._particles.splice(i, 1);
        continue;
      }

      // 计算生命周期比例
      const lifetimeRatio = particle.age / particle.lifetime;

      // 更新粒子大小
      if (this._settings.sizeOverLifetime) {
        const sizeMultiplier = this._settings.sizeOverLifetime.evaluate(lifetimeRatio);
        particle.size = particle.startSize * sizeMultiplier;
      }

      // 更新粒子颜色
      if (this._settings.colorOverLifetime) {
        particle.color.copy(this._settings.colorOverLifetime.evaluate(lifetimeRatio));
      }

      // 更新粒子旋转
      particle.rotation += particle.rotationSpeed * deltaTime;

      // 应用重力
      if (this._useGravity) {
        particle.velocity.add(gravity.clone().multiplyScalar(deltaTime));
      }

      // 更新位置
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
    }
  }

  /**
   * 预热粒子系统
   */
  prewarm(): void {
    // 模拟粒子系统运行一个完整周期
    const simulationSteps = 100; // 模拟步数
    const stepTime = this._duration / simulationSteps;

    // 先清空现有粒子
    this._particles = [];

    // 重置时间
    this._time = 0;
    this._emissionTime = 0;

    // 模拟粒子系统运行
    for (let i = 0; i < simulationSteps; i++) {
      this.emitParticles(stepTime);
      this.updateParticles(stepTime);
      this._time += stepTime;
      this._emissionTime += stepTime;
    }

    // 重置时间
    this._time = 0;
  }

  /**
   * 播放粒子系统
   */
  play(): void {
    const wasPlaying = this._isPlaying;
    const wasPaused = this._isPaused;
    
    this._isPlaying = true;
    this._isPaused = false;

    // 触发相应事件
    if (!wasPlaying) {
      this._eventEmitter.emit(ParticleLifecycleEvent.START);
    } else if (wasPaused) {
      this._eventEmitter.emit(ParticleLifecycleEvent.RESUME);
    }

    // 检查是否需要立即发射粒子
    // 特别是对于永久性粒子效果（如刀光）
    if (this._settings.maxParticles === 1) { // 检测是否为长生命周期粒子
      console.log('检测到永久性粒子效果，立即发射初始粒子');

      // 立即发射一个粒子
      const particle = this._emitter.emitParticle();
      
      // 触发粒子出生事件
      this._eventEmitter.emit(ParticleLifecycleEvent.PARTICLE_BORN, particle);

      // 如果在世界空间中模拟，转换粒子位置
      if (this._simulationSpace === 'World') {
        const worldMatrix = this.getThreeObject().matrixWorld;
        particle.position.applyMatrix4(worldMatrix);

        // 转换速度方向
        const direction = new THREE.Vector3().copy(particle.velocity).normalize();
        direction.applyMatrix4(new THREE.Matrix4().extractRotation(worldMatrix));
        particle.velocity.copy(direction.multiplyScalar(particle.velocity.length()));
      }

      // 添加到粒子列表
      this._particles.push(particle);

      // 立即更新渲染器
      this._renderer.update(this._particles);

      console.log('已立即发射初始粒子，当前粒子数量:', this._particles.length);
    }
  }

  /**
   * 暂停粒子系统
   */
  pause(): void {
    if (this._isPlaying && !this._isPaused) {
      this._isPaused = true;
      
      // 触发暂停事件
      this._eventEmitter.emit(ParticleLifecycleEvent.PAUSE);
    }
  }

  /**
   * 停止粒子系统
   * @param clearParticles 是否清除现有粒子
   */
  stop(clearParticles: boolean = true): void {
    if (this._isPlaying) {
      this._isPlaying = false;
      this._isPaused = false;
      this._time = 0;
      this._emissionTime = 0;

      if (clearParticles) {
        this._particles = [];
        this._renderer.update(this._particles);
      }
      
      // 触发停止事件
      this._eventEmitter.emit(ParticleLifecycleEvent.STOP);
    }
  }

  /**
   * 设置完成回调
   * @param callback 完成回调函数
   */
  onComplete(callback: () => void): void {
    this._onComplete = callback;
    
    // 同时通过事件系统添加一次性监听器
    this.once(ParticleLifecycleEvent.COMPLETE, callback);
  }

  /**
   * 设置粒子系统设置
   * @param settings 粒子系统设置
   */
  setSettings(settings: Partial<ParticleSystemSettings>): void {
    // 合并设置，确保必要属性存在
    if (settings.emission) {
      // 确保 emission 对象有 rateOverTime 属性
      if (!settings.emission.rateOverTime && settings.emission.rateOverTime !== 0) {
        settings.emission.rateOverTime = this._settings.emission.rateOverTime || 10;
      }
      this._settings.emission = { ...this._settings.emission, ...settings.emission };
    }

    // 合并其他设置
    Object.assign(this._settings, settings);

    // 如果设置了duration，则更新内部的_duration
    if (settings.duration !== undefined) {
      this._duration = settings.duration;
    }

    // 如果设置了loop，则更新内部的_loop
    if (settings.loop !== undefined) {
      this._loop = settings.loop;
    }

    // 如果设置了prewarm，则更新内部的_prewarm
    if (settings.prewarm !== undefined) {
      this._prewarm = settings.prewarm;
    }

    // 如果设置了playbackSpeed，则更新内部的_playbackSpeed
    if (settings.playbackSpeed !== undefined) {
      this._playbackSpeed = settings.playbackSpeed;
    }

    // 如果设置了maxParticles，则更新内部的_maxParticles
    if (settings.maxParticles !== undefined) {
      this._maxParticles = settings.maxParticles;
    }

    // 如果设置了playOnAwake，则更新内部的_playOnAwake
    if (settings.playOnAwake !== undefined) {
      this._playOnAwake = settings.playOnAwake;
    }

    // 如果设置了simulationSpace，则更新内部的_simulationSpace
    if (settings.simulationSpace !== undefined) {
      this._simulationSpace = settings.simulationSpace;
    }

    // 如果设置了useGravity，则更新内部的_useGravity
    if (settings.useGravity !== undefined) {
      this._useGravity = settings.useGravity;
    }

    // 如果设置了gravityModifier，则更新内部的_gravityModifier
    if (settings.gravityModifier !== undefined) {
      this._gravityModifier = settings.gravityModifier;
    }

    // 如果设置了autoDestroy，则更新内部的_autoDestroy
    if (settings.autoDestroy !== undefined) {
      this._autoDestroy = settings.autoDestroy;
    }

    // 如果设置了生命周期回调函数，则更新对应的回调
    if (settings.lifecycle) {
      if (settings.lifecycle.onProgress) {
        this.onProgress(settings.lifecycle.onProgress);
      }
      if (settings.lifecycle.onComplete) {
        this.onComplete(settings.lifecycle.onComplete);
      }
      if (settings.lifecycle.onDestroyed) {
        this.onDestroyed(settings.lifecycle.onDestroyed);
      }
      if (settings.lifecycle.onReset) {
        this.onReset(settings.lifecycle.onReset);
      }
    }

    // 更新发射器和渲染器
    console.log('更新粒子系统设置:', {
      renderMode: this._settings.renderer.renderMode,
      emission: this._settings.emission,
      hasMesh: this._settings.renderer.mesh ? true : false
    });

    this._emitter.updateSettings(this._settings);
    this._renderer.updateSettings(this._settings);
  }

  /**
   * 设置自定义网格
   * @param mesh 自定义网格
   */
  setCustomMesh(mesh: THREE.BufferGeometry): void {
    // 确保网格有效
    if (!mesh) {
      console.error('无效的网格几何体');
      return;
    }

    console.log('设置自定义网格:', mesh);
    console.log('网格详情:', {
      vertices: mesh.attributes.position ? mesh.attributes.position.count : 'no position attribute',
      attributes: Object.keys(mesh.attributes),
      uuid: mesh.uuid
    });

    // 设置渲染模式为网格模式
    this._settings.renderer.renderMode = 'Mesh';

    // 设置自定义网格
    this._settings.renderer.mesh = mesh;

    // 确保混合模式正确
    if (!this._settings.renderer.blending) {
      this._settings.renderer.blending = true;
    }

    // 确保发射率足够
    if (!this._settings.emission || this._settings.emission.rateOverTime < 5) {
      if (!this._settings.emission) {
        this._settings.emission = { rateOverTime: 10 };
      } else {
        this._settings.emission.rateOverTime = 10;
      }
    }

    // 重新初始化渲染器
    this._renderer.dispose();
    this._renderer = new ParticleRenderer(this._settings);
    this.getThreeObject().clear();
    this.getThreeObject().add(this._renderer.getMesh());

    console.log('已设置自定义网格，渲染模式为:', this._settings.renderer.renderMode);
    console.log('粒子系统设置:', {
      renderMode: this._settings.renderer.renderMode,
      emission: this._settings.emission,
      startLifetime: this._settings.startLifetime,
      startSpeed: this._settings.startSpeed,
      shape: this._settings.shape
    });

    // 如果粒子系统正在运行，重新启动它
    if (this._isPlaying && !this._isPaused) {
      this.stop();
      this.play();
    }
  }

  /**
   * 获取当前使用的自定义网格
   * @returns 自定义网格几何体
   */
  getCustomMesh(): THREE.BufferGeometry | undefined {
    return this._settings.renderer.mesh;
  }

  /**
   * 设置自定义材质
   * @param material 自定义材质
   */
  setCustomMaterial(material: THREE.Material): void {
    this._settings.renderer.material = material;
    this._renderer.updateSettings(this._settings);
  }

  /**
   * 获取粒子数量
   */
  getParticleCount(): number {
    return this._particles.length;
  }

  /**
   * 获取粒子系统是否正在播放
   */
  isPlaying(): boolean {
    return this._isPlaying && !this._isPaused;
  }

  /**
   * 获取粒子系统是否已暂停
   */
  isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * 获取粒子系统设置
   */
  getSettings(): ParticleSystemSettings {
    return this._settings;
  }

  /**
   * 获取粒子渲染器
   */
  getRenderer(): ParticleRenderer {
    return this._renderer;
  }

  /**
   * 获取TSL扩展
   * 如果不存在，则创建一个新的TSL扩展
   */
  getTSLExtension(): ParticleSystemTSL {
    if (!this._tslExtension) {
      this._tslExtension = new ParticleSystemTSL(this);
    }
    return this._tslExtension;
  }

  /**
   * 设置TSL效果
   * @param params 效果参数
   */
  setTSLEffect(params: ParticleTSLEffectParams): void {
    const tslExtension = this.getTSLExtension();
    tslExtension.setEffect(params);
  }

  /**
   * 设置UV动画效果
   * @param textureMap 纹理贴图
   * @param speedX X方向移动速度
   * @param speedY Y方向移动速度
   * @param scale UV缩放
   */
  setUVAnimationEffect(textureMap: THREE.Texture, speedX = 0.5, speedY = 0.0, scale = 1.0): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.UV_ANIMATION,
      textureMap,
      speedX,
      speedY,
      scale
    });
  }

  /**
   * 设置流动效果
   * @param textureMap 纹理贴图
   * @param flowSpeed 流动速度
   * @param flowDirection 流动方向 (0: X方向, 1: Y方向)
   * @param scale UV缩放
   */
  setFlowEffect(textureMap: THREE.Texture, flowSpeed = 1.0, flowDirection = 0, scale = 1.0): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.FLOW,
      textureMap,
      flowSpeed,
      flowDirection,
      scale
    });
  }

  /**
   * 设置发光效果
   * @param baseColor 基础颜色
   * @param glowColor 发光颜色
   * @param glowIntensity 发光强度
   * @param pulseSpeed 脉冲速度 (0表示不脉冲)
   */
  setGlowEffect(baseColor: THREE.Color, glowColor: THREE.Color, glowIntensity = 1.0, pulseSpeed = 0.0): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.GLOW,
      baseColor,
      glowColor,
      glowIntensity,
      pulseSpeed
    });
  }

  /**
   * 设置爆炸效果
   * @param textureMap 纹理贴图
   * @param centerColor 中心颜色
   * @param edgeColor 边缘颜色
   * @param explosionSpeed 爆炸速度
   */
  setExplosionEffect(textureMap: THREE.Texture, centerColor: THREE.Color, edgeColor: THREE.Color, explosionSpeed = 1.0): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.EXPLOSION,
      textureMap,
      centerColor,
      edgeColor,
      explosionSpeed
    });
  }

  /**
   * 设置内聚效果
   * @param textureMap 纹理贴图
   * @param centerColor 中心颜色
   * @param edgeColor 边缘颜色
   * @param convergenceSpeed 内聚速度
   */
  setConvergenceEffect(textureMap: THREE.Texture, centerColor: THREE.Color, edgeColor: THREE.Color, convergenceSpeed = 1.0): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.CONVERGENCE,
      textureMap,
      centerColor,
      edgeColor,
      convergenceSpeed
    });
  }

  /**
   * 设置旋转UV效果
   * @param textureMap 纹理贴图
   * @param rotationSpeed 旋转速度
   * @param scale UV缩放
   */
  setRotatingUVEffect(textureMap: THREE.Texture, rotationSpeed = 1.0, scale = 1.0): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.ROTATING_UV,
      textureMap,
      rotationSpeed,
      scale
    });
  }

  /**
   * 设置扭曲效果
   * @param textureMap 基础纹理贴图
   * @param distortionMap 扭曲纹理贴图
   * @param distortionStrength 扭曲强度
   * @param distortionSpeed 扭曲速度
   */
  setDistortionEffect(textureMap: THREE.Texture, distortionMap: THREE.Texture, distortionStrength = 0.1, distortionSpeed = 1.0): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.DISTORTION,
      textureMap,
      distortionMap,
      distortionStrength,
      distortionSpeed
    });
  }

  /**
   * 设置溶解效果
   * @param textureMap 基础纹理贴图
   * @param noiseMap 噪声纹理贴图
   * @param dissolveEdgeColor 溶解边缘颜色
   * @param dissolveAmount 溶解量 (0-1)
   * @param edgeWidth 边缘宽度
   */
  setDissolveEffect(textureMap: THREE.Texture, noiseMap: THREE.Texture, dissolveEdgeColor: THREE.Color, dissolveAmount = 0.5, edgeWidth = 0.1): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.DISSOLVE,
      textureMap,
      noiseMap,
      dissolveEdgeColor,
      dissolveAmount,
      edgeWidth
    });
  }

  /**
   * 设置能量波纹效果
   * @param textureMap 基础纹理贴图
   * @param waveColor 波纹颜色
   * @param waveSpeed 波纹速度
   * @param waveFrequency 波纹频率
   * @param waveAmplitude 波纹振幅
   */
  setEnergyWaveEffect(textureMap: THREE.Texture, waveColor: THREE.Color, waveSpeed = 1.0, waveFrequency = 5.0, waveAmplitude = 0.1): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.ENERGY_WAVE,
      textureMap,
      waveColor,
      waveSpeed,
      waveFrequency,
      waveAmplitude
    });
  }

  /**
   * 设置刀光拖尾效果
   * @param textureMap 基础纹理贴图
   * @param trailColor 拖尾颜色
   * @param trailLength 拖尾长度
   * @param trailSpeed 拖尾速度
   */
  setSwordTrailEffect(textureMap: THREE.Texture, trailColor: THREE.Color, trailLength = 0.5, trailSpeed = 1.0): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.SWORD_TRAIL,
      textureMap,
      trailColor,
      trailLength,
      trailSpeed
    });
  }

  /**
   * 设置自定义TSL效果
   * @param customColorNode 自定义颜色节点
   * @param customOpacityNode 自定义透明度节点
   */
  setCustomTSLEffect(customColorNode: any, customOpacityNode?: any): void {
    this.setTSLEffect({
      effectType: ParticleTSLEffectType.CUSTOM,
      customColorNode,
      customOpacityNode
    });
  }

  /**
   * 销毁粒子系统
   * @param immediate 是否立即销毁（包括所有现有粒子）
   */
  destroy(immediate: boolean = true): void {
    // 如果已经销毁，直接返回
    if (this._isDestroyed) {
      return;
    }
    
    // 标记为已销毁
    this._isDestroyed = true;
    
    // 停止粒子系统
    this.stop(immediate);

    // 清理渲染器
    this._renderer.dispose();

    // 清理粒子数组
    this._particles = [];

    // 清理TSL扩展
    this._tslExtension = null;

    // 清理事件系统
    this._eventEmitter.clear();
    this._onComplete = null;
    this._onProgress = null;
    this._onDestroyed = null;
    this._onReset = null;

    // 清理其他资源
    this._isPlaying = false;
    this._isPaused = false;
    this._time = 0;
    this._emissionTime = 0;
    
    // 触发销毁事件
    this._eventEmitter.emit(ParticleLifecycleEvent.DESTROYED);
    
    // 从场景移除自身 - 不直接访问私有属性parent
    this.removeFromParent();
    
    console.log('粒子系统已销毁:', this.name);
  }
  
  /**
   * 从父节点移除自身
   * 这里我们使用公共方法而非直接访问私有属性
   */
  private removeFromParent(): void {
    // 获取当前节点的父节点
    const parentObject = this.getThreeObject().parent;
    
    // 如果有父节点，从父节点移除
    if (parentObject) {
      parentObject.remove(this.getThreeObject());
    }
  }
  
  /**
   * 重置粒子系统
   * 重置时间和所有粒子，但保留设置和事件监听器
   */
  reset(): void {
    // 如果已销毁，无法重置
    if (this._isDestroyed) {
      console.warn('无法重置已销毁的粒子系统');
      return;
    }
    
    // 停止并清除所有粒子
    this.stop(true);
    
    // 重置内部状态
    this._time = 0;
    this._emissionTime = 0;
    this._isDestroyed = false;
    
    // 触发重置事件
    this._eventEmitter.emit(ParticleLifecycleEvent.RESET);
    
    // 调用重置回调
    if (this._onReset) {
      this._onReset();
    }
    
    // 如果设置为启动时播放，则自动播放
    if (this._playOnAwake) {
      this.play();
    }
    
    console.log('粒子系统已重置:', this.name);
  }

  /**
   * 设置是否在完成后自动销毁
   * @param autoDestroy 是否自动销毁
   */
  setAutoDestroy(autoDestroy: boolean): void {
    this._autoDestroy = autoDestroy;
  }
  
  /**
   * 获取是否在完成后自动销毁
   */
  getAutoDestroy(): boolean {
    return this._autoDestroy;
  }
  
  /**
   * 设置进度回调
   * @param callback 进度回调函数，参数为0-1之间的进度值
   */
  onProgress(callback: (progress: number) => void): void {
    this._onProgress = callback;
  }

  /**
   * 设置销毁回调
   * @param callback 销毁回调函数
   */
  onDestroyed(callback: () => void): void {
    this._onDestroyed = callback;
    
    // 同时通过事件系统添加一次性监听器
    this.once(ParticleLifecycleEvent.DESTROYED, callback);
  }
  
  /**
   * 设置重置回调
   * @param callback 重置回调函数
   */
  onReset(callback: () => void): void {
    this._onReset = callback;
    
    // 同时通过事件系统添加一次性监听器
    this.once(ParticleLifecycleEvent.RESET, callback);
  }
  
  /**
   * 检查粒子系统是否已被销毁
   */
  isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param callback 回调函数
   */
  public on(event: ParticleLifecycleEvent, callback: (...args: any[]) => void): void {
    this._eventEmitter.on(event, callback);
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param callback 要移除的回调函数
   */
  public off(event: ParticleLifecycleEvent, callback: (...args: any[]) => void): void {
    this._eventEmitter.off(event, callback);
  }

  /**
   * 添加一次性事件监听器
   * @param event 事件类型
   * @param callback 回调函数
   */
  public once(event: ParticleLifecycleEvent, callback: (...args: any[]) => void): void {
    this._eventEmitter.once(event, callback);
  }

  /**
   * 获取当前进度 (0-1)
   */
  public getProgress(): number {
    return Math.min(this._time / this._duration, 1.0);
  }

  /**
   * 获取当前时间
   */
  public getTime(): number {
    return this._time;
  }

  /**
   * 获取总持续时间
   */
  public getDuration(): number {
    return this._duration;
  }

  /**
   * 设置当前时间
   * @param time 时间
   */
  public setTime(time: number): void {
    this._time = Math.min(Math.max(time, 0), this._duration);
    // 发送进度事件
    this._eventEmitter.emit(ParticleLifecycleEvent.PROGRESS, this.getProgress());
  }

  /**
   * 序列化为JSON
   */
  public override toJSON(): any {
    const json = super.toJSON();
    
    // 只序列化基本设置
    const settings = this.getSettings();
    const particleSystemData = {
      duration: this._duration,
      loop: this._loop,
      prewarm: this._prewarm,
      playbackSpeed: this._playbackSpeed,
      maxParticles: this._maxParticles,
      playOnAwake: this._playOnAwake,
      simulationSpace: this._simulationSpace,
      useGravity: this._useGravity,
      gravityModifier: this._gravityModifier,
      autoDestroy: this._autoDestroy,
      
      // 序列化当前状态
      isPlaying: this._isPlaying,
      isPaused: this._isPaused,
      currentTime: this._time,
      
      // 序列化基本设置
      startLifetime: settings.startLifetime,
      startSpeed: settings.startSpeed,
      startSize: settings.startSize,
      startRotation: settings.startRotation,
      startColor: settings.startColor,
      emission: settings.emission,
      shape: settings.shape,
      sizeOverLifetime: settings.sizeOverLifetime,
      colorOverLifetime: settings.colorOverLifetime
    };

    json.particleSystemData = particleSystemData;
    return json;
  }

  /**
   * 从JSON恢复
   */
  public override fromJSON(json: any): void {
    super.fromJSON(json);

    if (json.particleSystemData) {
      const data = json.particleSystemData;

      // 恢复基本属性
      this._duration = data.duration;
      this._loop = data.loop;
      this._prewarm = data.prewarm;
      this._playbackSpeed = data.playbackSpeed;
      this._maxParticles = data.maxParticles;
      this._playOnAwake = data.playOnAwake;
      this._simulationSpace = data.simulationSpace;
      this._useGravity = data.useGravity;
      this._gravityModifier = data.gravityModifier;
      this._autoDestroy = data.autoDestroy;

      // 恢复当前状态
      this._isPlaying = data.isPlaying;
      this._isPaused = data.isPaused;
      this._time = data.currentTime;

      // 恢复基本设置
      const settings = this.getSettings();
      settings.startLifetime = data.startLifetime;
      settings.startSpeed = data.startSpeed;
      settings.startSize = data.startSize;
      settings.startRotation = data.startRotation;
      settings.startColor = data.startColor;
      settings.emission = data.emission;
      settings.shape = data.shape;
      settings.sizeOverLifetime = data.sizeOverLifetime;
      settings.colorOverLifetime = data.colorOverLifetime;

      // 应用设置
      this.setSettings(settings);

      // 如果之前在播放，则恢复播放
      if (this._isPlaying && !this._isPaused) {
        this.play();
      }
    }
  }
}


