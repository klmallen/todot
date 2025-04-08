/**
 * 渲染所有激活的场景
 */
public render(): void {
  const activeScenes = this.engine.getActiveScenes();
  
  // 清除画布
  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  
  // 渲染每个激活的场景
  for (const scene of activeScenes) {
    // 更新场景中的相机
    scene.camera.update();
    
    // 渲染场景中的所有对象
    for (const object of scene.objects) {
      if (object.mesh && object.material) {
        // 设置着色器程序
        this.gl.useProgram(object.material.shaderProgram);
        
        // 设置变换矩阵
        const modelMatrix = object.transform.getMatrix();
        const viewMatrix = scene.camera.getViewMatrix();
        const projectionMatrix = scene.camera.getProjectionMatrix();
        
        // 设置uniform变量
        object.material.setUniform('uModelMatrix', modelMatrix);
        object.material.setUniform('uViewMatrix', viewMatrix);
        object.material.setUniform('uProjectionMatrix', projectionMatrix);
        
        // 渲染网格
        object.mesh.render();
      }
    }
  }
} 