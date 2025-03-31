import { Component } from '../core/Component';
import { GameObject } from '../core/GameObject';
import { MeshFilter } from './MeshFilter';
import * as THREE from 'three';

export class MeshRenderer extends Component {
    private material: THREE.Material | null = null;
    private mesh: THREE.Mesh | null = null;

    constructor(gameObject: GameObject) {
        super(gameObject);
        console.log(gameObject,'gameObject')
    }

    onEnable(): void {
        this.updateMesh();
        if (this.mesh) {
            this.gameObject.getObject3D().add(this.mesh);
        }
    }

    onDisable(): void {
        if (this.mesh) {
            this.gameObject.getObject3D().remove(this.mesh);
        }
    }

    onDestroy(): void {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(material => material.dispose());
            } else if (this.mesh.material) {
                this.mesh.material.dispose();
            }
            this.gameObject.getObject3D().remove(this.mesh);
            this.mesh = null;
        }
    }

    setMaterial(material: THREE.Material): void {
        this.material = material;
        this.updateMesh();
    }

    getMaterial(): THREE.Material | null {
        return this.material;
    }

    getMesh(): THREE.Mesh | null {
        return this.mesh;
    }

    // 当MeshFilter更新时会被调用
    notifyGeometryChanged(): void {
        this.updateMesh();
    }

    private updateMesh(): void {
        console.log(this?.gameObject,'this?.gameObject')

        const meshFilter = this?.gameObject?.getComponent(MeshFilter);
        if (meshFilter && this.material) {
            const geometry = meshFilter.getGeometry();
            if (geometry) {
                if (this.mesh) {
                    // 更新现有mesh
                    this.mesh.geometry = geometry;
                    this.mesh.material = this.material;
                } else {
                    // 创建新mesh
                    this.mesh = new THREE.Mesh(geometry, this.material);
                    if (this.enabled) {
                        this.gameObject.getObject3D().add(this.mesh);
                    }
                }
            }
        }
    }
} 