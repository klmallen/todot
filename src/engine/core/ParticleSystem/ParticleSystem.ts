import * as THREE from 'three';
import { Node3d } from '../Node3d';
import { editable, editableComponent } from '../decorators';
import { ParticleEmitter } from './ParticleEmitter';
import { ParticleRenderer } from './ParticleRenderer';
import { ParticleSystemSettings } from './ParticleSystemSettings';
import { ParticleData } from './ParticleData';

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
  private _duration: number = 5.0;

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

  // 事件回调
  private _onComplete: (() => void) | null = null;

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
  update(deltaTime: number): void {
    super.update(deltaTime);

    if (!this._isPlaying || this._isPaused) {
      return;
    }

    // 应用播放速度
    const scaledDeltaTime = deltaTime * this._playbackSpeed;

    // 更新时间
    this._time += scaledDeltaTime;
    this._emissionTime += scaledDeltaTime;

    // 检查是否完成一个循环
    if (this._time >= this._duration) {
      if (this._loop) {
        // 如果循环，重置时间
        this._time = this._time % this._duration;
      } else {
        // 如果不循环，停止粒子系统
        this.stop();

        // 调用完成回调
        if (this._onComplete) {
          this._onComplete();
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
  }

  /**
   * 发射粒子
   * @param deltaTime 时间增量
   */
  private emitParticles(deltaTime: number): void {
    // 根据发射率计算本帧应该发射的粒子数量
    const emissionRate = this._settings.emission.rateOverTime;
    const particlesToEmit = Math.floor(emissionRate * deltaTime);

    // 发射粒子
    for (let i = 0; i < particlesToEmit; i++) {
      // 检查是否达到最大粒子数
      if (this._particles.length >= this._maxParticles) {
        break;
      }

      // 创建新粒子
      const particle = this._emitter.emitParticle();

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

    // 更新每个粒子
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const particle = this._particles[i];

      // 更新粒子生命周期
      particle.age += deltaTime;

      // 检查粒子是否已经死亡
      if (particle.age >= particle.lifetime) {
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
    this._isPlaying = true;
    this._isPaused = false;
  }

  /**
   * 暂停粒子系统
   */
  pause(): void {
    this._isPaused = true;
  }

  /**
   * 停止粒子系统
   * @param clearParticles 是否清除现有粒子
   */
  stop(clearParticles: boolean = true): void {
    this._isPlaying = false;
    this._isPaused = false;
    this._time = 0;
    this._emissionTime = 0;

    if (clearParticles) {
      this._particles = [];
      this._renderer.update(this._particles);
    }
  }

  /**
   * 设置完成回调
   * @param callback 完成回调函数
   */
  onComplete(callback: () => void): void {
    this._onComplete = callback;
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
   * 销毁粒子系统
   */
  destroy(): void {
    // 停止粒子系统
    this.stop();

    // 清理渲染器
    this._renderer.dispose();

    // 清理粒子数组
    this._particles = [];

    // 清理其他资源
    this._isPlaying = false;
    this._isPaused = false;
    this._time = 0;
    this._emissionTime = 0;

    // 清理事件监听器
    // 注意：父类 Node3d 没有 destroy 方法，所以不调用 super.destroy()
  }
}
