import { Character } from './Character';

/**
 * 行动时间条系统 - 控制角色行动顺序
 */
export class ActionTimeBar {
  private characters: Character[] = [];
  private activeCharacter: Character | null = null;
  private speedMultiplier: number = 1.0; // 全局速度倍率
  
  /**
   * 构造函数
   */
  constructor() {
    // 初始化
  }
  
  /**
   * 添加角色到速度条
   */
  public addCharacter(character: Character): void {
    if (!this.characters.includes(character)) {
      this.characters.push(character);
      // 随机初始化进度，避免所有角色同时行动
      character.setActionProgress(Math.random() * 20);
    }
  }
  
  /**
   * 移除角色
   */
  public removeCharacter(character: Character): void {
    const index = this.characters.indexOf(character);
    if (index !== -1) {
      this.characters.splice(index, 1);
      if (this.activeCharacter === character) {
        this.activeCharacter = null;
      }
    }
  }
  
  /**
   * 更新速度条
   */
  public update(deltaTime: number): void {
    // 如果当前有活动角色，不更新速度条
    if (this.activeCharacter) return;
    
    // 更新所有角色的行动进度
    for (const character of this.characters) {
      character.updateActionProgress(deltaTime * this.speedMultiplier);
    }
    
    // 找出行动进度最高且可行动的角色
    let highestProgress = 0;
    let nextCharacter: Character | null = null;
    
    for (const character of this.characters) {
      if (character.canAct() && character.getActionProgress() > highestProgress) {
        highestProgress = character.getActionProgress();
        nextCharacter = character;
      }
    }
    
    if (nextCharacter) {
      this.activeCharacter = nextCharacter;
    }
  }
  
  /**
   * 完成当前角色行动
   */
  public finishCurrentAction(): void {
    if (this.activeCharacter) {
      this.activeCharacter.resetActionProgress();
      this.activeCharacter = null;
    }
  }
  
  /**
   * 获取当前活动角色
   */
  public getActiveCharacter(): Character | null {
    return this.activeCharacter;
  }
  
  /**
   * 获取所有角色及其行动进度
   */
  public getCharactersProgress(): Array<{ character: Character; progress: number }> {
    return this.characters.map(character => ({
      character,
      progress: character.getActionProgress()
    })).sort((a, b) => b.progress - a.progress); // 按进度从高到低排序
  }
  
  /**
   * 设置全局速度倍率
   */
  public setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.1, multiplier);
  }
  
  /**
   * 获取全局速度倍率
   */
  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }
  
  /**
   * 加速特定角色
   */
  public accelerateCharacter(character: Character, amount: number): void {
    character.accelerateActionProgress(amount);
  }
  
  /**
   * 减速特定角色
   */
  public decelerateCharacter(character: Character, amount: number): void {
    character.decelerateActionProgress(amount);
  }
  
  /**
   * 获取下一个行动角色（预测）
   */
  public getNextCharacter(): Character | null {
    let highestProgress = 0;
    let nextCharacter: Character | null = null;
    
    for (const character of this.characters) {
      if (!character.canAct() && character.getActionProgress() > highestProgress) {
        highestProgress = character.getActionProgress();
        nextCharacter = character;
      }
    }
    
    return nextCharacter;
  }
  
  /**
   * 获取行动顺序预测
   * 返回按预计行动顺序排列的角色列表
   */
  public getActionOrder(): Character[] {
    // 创建角色和进度的副本用于模拟
    const progressMap = new Map<Character, number>();
    this.characters.forEach(character => {
      progressMap.set(character, character.getActionProgress());
    });
    
    // 模拟得到行动顺序
    const actionOrder: Character[] = [];
    const remainingChars = [...this.characters];
    
    while (actionOrder.length < this.characters.length) {
      let highestProgress = 0;
      let nextChar: Character | null = null;
      let nextCharIndex = -1;
      
      for (let i = 0; i < remainingChars.length; i++) {
        const char = remainingChars[i];
        const progress = progressMap.get(char) || 0;
        
        if (progress > highestProgress) {
          highestProgress = progress;
          nextChar = char;
          nextCharIndex = i;
        }
      }
      
      if (nextChar && nextCharIndex !== -1) {
        actionOrder.push(nextChar);
        remainingChars.splice(nextCharIndex, 1);
      } else {
        break; // 安全检查
      }
    }
    
    return actionOrder;
  }
} 