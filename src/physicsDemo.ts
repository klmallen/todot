import { runPhysicsExample } from './engine/examples/physics-example';

/**
 * 物理引擎演示程序入口
 */
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // 运行物理引擎示例
    const engine = await runPhysicsExample();
    
    // 添加说明信息
    addInstructions();
    
    console.log('物理引擎演示启动成功!');
  } catch (error) {
    console.error('物理引擎演示启动失败:', error);
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