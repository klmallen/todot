import { Scene, Object3D } from 'three';
import Engine from '../../../engine/core/Engine';
import { ModelLoader3D } from '../../../engine/core/ModelLoader3D';

/**
 * 角色状态枚举
 */
export enum CharacterStatus {
  IDLE = 'idle',
  ATTACKING = 'attacking',
  DEFENDING = 'defending',
  CASTING = 'casting',
  STUNNED = 'stunned',
  DEAD = 'dead'
}

/**
 * 角色类型枚举
 */
export enum CharacterType {
  PLAYER = 'player',
  ENEMY = 'enemy'
}

/**
 * 角色基本属性接口
 */
export interface CharacterStats {
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
  accuracy: number;
  evasion: number;
}

/**
 * 基础角色类
 */
export class Character {
  private name: string;
  private model: Object3D | null = null;
  private modelLoader: ModelLoader3D | null = null;
  private modelPath: string;
  private stats: CharacterStats;
  private status: CharacterStatus = CharacterStatus.IDLE;
  private actionProgress: number = 0; // 行动进度，达到100时可行动
  private type: CharacterType;
  private position: { x: number, y: number, z: number };
  private skills: any[] = []; // 技能列表，后续会扩展
  
  constructor(
    name: string,
    modelPath: string,
    stats: CharacterStats,
    type: CharacterType,
    position: { x: number, y: number, z: number }
  ) {
    this.name = name;
    this.modelPath = modelPath;
    this.stats = { ...stats };
    this.type = type;
    this.position = { ...position };
  }
  
  /**
   * 加载角色模型
   */
  public async loadModel(engine: Engine): Promise<boolean> {
    try {
      // 获取活动场景
      const scene = engine.getActiveScene();
      if (!scene) return false;
      
      // 创建模型加载器
      this.modelLoader = new ModelLoader3D(this.name + '_model', this.modelPath);
      
      // 设置模型位置
      this.modelLoader.setPosition(
        this.position.x,
        this.position.y,
        this.position.z
      );
      
      // 添加到场景
      scene.addNode(this.modelLoader);
      
      // 等待模型加载完成
      await this.modelLoader.waitForLoad();
      
      // 获取加载的模型
      this.model = this.modelLoader.getModel();
      
      return true;
    } catch (error) {
      console.error(`加载角色模型失败: ${error}`);
      return false;
    }
  }
  
  /**
   * 更新角色行动进度
   * @param deltaTime 时间增量
   */
  public updateActionProgress(deltaTime: number): void {
    if (this.status === CharacterStatus.DEAD) return;
    
    // 根据速度更新行动进度
    this.actionProgress += (this.stats.speed * deltaTime);
    
    // 最大进度为100
    if (this.actionProgress > 100) {
      this.actionProgress = 100;
    }
  }
  
  /**
   * 执行行动后重置进度
   */
  public resetActionProgress(): void {
    this.actionProgress = 0;
  }
  
  /**
   * 获取行动进度
   */
  public getActionProgress(): number {
    return this.actionProgress;
  }
  
  /**
   * 设置行动进度
   */
  public setActionProgress(progress: number): void {
    this.actionProgress = Math.max(0, Math.min(100, progress));
  }
  
  /**
   * 加速行动进度
   */
  public accelerateActionProgress(amount: number): void {
    this.actionProgress += amount;
    if (this.actionProgress > 100) {
      this.actionProgress = 100;
    }
  }
  
  /**
   * 减速行动进度
   */
  public decelerateActionProgress(amount: number): void {
    this.actionProgress -= amount;
    if (this.actionProgress < 0) {
      this.actionProgress = 0;
    }
  }
  
  /**
   * 攻击目标
   */
  public attack(target: Character): number {
    if (this.status === CharacterStatus.DEAD) return 0;
    
    this.status = CharacterStatus.ATTACKING;
    
    // 计算基础伤害
    let damage = this.stats.attack - target.getStats().defense / 2;
    damage = Math.max(1, damage); // 最小伤害为1
    
    // 暴击判定
    const isCrit = Math.random() < this.stats.critRate;
    if (isCrit) {
      damage *= this.stats.critDamage;
    }
    
    // 命中判定
    const hitRoll = Math.random();
    const hitChance = this.stats.accuracy - target.getStats().evasion;
    
    if (hitRoll > hitChance) {
      // 未命中
      damage = 0;
    }
    
    // 造成伤害
    if (damage > 0) {
      target.takeDamage(damage);
    }
    
    // 重置为空闲状态
    this.status = CharacterStatus.IDLE;
    
    return damage;
  }
  
  /**
   * 防御
   */
  public defend(): void {
    if (this.status === CharacterStatus.DEAD) return;
    
    this.status = CharacterStatus.DEFENDING;
    // 提高防御力或添加防御效果，后续实现
  }
  
  /**
   * 受伤
   */
  public takeDamage(damage: number): void {
    if (this.status === CharacterStatus.DEAD) return;
    
    // 如果处于防御状态，减少伤害
    if (this.status === CharacterStatus.DEFENDING) {
      damage = Math.floor(damage * 0.5);
    }
    
    this.stats.hp -= damage;
    
    // 检查是否死亡
    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.status = CharacterStatus.DEAD;
    }
  }
  
  /**
   * 治疗
   */
  public heal(amount: number): void {
    if (this.status === CharacterStatus.DEAD) return;
    
    this.stats.hp += amount;
    
    // 不超过最大生命值
    if (this.stats.hp > this.stats.maxHp) {
      this.stats.hp = this.stats.maxHp;
    }
  }
  
  /**
   * 获取名称
   */
  public getName(): string {
    return this.name;
  }
  
  /**
   * 获取状态
   */
  public getStatus(): CharacterStatus {
    return this.status;
  }
  
  /**
   * 设置状态
   */
  public setStatus(status: CharacterStatus): void {
    this.status = status;
  }
  
  /**
   * 获取类型
   */
  public getType(): CharacterType {
    return this.type;
  }
  
  /**
   * 获取统计数据
   */
  public getStats(): CharacterStats {
    return { ...this.stats };
  }
  
  /**
   * 设置统计数据
   */
  public setStats(stats: Partial<CharacterStats>): void {
    this.stats = { ...this.stats, ...stats };
  }
  
  /**
   * 检查是否可行动
   */
  public canAct(): boolean {
    return this.status !== CharacterStatus.DEAD && this.actionProgress >= 100;
  }
  
  /**
   * 获取位置
   */
  public getPosition(): { x: number, y: number, z: number } {
    return { ...this.position };
  }
  
  /**
   * 设置位置
   */
  public setPosition(position: { x: number, y: number, z: number }): void {
    this.position = { ...position };
    
    if (this.modelLoader) {
      this.modelLoader.setPosition(position.x, position.y, position.z);
    }
  }
  
  /**
   * 获取模型
   */
  public getModel(): Object3D | null {
    return this.model;
  }
  
  /**
   * 获取模型加载器
   */
  public getModelLoader(): ModelLoader3D | null {
    return this.modelLoader;
  }
} 