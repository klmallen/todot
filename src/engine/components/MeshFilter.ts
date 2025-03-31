import { Component } from '../core/Component';
import { GameObject } from '../core/GameObject';
import * as THREE from 'three';

// 为GameObject扩展类型定义
declare module '../core/GameObject' {
  interface GameObject {
    setMeshGeometry?: (geometry: THREE.BufferGeometry) => void;
    addMesh?: (geometry: THREE.BufferGeometry, material?: THREE.Material) => THREE.Mesh;
  }
}

// MeshFilter组件
export class MeshFilter extends Component {
    private geometry?: THREE.BufferGeometry;
    private mesh?: THREE.Mesh;
    
    setGeometry(geometry: THREE.BufferGeometry): void {
      this.geometry = geometry;
      
      // 如果已经有材质，自动更新mesh
      const renderer = this.gameObject.getComponent('MeshRenderer');
      if (renderer && renderer.getMaterial() && this.geometry) {
        this.createOrUpdateMesh(renderer.getMaterial());
      }
    }
    
    getGeometry(): THREE.BufferGeometry | undefined {
      return this.geometry;
    }
    
    getMesh(): THREE.Mesh | undefined {
      return this.mesh;
    }
    
    // 创建或更新mesh
    private createOrUpdateMesh(material: THREE.Material): THREE.Mesh {
      if (this.mesh) {
        this.mesh.geometry = this.geometry!;
        this.mesh.material = material;
      } else {
        this.mesh = new THREE.Mesh(this.geometry!, material);
        this.gameObject.transform.add(this.mesh);
      }
      return this.mesh;
    }
    
    // 扩展GameObject的方法
    onAttach(): void {
      // 添加方法到GameObject
      this.gameObject.setMeshGeometry = (geometry: THREE.BufferGeometry) => {
        this.setGeometry(geometry);
      };
      
      this.gameObject.addMesh = (geometry: THREE.BufferGeometry, material: THREE.Material = new THREE.MeshBasicMaterial()) => {
        this.setGeometry(geometry);
        const renderer = this.gameObject.getComponent('MeshRenderer');
        if (renderer) {
          renderer.setMaterial(material);
        } else {
          // 如果没有MeshRenderer组件，自动添加一个
          const meshRenderer = this.gameObject.addComponent('MeshRenderer');
          meshRenderer.setMaterial(material);
        }
        return this.createOrUpdateMesh(material);
      };
    }
    
    // 清理添加的方法
    onDetach(): void {
      delete this.gameObject.setMeshGeometry;
      delete this.gameObject.addMesh;
      
      // 移除mesh
      if (this.mesh && this.gameObject.transform) {
        this.gameObject.transform.remove(this.mesh);
        this.mesh = undefined;
      }
    }
}