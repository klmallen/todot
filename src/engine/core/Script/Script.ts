import { Node3d } from '../Node3d';
import { v4 as uuidv4 } from 'uuid';

export abstract class Script {
  protected gameObject: Node3d | null = null;
  protected enabled: boolean = true;
  protected id: string;
  private node: Node3d | null = null;

  constructor(params?: any) {
    this.id = uuidv4();
  }

  /**
   * 当脚本被附加到节点时调用
   * @param node 附加到的节点
   */
  public onAttach(node: Node3d): void {
    this.node = node;
    // 子类可以覆盖这个方法
  }

  /**
   * 当脚本从节点上分离时调用
   */
  public onDetach(): void {
    this.node = null;
    // 子类可以覆盖这个方法
  }

 



  /**
   * 当节点进入活跃场景时调用
   * 每次场景被激活时都会调用
   */
  public onEnterScene(): void {
    // 子类可以覆盖这个方法
  }

  /**
   * 当节点离开活跃场景时调用
   * 每次场景被停用时都会调用
   */
  public onExitScene(): void {
    // 子类可以覆盖这个方法
  }

  /**
   * 每帧更新时调用
   * @param deltaTime 距离上一帧的时间间隔（秒）
   */
  public update(deltaTime: number): void {
    // 子类可以覆盖这个方法
  }

  /**
   * 获取脚本ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * 获取脚本所附加的节点
   */
  public getNode(): Node3d | null {
    return this.node;
  }

  /**
   * 检查脚本是否启用
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 设置脚本启用状态
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // 生命周期方法
  abstract onStart(): void;  // 脚本首次启动时调用

   /**
   * 当节点加入场景树时调用（无论场景是否激活）
   * 此时可以进行初始化操作
   */
   abstract onReady(): void {
    // 子类可以覆盖这个方法
  }
  
  // 可选的生命周期方法
  onDestroy(): void {}  // 脚本被销毁时调用
  onEnable(): void {}   // 脚本被启用时调用
  onDisable(): void {}  // 脚本被禁用时调用
} 