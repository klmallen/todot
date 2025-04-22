import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { 
    Node, float, color, texture, uv, time, mix, smoothstep, vec2, vec3,
    sin, cos, normalize, dot, abs, pow, add, mul, sub, uniform
} from 'three/tsl';
import { TSLMaterialLibrary, MaterialParameters } from './TSLMaterialLibrary';

/**
 * TSL材质自定义器
 * 提供简单的API，让用户可以更轻松地创建自定义材质
 */
export class TSLMaterialCustomizer {
    private material: MeshStandardNodeMaterial;
    private materialLibrary: TSLMaterialLibrary;
    private params: MaterialParameters = {};
    private uniformNodes: Map<string, Node> = new Map();
    private materialName: string;
    
    /**
     * 构造函数
     * @param name 材质名称
     */
    constructor(name: string) {
        this.materialName = name;
        this.materialLibrary = TSLMaterialLibrary.getInstance();
        this.material = new MeshStandardNodeMaterial();
        this.material.side = THREE.DoubleSide;
        this.material.transparent = true;
    }
    
    /**
     * 设置颜色节点
     */
    public setColorNode(node: Node): TSLMaterialCustomizer {
        this.material.colorNode = node;
        return this;
    }
    
    /**
     * 设置不透明度节点
     */
    public setOpacityNode(node: Node): TSLMaterialCustomizer {
        this.material.opacityNode = node;
        return this;
    }
    
    /**
     * 设置自发光节点
     */
    public setEmissiveNode(node: Node): TSLMaterialCustomizer {
        this.material.emissiveNode = node;
        return this;
    }
    
    /**
     * 创建uniform节点
     */
    public createUniform(name: string, defaultValue: any): Node {
        const uniformNode = uniform(defaultValue);
        this.uniformNodes.set(name, uniformNode);
        this.params[name] = defaultValue;
        return uniformNode;
    }
    
    /**
     * 获取uniform节点
     */
    public getUniform(name: string): Node | undefined {
        return this.uniformNodes.get(name);
    }
    
    /**
     * 设置参数
     */
    public setParam(name: string, value: any): TSLMaterialCustomizer {
        this.params[name] = value;
        return this;
    }
    
    /**
     * 创建贴图节点
     */
    public createTextureNode(texture: THREE.Texture, uvNode?: Node): Node {
        return texture ? texture(texture, uvNode || uv()) : color(0xffffff);
    }
    
    /**
     * 创建时间节点
     */
    public createTimeNode(): Node {
        return time();
    }
    
    /**
     * 创建溶解效果
     */
    public createDissolveEffect(
        baseTexture: THREE.Texture,
        noiseTexture: THREE.Texture,
        edgeColor: THREE.Color = new THREE.Color(0xff0000),
        dissolveAmount: number = 0.5,
        edgeWidth: number = 0.1
    ): TSLMaterialCustomizer {
        // 创建uniform节点
        const dissolveAmountNode = this.createUniform('dissolveAmount', dissolveAmount);
        const edgeWidthNode = this.createUniform('edgeWidth', edgeWidth);
        const edgeColorNode = this.createUniform('edgeColor', edgeColor);
        
        // 创建纹理节点
        const baseTextureNode = texture(baseTexture, uv());
        const noiseTextureNode = texture(noiseTexture, uv()).r;
        
        // 创建边缘效果
        const edge = smoothstep(
            dissolveAmountNode.sub(edgeWidthNode),
            dissolveAmountNode.add(edgeWidthNode),
            noiseTextureNode
        );
        
        // 混合颜色
        const finalColor = mix(baseTextureNode.rgb, edgeColorNode, edge);
        
        // 设置节点
        this.material.colorNode = finalColor;
        this.material.opacityNode = baseTextureNode.a.mul(noiseTextureNode.gt(dissolveAmountNode));
        
        return this;
    }
    
    /**
     * 创建发光效果
     */
    public createGlowEffect(
        baseColor: THREE.Color = new THREE.Color(0xffffff),
        glowColor: THREE.Color = new THREE.Color(0x00ffff),
        glowIntensity: number = 1.0,
        pulseSpeed: number = 1.0
    ): TSLMaterialCustomizer {
        // 创建uniform节点
        const baseColorNode = this.createUniform('baseColor', baseColor);
        const glowColorNode = this.createUniform('glowColor', glowColor);
        const glowIntensityNode = this.createUniform('glowIntensity', glowIntensity);
        const pulseSpeedNode = this.createUniform('pulseSpeed', pulseSpeed);
        
        // 创建脉冲效果
        const pulse = sin(time().mul(pulseSpeedNode)).mul(0.5).add(0.5);
        
        // 创建发光效果
        const glow = glowColorNode.mul(glowIntensityNode).mul(pulse);
        
        // 设置节点
        this.material.colorNode = baseColorNode.add(glow);
        this.material.emissiveNode = glow;
        
        return this;
    }
    
    /**
     * 创建UV动画效果
     */
    public createUVAnimationEffect(
        baseTexture: THREE.Texture,
        speedX: number = 0.0,
        speedY: number = 0.0
    ): TSLMaterialCustomizer {
        // 创建uniform节点
        const speedXNode = this.createUniform('speedX', speedX);
        const speedYNode = this.createUniform('speedY', speedY);
        
        // 创建UV动画
        const animatedUV = uv().add(
            vec2(
                time().mul(speedXNode),
                time().mul(speedYNode)
            )
        );
        
        // 设置节点
        this.material.colorNode = texture(baseTexture, animatedUV);
        
        return this;
    }
    
    /**
     * 构建材质
     */
    public build(): any {
        // 注册材质更新回调
        const updateCallback = (material: MeshStandardNodeMaterial, params: MaterialParameters) => {
            // 更新所有uniform节点
            for (const [name, node] of this.uniformNodes.entries()) {
                if (params[name] !== undefined && 'value' in node) {
                    node.value = params[name];
                }
            }
        };
        
        // 注册材质
        this.materialLibrary.registerMaterial(this.materialName, updateCallback);
        
        // 创建材质实例
        return this.materialLibrary.createMaterial(this.materialName, this.params);
    }
} 