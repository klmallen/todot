import Engine from '../../../engine/core/Engine';
import { Character, CharacterType, CharacterStatus } from './Character';
import { ActionTimeBar } from './ActionTimeBar';

/**
 * 战斗状态枚举
 */
export enum BattleState {
  INIT = 'init',            // 初始化
  WAITING = 'waiting',      // 等待下一个角色行动
  ACTION_SELECT = 'select', // 选择行动
  EXECUTING = 'executing',  // 执行行动
  REACTION = 'reaction',    // 反应机制（格挡/要害）
  RESULT = 'result',        // 结算结果
  VICTORY = 'victory',      // 胜利
  DEFEAT = 'defeat',        // 失败
  ENDED = 'ended'           // 战斗结束
}

/**
 * 行动类型枚举
 */
export enum ActionType {
  ATTACK = 'attack',   // 普通攻击
  SKILL = 'skill',     // 技能
  DEFEND = 'defend',   // 防御
  ITEM = 'item',       // 使用物品
  FLEE = 'flee'        // 逃跑
}

/**
 * 反应类型枚举
 */
export enum ReactionType {
  NONE = 'none',       // 无反应
  BLOCK = 'block',     // 格挡
  COUNTER = 'counter', // 反击
  CRITICAL = 'critical' // 要害攻击
}

/**
 * 战斗结果类型枚举
 */
export enum BattleResultType {
  DAMAGE = 'damage',   // 伤害
  HEAL = 'heal',       // 治疗
  MISS = 'miss',       // 未命中
  BUFF = 'buff',       // 增益效果
  DEBUFF = 'debuff'    // 减益效果
}

/**
 * 战斗结果接口
 */
export interface BattleResult {
  type: BattleResultType;
  value: number;
  isCritical?: boolean;
  isBlocked?: boolean;
  isCountered?: boolean;
}

/**
 * 战斗系统类
 */
export class BattleSystem {
  private engine: Engine;
  private playerTeam: Character[] = [];
  private enemyTeam: Character[] = [];
  private actionTimeBar: ActionTimeBar;
  private battleState: BattleState = BattleState.INIT;
  private currentAction: ActionType | null = null;
  private currentTarget: Character | null = null;
  private currentResult: BattleResult | null = null;
  private reactionTimeoutMs: number = 500; // 反应时间窗口（毫秒）
  private reactionTimer: number = 0;
  private onStateChangeCallback: ((state: BattleState) => void) | null = null;
  private onReactionPromptCallback: ((type: ReactionType) => void) | null = null;
  
  /**
   * 构造函数
   */
  constructor(engine: Engine) {
    this.engine = engine;
    this.actionTimeBar = new ActionTimeBar();
  }
  
  /**
   * 初始化战斗
   */
  public async initBattle(
    playerTeam: Character[], 
    enemyTeam: Character[]
  ): Promise<boolean> {
    try {
      this.playerTeam = [...playerTeam];
      this.enemyTeam = [...enemyTeam];
      
      // 重置速度条
      this.actionTimeBar = new ActionTimeBar();
      
      // 将所有角色添加到速度条
      [...playerTeam, ...enemyTeam].forEach(character => {
        this.actionTimeBar.addCharacter(character);
      });
      
      // 加载所有角色模型
      for (const character of [...playerTeam, ...enemyTeam]) {
        await character.loadModel(this.engine);
      }
      
      // 设置战斗状态为等待
      this.setBattleState(BattleState.WAITING);
      
      return true;
    } catch (error) {
      console.error('初始化战斗失败:', error);
      return false;
    }
  }
  
  /**
   * 更新战斗系统
   */
  public update(deltaTime: number): void {
    switch (this.battleState) {
      case BattleState.WAITING:
        // 更新速度条
        this.actionTimeBar.update(deltaTime);
        
        // 检查是否有角色可以行动
        const activeCharacter = this.actionTimeBar.getActiveCharacter();
        if (activeCharacter) {
          // 根据角色类型决定下一步
          if (activeCharacter.getType() === CharacterType.PLAYER) {
            // 玩家角色，等待玩家选择行动
            this.setBattleState(BattleState.ACTION_SELECT);
          } else {
            // 敌方角色，AI决定行动
            this.executeAIAction(activeCharacter);
          }
        }
        break;
        
      case BattleState.REACTION:
        // 更新反应时间窗口
        this.reactionTimer -= deltaTime * 1000; // 转换为毫秒
        
        // 如果反应时间结束，进入结果阶段
        if (this.reactionTimer <= 0) {
          this.setBattleState(BattleState.RESULT);
        }
        break;
        
      case BattleState.EXECUTING:
      case BattleState.RESULT:
      case BattleState.ACTION_SELECT:
        // 这些状态不需要在update中处理
        break;
        
      case BattleState.VICTORY:
      case BattleState.DEFEAT:
        // 战斗结束状态
        break;
    }
    
    // 检查战斗是否结束
    this.checkBattleEnd();
  }
  
  /**
   * 设置战斗状态
   */
  private setBattleState(state: BattleState): void {
    this.battleState = state;
    
    // 调用状态改变回调
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
    
    // 如果进入反应状态，开始反应计时器
    if (state === BattleState.REACTION) {
      this.reactionTimer = this.reactionTimeoutMs;
      
      // 随机决定反应类型（实际游戏中应基于当前行动和角色属性）
      const reactionType = Math.random() < 0.5 ? ReactionType.BLOCK : ReactionType.CRITICAL;
      
      // 调用反应提示回调
      if (this.onReactionPromptCallback) {
        this.onReactionPromptCallback(reactionType);
      }
    }
  }
  
  /**
   * 执行AI行动
   */
  private executeAIAction(character: Character): void {
    // 设置为执行状态
    this.setBattleState(BattleState.EXECUTING);
    
    // 简单AI：随机选择一个玩家角色攻击
    const availableTargets = this.playerTeam.filter(
      player => player.getStatus() !== CharacterStatus.DEAD
    );
    
    if (availableTargets.length === 0) {
      // 没有可攻击的目标，跳过回合
      this.actionTimeBar.finishCurrentAction();
      this.setBattleState(BattleState.WAITING);
      return;
    }
    
    // 随机选择目标
    const targetIndex = Math.floor(Math.random() * availableTargets.length);
    const target = availableTargets[targetIndex];
    
    // 执行攻击
    this.currentAction = ActionType.ATTACK;
    this.currentTarget = target;
    
    // 进入反应阶段（玩家可以尝试格挡/反击）
    this.setBattleState(BattleState.REACTION);
  }
  
  /**
   * 执行玩家选择的行动
   */
  public executePlayerAction(action: ActionType, target?: Character): void {
    // 获取当前活动角色
    const activeCharacter = this.actionTimeBar.getActiveCharacter();
    
    if (!activeCharacter || activeCharacter.getType() !== CharacterType.PLAYER) {
      console.error('无效操作：当前不是玩家角色的回合');
      return;
    }
    
    // 保存当前行动和目标
    this.currentAction = action;
    this.currentTarget = target || null;
    
    // 根据行动类型执行不同操作
    switch (action) {
      case ActionType.ATTACK:
        if (!target) {
          console.error('攻击行动需要指定目标');
          return;
        }
        
        // 设置为执行状态
        this.setBattleState(BattleState.EXECUTING);
        
        // 如果目标是敌人，敌人可能会有反应（格挡/反击）
        if (target.getType() === CharacterType.ENEMY) {
          // 进入反应阶段（敌人可能会反应）
          this.setBattleState(BattleState.REACTION);
        } else {
          // 直接进入结果阶段
          this.executeAttack(activeCharacter, target);
          this.setBattleState(BattleState.RESULT);
        }
        break;
        
      case ActionType.DEFEND:
        // 执行防御
        activeCharacter.defend();
        
        // 完成当前行动
        this.actionTimeBar.finishCurrentAction();
        
        // 返回等待状态
        this.setBattleState(BattleState.WAITING);
        break;
        
      // 其他行动类型（待实现）
      default:
        console.error('未实现的行动类型:', action);
        break;
    }
  }
  
  /**
   * 处理玩家反应
   */
  public handlePlayerReaction(reactionType: ReactionType): void {
    if (this.battleState !== BattleState.REACTION) {
      console.error('无效操作：当前不是反应阶段');
      return;
    }
    
    const activeCharacter = this.actionTimeBar.getActiveCharacter();
    if (!activeCharacter) return;
    
    const isPlayerTurn = activeCharacter.getType() === CharacterType.PLAYER;
    
    // 处理反应逻辑
    if (isPlayerTurn && this.currentTarget) {
      // 玩家攻击，敌人反应
      switch (reactionType) {
        case ReactionType.BLOCK:
          // 敌人尝试格挡
          // 这里可以添加成功率判定
          const blockSuccess = Math.random() < 0.7; // 70%成功率
          if (blockSuccess) {
            // 格挡成功，减少伤害
            this.currentTarget.setStatus(CharacterStatus.DEFENDING);
          }
          break;
          
        case ReactionType.COUNTER:
          // 敌人尝试反击
          // 这里可以添加成功率判定
          const counterSuccess = Math.random() < 0.3; // 30%成功率
          if (counterSuccess) {
            // 反击成功，敌人攻击玩家
            // TODO: 实现反击逻辑
          }
          break;
      }
      
      // 执行攻击
      this.executeAttack(activeCharacter, this.currentTarget);
    } else if (!isPlayerTurn && this.currentTarget) {
      // 敌人攻击，玩家反应
      switch (reactionType) {
        case ReactionType.BLOCK:
          // 玩家尝试格挡
          // 这里可以添加成功率判定
          const blockSuccess = Math.random() < 0.7; // 70%成功率
          if (blockSuccess) {
            // 格挡成功，减少伤害
            this.currentTarget.setStatus(CharacterStatus.DEFENDING);
          }
          break;
          
        case ReactionType.COUNTER:
          // 玩家尝试反击
          // 这里可以添加成功率判定
          const counterSuccess = Math.random() < 0.3; // 30%成功率
          if (counterSuccess) {
            // 反击成功，玩家攻击敌人
            // TODO: 实现反击逻辑
          }
          break;
      }
      
      // 执行敌人的攻击
      this.executeAttack(activeCharacter, this.currentTarget);
    }
    
    // 进入结果阶段
    this.setBattleState(BattleState.RESULT);
  }
  
  /**
   * 执行攻击
   */
  private executeAttack(attacker: Character, target: Character): void {
    // 执行攻击并获取伤害
    const damage = attacker.attack(target);
    
    // 记录战斗结果
    this.currentResult = {
      type: damage > 0 ? BattleResultType.DAMAGE : BattleResultType.MISS,
      value: damage,
      isBlocked: target.getStatus() === CharacterStatus.DEFENDING
    };
    
    // 如果目标处于防御状态，攻击后恢复为空闲状态
    if (target.getStatus() === CharacterStatus.DEFENDING) {
      target.setStatus(CharacterStatus.IDLE);
    }
  }
  
  /**
   * 结束当前回合
   */
  public endCurrentTurn(): void {
    if (this.battleState === BattleState.RESULT) {
      // 重置当前行动和目标
      this.currentAction = null;
      this.currentTarget = null;
      this.currentResult = null;
      
      // 完成当前行动
      this.actionTimeBar.finishCurrentAction();
      
      // 返回等待状态
      this.setBattleState(BattleState.WAITING);
    }
  }
  
  /**
   * 检查战斗是否结束
   */
  private checkBattleEnd(): void {
    // 检查玩家团队是否全灭
    const isPlayerTeamDefeated = this.playerTeam.every(
      player => player.getStatus() === CharacterStatus.DEAD
    );
    
    // 检查敌方团队是否全灭
    const isEnemyTeamDefeated = this.enemyTeam.every(
      enemy => enemy.getStatus() === CharacterStatus.DEAD
    );
    
    if (isPlayerTeamDefeated) {
      this.setBattleState(BattleState.DEFEAT);
    } else if (isEnemyTeamDefeated) {
      this.setBattleState(BattleState.VICTORY);
    }
  }
  
  /**
   * 获取玩家团队
   */
  public getPlayerTeam(): Character[] {
    return [...this.playerTeam];
  }
  
  /**
   * 获取敌方团队
   */
  public getEnemyTeam(): Character[] {
    return [...this.enemyTeam];
  }
  
  /**
   * 获取当前战斗状态
   */
  public getBattleState(): BattleState {
    return this.battleState;
  }
  
  /**
   * 获取速度条系统
   */
  public getActionTimeBar(): ActionTimeBar {
    return this.actionTimeBar;
  }
  
  /**
   * 获取当前战斗结果
   */
  public getCurrentResult(): BattleResult | null {
    return this.currentResult;
  }
  
  /**
   * 设置状态变化回调
   */
  public setOnStateChangeCallback(callback: (state: BattleState) => void): void {
    this.onStateChangeCallback = callback;
  }
  
  /**
   * 设置反应提示回调
   */
  public setOnReactionPromptCallback(callback: (type: ReactionType) => void): void {
    this.onReactionPromptCallback = callback;
  }
  
  /**
   * 设置反应时间窗口（毫秒）
   */
  public setReactionTimeoutMs(timeoutMs: number): void {
    this.reactionTimeoutMs = Math.max(100, timeoutMs);
  }
} 