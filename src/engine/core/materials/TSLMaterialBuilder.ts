import * as THREE from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { 
    Node, float, color, texture, uv, time, mix, smoothstep, vec2, vec3,
    sin, cos, normalize, dot, abs, pow, add, mul, sub, uniform
} from 'three/tsl';
import { TSLMaterial, TSLMaterialLibrary, MaterialParameters } from './TSLMaterialLibrary';

/**
 * 材质节点类型
 */
export enum MaterialNodeType {
    COLOR = 'color',
    TEXTURE = 'texture',
    UV = 'uv',
    FLOAT = 'float',
    VEC2 = 'vec2',
    VEC3 = 'vec3',
    TIME = 'time',
    UNIFORM = 'uniform',
    MIX = 'mix',
    ADD = 'add',
    SUB = 'sub',
    MUL = 'mul',
    DIV = 'div',
    SIN = 'sin',
    COS = 'cos',
    SMOOTHSTEP = 'smoothstep',
    STEP = 'step',
    DOT = 'dot',
    NORMALIZE = 'normalize',
    ABS = 'abs',
    POW = 'pow'
}

/**
 * 材质节点配置
 */
export interface MaterialNodeConfig {
    type: MaterialNodeType;
    name: string;
    inputs?: { [key: string]: MaterialNodeConfig | any };
}

/**
 * TSL材质构建器
 * 允许用户通过配置创建自定义TSL材质
 */
export class TSLMaterialBuilder {
    private nodeCache: Map<string, Node> = new Map();
    private materialLibrary: TSLMaterialLibrary;
    
    constructor() {
        this.materialLibrary = TSLMaterialLibrary.getInstance();
    }
    
    /**
     * 从配置创建材质
     */
    public createMaterialFromConfig(config: {
        name: string;
        colorNode?: MaterialNodeConfig;
        opacityNode?: MaterialNodeConfig;
        emissiveNode?: MaterialNodeConfig;
        normalNode?: MaterialNodeConfig;
        params?: MaterialParameters;
    }): TSLMaterial {
        // 创建材质更新回调
        const updateCallback = (material: MeshStandardNodeMaterial, params: MaterialParameters) => {
            this.nodeCache.clear();
            
            // 设置材质节点
            if (config.colorNode) {
                material.colorNode = this.createNodeFromConfig(config.colorNode, params);
            }
            
            if (config.opacityNode) {
                material.opacityNode = this.createNodeFromConfig(config.opacityNode, params);
            }
            
            if (config.emissiveNode) {
                material.emissiveNode = this.createNodeFromConfig(config.emissiveNode, params);
            }
            
            if (config.normalNode) {
                material.normalNode = this.createNodeFromConfig(config.normalNode, params);
            }
        };
        
        // 注册材质
        this.materialLibrary.registerMaterial(config.name, updateCallback);
        
        // 创建材质实例
        return this.materialLibrary.createMaterial(config.name, config.params || {})!;
    }
    
    /**
     * 从配置创建节点
     */
    private createNodeFromConfig(config: MaterialNodeConfig, params: MaterialParameters): Node {
        // 检查缓存
        if (this.nodeCache.has(config.name)) {
            return this.nodeCache.get(config.name)!;
        }
        
        let node: Node;
        
        switch (config.type) {
            case MaterialNodeType.COLOR:
                const colorValue = config.inputs?.value || params[config.name] || new THREE.Color(0xffffff);
                node = color(colorValue);
                break;
                
            case MaterialNodeType.TEXTURE:
                const textureValue = config.inputs?.value || params[config.name];
                const textureUV = config.inputs?.uv 
                    ? this.createNodeFromConfig(config.inputs.uv, params)
                    : uv();
                node = texture(textureValue, textureUV);
                break;
                
            case MaterialNodeType.UV:
                node = uv();
                break;
                
            case MaterialNodeType.FLOAT:
                const floatValue = config.inputs?.value || params[config.name] || 0.0;
                node = float(floatValue);
                break;
                
            case MaterialNodeType.VEC2:
                const vec2X = config.inputs?.x
                    ? this.createNodeFromConfig(config.inputs.x, params)
                    : float(config.inputs?.xValue || params[`${config.name}_x`] || 0.0);
                const vec2Y = config.inputs?.y
                    ? this.createNodeFromConfig(config.inputs.y, params)
                    : float(config.inputs?.yValue || params[`${config.name}_y`] || 0.0);
                node = vec2(vec2X, vec2Y);
                break;
                
            case MaterialNodeType.VEC3:
                const vec3X = config.inputs?.x
                    ? this.createNodeFromConfig(config.inputs.x, params)
                    : float(config.inputs?.xValue || params[`${config.name}_x`] || 0.0);
                const vec3Y = config.inputs?.y
                    ? this.createNodeFromConfig(config.inputs.y, params)
                    : float(config.inputs?.yValue || params[`${config.name}_y`] || 0.0);
                const vec3Z = config.inputs?.z
                    ? this.createNodeFromConfig(config.inputs.z, params)
                    : float(config.inputs?.zValue || params[`${config.name}_z`] || 0.0);
                node = vec3(vec3X, vec3Y, vec3Z);
                break;
                
            case MaterialNodeType.TIME:
                node = time();
                break;
                
            case MaterialNodeType.UNIFORM:
                const uniformValue = params[config.name] || config.inputs?.defaultValue || 0.0;
                node = uniform(uniformValue);
                break;
                
            case MaterialNodeType.MIX:
                const mixA = this.createNodeFromConfig(config.inputs?.a, params);
                const mixB = this.createNodeFromConfig(config.inputs?.b, params);
                const mixT = this.createNodeFromConfig(config.inputs?.t, params);
                node = mix(mixA, mixB, mixT);
                break;
                
            case MaterialNodeType.ADD:
                const addA = this.createNodeFromConfig(config.inputs?.a, params);
                const addB = this.createNodeFromConfig(config.inputs?.b, params);
                node = add(addA, addB);
                break;
                
            case MaterialNodeType.SUB:
                const subA = this.createNodeFromConfig(config.inputs?.a, params);
                const subB = this.createNodeFromConfig(config.inputs?.b, params);
                node = sub(subA, subB);
                break;
                
            case MaterialNodeType.MUL:
                const mulA = this.createNodeFromConfig(config.inputs?.a, params);
                const mulB = this.createNodeFromConfig(config.inputs?.b, params);
                node = mul(mulA, mulB);
                break;
                
            case MaterialNodeType.SIN:
                const sinA = this.createNodeFromConfig(config.inputs?.a, params);
                node = sin(sinA);
                break;
                
            case MaterialNodeType.COS:
                const cosA = this.createNodeFromConfig(config.inputs?.a, params);
                node = cos(cosA);
                break;
                
            case MaterialNodeType.SMOOTHSTEP:
                const ssEdge0 = this.createNodeFromConfig(config.inputs?.edge0, params);
                const ssEdge1 = this.createNodeFromConfig(config.inputs?.edge1, params);
                const ssX = this.createNodeFromConfig(config.inputs?.x, params);
                node = smoothstep(ssEdge0, ssEdge1, ssX);
                break;
                
            case MaterialNodeType.NORMALIZE:
                const normA = this.createNodeFromConfig(config.inputs?.a, params);
                node = normalize(normA);
                break;
                
            default:
                console.warn(`Unknown node type: ${config.type}`);
                node = float(0.0);
                break;
        }
        
        // 缓存节点
        this.nodeCache.set(config.name, node);
        
        return node;
    }
    
    /**
     * 创建溶解材质的例子
     */
    public createDissolveMaterial(name: string, params: MaterialParameters): TSLMaterial {
        const config = {
            name,
            colorNode: {
                type: MaterialNodeType.MIX,
                name: 'finalColor',
                inputs: {
                    a: {
                        type: MaterialNodeType.TEXTURE,
                        name: 'baseTexture',
                        inputs: {
                            value: null, // 将从params中获取
                            uv: {
                                type: MaterialNodeType.UV,
                                name: 'baseUV'
                            }
                        }
                    },
                    b: {
                        type: MaterialNodeType.COLOR,
                        name: 'edgeColor',
                        inputs: {
                            value: new THREE.Color(0xff0000)
                        }
                    },
                    t: {
                        type: MaterialNodeType.SMOOTHSTEP,
                        name: 'dissolveEdge',
                        inputs: {
                            edge0: {
                                type: MaterialNodeType.SUB,
                                name: 'dissolveMin',
                                inputs: {
                                    a: {
                                        type: MaterialNodeType.UNIFORM,
                                        name: 'dissolveAmount'
                                    },
                                    b: {
                                        type: MaterialNodeType.UNIFORM,
                                        name: 'edgeWidth'
                                    }
                                }
                            },
                            edge1: {
                                type: MaterialNodeType.ADD,
                                name: 'dissolveMax',
                                inputs: {
                                    a: {
                                        type: MaterialNodeType.UNIFORM,
                                        name: 'dissolveAmount'
                                    },
                                    b: {
                                        type: MaterialNodeType.UNIFORM,
                                        name: 'edgeWidth'
                                    }
                                }
                            },
                            x: {
                                type: MaterialNodeType.TEXTURE,
                                name: 'noiseTexture',
                                inputs: {
                                    value: null, // 将从params中获取
                                    uv: {
                                        type: MaterialNodeType.UV,
                                        name: 'noiseUV'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            opacityNode: {
                type: MaterialNodeType.FLOAT,
                name: 'dissolveOpacity',
                inputs: {
                    value: 1.0
                }
            },
            params
        };
        
        return this.createMaterialFromConfig(config);
    }
} 