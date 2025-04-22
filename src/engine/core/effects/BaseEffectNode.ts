import * as THREE from 'three';
import { Node3d } from '../Node3d';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { Node, NodeBuilder } from 'three/tsl';

/**
 * 基础特效节点类
 * 所有具体特效节点的基类
 */
export abstract class BaseEffectNode extends Node3d {
    protected originalMaterial: THREE.Material | null = null;
    protected nodeMaterial: MeshStandardNodeMaterial | null = null;
    protected effectNodes: Node[] = [];
    protected customNodes: { [key: string]: Node } = {};
    
    constructor(name: string) {
        super(name);
    }
    
    /**
     * 初始化特效
     */
    public initEffect(): void {
        this.saveOriginalMaterial();
        this.createNodeMaterial();
        this.buildEffectNodes();
        this.applyEffectMaterial();
    }
    
    /**
     * 创建节点材质
     */
    protected createNodeMaterial(): void {
        this.nodeMaterial = new MeshStandardNodeMaterial();
        this.nodeMaterial.side = THREE.DoubleSide;
        this.nodeMaterial.transparent = true;
    }
    
    /**
     * 构建效果节点
     */
    protected abstract buildEffectNodes(): void;
    
    /**
     * 添加效果节点
     */
    protected addEffectNode(node: Node): void {
        this.effectNodes.push(node);
    }
    
    /**
     * 添加自定义节点
     */
    public addCustomNode(name: string, node: Node): void {
        this.customNodes[name] = node;
    }
    
    /**
     * 获取自定义节点
     */
    public getCustomNode(name: string): Node | undefined {
        return this.customNodes[name];
    }
    
    /**
     * 更新特效参数
     */
    public abstract updateEffectParams(params: any): void;
    
    /**
     * 重置为原始材质
     */
    public resetToOriginalMaterial(): void {
        const mesh = this.getThreeObject().children[0] as THREE.Mesh;
        if (mesh && this.originalMaterial) {
            mesh.material = this.originalMaterial;
        }
    }
    
    /**
     * 保存原始材质
     */
    protected saveOriginalMaterial(): void {
        const mesh = this.getThreeObject().children[0] as THREE.Mesh;
        if (mesh && mesh.material) {
            this.originalMaterial = mesh.material;
        }
    }
    
    /**
     * 应用特效材质
     */
    protected applyEffectMaterial(): void {
        const mesh = this.getThreeObject().children[0] as THREE.Mesh;
        if (mesh && this.nodeMaterial) {
            mesh.material = this.nodeMaterial;
        }
    }
    
    /**
     * 获取节点材质
     */
    public getNodeMaterial(): MeshStandardNodeMaterial | null {
        return this.nodeMaterial;
    }
} 