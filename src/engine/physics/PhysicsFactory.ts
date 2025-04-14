import * as THREE from 'three';
import { Node3d } from '../core/Node3d';
import { MeshInstance3D } from '../core/MeshInstance3D';
import { ModelLoader3D } from '../core/ModelLoader3D';
import { PhysicsEnhancer, PhysicsOptions, IPhysicsCapable } from './PhysicsEnhancer';
import { CannonColliderType } from './CannonCollider';

/**
 * 物理工厂
 * 提供便捷的方法来创建带有物理能力的节点
 */
export class PhysicsFactory {
  /**
   * 为任意Node3d节点添加物理能力
   * @param node 要增强的节点
   * @param options 物理配置选项
   * @returns 增强后的节点
   */
  public static addPhysicsToNode<T extends Node3d>(node: T, options: PhysicsOptions = {}): T & IPhysicsCapable {
    return PhysicsEnhancer.enhance(node, options);
  }
  
  /**
   * 为MeshInstance3D节点添加物理能力
   * @param mesh 要增强的网格实例
   * @param options 物理配置选项
   * @returns 增强后的网格实例
   */
  public static addPhysicsToMesh(mesh: MeshInstance3D, options: PhysicsOptions = {}): MeshInstance3D & IPhysicsCapable {
    // 如果未指定碰撞体类型，根据几何体类型自动选择
    if (!options.colliderType) {
      options.colliderType = this.determineColliderType(mesh);
    }
    
    return PhysicsEnhancer.enhance(mesh, options);
  }
  
  /**
   * 为ModelLoader3D节点添加物理能力
   * @param model 要增强的模型加载器
   * @param options 物理配置选项
   * @returns 增强后的模型加载器
   */
  public static addPhysicsToModel(model: ModelLoader3D, options: PhysicsOptions = {}): ModelLoader3D & IPhysicsCapable {
    // 如果模型已加载，立即添加物理能力
    PhysicsEnhancer.enhance(model, options);
    
    // 返回增强的模型（注意：物理能力将在模型加载完成后才能正常使用）
    return model as ModelLoader3D & IPhysicsCapable;
  }
  
  /**
   * 创建一个带有物理能力的立方体
   * @param name 节点名称
   * @param size 立方体尺寸
   * @param options 物理配置选项
   * @returns 带有物理能力的立方体节点
   */
  public static createPhysicsBox(
    name: string = '物理立方体',
    size: THREE.Vector3 | number = new THREE.Vector3(1, 1, 1),
    options: PhysicsOptions = {}
  ): MeshInstance3D & IPhysicsCapable {
    // 处理尺寸参数
    let boxSize: THREE.Vector3;
    if (typeof size === 'number') {
      boxSize = new THREE.Vector3(size, size, size);
    } else {
      boxSize = size;
    }
    
    // 创建几何体和材质
    const geometry = new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z);
    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    
    // 创建网格实例
    const box = new MeshInstance3D(name, geometry, material);
    
    // 设置默认的碰撞体类型
    const physicsOptions: PhysicsOptions = {
      colliderType: CannonColliderType.BOX,
      ...options
    };
    
    // 添加物理能力
    return PhysicsEnhancer.enhance(box, physicsOptions);
  }
  
  /**
   * 创建一个带有物理能力的球体
   * @param name 节点名称
   * @param radius 球体半径
   * @param options 物理配置选项
   * @returns 带有物理能力的球体节点
   */
  public static createPhysicsSphere(
    name: string = '物理球体',
    radius: number = 0.5,
    options: PhysicsOptions = {}
  ): MeshInstance3D & IPhysicsCapable {
    // 创建几何体和材质
    const geometry = new THREE.SphereGeometry(radius, 32, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    
    // 创建网格实例
    const sphere = new MeshInstance3D(name, geometry, material);
    
    // 设置默认的碰撞体类型
    const physicsOptions: PhysicsOptions = {
      colliderType: CannonColliderType.SPHERE,
      ...options
    };
    
    // 添加物理能力
    return PhysicsEnhancer.enhance(sphere, physicsOptions);
  }
  
  /**
   * 创建一个带有物理能力的圆柱体
   * @param name 节点名称
   * @param radius 圆柱体半径
   * @param height 圆柱体高度
   * @param options 物理配置选项
   * @returns 带有物理能力的圆柱体节点
   */
  public static createPhysicsCylinder(
    name: string = '物理圆柱体',
    radius: number = 0.5,
    height: number = 1,
    options: PhysicsOptions = {}
  ): MeshInstance3D & IPhysicsCapable {
    // 创建几何体和材质
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    
    // 创建网格实例
    const cylinder = new MeshInstance3D(name, geometry, material);
    
    // 设置默认的碰撞体类型
    const physicsOptions: PhysicsOptions = {
      colliderType: CannonColliderType.CYLINDER,
      ...options
    };
    
    // 添加物理能力
    return PhysicsEnhancer.enhance(cylinder, physicsOptions);
  }
  
  /**
   * 创建一个带有物理能力的平面
   * @param name 节点名称
   * @param width 平面宽度
   * @param height 平面高度
   * @param options 物理配置选项
   * @returns 带有物理能力的平面节点
   */
  public static createPhysicsPlane(
    name: string = '物理平面',
    width: number = 10,
    height: number = 10,
    options: PhysicsOptions = {}
  ): MeshInstance3D & IPhysicsCapable {
    // 创建几何体和材质
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      side: THREE.DoubleSide
    });
    
    // 创建网格实例
    const plane = new MeshInstance3D(name, geometry, material);
    
    // 平面默认为静态物体（质量为0）
    const physicsOptions: PhysicsOptions = {
      colliderType: CannonColliderType.PLANE,
      mass: 0,
      ...options
    };
    
    // 添加物理能力
    return PhysicsEnhancer.enhance(plane, physicsOptions);
  }
  
  /**
   * 根据网格几何体类型自动确定合适的碰撞体类型
   * @param mesh 网格实例
   * @returns 适合的碰撞体类型
   */
  private static determineColliderType(mesh: MeshInstance3D): CannonColliderType {
    const geometry = mesh.getGeometry();
    
    if (!geometry) return CannonColliderType.BOX;
    
    // 根据几何体类型选择碰撞体
    if (geometry instanceof THREE.BoxGeometry || geometry instanceof THREE.BoxBufferGeometry) {
      return CannonColliderType.BOX;
    } else if (geometry instanceof THREE.SphereGeometry || geometry instanceof THREE.SphereBufferGeometry) {
      return CannonColliderType.SPHERE;
    } else if (geometry instanceof THREE.CylinderGeometry || geometry instanceof THREE.CylinderBufferGeometry) {
      return CannonColliderType.CYLINDER;
    } else if (geometry instanceof THREE.PlaneGeometry || geometry instanceof THREE.PlaneBufferGeometry) {
      return CannonColliderType.PLANE;
    } else {
      // 复杂网格使用三角网格碰撞体
      return CannonColliderType.TRIMESH;
    }
  }
} 