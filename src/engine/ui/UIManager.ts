import Engine from '../core/Engine';
import { SceneResource, GameControl, UITheme, UIConfig } from './types';

interface UITab {
  id: string;
  title: string;
  content: HTMLElement;
  isActive: boolean;
}

export class UIManager {
  private container!: HTMLElement;
  private tabContainer!: HTMLElement;
  private contentContainer!: HTMLElement;
  private tabs: Map<string, UITab>;
  private engine: Engine;
  private theme: UITheme;
  private config: UIConfig;

  constructor(engine: Engine, config: UIConfig = {}) {
    this.engine = engine;
    this.tabs = new Map();
    this.config = {
      position: 'right',
      width: 300,
      ...config
    };
    this.theme = config.theme || {
      backgroundColor: '#1e1e1e',
      textColor: '#e0e0e0',
      borderColor: '#333333',
      hoverColor: '#2d2d2d',
      activeColor: '#3c3c3c'
    };
    this.setupUI();
  }

  private setupUI(): void {
    // 创建主容器
    this.container = document.createElement('div');
    this.container.className = 'ui-manager';
    
    // 创建标签容器
    this.tabContainer = document.createElement('div');
    this.tabContainer.className = 'tab-container';
    
    // 创建内容容器
    this.contentContainer = document.createElement('div');
    this.contentContainer.className = 'content-container';
    
    this.container.appendChild(this.tabContainer);
    this.container.appendChild(this.contentContainer);
    
    // 添加样式
    this.addStyles();

    // 设置位置和宽度
    this.container.style[this.config.position || 'right'] = '0';
    this.container.style.width = `${this.config.width}px`;
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --ui-bg-color: ${this.theme.backgroundColor};
        --ui-text-color: ${this.theme.textColor};
        --ui-border-color: ${this.theme.borderColor};
        --ui-hover-color: ${this.theme.hoverColor};
        --ui-active-color: ${this.theme.activeColor};
      }

      .ui-manager {
        position: fixed;
        top: 0;
        height: 100vh;
        background-color: var(--ui-bg-color);
        color: var(--ui-text-color);
        display: flex;
        flex-direction: column;
        border-left: 1px solid var(--ui-border-color);
        z-index: 1000;
      }

      .tab-container {
        display: flex;
        background-color: var(--ui-bg-color);
        border-bottom: 1px solid var(--ui-border-color);
      }

      .tab {
        padding: 8px 16px;
        cursor: pointer;
        background-color: var(--ui-bg-color);
        border: none;
        color: var(--ui-text-color);
        transition: background-color 0.2s;
      }

      .tab:hover {
        background-color: var(--ui-hover-color);
      }

      .tab.active {
        background-color: var(--ui-active-color);
      }

      .content-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .tab-content {
        display: none;
      }

      .tab-content.active {
        display: block;
      }

      .resource-item {
        display: flex;
        justify-content: space-between;
        padding: 8px;
        border-bottom: 1px solid var(--ui-border-color);
      }

      .control-item {
        margin-bottom: 16px;
      }

      .control-item span {
        display: block;
        margin-bottom: 4px;
      }

      .control-value {
        padding: 8px;
        background-color: var(--ui-hover-color);
      }
    `;
    document.head.appendChild(style);
  }

  public addTab(id: string, title: string, content: HTMLElement): void {
    // 创建标签按钮
    const tabButton = document.createElement('button');
    tabButton.className = 'tab';
    tabButton.textContent = title;
    tabButton.onclick = () => this.activateTab(id);
    
    // 创建标签内容容器
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'tab-content';
    contentWrapper.appendChild(content);
    
    // 存储标签信息
    const tab: UITab = {
      id,
      title,
      content: contentWrapper,
      isActive: false
    };
    
    this.tabs.set(id, tab);
    this.tabContainer.appendChild(tabButton);
    this.contentContainer.appendChild(contentWrapper);
    
    // 如果是第一个标签，或者是指定的初始标签，激活它
    if (this.tabs.size === 1 || id === this.config.initialTab) {
      this.activateTab(id);
    }
  }

  public activateTab(id: string): void {
    // 取消激活所有标签
    this.tabs.forEach((tab, tabId) => {
      const tabButton = this.tabContainer.querySelector(`[data-tab-id="${tabId}"]`);
      const tabContent = tab.content;
      
      if (tabId === id) {
        tabButton?.classList.add('active');
        tabContent.classList.add('active');
        tab.isActive = true;
      } else {
        tabButton?.classList.remove('active');
        tabContent.classList.remove('active');
        tab.isActive = false;
      }
    });
  }

  public mount(): void {
    document.body.appendChild(this.container);
  }

  public unmount(): void {
    document.body.removeChild(this.container);
  }

  public createSceneResourcesTab(): void {
    const content = document.createElement('div');
    content.innerHTML = `
      <h2>场景资源</h2>
      <div class="resource-list"></div>
    `;
    this.addTab('resources', '场景资源', content);
  }

  public createGameControlsTab(): void {
    const content = document.createElement('div');
    content.innerHTML = `
      <h2>游戏控制</h2>
      <div class="controls-container"></div>
    `;
    this.addTab('controls', '游戏控制', content);
  }

  public updateSceneResources(resources: SceneResource[]): void {
    const resourceList = this.container.querySelector('.resource-list');
    if (resourceList) {
      resourceList.innerHTML = resources.map(resource => `
        <div class="resource-item" data-id="${resource.id}">
          <span>${resource.name}</span>
          <span>${resource.type}</span>
        </div>
      `).join('');
    }
  }

  public updateGameControls(controls: GameControl[]): void {
    const controlsContainer = this.container.querySelector('.controls-container');
    if (controlsContainer) {
      controlsContainer.innerHTML = controls.map(control => {
        let controlHtml = `<div class="control-item" data-id="${control.id}">
          <span>${control.name}</span>`;

        switch (control.type) {
          case 'button':
            controlHtml += `<button onclick="(${control.onChange})()">${control.value}</button>`;
            break;
          case 'slider':
            controlHtml += `<input type="range" 
              min="${control.options?.min || 0}" 
              max="${control.options?.max || 100}" 
              step="${control.options?.step || 1}" 
              value="${control.value}"
              onchange="(${control.onChange})(this.value)">`;
            break;
          case 'toggle':
            controlHtml += `<input type="checkbox" 
              ${control.value ? 'checked' : ''} 
              onchange="(${control.onChange})(this.checked)">`;
            break;
          case 'select':
            controlHtml += `<select onchange="(${control.onChange})(this.value)">
              ${control.options?.choices?.map(choice => 
                `<option value="${choice}" ${choice === control.value ? 'selected' : ''}>${choice}</option>`
              ).join('')}
            </select>`;
            break;
        }

        controlHtml += '</div>';
        return controlHtml;
      }).join('');
    }
  }
} 