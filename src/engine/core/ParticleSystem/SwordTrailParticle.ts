import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import { editableComponent } from '../decorators';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { uniform, texture, uv, mix, step, smoothstep, color, float, vec3, sin } from 'three/tsl';
import { time } from 'three/tsl';
import { TSLFunctionLibrary } from '../materials/TSLFunctionLibrary';

@editableComponent({
  displayName: '刀光粒子',
  description: '预设的刀光粒子效果',
  icon: 'sword',
  category: 'Particle'
})
export class SwordTrailParticle extends ParticleSystem {
  private material: MeshStandardNodeMaterial | null = null;
  private gradientTexture: THREE.Texture | null = null;
  private noiseTexture: THREE.Texture | null = null;

  constructor(name: string = '刀光粒子') {
    super(name);
    this.initializeAssets();
    this.setupParticleSystem();
  }

  /**
   * 初始化资源
   */
  private initializeAssets(): void {
    // 创建纹理
    this.gradientTexture = this.createGradientTexture();
    this.noiseTexture = this.createNoiseTexture();
    
    // 创建材质
    this.material = this.createMaterial();
  }

  /**
   * 设置粒子系统
   */
  private setupParticleSystem(): void {
    // 配置粒子系统设置
    const settings = this.getSettings();
    
    // 基础设置
    settings.maxParticles = 100;
    settings.duration = 2.0;
    settings.loop = true;
    settings.playOnAwake = true;

    // 发射设置
    settings.emission.rateOverTime = 50;
    
    // 渲染设置
    settings.renderer.material = this.material!;
    settings.renderer.renderMode = 'Trail';
    settings.renderer.blending = true;
    settings.renderer.blendMode = THREE.AdditiveBlending as THREE.BlendingDstFactor;
    
    // 应用设置
    this.setSettings(settings);
  }

  /**
   * 创建渐变纹理
   */
  private createGradientTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.9, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * 创建噪声纹理
   */
  private createNoiseTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 256, 256);
    const imageData = ctx.getImageData(0, 0, 256, 256);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.floor(Math.random() * 256);
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
        }
    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * 创建材质
   */
  private createMaterial(): MeshStandardNodeMaterial {
    const material = new MeshStandardNodeMaterial();
    material.side = THREE.DoubleSide;
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;

      // 创建基础uniform变量
      const flowPosition = uniform(0.1);     // 流动位置 - 0到1之间
      const trailLength = uniform(0.7);      // 刀光长度 - 值越小刀光越短
      const dissolveAmount = uniform(0.5);   // 溶解程度 - 值越大溶解效果越明显
      const flowSpeed = uniform(1.0);        // 流动速度 - 控制自动流动的速度
      const baseColorUniform = uniform(new THREE.Color('red'));  // 基础颜色
      const edgeColorUniform = uniform(new THREE.Color('#333333'));  // 边缘颜色
      const reverseDirection = uniform(1.0); // 反转方向 - 1.0正向，-1.0反向
      const edgeNoisePower = uniform(0.9);   // 边缘噪声强度
      const maskStrength = uniform(1.0);     // 遮罩强度
      const glowStrength = uniform(3.0);     // 发光强度
      const glowRadius = uniform(0.5);       // 发光半径

      // 将uniform变量保存到材质的userData中
    material.userData = {
        flowPosition,
        trailLength,
        dissolveAmount,
        flowSpeed,
        baseColor: baseColorUniform,
        edgeColor: edgeColorUniform,
        reverseDirection,
        edgeNoisePower,
        maskStrength,
        autoFlow: true,
        glowStrength,
        glowRadius
      };

      // 获取TSL函数库实例
      const tslFunctions = TSLFunctionLibrary.getInstance();

      // 创建基于UV的X轴流动刀光效果
    const baseTextureNode = texture(this.gradientTexture!, uv());
      const baseColorNode = baseTextureNode.mul(baseColorUniform);
      const uvNode = uv();
      
      // 获取噪声纹理
      const noiseScale = uniform(0.1);
      const scaledUV = uv().mul(noiseScale);
    const noiseValue = texture(this.noiseTexture!, scaledUV).r;
      
      // 考虑反转方向并计算与流动位置的距离
      const adjustedUV = tslFunctions.remap(
        uvNode.x,
        float(0.0),
        float(1.0),
        float(-1.0),
        float(1.0)
      ).mul(reverseDirection);
      
      // 判断当前是否为反向模式
      const isReversed = step(float(0.0), reverseDirection.mul(float(-1.0))); 
      
      // 计算到中心点的距离
      const flowCenter = flowPosition.mul(2.0).sub(1.0);
      const distanceFromCenter = adjustedUV.sub(flowCenter);
      const absDistance = distanceFromCenter.abs();
      
      // 区分前端和后端
      const frontDirectionFactor = mix(
        distanceFromCenter,
        distanceFromCenter.negate(),
        isReversed
      );
      
      // 使用smoothstep获得更平滑的过渡
      const isFrontSide = smoothstep(
        float(-0.05), 
        float(0.05), 
        frontDirectionFactor
      );
      
      // 创建刀光区域
      const maxDistance = trailLength;
      
      // 获取多层噪声
      const noiseDetail = texture(
      this.noiseTexture!, 
        uv().mul(uniform(0.8))
      ).r;
      
      // 混合噪声
      const edgeNoiseValue = noiseValue.mul(0.7).add(
        noiseDetail.mul(0.3)
      ).add(sin(time.mul(2.0)).mul(0.1));
      
      // 用噪声调整距离
      const noisyDistance = absDistance.sub(
        edgeNoiseValue.mul(edgeNoisePower).mul(maxDistance.mul(0.15))
      );
      
      // 使用smoothstep创建自然边缘
      const trailAreaMask = smoothstep(
        maxDistance.add(0.15),
        maxDistance.sub(0.15),
        noisyDistance
      );
      
      // 创建溶解效果
      const frontEdgeSize = uniform(0.15);
      
      // 前端边缘不溶解的部分
      const frontEdgeMask = smoothstep(
        float(-0.02),
        frontEdgeSize,
        frontDirectionFactor
      ).mul(trailAreaMask);
      
      // 基于噪声的溶解效果
      const noiseScale1 = uniform(0.1);
      const noiseScale2 = uniform(0.3);
      
      // 处理UV坐标
      const normalUV = uv();
      const reversedUVx = float(1.0).sub(normalUV.x);
      
      // 创建噪声采样向量
      const noiseUV = vec3(
        mix(normalUV.x, reversedUVx, isReversed),
        normalUV.y,
        float(0.0)
      );
      
      const scaledUV1 = noiseUV.mul(noiseScale1);
      const scaledUV2 = noiseUV.mul(noiseScale2);
      
      // 多层噪声混合
    const noise1 = texture(this.noiseTexture!, scaledUV1).r;
    const noise2 = texture(this.noiseTexture!, scaledUV2).r;
      
      // 添加波动和细节
      const dissolveNoise = noise1.mul(0.6).add(noise2.mul(0.4)).add(
        sin(noiseUV.x.mul(15.0).add(time.mul(1.0))).mul(0.1).add(
          sin(noiseUV.y.mul(12.0).add(time.mul(0.8))).mul(0.1)
        )
      );
      
      // 基于位置的溶解强度
      const normalizedDistance = mix(
        distanceFromCenter, 
        distanceFromCenter.negate(), 
        isReversed
      );
      
      const positionFactor = normalizedDistance.add(maxDistance)
        .div(maxDistance.mul(2.0))
        .clamp(float(0.0), float(1.0));
      
      // 使用幂函数使后端溶解效果更强
      const positionBasedDissolve = positionFactor.pow(float(1.3))
        .mul(float(1.0).sub(frontEdgeMask.mul(0.7)));
      
      // 边缘溶解效果
      const dissolveMask = smoothstep(
        dissolveAmount.add(positionBasedDissolve.mul(0.3)).sub(0.25),
        dissolveAmount.add(positionBasedDissolve.mul(0.3)).add(0.25),
        dissolveNoise
      );
      
      // 在位置0和1处完全隐藏
      const visibilityMask = smoothstep(float(0.0), float(0.15), flowPosition)
        .mul(smoothstep(float(0.0), float(0.15), float(1.0).sub(flowPosition)));
      
      // 垂直UV变化处理
      const verticalGradient = smoothstep(
        float(0.3), 
        float(0.7), 
        noiseUV.y
      );
      
      // 混合颜色
      const edgeFactor = smoothstep(
        float(0.3),
        float(0.7),
        dissolveNoise.add(positionBasedDissolve.mul(0.4))
      );
      
      // 添加垂直渐变到颜色混合
      const finalColor = mix(
        baseColorNode,
        edgeColorUniform,
        edgeFactor.mul(verticalGradient.mul(0.7).add(0.3))
      );
      
      // 应用透明度
      const alpha = trailAreaMask.mul(
        mix(
          dissolveMask,
          float(1.0), 
          frontEdgeMask.mul(0.1)
        )
      ).mul(baseTextureNode.a).mul(visibilityMask);
      
      // 添加时间动画效果
      const timeEffect = sin(time.mul(3.0)).mul(0.07);
      const colorWithEffect = finalColor;
      
      // 设置材质节点
    material.colorNode = colorWithEffect;
    material.opacityNode = alpha;
    material.roughnessNode = float(0.2);
    material.metalnessNode = float(0.8);

      // 设置发光效果
      const baseEmissive = colorWithEffect.mul(0.5);
      const glowFactor = dissolveNoise
        .mul(maskStrength)
        .add(frontEdgeMask.mul(0.2))
        .mul(glowStrength);

      const glowColor = mix(
        baseColorUniform,
        edgeColorUniform,
        edgeFactor.mul(0.5)
      ).mul(glowFactor);

    material.emissiveNode = baseEmissive.add(glowColor);

    return material;
  }

  // 暴露控制接口
  public setFlowPosition(value: number): void {
    if (this.material?.userData?.flowPosition) {
      this.material.userData.flowPosition.value = Math.max(0, Math.min(1, value));
    }
  }

  public setTrailLength(value: number): void {
    if (this.material?.userData?.trailLength) {
      this.material.userData.trailLength.value = value;
    }
  }

  public setDissolveAmount(value: number): void {
    if (this.material?.userData?.dissolveAmount) {
      this.material.userData.dissolveAmount.value = value;
    }
  }

  public setFlowSpeed(value: number): void {
    if (this.material?.userData?.flowSpeed) {
      this.material.userData.flowSpeed.value = value;
    }
  }

  public setBaseColor(color: THREE.Color | string): void {
    if (this.material?.userData?.baseColor) {
      if (typeof color === 'string') {
        color = new THREE.Color(color);
      }
      this.material.userData.baseColor.value = color;
    }
  }

  public setEdgeColor(color: THREE.Color | string): void {
    if (this.material?.userData?.edgeColor) {
      if (typeof color === 'string') {
        color = new THREE.Color(color);
      }
      this.material.userData.edgeColor.value = color;
    }
  }

  public setReverseDirection(value: boolean): void {
    if (this.material?.userData?.reverseDirection) {
      this.material.userData.reverseDirection.value = value ? -1.0 : 1.0;
    }
  }

  public setEdgeNoisePower(value: number): void {
    if (this.material?.userData?.edgeNoisePower) {
      this.material.userData.edgeNoisePower.value = value;
    }
  }

  public setMaskStrength(value: number): void {
    if (this.material?.userData?.maskStrength) {
      this.material.userData.maskStrength.value = value;
    }
  }

  public setGlowStrength(value: number): void {
    if (this.material?.userData?.glowStrength) {
      this.material.userData.glowStrength.value = value;
      }
  }

  public setGlowRadius(value: number): void {
    if (this.material?.userData?.glowRadius) {
      this.material.userData.glowRadius.value = value;
    }
  }

  public setAutoFlow(value: boolean): void {
    if (this.material?.userData) {
      this.material.userData.autoFlow = value;
  }
  }

  public override update(deltaTime: number): void {
    super.update(deltaTime);
    
    if (this.material?.userData?.autoFlow) {
      const currentTime = Date.now() * 0.001;
      this.setFlowPosition((Math.sin(currentTime) + 1) * 0.5);
    }
  }
} 