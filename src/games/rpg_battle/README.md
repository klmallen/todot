# RPG回合制战斗系统

这是一个类似"33号远征队"的回合制魂类游戏战斗系统，具有速度条、反应机制等特性。

## 功能特点

- 回合制战斗机制，类似阴阳师的出手顺序系统
- 基于速度属性的行动条系统
- 攻击和被攻击时有反应机制（格挡/要害攻击）
- 4人小队对战BOSS

## 场景导出功能

游戏提供了场景导出功能，可以将当前战斗场景的状态导出为JSON格式，方便保存、分享或分析。

### 使用方法

1. **通过UI按钮导出**：
   - 游戏界面右上角有"导出场景数据"按钮
   - 点击按钮后会下载一个JSON文件，包含所有场景的数据

2. **通过代码导出**：
   ```typescript
   // 创建场景导出器
   const sceneExporter = new SceneExporter(engine);
   
   // 导出所有场景数据为JSON对象
   const scenesData = sceneExporter.exportAllScenes();
   
   // 导出为JSON字符串（格式化）
   const jsonString = sceneExporter.exportAllScenesAsString(true);
   
   // 下载为JSON文件
   sceneExporter.downloadScenesAsJSON("my_battle_scene.json");
   ```

### 导出的数据结构

导出的JSON文件包含以下内容：

```json
{
  "version": "1.0.0",
  "timestamp": "2023-07-19T10:15:30.123Z",
  "scenes": {
    "BattleScene": {
      // 场景详细数据
      "name": "BattleScene",
      "nodes": [
        // 场景中的所有节点
      ],
      "settings": {
        // 场景设置
      }
    }
  },
  "activeScenes": ["BattleScene"]
}
```

### 使用场景

- 保存游戏进度
- 调试和分析战斗场景
- 分享战斗配置
- 生成随机战斗场景后导出保存

## 扩展开发

如需扩展导出功能，可以修改以下文件：

- `src/engine/core/Engine.ts` - 引擎核心导出方法
- `src/games/rpg_battle/utils/SceneExporter.ts` - 场景导出工具类
- `src/games/rpg_battle/main.ts` - 导出按钮的集成 