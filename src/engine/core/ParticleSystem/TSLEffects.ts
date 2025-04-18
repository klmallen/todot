import * as THREE from 'three';
import { 
    texture, uv, time, oscSine, oscTriangle, 
    vec2, vec3, vec4, float, color, 
    mix, smoothstep, saturate, length, normalize,step,
    Fn
} from 'three/tsl';

/**
 * 粒子系统TSL特效预设
 * 提供常用的粒子特效着色器
 */
export class TSLEffects {
    /**
     * 创建UV动画效果
     * @param textureMap 纹理贴图
     * @param speedX X方向移动速度
     * @param speedY Y方向移动速度
     * @param scale UV缩放
     * @returns TSL节点
     */
    static createUVAnimation(textureMap: THREE.Texture, speedX = 0.5, speedY = 0.0, scale = 1.0) {
        // 创建随时间变化的UV坐标
        const scaledTime = time.mul(float(speedX));
        const scaledTimeY = time.mul(float(speedY));
        
        // 基础UV坐标
        const baseUV = uv().mul(float(scale));
        
        // 动画UV坐标
        const animatedUV = vec2(
            baseUV.x.add(scaledTime),
            baseUV.y.add(scaledTimeY)
        );
        
        // 返回带动画的纹理
        return texture(textureMap, animatedUV);
    }
    
    /**
     * 创建流动效果（适合刀光、尾迹等）
     * @param textureMap 纹理贴图
     * @param flowSpeed 流动速度
     * @param direction 流动方向 (0: X方向, 1: Y方向)
     * @param scale UV缩放
     * @returns TSL节点
     */
    static createFlowEffect(textureMap: THREE.Texture, flowSpeed = 1.0, direction = 0, scale = 1.0) {
        // 创建随时间变化的UV坐标
        const scaledTime = time.mul(float(flowSpeed));
        
        // 基础UV坐标
        const baseUV = uv().mul(float(scale));
        
        // 根据方向创建流动UV
        let flowUV;
        if (direction === 0) {
            // X方向流动
            flowUV = vec2(baseUV.x.sub(scaledTime), baseUV.y);
        } else {
            // Y方向流动
            flowUV = vec2(baseUV.x, baseUV.y.sub(scaledTime));
        }
        
        // 返回带流动效果的纹理
        return texture(textureMap, flowUV);
    }
    
    /**
     * 创建发光效果
     * @param baseColor 基础颜色
     * @param glowColor 发光颜色
     * @param glowIntensity 发光强度
     * @param pulseSpeed 脉冲速度 (0表示不脉冲)
     * @returns TSL节点
     */
    static createGlowEffect(baseColor: THREE.Color, glowColor: THREE.Color, glowIntensity = 1.0, pulseSpeed = 0.0) {
        // 创建基础颜色节点
        const baseColorNode = color(baseColor);
        const glowColorNode = color(glowColor).mul(float(glowIntensity));
        
        // 如果有脉冲效果
        if (pulseSpeed > 0) {
            // 创建脉冲因子 (0.5 - 1.0)
            const pulseFactor = oscSine(time.mul(float(pulseSpeed))).mul(0.5).add(0.5);
            
            // 返回带脉冲发光的颜色
            return mix(baseColorNode, glowColorNode, pulseFactor);
        }
        
        // 返回固定发光的颜色
        return baseColorNode.add(glowColorNode);
    }
    
    /**
     * 创建爆炸效果
     * @param textureMap 纹理贴图
     * @param centerColor 中心颜色
     * @param edgeColor 边缘颜色
     * @param explosionSpeed 爆炸速度
     * @returns TSL节点
     */
    static createExplosionEffect(textureMap: THREE.Texture, centerColor: THREE.Color, edgeColor: THREE.Color, explosionSpeed = 1.0) {
        // 创建爆炸动画因子
        const explosionFactor = time.mul(float(explosionSpeed)).min(float(1.0));
        
        // 创建从中心向外扩散的UV
        const centerUV = vec2(0.5, 0.5);
        const currentUV = uv();
        
        // 计算UV到中心的距离
        const distanceToCenter = length(currentUV.sub(centerUV));
        
        // 创建爆炸边缘效果
        const edgeFactor = smoothstep(
            explosionFactor.sub(0.1),
            explosionFactor,
            distanceToCenter
        );
        
        // 混合中心和边缘颜色
        const explosionColor = mix(
            color(centerColor),
            color(edgeColor),
            edgeFactor
        );
        
        // 获取基础纹理
        const baseTexture = texture(textureMap, currentUV);
        
        // 返回最终颜色
        return baseTexture.mul(explosionColor);
    }
    
    /**
     * 创建内聚效果
     * @param textureMap 纹理贴图
     * @param centerColor 中心颜色
     * @param edgeColor 边缘颜色
     * @param convergenceSpeed 内聚速度
     * @returns TSL节点
     */
    static createConvergenceEffect(textureMap: THREE.Texture, centerColor: THREE.Color, edgeColor: THREE.Color, convergenceSpeed = 1.0) {
        // 创建内聚动画因子 (从1到0)
        const convergenceFactor = float(1.0).sub(time.mul(float(convergenceSpeed)).min(float(1.0)));
        
        // 创建从中心向外的UV
        const centerUV = vec2(0.5, 0.5);
        const currentUV = uv();
        
        // 计算UV到中心的距离
        const distanceToCenter = length(currentUV.sub(centerUV));
        
        // 创建内聚边缘效果
        const edgeFactor = smoothstep(
            convergenceFactor.sub(0.1),
            convergenceFactor,
            distanceToCenter
        );
        
        // 混合中心和边缘颜色
        const convergenceColor = mix(
            color(centerColor),
            color(edgeColor),
            edgeFactor
        );
        
        // 获取基础纹理
        const baseTexture = texture(textureMap, currentUV);
        
        // 返回最终颜色
        return baseTexture.mul(convergenceColor);
    }
    
    /**
     * 创建旋转UV效果
     * @param textureMap 纹理贴图
     * @param rotationSpeed 旋转速度
     * @param scale UV缩放
     * @returns TSL节点
     */
    static createRotatingUVEffect(textureMap: THREE.Texture, rotationSpeed = 1.0, scale = 1.0) {
        // 创建随时间变化的旋转角度
        const angle = time.mul(float(rotationSpeed));
        
        // 计算旋转矩阵的分量
        const cosAngle = angle.cos();
        const sinAngle = angle.sin();
        
        // 基础UV坐标 (中心在0.5,0.5)
        const baseUV = uv().sub(vec2(0.5, 0.5)).mul(float(scale));
        
        // 应用旋转
        const rotatedUV = vec2(
            baseUV.x.mul(cosAngle).sub(baseUV.y.mul(sinAngle)),
            baseUV.x.mul(sinAngle).add(baseUV.y.mul(cosAngle))
        ).add(vec2(0.5, 0.5));
        
        // 返回带旋转的纹理
        return texture(textureMap, rotatedUV);
    }
    
    /**
     * 创建扭曲效果
     * @param textureMap 基础纹理贴图
     * @param distortionMap 扭曲纹理贴图
     * @param distortionStrength 扭曲强度
     * @param distortionSpeed 扭曲速度
     * @returns TSL节点
     */
    static createDistortionEffect(textureMap: THREE.Texture, distortionMap: THREE.Texture, distortionStrength = 0.1, distortionSpeed = 1.0) {
        // 创建随时间变化的UV坐标用于扭曲贴图
        const distortionUV = uv().add(vec2(time.mul(float(distortionSpeed)), 0));
        
        // 获取扭曲贴图
        const distortion = texture(distortionMap, distortionUV).rg.sub(0.5).mul(float(distortionStrength));
        
        // 应用扭曲到基础UV
        const distortedUV = uv().add(distortion);
        
        // 返回扭曲后的纹理
        return texture(textureMap, distortedUV);
    }
    
    /**
     * 创建溶解效果
     * @param textureMap 基础纹理贴图
     * @param noiseMap 噪声纹理贴图
     * @param dissolveEdgeColor 溶解边缘颜色
     * @param dissolveAmount 溶解量 (0-1)
     * @param edgeWidth 边缘宽度
     * @returns TSL节点
     */
    static createDissolveEffect(textureMap: THREE.Texture, noiseMap: THREE.Texture, dissolveEdgeColor: THREE.Color, dissolveAmount = 0.5, edgeWidth = 0.1) {
        // 获取噪声贴图
        const noise = texture(noiseMap, uv()).r;
        
        // 计算溶解因子
        const dissolveFactor = float(dissolveAmount);
        
        // 计算边缘因子
        const edgeFactor = smoothstep(
            dissolveFactor.sub(float(edgeWidth)),
            dissolveFactor,
            noise
        );
        
        // 获取基础纹理
        const baseTexture = texture(textureMap, uv());
        
        // 混合边缘颜色
        const finalColor = mix(
            baseTexture,
            color(dissolveEdgeColor),
            edgeFactor
        );
        
        // 应用透明度裁剪
        const alpha = step(dissolveFactor, noise);
        
        // 返回最终颜色和透明度
        return vec4(finalColor.rgb, baseTexture.a.mul(alpha));
    }
    
    /**
     * 创建能量波纹效果
     * @param textureMap 基础纹理贴图
     * @param waveColor 波纹颜色
     * @param waveSpeed 波纹速度
     * @param waveFrequency 波纹频率
     * @param waveAmplitude 波纹振幅
     * @returns TSL节点
     */
    static createEnergyWaveEffect(textureMap: THREE.Texture, waveColor: THREE.Color, waveSpeed = 1.0, waveFrequency = 5.0, waveAmplitude = 0.1) {
        // 创建随时间变化的波纹
        const waveTime = time.mul(float(waveSpeed));
        
        // 基础UV坐标
        const baseUV = uv();
        
        // 计算到中心的距离
        const center = vec2(0.5, 0.5);
        const distToCenter = length(baseUV.sub(center));
        
        // 创建波纹效果
        const wave = distToCenter.mul(float(waveFrequency)).add(waveTime).sin().mul(float(waveAmplitude));
        
        // 应用波纹到UV
        const waveUV = baseUV.add(
            normalize(baseUV.sub(center)).mul(wave)
        );
        
        // 获取基础纹理
        const baseTexture = texture(textureMap, waveUV);
        
        // 创建波纹强度
        const waveIntensity = wave.add(1.0).mul(0.5);
        
        // 混合波纹颜色
        return mix(
            baseTexture,
            color(waveColor),
            waveIntensity
        );
    }
    
    /**
     * 创建刀光拖尾效果
     * @param textureMap 基础纹理贴图
     * @param trailColor 拖尾颜色
     * @param trailLength 拖尾长度
     * @param trailSpeed 拖尾速度
     * @returns TSL节点
     */
    static createSwordTrailEffect(textureMap: THREE.Texture, trailColor: THREE.Color, trailLength = 0.5, trailSpeed = 1.0) {
        // 创建随时间变化的UV坐标
        const scaledTime = time.mul(float(trailSpeed));
        
        // 基础UV坐标
        const baseUV = uv();
        
        // 创建拖尾UV (X方向拉伸)
        const trailUV = vec2(
            baseUV.x.sub(scaledTime),
            baseUV.y
        );
        
        // 获取基础纹理
        const baseTexture = texture(textureMap, trailUV);
        
        // 创建拖尾渐变 (从右到左)
        const trailGradient = saturate(baseUV.x.div(float(trailLength)));
        
        // 混合拖尾颜色
        return mix(
            color(trailColor),
            baseTexture,
            trailGradient
        );
    }
}
