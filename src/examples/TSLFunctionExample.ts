import * as THREE from 'three';
import { Engine } from '../engine/core/Engine';
import { TSLMaterialCustomizer } from '../engine/core/materials/TSLMaterialCustomizer';
import { TSLFunctionLibrary } from '../engine/core/materials/TSLFunctionLibrary';
import { 
    float, color, texture, uv, time, uniform
} from 'three/tsl';

/**
 * TSL函数库示例
 * 展示如何使用TSL函数库创建复杂的材质效果
 */
export class TSLFunctionExample {
    private engine: Engine;
    private tslFunctions: TSLFunctionLibrary;
    private scene: THREE.Scene;
    private objects: THREE.Mesh[] = [];
    private materials: any[] = [];
    
    constructor() {
        // 初始化引擎
        this.engine = new Engine();
        this.engine.init();
        this.scene = this.engine.getScene();
        
        // 获取函数库
        this.tslFunctions = TSLFunctionLibrary.getInstance();
        
        // 创建演示场景
        this.setupScene();
        
        // 创建UI
        this.createUI();
        
        // 动画循环
        this.animate();
    }
    
    /**
     * 设置场景
     */
    private setupScene(): void {
        // 创建相机
        const camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        camera.position.set(0, 2, 5);
        this.engine.setCamera(camera);
        
        // 创建光源
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 2, 3);
        this.scene.add(directionalLight);
        
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // 加载纹理
        const textureLoader = new THREE.TextureLoader();
        const baseTexture = textureLoader.load('textures/base.jpg');
        const noiseTexture = textureLoader.load('textures/noise.jpg');
        const distortionTexture = textureLoader.load('textures/distortion.jpg');
        
        // 创建各种示例材质
        this.createDissolveMaterial(baseTexture, noiseTexture);
        this.createGlowMaterial();
        this.createDistortionMaterial(baseTexture, distortionTexture);
        this.createToonMaterial();
        this.createCheckerboardMaterial();
        this.createVertexAnimationMaterial();
        
        // 创建地面
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        this.scene.add(ground);
    }
    
    /**
     * 创建溶解材质示例
     */
    private createDissolveMaterial(baseTexture: THREE.Texture, noiseTexture: THREE.Texture): void {
        // 创建溶解材质
        const customizer = new TSLMaterialCustomizer('dissolveExample');
        
        // 创建uniform节点
        const dissolveAmount = customizer.createUniform('dissolveAmount', 0.5);
        const edgeWidth = customizer.createUniform('edgeWidth', 0.1);
        const edgeColor = customizer.createUniform('edgeColor', new THREE.Color(0xff0000));
        
        // 使用函数库创建溶解效果
        const baseColorNode = texture(baseTexture, uv());
        const dissolveEffect = this.tslFunctions.createDissolveEffect(
            baseColorNode,
            noiseTexture,
            edgeColor,
            dissolveAmount,
            edgeWidth
        );
        
        // 设置材质节点
        customizer.setColorNode(dissolveEffect.color);
        customizer.setOpacityNode(dissolveEffect.opacity);
        
        // 构建材质
        const material = customizer.build();
        this.materials.push(material);
        
        // 创建网格
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const mesh = new THREE.Mesh(geometry, material.getMaterial());
        mesh.position.set(-2.5, 0, 0);
        this.scene.add(mesh);
        this.objects.push(mesh);
    }
    
    /**
     * 创建发光材质示例
     */
    private createGlowMaterial(): void {
        // 创建发光材质
        const customizer = new TSLMaterialCustomizer('glowExample');
        
        // 创建uniform节点
        const baseColor = customizer.createUniform('baseColor', new THREE.Color(0x2266cc));
        const glowColor = customizer.createUniform('glowColor', new THREE.Color(0x00ffff));
        const glowIntensity = customizer.createUniform('glowIntensity', 1.0);
        const pulseSpeed = customizer.createUniform('pulseSpeed', 2.0);
        
        // 使用函数库创建发光效果
        const glowEffect = this.tslFunctions.createGlowEffect(
            color(baseColor),
            color(glowColor),
            float(glowIntensity),
            float(pulseSpeed)
        );
        
        // 设置材质节点
        customizer.setColorNode(glowEffect.color);
        customizer.setEmissiveNode(glowEffect.emissive);
        
        // 构建材质
        const material = customizer.build();
        this.materials.push(material);
        
        // 创建网格
        const geometry = new THREE.TorusGeometry(0.3, 0.15, 16, 32);
        const mesh = new THREE.Mesh(geometry, material.getMaterial());
        mesh.position.set(-1.5, 0, 0);
        this.scene.add(mesh);
        this.objects.push(mesh);
    }
    
    /**
     * 创建扭曲材质示例
     */
    private createDistortionMaterial(baseTexture: THREE.Texture, distortionTexture: THREE.Texture): void {
        // 创建扭曲材质
        const customizer = new TSLMaterialCustomizer('distortionExample');
        
        // 创建uniform节点
        const distortionStrength = customizer.createUniform('distortionStrength', 0.2);
        const distortionSpeed = customizer.createUniform('distortionSpeed', 0.5);
        
        // 使用函数库创建UV扭曲
        const distortedUV = this.tslFunctions.createUVDistortion(
            uv(),
            distortionTexture,
            float(distortionStrength),
            float(distortionSpeed)
        );
        
        // 设置材质节点
        customizer.setColorNode(texture(baseTexture, distortedUV));
        
        // 构建材质
        const material = customizer.build();
        this.materials.push(material);
        
        // 创建网格
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const mesh = new THREE.Mesh(geometry, material.getMaterial());
        mesh.position.set(-0.5, 0, 0);
        this.scene.add(mesh);
        this.objects.push(mesh);
    }
    
    /**
     * 创建卡通着色示例
     */
    private createToonMaterial(): void {
        // 创建卡通材质
        const customizer = new TSLMaterialCustomizer('toonExample');
        
        // 创建uniform节点
        const baseColor = customizer.createUniform('baseColor', new THREE.Color(0xff5533));
        const lightColor = customizer.createUniform('lightColor', new THREE.Color(0xffff99));
        const shadowColor = customizer.createUniform('shadowColor', new THREE.Color(0x661100));
        const steps = customizer.createUniform('steps', 3.0);
        
        // 使用函数库创建卡通着色
        const toonColor = this.tslFunctions.createToonShading(
            color(baseColor),
            color(lightColor),
            color(shadowColor),
            float(steps)
        );
        
        // 设置材质节点
        customizer.setColorNode(toonColor);
        
        // 构建材质
        const material = customizer.build();
        this.materials.push(material);
        
        // 创建网格
        const geometry = new THREE.TetrahedronGeometry(0.5, 0);
        const mesh = new THREE.Mesh(geometry, material.getMaterial());
        mesh.position.set(0.5, 0, 0);
        this.scene.add(mesh);
        this.objects.push(mesh);
    }
    
    /**
     * 创建棋盘格材质示例
     */
    private createCheckerboardMaterial(): void {
        // 创建棋盘格材质
        const customizer = new TSLMaterialCustomizer('checkerboardExample');
        
        // 创建uniform节点
        const colorA = customizer.createUniform('colorA', new THREE.Color(0x222222));
        const colorB = customizer.createUniform('colorB', new THREE.Color(0xeeeeee));
        const scale = customizer.createUniform('scale', 8.0);
        
        // 使用函数库创建棋盘格
        const checkerboard = this.tslFunctions.createCheckerboard(
            color(colorA),
            color(colorB),
            float(scale)
        );
        
        // 设置材质节点
        customizer.setColorNode(checkerboard);
        
        // 构建材质
        const material = customizer.build();
        this.materials.push(material);
        
        // 创建网格
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const mesh = new THREE.Mesh(geometry, material.getMaterial());
        mesh.position.set(1.5, 0, 0);
        this.scene.add(mesh);
        this.objects.push(mesh);
    }
    
    /**
     * 创建顶点动画材质示例
     */
    private createVertexAnimationMaterial(): void {
        // 创建顶点动画材质
        const customizer = new TSLMaterialCustomizer('vertexAnimationExample');
        
        // 创建uniform节点
        const baseColor = customizer.createUniform('baseColor', new THREE.Color(0x22cc66));
        const amplitude = customizer.createUniform('amplitude', 0.2);
        const frequency = customizer.createUniform('frequency', 1.5);
        const noiseScale = customizer.createUniform('noiseScale', 3.0);
        
        // 使用函数库创建顶点动画
        const vertexOffset = this.tslFunctions.createVertexAnimation(
            float(amplitude),
            float(frequency),
            float(noiseScale)
        );
        
        // 创建菲涅尔效果
        const fresnel = this.tslFunctions.createFresnelEffect(
            color(baseColor),
            color(0xffffff),
            float(2.0)
        );
        
        // 设置材质节点
        customizer.setColorNode(fresnel);
        
        // 构建材质
        const material = customizer.build();
        this.materials.push(material);
        
        // 创建网格 - 注意: 为了实际应用顶点动画，需要在材质上设置positionNode
        const geometry = new THREE.OctahedronGeometry(0.5, 2);
        const mesh = new THREE.Mesh(geometry, material.getMaterial());
        mesh.position.set(2.5, 0, 0);
        this.scene.add(mesh);
        this.objects.push(mesh);
        
        // 注意: 这里需要将vertexOffset应用到position节点
        // 但由于当前的API限制，这里仅作演示，不实际应用
    }
    
    /**
     * 动画循环
     */
    private animate(): void {
        const clock = new THREE.Clock();
        
        const loop = () => {
            requestAnimationFrame(loop);
            
            const deltaTime = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();
            
            // 旋转对象
            this.objects.forEach((obj, index) => {
                obj.rotation.y += deltaTime * (0.5 + index * 0.1);
                obj.rotation.x = Math.sin(elapsedTime * 0.5 + index) * 0.2;
            });
            
            // 动态更新溶解材质
            if (this.materials[0]) {
                this.materials[0].setParameters({
                    dissolveAmount: Math.sin(elapsedTime * 0.5) * 0.5 + 0.5
                });
            }
            
            // 动态更新发光材质
            if (this.materials[1]) {
                this.materials[1].setParameters({
                    glowIntensity: Math.sin(elapsedTime) * 0.5 + 1.0
                });
            }
        };
        
        loop();
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
        panel.style.minWidth = '250px';
        panel.style.maxWidth = '300px';
        document.body.appendChild(panel);
        
        // 标题
        const title = document.createElement('h3');
        title.textContent = 'TSL函数库示例';
        title.style.margin = '0 0 10px 0';
        panel.appendChild(title);
        
        // 说明
        const description = document.createElement('p');
        description.textContent = '这个示例展示了如何使用TSL函数库创建各种材质效果。从左到右依次为：溶解、发光、UV扭曲、卡通着色、棋盘格和顶点动画。';
        description.style.fontSize = '12px';
        description.style.marginBottom = '15px';
        panel.appendChild(description);
        
        // 控制：溶解
        this.createControlGroup(panel, '溶解效果', [
            {
                name: '溶解量',
                min: 0,
                max: 1,
                value: 0.5,
                step: 0.01,
                param: 'dissolveAmount',
                materialIndex: 0
            },
            {
                name: '边缘宽度',
                min: 0,
                max: 0.3,
                value: 0.1,
                step: 0.01,
                param: 'edgeWidth',
                materialIndex: 0
            }
        ]);
        
        // 控制：发光
        this.createControlGroup(panel, '发光效果', [
            {
                name: '发光强度',
                min: 0,
                max: 3,
                value: 1.0,
                step: 0.1,
                param: 'glowIntensity',
                materialIndex: 1
            },
            {
                name: '脉冲速度',
                min: 0,
                max: 5,
                value: 2.0,
                step: 0.1,
                param: 'pulseSpeed',
                materialIndex: 1
            }
        ]);
        
        // 控制：扭曲
        this.createControlGroup(panel, 'UV扭曲', [
            {
                name: '扭曲强度',
                min: 0,
                max: 1,
                value: 0.2,
                step: 0.01,
                param: 'distortionStrength',
                materialIndex: 2
            },
            {
                name: '扭曲速度',
                min: 0,
                max: 2,
                value: 0.5,
                step: 0.1,
                param: 'distortionSpeed',
                materialIndex: 2
            }
        ]);
        
        // 控制：卡通
        this.createControlGroup(panel, '卡通着色', [
            {
                name: '着色层级',
                min: 1,
                max: 10,
                value: 3,
                step: 1,
                param: 'steps',
                materialIndex: 3
            }
        ]);
        
        // 控制：棋盘格
        this.createControlGroup(panel, '棋盘格', [
            {
                name: '缩放',
                min: 1,
                max: 20,
                value: 8,
                step: 1,
                param: 'scale',
                materialIndex: 4
            }
        ]);
        
        // 控制：顶点动画
        this.createControlGroup(panel, '顶点动画', [
            {
                name: '振幅',
                min: 0,
                max: 0.5,
                value: 0.2,
                step: 0.01,
                param: 'amplitude',
                materialIndex: 5
            },
            {
                name: '频率',
                min: 0,
                max: 5,
                value: 1.5,
                step: 0.1,
                param: 'frequency',
                materialIndex: 5
            }
        ]);
    }
    
    /**
     * 创建控制组
     */
    private createControlGroup(parent: HTMLElement, title: string, controls: {
        name: string;
        min: number;
        max: number;
        value: number;
        step: number;
        param: string;
        materialIndex: number;
    }[]): void {
        const group = document.createElement('div');
        group.style.marginBottom = '15px';
        parent.appendChild(group);
        
        // 标题
        const titleElem = document.createElement('h4');
        titleElem.textContent = title;
        titleElem.style.margin = '0 0 5px 0';
        titleElem.style.fontSize = '14px';
        group.appendChild(titleElem);
        
        // 控制项
        controls.forEach(control => {
            const container = document.createElement('div');
            container.style.marginBottom = '5px';
            
            const label = document.createElement('label');
            label.textContent = `${control.name}: `;
            label.style.fontSize = '12px';
            container.appendChild(label);
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = control.min.toString();
            slider.max = control.max.toString();
            slider.value = control.value.toString();
            slider.step = control.step.toString();
            slider.style.width = '100%';
            
            const valueElem = document.createElement('span');
            valueElem.textContent = control.value.toString();
            valueElem.style.fontSize = '10px';
            valueElem.style.float = 'right';
            
            slider.addEventListener('input', () => {
                const value = parseFloat(slider.value);
                valueElem.textContent = value.toFixed(2);
                
                // 更新材质参数
                const material = this.materials[control.materialIndex];
                if (material) {
                    const params: { [key: string]: any } = {};
                    params[control.param] = value;
                    material.setParameters(params);
                }
            });
            
            container.appendChild(valueElem);
            container.appendChild(slider);
            group.appendChild(container);
        });
    }
} 