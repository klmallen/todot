import * as THREE from 'three';
import Engine from '../core/Engine';
import { Scene } from '../core/Scene';
import { Node3d } from '../core/Node3d';
import { CameraNode3D } from '../core/CameraNode3D';
import { ParticleSystem } from '../core/ParticleSystem/ParticleSystem';
import { ParticleSystemSettings } from '../core/ParticleSystem/ParticleSystemSettings';
import { MinMaxCurve } from '../core/ParticleSystem/Curves/MinMaxCurve';
import { ColorCurve } from '../core/ParticleSystem/Curves/ColorCurve';
import { GradientCurve } from '../core/ParticleSystem/Curves/GradientCurve';
import { ModelLoader3D } from '../core/ModelLoader3D';

/**
 * TSL溶解效果示例
 * 展示如何使用Three.js Shading Language (TSL)创建溶解效果
 * 
 * 注意：这个示例使用了自定义着色器，模拟TSL的使用方式
 */
export async function runTSLDissolveExample(): Promise<Engine> {
  console.log('开始运行TSL溶解效果示例');
  
  // 创建引擎实例
  const engine = await new Engine().init({
    showDefaultUI: true,
    showHelpers: true,
    addDefaultLights: true,
    useWebGPU: true // 使用WebGL以确保着色器兼容性
  });

  // 创建场景
  const sceneName = `TSL溶解效果示例_${Date.now()}`;
  const scene = new Scene(sceneName);
  engine.addScene(scene);
  engine.activateScene(sceneName);

  // 创建相机
  const camera = new CameraNode3D('主相机', 75, 0.1, 1000, {
    position: new THREE.Vector3(0, 5, 10),
    rotation: new THREE.Euler(-0.2, 0, 0)
  });
  scene.addNode(camera);

  // 创建地面
  const ground = new Node3d('地面');
  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  ground.getThreeObject().add(groundMesh);
  scene.addNode(ground);

  // 创建溶解效果模型
  // createDissolveEffect(scene);

  // 启动引擎
  engine.start();

  return engine;
}

/**
 * 创建噪声纹理
 */
function createNoiseTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  
  const ctx = canvas.getContext('2d')!;
  
  // 填充黑色背景
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 256, 256);
  
  // 生成噪声
  const imageData = ctx.getImageData(0, 0, 256, 256);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // 生成随机噪声
    const value = Math.floor(Math.random() * 256);
    data[i] = value;     // R
    data[i + 1] = value; // G
    data[i + 2] = value; // B
    data[i + 3] = 255;   // A
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  
  return texture;
}

/**
 * 创建溶解效果
 * 使用自定义着色器实现TSL风格的溶解效果
 */
function createDissolveEffect(scene: Scene): void {
  // 创建一个简单的模型
  const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
  
  // 创建噪声纹理
  const noiseTexture = createNoiseTexture();
  
  // 创建自定义着色器材质 - 模拟TSL的使用方式
  const material = new THREE.ShaderMaterial({
    uniforms: {
      // 这些是我们的uniform变量，在TSL中可以直接使用uniform()函数创建
      baseColor: { value: new THREE.Color(0x00aaff) },
      edgeColor: { value: new THREE.Color(0xffffff) },
      noiseTexture: { value: noiseTexture },
      dissolveAmount: { value: 0.5 },
      edgeWidth: { value: 0.1 },
      time: { value: 0.0 }
    },
    // 顶点着色器
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        // 在TSL中，这些变量可以直接使用，如positionLocal, uv()等
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    // 片段着色器 - 实现溶解效果
    fragmentShader: `
      uniform vec3 baseColor;
      uniform vec3 edgeColor;
      uniform sampler2D noiseTexture;
      uniform float dissolveAmount;
      uniform float edgeWidth;
      uniform float time;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        // 在TSL中，这些操作可以使用更简洁的语法
        // 例如: const noise = texture(noiseTexture, vUv).r;
        vec4 noiseColor = texture2D(noiseTexture, vUv);
        float noise = noiseColor.r;
        
        // 在TSL中可以使用: const edge = smoothstep(dissolveAmount - edgeWidth, dissolveAmount, noise);
        float edge = smoothstep(dissolveAmount - edgeWidth, dissolveAmount, noise);
        
        // 在TSL中可以使用: const finalColor = mix(baseColor, edgeColor, edge);
        vec3 finalColor = mix(baseColor, edgeColor, edge);
        
        // 在TSL中可以使用: const alpha = step(dissolveAmount, noise);
        float alpha = step(dissolveAmount, noise);
        
        // 添加一些动画效果
        finalColor += 0.2 * vec3(sin(vPosition.x * 10.0 + time), sin(vPosition.y * 10.0 + time), sin(vPosition.z * 10.0 + time));
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });
  
  // 创建网格
  const mesh = new THREE.Mesh(geometry, material);
  
  // 创建节点
  const node = new Node3d('溶解效果');
  node.position.set(0, 2, 0);
  node.getThreeObject().add(mesh);
  
  // 添加到场景
  scene.addNode(node);
  
  // 添加动画脚本
  node.addScript({
    update: function(deltaTime: number): void {
      // 旋转模型
      node.rotation.y += deltaTime * 0.5;
      
      // 更新时间uniform
      const time = Date.now() * 0.001;
      (material.uniforms.time.value as number) = time;
      
      // 更新溶解量 - 随时间变化
      (material.uniforms.dissolveAmount.value as number) = Math.sin(time * 0.5) * 0.5 + 0.5;
      
      // 更新边缘宽度 - 随时间变化
      (material.uniforms.edgeWidth.value as number) = 0.05 + Math.sin(time * 2.0) * 0.05;
      
      // 更新边缘颜色 - 随时间变化
      const hue = (time * 0.1) % 1.0;
      (material.uniforms.edgeColor.value as THREE.Color).setHSL(hue, 1.0, 0.5);
    }
  });
  
  // 添加调试信息
  const debugInfo = document.createElement('div');
  debugInfo.style.position = 'absolute';
  debugInfo.style.top = '10px';
  debugInfo.style.left = '10px';
  debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  debugInfo.style.color = '#00aaff';
  debugInfo.style.padding = '10px';
  debugInfo.style.fontFamily = 'monospace';
  debugInfo.style.zIndex = '1000';
  document.body.appendChild(debugInfo);
  
  // 更新调试信息
  setInterval(() => {
    debugInfo.innerHTML = `
      <div>TSL溶解效果示例</div>
      <div>溶解量: ${(material.uniforms.dissolveAmount.value as number).toFixed(2)}</div>
      <div>边缘宽度: ${(material.uniforms.edgeWidth.value as number).toFixed(2)}</div>
      <div>边缘颜色: #${(material.uniforms.edgeColor.value as THREE.Color).getHexString()}</div>
      <div>时间: ${(material.uniforms.time.value as number).toFixed(1)}</div>
      <div>注: 这个示例使用ShaderMaterial模拟TSL的使用方式</div>
    `;
  }, 100);
  
  // 添加说明
  console.log(`
    TSL溶解效果示例已创建
    
    在实际使用TSL时，代码会更简洁：
    
    // 创建自定义uniform变量
    const dissolveAmount = uniform(0.5);
    const edgeWidth = uniform(0.1);
    const baseColor = uniform(new THREE.Color(0x00aaff));
    const edgeColor = uniform(new THREE.Color(0xffffff));
    const timeUniform = uniform(0.0);
    
    // 使用TSL编写溶解效果
    const noise = texture(noiseTexture, uv()).r;
    const edge = smoothstep(dissolveAmount.sub(edgeWidth), dissolveAmount, noise);
    const finalColor = mix(baseColor, edgeColor, edge);
    const alpha = step(dissolveAmount, noise);
    
    // 设置材质节点
    material.colorNode = finalColor;
    material.opacityNode = alpha;
    
    // 在更新循环中直接更新uniform变量
    dissolveAmount.value = Math.sin(time * 0.5) * 0.5 + 0.5;
    edgeWidth.value = 0.05 + Math.sin(time * 2.0) * 0.05;
    edgeColor.value.setHSL(hue, 1.0, 0.5);
  `);
}

// 运行示例
runTSLDissolveExample();
