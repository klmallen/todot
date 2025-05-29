import Engine from '../../../engine/core/Engine';

/**
 * 场景导出工具类
 * 提供各种方法来导出战斗场景数据
 */
export class SceneExporter {
  private engine: Engine;

  /**
   * 构造函数
   * @param engine 引擎实例
   */
  constructor(engine: Engine) {
    this.engine = engine;
  }

  /**
   * 导出当前所有场景数据
   * @returns 包含所有场景数据的JSON对象
   */
  public exportAllScenes(): any {
    return this.engine.exportAllScenesJSON();
  }

  /**
   * 导出当前所有场景数据为JSON字符串
   * @param prettyPrint 是否美化JSON格式，默认为true
   * @returns JSON字符串
   */
  public exportAllScenesAsString(prettyPrint: boolean = true): string {
    return this.engine.exportAllScenesJSONString(prettyPrint);
  }

  /**
   * 将所有场景数据下载为JSON文件
   * @param filename 文件名，默认为"rpg_battle_scenes.json"
   */
  public downloadScenesAsJSON(filename: string = "rpg_battle_scenes.json"): void {
    this.engine.downloadAllScenesJSON(filename);
  }

  /**
   * 创建导出按钮并添加到DOM
   * @param container 父容器元素
   * @param position 按钮位置，可选
   * @returns 创建的按钮元素
   */
  public createExportButton(
    container: HTMLElement,
    position?: { top?: string; right?: string; bottom?: string; left?: string }
  ): HTMLButtonElement {
    // 创建按钮
    const button = document.createElement('button');
    button.innerText = '导出场景数据';
    button.title = '将当前所有场景数据导出为JSON文件';
    
    // 设置样式
    const buttonStyle = button.style;
    buttonStyle.position = 'absolute';
    buttonStyle.padding = '8px 12px';
    buttonStyle.backgroundColor = '#4a90e2';
    buttonStyle.color = 'white';
    buttonStyle.border = 'none';
    buttonStyle.borderRadius = '4px';
    buttonStyle.cursor = 'pointer';
    buttonStyle.fontWeight = 'bold';
    buttonStyle.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    buttonStyle.zIndex = '1000';
    
    // 设置位置
    if (position) {
      if (position.top) buttonStyle.top = position.top;
      if (position.right) buttonStyle.right = position.right;
      if (position.bottom) buttonStyle.bottom = position.bottom;
      if (position.left) buttonStyle.left = position.left;
    } else {
      // 默认位置：右上角
      buttonStyle.top = '10px';
      buttonStyle.right = '10px';
    }
    
    // 添加悬停效果
    button.onmouseover = () => {
      buttonStyle.backgroundColor = '#357ae8';
    };
    
    button.onmouseout = () => {
      buttonStyle.backgroundColor = '#4a90e2';
    };
    
    // 点击事件
    button.onclick = () => {
      this.downloadScenesAsJSON();
    };
    
    // 添加到容器
    container.appendChild(button);
    
    return button;
  }
} 