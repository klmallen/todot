/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-13 15:03:10
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-04-14 11:38:01
 * @FilePath: \todot\src\physicsDemo.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { runPhysicsExample } from './engine/examples/physics-example';

/**
 * 物理引擎演示程序入口
 */
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100vh';
    canvas.style.display = 'block';
    document.body.appendChild(canvas);
    
    // 添加说明信息
    addInstructions();
    
    // 运行物理引擎示例 (使用await处理返回的Promise)
    const engine = await runPhysicsExample(canvas);
    
    console.log('物理引擎演示启动成功!', engine);
  } catch (error) {
    console.error('物理引擎演示启动失败:', error);
    alert(`启动失败: ${error.message}`);
  }
});

/**
 * 添加说明信息
 */
function addInstructions() {
  // 创建说明面板
  const instructions = document.createElement('div');
  instructions.style.position = 'absolute';
  instructions.style.top = '20px';
  instructions.style.left = '20px';
  instructions.style.padding = '15px';
  instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  instructions.style.color = 'white';
  instructions.style.fontFamily = 'Arial, sans-serif';
  instructions.style.fontSize = '14px';
  instructions.style.borderRadius = '5px';
  instructions.style.maxWidth = '300px';
  instructions.style.zIndex = '1000';
  
  // 添加说明内容
  instructions.innerHTML = `
    <h2 style="margin-top: 0; color: #4CAF50;">CANNON-ES 物理引擎演示</h2>
    <p>这个示例展示了如何使用CANNON-ES物理引擎与Three.js集成。</p>
    <ul>
      <li>绿色线框显示了物体的碰撞边界</li>
      <li>物体受重力影响并互相碰撞</li>
      <li>点击"掉落新物体"按钮添加更多物体</li>
      <li>使用鼠标拖动来旋转视图</li>
      <li>使用鼠标滚轮缩放视图</li>
    </ul>
    <p style="font-size: 12px; color: #aaa;">按ESC键隐藏此说明</p>
  `;
  
  // 添加到文档
  document.body.appendChild(instructions);
  
  // 添加ESC键监听器
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
    }
  });
} 