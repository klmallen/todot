import * as THREE from 'three';

export class Camera {
  private camera: THREE.PerspectiveCamera;

  constructor(fov: number = 75, aspect: number = window.innerWidth / window.innerHeight, near: number = 0.1, far: number = 1000) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);
  }

  getThreeCamera(): THREE.Camera {
    return this.camera;
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  setRotation(x: number, y: number, z: number): void {
    this.camera.rotation.set(x, y, z);
  }

  lookAt(x: number, y: number, z: number): void {
    this.camera.lookAt(x, y, z);
  }

  updateProjectionMatrix(): void {
    this.camera.updateProjectionMatrix();
  }
} 