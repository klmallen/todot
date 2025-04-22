import * as THREE from 'three';
import { TSLMaterialLibrary, MaterialParameters } from '../engine/core/materials/TSLMaterialLibrary';
import { TSLMaterialBuilder, MaterialNodeType } from '../engine/core/materials/TSLMaterialBuilder';
import { Engine } from '../engine/core/Engine';

/**
 * TSL材质示例
 * 展示如何使用TSL材质系统
 */
export class TslMaterialExample {
    private engine: Engine;
    private materialLibrary: TSLMaterialLibrary;
    private materialBuilder: TSLMaterialBuilder;
    private particleSystem: THREE.Points;
    private particleMaterial: any; // TSLMaterial
    
    constructor() {
        // 初始化引擎
        this.engine = new Engine();
        this.engine.init();
        
        // 获取材质库和构建器
        this.materialLibrary = TSLMaterialLibrary.getInstance();
        this.materialBuilder = new TSLMaterialBuilder();
        
        // 创建场景
        this.setupScene();
        
        // 创建UI
        this.createUI();
    }
    
    /**
     * 设置场景
     */
    private setupScene(): void {
        // 创建相机
        const camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        camera.position.z = 5;
        this.engine.setCamera(camera);
        
        // 创建光源
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        this.engine.getScene().add(light);
        
        // 创建粒子系统
        this.createParticleSystem();
    }
    
    /**
     * 创建粒子系统
     */
    private createParticleSystem(): void {
        // 加载纹理
        const textureLoader = new THREE.TextureLoader();
        const particleTexture = textureLoader.load('textures/particle.png');
        const noiseTexture = textureLoader.load('textures/noise.png');
        
        // 创建溶解材质
        const dissolveParams: MaterialParameters = {
            baseTexture: particleTexture,
            noiseTexture: noiseTexture,
            dissolveAmount: 0.5,
            edgeWidth: 0.1,
            edgeColor: new THREE.Color(0xff0000)
        };
        
        // 方法1: 使用预设材质
        // this.particleMaterial = this.materialLibrary.createMaterial('dissolve', dissolveParams);
        
        // 方法2: 使用材质构建器的预设
        // this.particleMaterial = this.materialBuilder.createDissolveMaterial('customDissolve', dissolveParams);
        
        // 方法3: 使用材质构建器手动创建
        this.particleMaterial = this.materialBuilder.createMaterialFromConfig({
            name: 'customParticleMaterial',
            colorNode: {
                type: MaterialNodeType.MIX,
                name: 'finalColor',
                inputs: {
                    a: {
                        type: MaterialNodeType.TEXTURE,
                        name: 'baseTexture',
                        inputs: {
                            value: particleTexture
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
                                        name: 'dissolveAmount',
                                        inputs: {
                                            defaultValue: 0.5
                                        }
                                    },
                                    b: {
                                        type: MaterialNodeType.UNIFORM,
                                        name: 'edgeWidth',
                                        inputs: {
                                            defaultValue: 0.1
                                        }
                                    }
                                }
                            },
                            edge1: {
                                type: MaterialNodeType.ADD,
                                name: 'dissolveMax',
                                inputs: {
                                    a: {
                                        type: MaterialNodeType.UNIFORM,
                                        name: 'dissolveAmount',
                                        inputs: {
                                            defaultValue: 0.5
                                        }
                                    },
                                    b: {
                                        type: MaterialNodeType.UNIFORM,
                                        name: 'edgeWidth',
                                        inputs: {
                                            defaultValue: 0.1
                                        }
                                    }
                                }
                            },
                            x: {
                                type: MaterialNodeType.TEXTURE,
                                name: 'noiseTexture',
                                inputs: {
                                    value: noiseTexture
                                }
                            }
                        }
                    }
                }
            },
            params: dissolveParams
        });
        
        // 创建粒子几何体
        const particleCount = 1000;
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
            sizes[i] = Math.random() * 0.5 + 0.1;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // 创建粒子系统
        this.particleSystem = new THREE.Points(
            geometry,
            this.particleMaterial.getMaterial()
        );
        this.engine.getScene().add(this.particleSystem);
        
        // 动画
        const animate = () => {
            requestAnimationFrame(animate);
            
            // 旋转粒子系统
            this.particleSystem.rotation.y += 0.001;
            
            // 更新材质
            this.updateMaterial();
        };
        
        animate();
    }
    
    /**
     * 更新材质
     */
    private updateMaterial(): void {
        // 获取随时间变化的溶解值
        const dissolveAmount = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
        
        // 更新材质参数
        this.particleMaterial.setParameters({
            dissolveAmount
        });
    }
    
    /**
     * 创建UI
     */
    private createUI(): void {
        // 创建控制面板
        const panel = document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.top = '10px';
        panel.style.right = '10px';
        panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        panel.style.padding = '10px';
        panel.style.borderRadius = '5px';
        panel.style.color = 'white';
        document.body.appendChild(panel);
        
        // 标题
        const title = document.createElement('h3');
        title.textContent = 'TSL材质控制';
        title.style.margin = '0 0 10px 0';
        panel.appendChild(title);
        
        // 溶解控制
        this.createSlider(panel, '溶解量', 0, 1, 0.5, 0.01, (value) => {
            this.particleMaterial.setParameters({ dissolveAmount: value });
        });
        
        // 边缘宽度控制
        this.createSlider(panel, '边缘宽度', 0, 0.5, 0.1, 0.01, (value) => {
            this.particleMaterial.setParameters({ edgeWidth: value });
        });
        
        // 颜色控制
        this.createColorPicker(panel, '边缘颜色', '#ff0000', (value) => {
            this.particleMaterial.setParameters({ 
                edgeColor: new THREE.Color(value) 
            });
        });
    }
    
    /**
     * 创建滑块控件
     */
    private createSlider(
        parent: HTMLElement, 
        label: string, 
        min: number, 
        max: number, 
        value: number, 
        step: number, 
        onChange: (value: number) => void
    ): HTMLInputElement {
        const container = document.createElement('div');
        container.style.marginBottom = '10px';
        
        const labelElem = document.createElement('label');
        labelElem.textContent = `${label}: `;
        container.appendChild(labelElem);
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min.toString();
        slider.max = max.toString();
        slider.value = value.toString();
        slider.step = step.toString();
        slider.style.width = '100%';
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = value.toString();
        valueDisplay.style.marginLeft = '10px';
        
        slider.addEventListener('input', () => {
            const newValue = parseFloat(slider.value);
            valueDisplay.textContent = newValue.toFixed(2);
            onChange(newValue);
        });
        
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        parent.appendChild(container);
        
        return slider;
    }
    
    /**
     * 创建颜色选择器
     */
    private createColorPicker(
        parent: HTMLElement, 
        label: string, 
        value: string, 
        onChange: (value: string) => void
    ): HTMLInputElement {
        const container = document.createElement('div');
        container.style.marginBottom = '10px';
        
        const labelElem = document.createElement('label');
        labelElem.textContent = `${label}: `;
        container.appendChild(labelElem);
        
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = value;
        
        colorPicker.addEventListener('input', () => {
            onChange(colorPicker.value);
        });
        
        container.appendChild(colorPicker);
        parent.appendChild(container);
        
        return colorPicker;
    }
} 