import * as THREE from 'three';
import { 
    Node, float, color, texture, uv, time, mix, smoothstep, vec2, vec3, vec4,
    sin, cos, normalize, dot, abs, pow, add, mul, sub, uniform, Fn,
    step, fract, floor, max, min, mod, reflect, positionWorld, normalWorld,
    positionView, MeshStandardNodeMaterial
} from 'three/tsl';

/**
 * TSL函数库
 * 提供常用特效和工具函数
 */
export class TSLFunctionLibrary {
    private static instance: TSLFunctionLibrary;
    
    private constructor() {}
    
    /**
     * 获取单例实例
     */
    public static getInstance(): TSLFunctionLibrary {
        if (!TSLFunctionLibrary.instance) {
            TSLFunctionLibrary.instance = new TSLFunctionLibrary();
        }
        return TSLFunctionLibrary.instance;
    }
    
    // ===== 纹理特效 =====
    
    /**
     * 创建溶解效果
     */
    public createDissolveEffect(
        baseColor: Node, 
        noiseTexture: THREE.Texture, 
        edgeColor: Node, 
        dissolveAmount: Node, 
        edgeWidth: Node
    ): { color: Node, opacity: Node } {
        const noiseValue = texture(noiseTexture, uv()).r;
        
        // 计算边缘
        const edge = smoothstep(
            dissolveAmount.sub(edgeWidth),
            dissolveAmount.add(edgeWidth),
            noiseValue
        );
        
        // 混合颜色
        const finalColor = mix(baseColor, edgeColor, edge);
        
        // 计算透明度
        const opacity = step(dissolveAmount, noiseValue);
        
        return { color: finalColor, opacity };
    }
    
    /**
     * 创建发光效果
     */
    public createGlowEffect(
        baseColor: Node, 
        glowColor: Node, 
        glowIntensity: Node, 
        pulseSpeed: Node = float(1.0)
    ): { color: Node, emissive: Node } {
        // 创建脉冲
        const pulse = sin(time().mul(pulseSpeed)).mul(0.5).add(0.5);
        
        // 创建发光
        const glow = glowColor.mul(glowIntensity).mul(pulse);
        
        // 最终颜色
        const finalColor = baseColor.add(glow);
        
        return { color: finalColor, emissive: glow };
    }
    
    /**
     * 创建动态UV偏移效果
     */
    public createUVAnimation(
        baseUV: Node = uv(), 
        speedX: Node = float(0), 
        speedY: Node = float(0)
    ): Node {
        return baseUV.add(
            vec2(
                time().mul(speedX),
                time().mul(speedY)
            )
        );
    }
    
    /**
     * 创建UV平铺效果
     */
    public createUVTiling(
        baseUV: Node = uv(), 
        tilesX: Node = float(1), 
        tilesY: Node = float(1)
    ): Node {
        return vec2(
            mod(baseUV.x.mul(tilesX), float(1)),
            mod(baseUV.y.mul(tilesY), float(1))
        );
    }
    
    /**
     * 创建UV扭曲效果
     */
    public createUVDistortion(
        baseUV: Node = uv(), 
        distortionTexture: THREE.Texture, 
        strength: Node = float(0.1), 
        speed: Node = float(1.0)
    ): Node {
        const timeValue = time().mul(speed);
        const offsetUV = add(baseUV, vec2(timeValue.mul(0.1), timeValue.mul(0.2)));
        const distortion = texture(distortionTexture, offsetUV).rg.sub(0.5).mul(2.0).mul(strength);
        return baseUV.add(distortion);
    }
    
    /**
     * 创建UV径向扭曲效果
     */
    public createRadialDistortion(
        baseUV: Node = uv(), 
        center: Node = vec2(0.5, 0.5), 
        strength: Node = float(0.1)
    ): Node {
        const dir = baseUV.sub(center);
        const dist = dir.length();
        const offset = dir.normalize().mul(dist.pow(2).neg().exp().mul(strength));
        return baseUV.add(offset);
    }
    
    // ===== 颜色特效 =====
    
    /**
     * 创建颜色渐变效果
     */
    public createColorGradient(
        colorA: Node,
        colorB: Node,
        gradientTexture: THREE.Texture | Node,
        factor: Node = float(0.5)
    ): Node {
        let gradient: Node;
        
        if (gradientTexture instanceof THREE.Texture) {
            gradient = texture(gradientTexture, vec2(factor, 0.5)).r;
        } else {
            gradient = gradientTexture;
        }
        
        return mix(colorA, colorB, gradient);
    }
    
    /**
     * 创建颜色脉冲效果
     */
    public createColorPulse(
        colorA: Node,
        colorB: Node,
        frequency: Node = float(1.0),
        phase: Node = float(0.0)
    ): Node {
        const t = sin(time().mul(frequency).add(phase)).mul(0.5).add(0.5);
        return mix(colorA, colorB, t);
    }
    
    /**
     * 创建HSV颜色变换
     * 注意：这是近似实现，不是完全准确的HSV转换
     */
    public createHSVShift(
        inputColor: Node,
        hueShift: Node = float(0),
        saturationShift: Node = float(0),
        valueShift: Node = float(0)
    ): Node {
        // 这个是TSL的简化实现，不完全准确但效果足够
        return Fn(([color, hue, sat, val]) => {
            // 计算亮度
            const luminance = color.rgb.dot(vec3(0.299, 0.587, 0.114));
            
            // 应用色调变换(非常简化的实现)
            const hueMatrix = vec3(
                cos(hue).mul(2).sub(1), 
                sin(hue.mul(3)), 
                sin(hue.neg().mul(2))
            );
            
            // 创建色调旋转颜色
            const huedColor = vec3(
                color.r.mul(hueMatrix.x).add(color.g.mul(hueMatrix.y)).add(color.b.mul(hueMatrix.z)),
                color.r.mul(hueMatrix.z).add(color.g.mul(hueMatrix.x)).add(color.b.mul(hueMatrix.y)),
                color.r.mul(hueMatrix.y).add(color.g.mul(hueMatrix.z)).add(color.b.mul(hueMatrix.x))
            );
            
            // 应用饱和度变换
            const satColor = mix(vec3(luminance), huedColor, sat.add(1.0));
            
            // 应用亮度变换
            const valColor = satColor.mul(val.add(1.0));
            
            return vec4(valColor, color.a);
        })([inputColor, hueShift, saturationShift, valueShift]);
    }
    
    // ===== 光照特效 =====
    
    /**
     * 创建边缘光效果(菲涅尔)
     */
    public createFresnelEffect(
        baseColor: Node,
        fresnelColor: Node,
        fresnelPower: Node = float(2.0)
    ): Node {
        // 使用世界空间法线和视角方向计算菲涅尔效果
        const viewDir = normalize(positionView);
        const normalDir = normalize(normalWorld);
        const fresnelFactor = float(1.0).sub(abs(dot(viewDir, normalDir))).pow(fresnelPower);
        
        return mix(baseColor, fresnelColor, fresnelFactor);
    }
    
    /**
     * 创建轮廓描边效果
     */
    public createOutlineEffect(
        baseColor: Node,
        outlineColor: Node,
        outlineThickness: Node = float(0.01)
    ): { material: (material: MeshStandardNodeMaterial) => void } {
        // 这需要处理材质的整体设置，不仅仅是颜色
        return {
            material: (material: MeshStandardNodeMaterial) => {
                // 保存原始颜色节点
                const originalColorNode = material.colorNode || baseColor;
                
                // 创建一个新的材质处理函数
                const processOutline = Fn(([color, outline, thickness]) => {
                    // 这里简化实现，真正的描边效果需要在vertex shader中处理
                    // 或者使用后期处理
                    return color; // 占位，实际实现需要更复杂的处理
                });
                
                // 应用到材质
                material.colorNode = processOutline([originalColorNode, outlineColor, outlineThickness]);
            }
        };
    }
    
    /**
     * 创建卡通着色效果
     */
    public createToonShading(
        baseColor: Node,
        lightColor: Node = color(0xffffff),
        shadowColor: Node = color(0x000000),
        steps: Node = float(3.0)
    ): Node {
        // 简单的卡通着色
        const lightDir = normalize(vec3(1, 1, 1));
        const normalDir = normalize(normalWorld);
        
        // 计算光照强度并量化
        const intensity = max(dot(normalDir, lightDir), float(0));
        const toonIntensity = floor(intensity.mul(steps)).div(steps.sub(1));
        
        // 混合颜色
        return mix(
            mix(shadowColor, baseColor, float(0.5)), // 阴影颜色
            mix(baseColor, lightColor, float(0.5)),  // 高光颜色
            toonIntensity
        );
    }
    
    // ===== 程序化纹理 =====
    
    /**
     * 创建棋盘格纹理
     */
    public createCheckerboard(
        colorA: Node = color(0x000000),
        colorB: Node = color(0xffffff),
        scale: Node = float(5.0)
    ): Node {
        return Fn(([cA, cB, s]) => {
            const scaledUV = uv().mul(s);
            const ix = floor(scaledUV.x);
            const iy = floor(scaledUV.y);
            const checker = mod(ix.add(iy), float(2));
            return mix(cA, cB, checker);
        })([colorA, colorB, scale]);
    }
    
    /**
     * 创建噪声纹理
     * 这是一个简单的伪随机噪声
     */
    public createSimpleNoise(scale: Node = float(10.0)): Node {
        return Fn(([s]) => {
            const p = uv().mul(s);
            const seed = p.x.mul(31.34).add(p.y.mul(43.21));
            return fract(seed.mul(9.123).sin().mul(45678.9));
        })([scale]);
    }
    
    /**
     * 创建条纹纹理
     */
    public createStripes(
        colorA: Node = color(0x000000),
        colorB: Node = color(0xffffff),
        frequency: Node = float(10.0),
        direction: Node = float(0.0) // 0 = 水平, PI/2 = 垂直
    ): Node {
        return Fn(([cA, cB, freq, dir]) => {
            // 旋转UV
            const rotatedU = uv().x.mul(cos(dir)).sub(uv().y.mul(sin(dir)));
            // 创建条纹
            const stripeValue = sin(rotatedU.mul(freq));
            // 锐化条纹
            const sharpStripe = step(float(0), stripeValue);
            return mix(cA, cB, sharpStripe);
        })([colorA, colorB, frequency, direction]);
    }
    
    // ===== 几何特效 =====
    
    /**
     * 创建顶点动画函数
     */
    public createVertexAnimation(
        amplitude: Node = float(0.1),
        frequency: Node = float(1.0),
        noiseScale: Node = float(5.0)
    ): Node {
        // 这个函数返回一个可以用于position节点的偏移值
        return Fn(([amp, freq, scale]) => {
            // 创建基于位置的噪声
            const noise = fract(
                sin(
                    positionWorld.x.mul(scale.mul(1.0))
                    .add(positionWorld.y.mul(scale.mul(3.7)))
                    .add(positionWorld.z.mul(scale.mul(2.3)))
                ).mul(43758.5453)
            );
            
            // 创建动态波动
            const wave = sin(time().mul(freq).add(noise.mul(6.28)));
            
            // 应用到法线方向
            return normalWorld.mul(amp.mul(wave));
        })([amplitude, frequency, noiseScale]);
    }
    
    /**
     * 创建虚线效果(对于线条)
     */
    public createDashLine(
        dashSize: Node = float(0.2),
        gapSize: Node = float(0.1)
    ): Node {
        return Fn(([dash, gap]) => {
            const totalSize = dash.add(gap);
            const modulo = mod(uv().x, totalSize);
            return step(modulo, dash);
        })([dashSize, gapSize]);
    }
    
    // ===== 实用工具 =====
    
    /**
     * 创建简单的渐变映射
     */
    public createGradientMap(
        value: Node,
        stops: Node[], // 应该是0到1之间的浮点数
        colors: Node[] // 对应的颜色值
    ): Node {
        // 检查stops和colors数组长度是否匹配
        if (stops.length !== colors.length || stops.length < 2) {
            console.error("Gradient map: stops and colors arrays must have the same length (at least 2)");
            return color(0xff00ff); // 默认紫色表示错误
        }
        
        // 创建一个渐变映射函数
        return Fn((inputs) => {
            const val = inputs[0];
            
            // 获取stops和colors
            const stopCount = (inputs.length - 1) / 2;
            const gradientStops = inputs.slice(1, stopCount + 1);
            const gradientColors = inputs.slice(stopCount + 1);
            
            // 默认值为第一个颜色
            let result = gradientColors[0];
            
            // 遍历所有stops，找到对应区间
            for (let i = 0; i < stopCount - 1; i++) {
                const currentStop = gradientStops[i];
                const nextStop = gradientStops[i + 1];
                const currentColor = gradientColors[i];
                const nextColor = gradientColors[i + 1];
                
                // 计算当前区间内的插值因子
                const factor = smoothstep(currentStop, nextStop, val);
                
                // 混合颜色
                const segmentColor = mix(currentColor, nextColor, factor);
                
                // 如果在当前区间内，使用这个区间的颜色
                const inSegment = step(currentStop, val).mul(step(val, nextStop));
                result = mix(result, segmentColor, inSegment);
            }
            
            return result;
        })([value, ...stops, ...colors]);
    }
    
    /**
     * 创建时间曲线函数
     * 根据不同的曲线类型返回0到1之间的值
     * @param curveType 曲线类型: "sine", "square", "triangle", "sawtooth", "bounce", "elastic"
     */
    public createTimeCurve(
        frequency: Node = float(1.0),
        curveType: string = "sine"
    ): Node {
        const t = time().mul(frequency);
        
        switch (curveType) {
            case "sine":
                return t.sin().mul(0.5).add(0.5);
                
            case "square":
                return t.sin().step(0);
                
            case "triangle":
                return t.mul(2).mod(2).sub(1).abs();
                
            case "sawtooth":
                return t.mod(1);
                
            case "bounce":
                return Fn(([time]) => {
                    const t = time.mod(1);
                    return float(1).sub(abs(sin(t.mul(Math.PI)).mul(2).sub(1)).pow(2));
                })([t]);
                
            case "elastic":
                return Fn(([time]) => {
                    const t = time.mod(1);
                    return sin(t.mul(Math.PI * 2).mul(3))
                        .mul(pow(float(1).sub(t), float(3)))
                        .mul(0.5).add(0.5);
                })([t]);
                
            default:
                return t.sin().mul(0.5).add(0.5); // 默认正弦曲线
        }
    }
    
    /**
     * 创建方向性溶解效果
     * 使对象沿着UV一个方向渐进式溶解消失
     * @param baseColor 基础颜色节点
     * @param noiseTexture 噪声纹理
     * @param edgeColor 边缘颜色节点
     * @param dissolveProgress 溶解进度(0-1)
     * @param edgeWidth 边缘宽度
     * @param direction 溶解方向 'x+', 'x-', 'y+', 'y-'
     * @param noiseScale 噪声纹理缩放因子，值越小噪声越粗糙 (默认0.3)
     * @returns 包含颜色和不透明度的节点对象
     */
    public createDirectionalDissolveEffect(
        baseColor: Node, 
        noiseTexture: THREE.Texture, 
        edgeColor: Node, 
        dissolveProgress: Node, 
        edgeWidth: Node,
        direction: string = 'x+',
        noiseScale: number = 1.0
    ): { color: Node, opacity: Node } {
        console.log(edgeColor.value,'edgeColor')
        // 使用Fn函数创建自定义溶解效果
        return Fn(([base, noise, edgeCol, progress, width, dir, scale]) => {
            const uvCoord = uv();
            let dirFactor: Node;
            
            // 基于方向确定UV影响
            switch(dir) {
                case 'x-': // 从右到左溶解
                    dirFactor = uvCoord.x;
                    break;
                case 'x+': // 从左到右溶解
                    dirFactor = float(1).sub(uvCoord.x);
                    break;
                case 'y-': // 从上到下溶解
                    dirFactor = uvCoord.y;
                    break;
                case 'y+': // 从下到上溶解
                    dirFactor = float(1).sub(uvCoord.y);
                    break;
                default:
                    dirFactor = float(0);
            }
            
            // 计算方向性溶解值 = 全局进度 + 方向因子
            const localDissolve = progress.mul(2).sub(dirFactor);
            
            // 使用缩放的UV坐标获取噪声值，使噪声更粗糙
            const scaledUV = uvCoord.mul(scale);
            const noiseValue = texture(noise, scaledUV).r;
            
            // 计算边缘效果 - 生成平滑步进值作为混合因子
            const edgeFactor = smoothstep(
                localDissolve.sub(width),
                localDissolve.add(width),
                noiseValue
            );
            
            // 混合颜色 - 正确地使用edgeFactor作为混合因子
            const finalColor = mix(base, edgeCol, edgeFactor);
            
            // 计算透明度
            const opacity = step(localDissolve, noiseValue);
            
            return { color: finalColor, opacity: opacity };
        })([baseColor, noiseTexture, edgeColor, dissolveProgress, edgeWidth, uniform(direction), float(noiseScale)]);
    }
    
    /**
     * 重映射值从一个范围到另一个范围
     * @param value 要重映射的值
     * @param inputMin 输入范围最小值
     * @param inputMax 输入范围最大值
     * @param outputMin 输出范围最小值
     * @param outputMax 输出范围最大值
     * @returns 重映射后的值
     */
    public remap(
        value: Node,
        inputMin: Node = float(0),
        inputMax: Node = float(1),
        outputMin: Node = float(0),
        outputMax: Node = float(1)
    ): Node {
        // 计算归一化值 t = (value - inputMin) / (inputMax - inputMin)
        const t = value.sub(inputMin).div(inputMax.sub(inputMin));
        
        // 映射到输出范围 result = outputMin + t * (outputMax - outputMin)
        return outputMin.add(t.mul(outputMax.sub(outputMin)));
    }
} 