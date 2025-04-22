import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { 
    float, color, texture, uv, time, mix, smoothstep, vec3, vec2,
    Node, uniform, sin
} from 'three/tsl';

/**
 * 材质参数接口
 */
export interface MaterialParameters {
    [key: string]: any;
}

/**
 * 材质更新回调类型
 */
export type MaterialUpdateCallback = (material: MeshStandardNodeMaterial, params: MaterialParameters) => void;

/**
 * TSL材质类
 */
export class TSLMaterial {
    private material: MeshStandardNodeMaterial;
    private params: MaterialParameters;
    private updateCallback: MaterialUpdateCallback;
    private uniformNodes: Map<string, Node> = new Map();
    
    /**
     * 构造函数
     * @param params 材质参数
     * @param updateCallback 材质更新回调
     */
    constructor(params: MaterialParameters, updateCallback: MaterialUpdateCallback) {
        this.params = { ...params };
        this.updateCallback = updateCallback;
        this.material = new MeshStandardNodeMaterial();
        this.material.side = THREE.DoubleSide;
        this.material.transparent = true;
        
        // 初始化材质
        this.update();
    }
    
    /**
     * 获取材质实例
     */
    public getMaterial(): MeshStandardNodeMaterial {
        return this.material;
    }
    
    /**
     * 获取参数
     */
    public getParameters(): MaterialParameters {
        return { ...this.params };
    }
    
    /**
     * 设置参数
     */
    public setParameters(params: Partial<MaterialParameters>): void {
        this.params = { ...this.params, ...params };
        this.update();
    }
    
    /**
     * 更新材质
     */
    public update(): void {
        this.updateCallback(this.material, this.params);
    }
    
    /**
     * 创建并注册一个uniform节点
     */
    public createUniform(name: string, defaultValue: any): Node {
        const node = uniform(defaultValue);
        this.uniformNodes.set(name, node);
        return node;
    }
    
    /**
     * 获取uniform节点
     */
    public getUniform(name: string): Node | undefined {
        return this.uniformNodes.get(name);
    }
    
    /**
     * 设置uniform值
     */
    public setUniformValue(name: string, value: any): void {
        const node = this.uniformNodes.get(name);
        if (node && 'value' in node) {
            node.value = value;
        }
    }
    
    /**
     * 克隆材质
     */
    public clone(): TSLMaterial {
        return new TSLMaterial(this.params, this.updateCallback);
    }
}

/**
 * TSL材质库
 * 提供创建和管理自定义TSL材质的功能
 */
export class TSLMaterialLibrary {
    private static instance: TSLMaterialLibrary;
    private materials: Map<string, TSLMaterial> = new Map();
    
    private constructor() {
        this.registerDefaultMaterials();
    }
    
    /**
     * 获取单例实例
     */
    public static getInstance(): TSLMaterialLibrary {
        if (!TSLMaterialLibrary.instance) {
            TSLMaterialLibrary.instance = new TSLMaterialLibrary();
        }
        return TSLMaterialLibrary.instance;
    }
    
    /**
     * 注册默认材质
     */
    private registerDefaultMaterials(): void {
        // 溶解材质
        this.registerMaterial('dissolve', (material, params) => {
            const textureMap = params.textureMap as THREE.Texture;
            const noiseMap = params.noiseMap as THREE.Texture;
            const dissolveAmount = float(params.dissolveAmount || 0.5);
            const edgeWidth = float(params.edgeWidth || 0.1);
            const edgeColor = color(params.edgeColor || new THREE.Color(0xff0000));
            
            if (textureMap && noiseMap) {
                const texColor = texture(textureMap, uv());
                const noiseValue = texture(noiseMap, uv()).r;
                
                const edge = smoothstep(
                    dissolveAmount.sub(edgeWidth),
                    dissolveAmount.add(edgeWidth),
                    noiseValue
                );
                
                const finalColor = mix(texColor.rgb, edgeColor, edge);
                const finalOpacity = texColor.a.mul(noiseValue.gt(dissolveAmount));
                
                material.colorNode = finalColor;
                material.opacityNode = finalOpacity;
            }
        });
        
        // 发光材质
        this.registerMaterial('glow', (material, params) => {
            const baseColor = color(params.baseColor || new THREE.Color(0xffffff));
            const glowColor = color(params.glowColor || new THREE.Color(0x00ffff));
            const glowIntensity = float(params.glowIntensity || 1.0);
            const pulseSpeed = float(params.pulseSpeed || 1.0);
            
            const pulse = sin(time().mul(pulseSpeed)).mul(0.5).add(0.5);
            const glow = glowColor.mul(glowIntensity).mul(pulse);
            
            material.colorNode = baseColor.add(glow);
            material.emissiveNode = glow;
        });
        
        // UV动画材质
        this.registerMaterial('uvAnimation', (material, params) => {
            const textureMap = params.textureMap as THREE.Texture;
            const speedX = float(params.speedX || 0.0);
            const speedY = float(params.speedY || 0.0);
            
            if (textureMap) {
                const animatedUV = uv().add(
                    vec2(
                        time().mul(speedX),
                        time().mul(speedY)
                    )
                );
                
                material.colorNode = texture(textureMap, animatedUV);
            }
        });
    }
    
    /**
     * 注册材质
     */
    public registerMaterial(name: string, updateCallback: MaterialUpdateCallback): void {
        this.materials.set(name, new TSLMaterial({}, updateCallback));
    }
    
    /**
     * 创建材质实例
     */
    public createMaterial(name: string, params: MaterialParameters = {}): TSLMaterial | null {
        const template = this.materials.get(name);
        if (!template) {
            console.warn(`Material '${name}' not found in library`);
            return null;
        }
        
        const material = template.clone();
        material.setParameters(params);
        return material;
    }
    
    /**
     * 获取所有可用材质名称
     */
    public getAvailableMaterials(): string[] {
        return Array.from(this.materials.keys());
    }
} 