/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-05 21:37:30
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-06 10:41:51
 * @FilePath: \todot\src\engine\ui\SceneTreePanel.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// src/engine/ui/SceneTreePanel.ts
import { Pane } from 'tweakpane';
import { createEffect } from '@lincode/reactivity';
import { SceneTreePluginBundle } from './plugins/SceneTreePlugin';
import { ButtonGridBladePlugin } from './plugins/button-grid/plugin';
import Engine from '../core/Engine';

/**
 * 场景树面板类 - 用于显示场景节点层次结构
 */
export default class SceneTreePanel {
  private pane: Pane | null = null;
  private container: HTMLElement;
  private disposers: Array<any> = [];

  /**
   * 创建场景树面板
   * @param container 面板容器元素
   */
  constructor(container: HTMLElement) {
    this.container = container;
    this.initTweakpane();
  }

  /**
   * 初始化 Tweakpane
   */
  private initTweakpane() {
    if (this.pane) {
      this.pane.dispose();
    }
    
    this.pane = new Pane({
      container: this.container,
      title: '场景树'
    });
    
    // 注册场景树插件
    this.pane.registerPlugin(SceneTreePluginBundle);
    this.pane.registerPlugin(ButtonGridBladePlugin);
    
    // 获取引擎和场景
    const engine = Engine.getInstance();
    const scenes = engine.getAllScenes();
    
    setTimeout(() => {
      console.log(scenes,'scenes');
            // 添加场景树视图
            this.pane.addBlade({
              view: 'buttongrid',
              title: '场景层级',
              expanded: true,
              selectable: true,
              // 不传递scene参数，让控制器自己去获取所有场景
            });
    },3000)
  }

  /**
   * 销毁面板
   */
  public dispose() {
    if (this.pane) {
      this.pane.dispose();
      this.pane = null;
    }
    
    // 清理监听器
    this.disposers.forEach(disposer => {
      if (typeof disposer === 'function') {
        disposer();
      } else if (disposer && typeof disposer.cancel === 'function') {
        disposer.cancel();
      }
    });
    this.disposers = [];
  }
}