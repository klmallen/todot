import * as THREE from 'three';
import { Node3d } from '../core/Node3d';
import { EventEmitter } from '../utils/EventEmitter';
import { editable, editableComponent } from '../core/decorators';
import Engine from '../core/Engine';

/**
 * 射线跟随模式枚举
 */
export enum RaycastFollowMode {
  /** 不跟随，使用固定方向 */
  NONE = 'none',
  /** 自动跟随目标 */
  AUTO = 'auto',
  /** 手动更新跟随 */
  MANUAL = 'manual'
}

/**
 * 射线投射结果接口
 */
export interface RaycastResult {
  /** 命中的节点 */
  node: Node3d | null;
  /** 命中点（世界空间） */
  point: THREE.Vector3;
  /** 命中法线 */
  normal: THREE.Vector3;
  /** 命中距离 */
  distance: number;
  /** 射线起点 */
  origin: THREE.Vector3;
  /** 射线方向 */
  direction: THREE.Vector3;
}

/**
 * 射线节点类
 * 用于创建射线并检测与场景中对象的碰撞
 */
@editableComponent({
  displayName: '射线节点',
  description: '创建射线并检测碰撞',
  icon: 'linear_scale',
  category: 'Input'
})
export class RaycastNode extends Node3d {
  // 射线投射器
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  
  // 事件发射器
  private events: EventEmitter = new EventEmitter();
  
  // 射线起点相对于节点的偏移
  @editable({
    displayName: '起点偏移',
    description: '射线起点相对于节点位置的偏移',
    type: 'vector3',
    group: 'Raycast'
  })
  private originOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  
  // 射线方向
  @editable({
    displayName: '方向',
    description: '射线的方向向量',
    type: 'vector3',
    group: 'Raycast'
  })
  private direction: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  
  // 射线最大距离
  @editable({
    displayName: '最大距离',
    description: '射线检测的最大距离',
    type: 'number',
    min: 0.1,
    max: 1000,
    group: 'Raycast'
  })
  private maxDistance: number = 100;
  
  // 是否启用
  @editable({
    displayName: '启用',
    description: '是否启用射线检测',
    type: 'boolean',
    group: 'Raycast'
  })
  private enabled: boolean = true;
  
  // 是否显示射线辅助
  @editable({
    displayName: '显示辅助线',
    description: '是否显示射线的可视化辅助线',
    type: 'boolean',
    group: 'Raycast'
  })
  private showHelper: boolean = true;
  
  // 射线辅助线颜色
  @editable({
    displayName: '辅助线颜色',
    description: '射线辅助线的颜色',
    type: 'color',
    group: 'Raycast'
  })
  private helperColor: THREE.Color = new THREE.Color(0xff0000);
  
  // 上次检测结果
  private lastResult: RaycastResult | null = null;
  
  // 所有上次检测到的命中结果
  private lastResults: RaycastResult[] = [];
  
  // 当前命中的节点
  private hitNode: Node3d | null = null;
  
  // 当前命中的所有节点
  private hitNodes: Set<Node3d> = new Set();
  
  // 射线辅助对象
  private helper: THREE.Line | null = null;
  
  // 是否根据方向朝向调整射线方向
  @editable({
    displayName: '使用节点朝向',
    description: '是否根据节点的朝向调整射线方向',
    type: 'boolean',
    group: 'Raycast'
  })
  private useNodeOrientation: boolean = false;
  
  // 是否持续检测
  @editable({
    displayName: '持续检测',
    description: '是否在每一帧中执行检测',
    type: 'boolean',
    group: 'Raycast'
  })
  private continuous: boolean = true;
  
  // 是否已创建辅助对象
  private helperCreated: boolean = false;
  
  // 射线目标节点
  @editable({
    displayName: '目标节点',
    description: '射线指向的目标节点',
    type: 'node',
    group: 'Target'
  })
  private targetNode: Node3d | null = null;
  
  // 射线跟随模式
  @editable({
    displayName: '跟随模式',
    description: '射线如何跟随目标节点',
    type: 'enum',
    options: [
      { label: '不跟随', value: RaycastFollowMode.NONE },
      { label: '自动跟随', value: RaycastFollowMode.AUTO },
      { label: '手动更新', value: RaycastFollowMode.MANUAL }
    ],
    group: 'Target'
  })
  private followMode: RaycastFollowMode = RaycastFollowMode.NONE;
  
  // 是否检测多个命中
  @editable({
    displayName: '多物体检测',
    description: '是否检测并返回多个命中结果',
    type: 'boolean',
    group: 'Raycast'
  })
  private multipleHits: boolean = false;
  
  // 目标偏移
  @editable({
    displayName: '目标偏移',
    description: '目标节点的偏移量',
    type: 'vector3',
    group: 'Target'
  })
  private targetOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // 是否从目标节点发射
  @editable({
    displayName: '从目标发射',
    description: '是否从目标节点位置发射射线',
    type: 'boolean',
    group: 'Target'
  })
  private emitFromTarget: boolean = false;

  // 自定义起点位置
  @editable({
    displayName: '自定义起点',
    description: '自定义射线起点位置',
    type: 'vector3',
    group: 'Raycast'
  })
  private customOrigin: THREE.Vector3 | null = null;

  // 添加新的属性，表示射线是否已设置
  @editable({
    displayName: '是否已设置',
    description: '射线参数是否已设置，未设置不会绘制和检测',
    type: 'boolean',
    group: 'Raycast'
  })
  private isSetup: boolean = false;

  // 在RaycastNode类中添加新属性
  @editable({
    displayName: '包围盒缩放',
    description: '碰撞检测包围盒的缩放系数',
    type: 'number',
    min: 0.1,
    max: 2.0,
    group: 'Raycast'
  })
  private boundingBoxScale: number = 1.0;

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = '射线节点') {
    super(name);
    this.raycaster.params.Line.threshold = 0.1;
    this.raycaster.params.Points.threshold = 0.1;
  }

  /**
   * 节点准备完成时调用
   */
  onReady(): void {
    // 创建射线辅助对象
    // if (this.showHelper) {
    //   this.createHelper();
    // }
  }

  /**
   * 节点进入场景时调用
   */
  onEnterScene(): void {
    // // 如果需要，创建辅助对象
    // if (this.showHelper && !this.helperCreated) {
    //   this.createHelper();
    // }
  }

  /**
   * 节点更新
   * @param deltaTime 时间间隔
   */
  update(deltaTime: number): void {
    super.update(deltaTime);
    
    if (!this.enabled) return;
    
    // 如果设置了目标节点且跟随模式为自动，更新射线方向
    if (this.targetNode && this.followMode === RaycastFollowMode.AUTO) {
      this.updateDirectionToTarget();
    }
    
    // 如果启用了持续检测，每帧执行一次检测
    if (this.continuous) {
      this.performRaycast();
    }
    
    // 更新辅助对象
    if (this.helper && this.showHelper) {
      this.updateHelper();
    }
  }

  /**
   * 更新射线方向指向目标
   */
  updateDirectionToTarget(): void {
    if (!this.targetNode) return;
    
    // 如果从目标节点发射，则方向就是目标节点的前向向量
    if (this.emitFromTarget) {
      if (this.useNodeOrientation) {
        // 已经在getDirection中处理了，不需要额外操作
        this.updateHelper();
        return;
      } else {
        // 设置方向为目标节点的前向向量
        const forward = this.getForwardVector(this.targetNode);
        this.direction.copy(forward);
      }
    } else {
      // 传统实现：从射线起点指向目标
      const origin = this.getOrigin();
      const targetPos = new THREE.Vector3();
      this.targetNode.getThreeObject().getWorldPosition(targetPos);
      
      // 应用目标偏移
      if (!this.targetOffset.equals(new THREE.Vector3())) {
        const targetQuat = new THREE.Quaternion();
        this.targetNode.getThreeObject().getWorldQuaternion(targetQuat);
        
        const offsetWorld = this.targetOffset.clone().applyQuaternion(targetQuat);
        targetPos.add(offsetWorld);
      }
      
      // 计算方向向量
      const direction = new THREE.Vector3().subVectors(targetPos, origin).normalize();
      
      // 如果不使用节点朝向，直接设置方向
      if (!this.useNodeOrientation) {
        this.direction.copy(direction);
      } else {
        // 否则需要更新节点的旋转，使其面向目标
        this.getThreeObject().lookAt(targetPos);
      }
    }
    
    this.updateHelper();
  }

  /**
   * 获取是否使用节点朝向
   * @returns 是否使用节点朝向
   */
  isUsingNodeOrientation(): boolean {
    return this.useNodeOrientation;
  }

  /**
   * 创建射线辅助对象
   */
  private createHelper(): void {
    // 射线的起点和终点
    const origin = this.getOrigin();
    let direction: THREE.Vector3;
    
    // 打印原始方向向量，方便诊断
    // console.log('原始设置的方向向量:', this.direction);
    // console.log('是否使用节点朝向:', this.useNodeOrientation);
    
    // 先尝试直接使用原始方向，不经过四元数转换
    direction = this.direction.clone().normalize();
    // console.log('直接使用原始方向(不经过转换):', direction);
    
    // 为了帮助调试，绘制两条线：一条是直接使用方向的，一条是经过转换的
    // 1. 直接使用方向向量的终点
    const directEnd = origin.clone().add(direction.clone().multiplyScalar(this.maxDistance));
    // console.log('直接使用方向的终点:', directEnd);
    
    // 2. 经过转换的终点 (根据useNodeOrientation决定使用哪种转换)
    let transformedDirection: THREE.Vector3;
    if (this.useNodeOrientation) {
      transformedDirection = this.getDirection().clone().normalize();
      // console.log('使用节点朝向后的方向:', transformedDirection);
    } else { 
      // 直接使用设置的方向，但需要应用节点世界变换
      const worldQuat = new THREE.Quaternion();
      this.getThreeObject().getWorldQuaternion(worldQuat);
      // console.log('世界四元数:', worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w);
      
      // 克隆方向向量，确保不修改原始值
      const dirCopy = this.direction.clone().normalize();
      // console.log('应用四元数前的方向副本:', dirCopy);
      
      // 应用四元数旋转
      transformedDirection = dirCopy.applyQuaternion(worldQuat);
      // console.log('应用四元数后的最终方向:', transformedDirection);
    }
    
    const transformedEnd = origin.clone().add(transformedDirection.clone().multiplyScalar(this.maxDistance));
    // console.log('转换后的终点:', transformedEnd);
    
    // 对比两个终点
    // console.log('直接使用方向和转换后方向的终点差异:',
    //   directEnd.x - transformedEnd.x,
    //   directEnd.y - transformedEnd.y,
    //   directEnd.z - transformedEnd.z
    // );
    
    // 创建两条辅助线的几何体 (一条红色直接方向，一条蓝色转换后)
    const geometry = new THREE.BufferGeometry().setFromPoints([
      origin,
      directEnd  // 使用直接方向的终点
    ]);
    
    // 创建辅助线的材质
    const material = new THREE.LineBasicMaterial({
      color: this.helperColor,
      linewidth: 1
    });
    
    // 创建辅助线
    this.helper = new THREE.Line(geometry, material);
    // this.getThreeObject().add(this.helper);
    
    // 创建第二条线(转换后)的几何体，用蓝色显示
    const transformedGeometry = new THREE.BufferGeometry().setFromPoints([
      origin,
      transformedEnd
    ]);
    
    const transformedMaterial = new THREE.LineBasicMaterial({
      color:  this.helperColor,  // 蓝色
      linewidth: 1
    });
    
    const transformedHelper = new THREE.Line(transformedGeometry, transformedMaterial);
    this.getThreeObject().add(transformedHelper);
    
    this.helperCreated = true;
  }

  /**
   * 更新辅助对象
   */
  private updateHelper(): void {
    // 如果未设置或没有辅助对象，则不执行
    if (!this.helper || !this.isSetup) return;
    
    // 获取射线的起点和方向
    const origin = this.getOrigin();
    let direction: THREE.Vector3;
    
    // 确保使用正确的方向
    if (this.useNodeOrientation) {
      direction = this.getDirection().clone().normalize();
    } else {
      // 对于非节点朝向模式，需要注意保持射线方向在世界空间中的一致性
      // 直接使用设置的方向，但需要应用节点世界变换
      const worldQuat = new THREE.Quaternion();
      this.getThreeObject().getWorldQuaternion(worldQuat);
      direction = this.direction.clone().normalize().applyQuaternion(worldQuat);
    }
    
    // 计算终点
    let end: THREE.Vector3;
    
    // 如果有命中点，使用命中点作为终点
    if (this.lastResult && this.lastResult.node) {
      end = this.lastResult.point.clone();
    } else {
      // 否则使用最大距离计算终点
      end = origin.clone().add(direction.multiplyScalar(this.maxDistance));
    }
    
    // 更新几何体
    const positions = new Float32Array([
      origin.x, origin.y, origin.z,
      end.x, end.y, end.z
    ]);
    
    (this.helper.geometry as THREE.BufferGeometry).setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    
    this.helper.geometry.computeBoundingSphere();
  }

  /**
   * 执行射线投射，使用包围盒而非精确几何体检测
   */
  performRaycast(): RaycastResult | RaycastResult[] | null {
    // 如果禁用或未设置，则不执行
    if (!this.enabled || !this.isSetup) return this.multipleHits ? [] : null;
    
    try {
      // 获取射线起点和方向
      const origin = this.getOrigin();
      let direction: THREE.Vector3;
      
      if (this.useNodeOrientation) {
        direction = this.getDirection();
      } else {
        const worldQuat = new THREE.Quaternion();
        this.getThreeObject().getWorldQuaternion(worldQuat);
        direction = this.direction.clone().normalize().applyQuaternion(worldQuat);
      }
      
      // 创建THREE.js射线对象
      const ray = new THREE.Ray(origin, direction.normalize());
      
      // 获取所有场景中的对象
      const objects: Array<{node: Node3d, object: THREE.Object3D}> = [];
      const engine = Engine.getInstance();
      
      engine.getAllScenes().forEach(scene => {
        scene.getAllNodes().forEach(node => {
          // 跳过自身
          if (node === this) return;
          
          const obj = node.getThreeObject();
          if (obj && obj.visible) {
            objects.push({node, object: obj});
          }
        });
      });
      
      // 手动使用包围盒检测
      const intersects: Array<{
        node: Node3d,
        object: THREE.Object3D,
        distance: number,
        point: THREE.Vector3,
        normal: THREE.Vector3
      }> = [];
      
      // 用于临时计算的包围盒和变量
      const box = new THREE.Box3();
      const inverseMatrix = new THREE.Matrix4();
      const boxMin = new THREE.Vector3();
      const boxMax = new THREE.Vector3();
      
      // 对每个对象进行包围盒检测
      for (const {node, object} of objects) {
        // 计算世界空间中的包围盒
        box.setFromObject(object);
        
        // 应用缩放
        if (this.boundingBoxScale !== 1.0) {
          const center = new THREE.Vector3();
          box.getCenter(center);
          box.expandByScalar((this.boundingBoxScale - 1.0) * box.getSize(new THREE.Vector3()).length() * 0.5);
        }
        
        if (box.isEmpty()) continue;
        
        // 计算射线与包围盒的相交
        const intersectionPoint = new THREE.Vector3();
        if (ray.intersectBox(box, intersectionPoint)) {
          // 计算相交距离
          const distance = origin.distanceTo(intersectionPoint);
          
          // 如果超出最大距离，则跳过
          if (distance > this.maxDistance) continue;
          
          // 计算法线（简单地使用指向包围盒中心的向量）
          const boxCenter = new THREE.Vector3();
          box.getCenter(boxCenter);
          const normal = new THREE.Vector3().subVectors(boxCenter, intersectionPoint).normalize();
          
          // 添加到相交结果
          intersects.push({
            node,
            object,
            distance,
            point: intersectionPoint.clone(),
            normal
          });
        }
      }
      
      // 按距离排序
      intersects.sort((a, b) => a.distance - b.distance);
      
      // 处理多个命中或单个命中，与原代码类似
      const currentHitNodes = new Set<Node3d>();
      
      // 处理多个命中的情况
      if (this.multipleHits && intersects.length > 0) {
        const results: RaycastResult[] = [];
        
        for (const intersection of intersects) {
          // 创建结果对象
          const result: RaycastResult = {
            node: intersection.node,
            point: intersection.point,
            normal: intersection.normal,
            distance: intersection.distance,
            origin: origin.clone(),
            direction: direction.clone()
          };
          
          results.push(result);
          currentHitNodes.add(intersection.node);
          
          // 如果这个节点之前没有被命中，触发进入事件
          if (!this.hitNodes.has(intersection.node)) {
            this.events.emit('enter', result);
            this.events.emit('enter:multiple', { result, index: results.length - 1, total: intersects.length });
          }
        }
        
        // 检查哪些之前命中的节点现在没有命中，触发退出事件
        this.hitNodes.forEach(node => {
          if (!currentHitNodes.has(node)) {
            this.events.emit('exit', {
              node: node,
              point: new THREE.Vector3(),
              normal: new THREE.Vector3(),
              distance: 0,
              origin: origin.clone(),
              direction: direction.clone()
            });
            this.events.emit('exit:multiple', { node });
          }
        });
        
        // 更新命中节点集合
        this.hitNodes = currentHitNodes;
        
        // 触发多命中事件
        if (results.length > 0) {
          this.events.emit('hits', results);
        } else {
          this.events.emit('miss', {
            node: null,
            point: origin.clone().add(direction.clone().multiplyScalar(this.maxDistance)),
            normal: new THREE.Vector3(),
            distance: this.maxDistance,
            origin: origin.clone(),
            direction: direction.clone()
          });
        }
        
        // 保存结果
        this.lastResults = results;
        this.lastResult = results.length > 0 ? results[0] : null;
        
        return results;
      }
      
      // 处理单个命中的情况
      else if (intersects.length > 0) {
        const intersection = intersects[0];
        
        // 创建结果对象
        const result: RaycastResult = {
          node: intersection.node,
          point: intersection.point,
          normal: intersection.normal,
          distance: intersection.distance,
          origin: origin.clone(),
          direction: direction.clone()
        };
        
        // 添加到当前命中节点集合
        currentHitNodes.add(intersection.node);
        
        // 检查是否命中了新的节点
        if (this.hitNode !== intersection.node) {
          // 如果之前命中了其他节点，触发退出事件
          if (this.hitNode) {
            this.events.emit('exit', {
              node: this.hitNode,
              point: result.point,
              normal: result.normal,
              distance: result.distance,
              origin: result.origin,
              direction: result.direction
            });
          }
          
          // 更新当前命中的节点
          this.hitNode = intersection.node;
          
          // 如果新命中了节点，触发进入事件
          this.events.emit('enter', result);
        }
        
        // 触发命中事件
        this.events.emit('hit', result);
        
        // 保存结果
        this.lastResult = result;
        this.lastResults = [result];
        return result;
      } else {
        // 未命中任何对象
        
        // 如果之前命中了节点，触发退出事件
        if (this.hitNode) {
          this.events.emit('exit', {
            node: this.hitNode,
            point: new THREE.Vector3(),
            normal: new THREE.Vector3(),
            distance: 0,
            origin: origin.clone(),
            direction: direction.clone()
          });
          
          this.hitNode = null;
        }
        
        // 对于多命中模式，检查所有需要退出的节点
        if (this.multipleHits && this.hitNodes.size > 0) {
          this.hitNodes.forEach(node => {
            this.events.emit('exit:multiple', { node });
          });
          this.hitNodes.clear();
        }
        
        // 触发未命中事件
        this.events.emit('miss', {
          node: null,
          point: origin.clone().add(direction.clone().multiplyScalar(this.maxDistance)),
          normal: new THREE.Vector3(),
          distance: this.maxDistance,
          origin: origin.clone(),
          direction: direction.clone()
        });
        
        // 清除上次结果
        this.lastResult = null;
        this.lastResults = [];
        return this.multipleHits ? [] : null;
      }
    } catch (error) {
      console.error('射线投射失败:', error);
      return this.multipleHits ? [] : null;
    }
  }

  /**
   * 从Three.js对象查找对应的Node3d
   * @param object Three.js对象
   * @returns 找到的Node3d或null
   */
  private findNodeFromObject(object: THREE.Object3D): Node3d | null {
    try {
      // 遍历对象及其父级，寻找对应的节点
      let current: THREE.Object3D | null = object;
      
      while (current) {
        // 在所有场景中搜索
        const engine = Engine.getInstance();
        for (const scene of engine.getAllScenes()) {
          // 遍历场景中的所有节点
          for (const node of scene.getAllNodes()) {
            if (node.getThreeObject() === current) {
              return node;
            }
          }
        }
        
        // 向上查找父对象
        current = current.parent;
      }
      
      return null;
    } catch (error) {
      console.error('查找节点失败:', error);
      return null;
    }
  }

  /**
   * 获取射线起点（世界空间）
   * @returns 射线起点坐标
   */
  getOrigin(): THREE.Vector3 {
    let worldPos = new THREE.Vector3();
    
    // 如果设置了从目标节点发射且目标节点存在
    if (this.emitFromTarget && this.targetNode) {
      // 使用目标节点位置作为起点
      this.targetNode.getThreeObject().getWorldPosition(worldPos);
    } 
    // 如果设置了自定义起点
    else if (this.customOrigin) {
      worldPos.copy(this.customOrigin);
    } 
    // 默认使用射线节点自身位置
    else {
      this.getThreeObject().getWorldPosition(worldPos);
    }
    
    // 应用偏移
    if (!this.originOffset.equals(new THREE.Vector3())) {
      const worldQuat = new THREE.Quaternion();
      
      // 根据不同的起点来源获取正确的四元数
      if (this.emitFromTarget && this.targetNode) {
        this.targetNode.getThreeObject().getWorldQuaternion(worldQuat);
      } else {
        this.getThreeObject().getWorldQuaternion(worldQuat);
      }
      
      const offsetWorld = this.originOffset.clone().applyQuaternion(worldQuat);
      worldPos.add(offsetWorld);
    }
    
    return worldPos;
  }

  /**
   * 获取射线方向（世界空间）
   * @returns 射线方向向量（已标准化）
   */
  getDirection(): THREE.Vector3 {
    // 如果使用节点朝向
    if (this.useNodeOrientation) {
      const dir = new THREE.Vector3();
      
      // 根据射线是否从目标发射选择正确的节点来获取方向
      if (this.emitFromTarget && this.targetNode) {
        this.targetNode.getThreeObject().getWorldDirection(dir);
      } else {
        this.getThreeObject().getWorldDirection(dir);
      }
      
      return dir;
    } else {
      // 否则使用设定的方向
      const worldQuat = new THREE.Quaternion();
      
      // 根据不同的起点来源获取正确的四元数
      if (this.emitFromTarget && this.targetNode) {
        this.targetNode.getThreeObject().getWorldQuaternion(worldQuat);
      } else {
        this.getThreeObject().getWorldQuaternion(worldQuat);
      }
      
      // 应用节点旋转
      const direction = this.direction.clone().normalize();
      direction.applyQuaternion(worldQuat);
      
      return direction;
    }
  }

  /**
   * 设置射线方向
   * @param direction 新方向
   */
  setDirection(direction: THREE.Vector3): void {
    this.direction.copy(direction.normalize());
    
    // 如果不使用节点朝向，可能需要更新节点自身的朝向
    if (!this.useNodeOrientation) {
      this.updateHelper();
    }
  }

  /**
   * 设置射线起点偏移
   * @param offset 新偏移
   */
  setOriginOffset(offset: THREE.Vector3): void {
    this.originOffset.copy(offset);
    this.updateHelper();
  }

  /**
   * 设置射线最大距离
   * @param distance 新距离
   */
  setMaxDistance(distance: number): void {
    this.maxDistance = distance;
    this.updateHelper();
  }

  /**
   * 设置是否显示辅助线
   * @param show 是否显示
   */
  setShowHelper(show: boolean): void {
    this.showHelper = show;
    
    if (this.helper) {
      this.helper.visible = show;
    } else if (show) {
      // this.createHelper();
    }
  }

  /**
   * 设置辅助线颜色
   * @param color 新颜色
   */
  setHelperColor(color: THREE.Color): void {
    this.helperColor.copy(color);
    
    if (this.helper && this.helper.material instanceof THREE.LineBasicMaterial) {
      this.helper.material.color.copy(color);
    }
  }

  /**
   * 设置是否启用射线检测
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (this.helper) {
      this.helper.visible = enabled && this.showHelper && this.isSetup;
    }
  }

  /**
   * 设置是否使用节点朝向
   * @param use 是否使用
   */
  setUseNodeOrientation(use: boolean): void {
    this.useNodeOrientation = use;
    this.updateHelper();
  }

  /**
   * 设置是否持续检测
   * @param continuous 是否持续检测
   */
  setContinuous(continuous: boolean): void {
    this.continuous = continuous;
  }

  /**
   * 设置是否检测多个命中
   * @param multiple 是否检测多个命中
   */
  setMultipleHits(multiple: boolean): void {
    this.multipleHits = multiple;
  }

  /**
   * 设置目标节点
   * @param node 目标节点
   */
  setTargetNode(node: Node3d | null): void {
    this.targetNode = node;
    
    // 如果设置了目标节点且跟随模式为自动，立即更新方向
    if (node && this.followMode === RaycastFollowMode.AUTO) {
      this.updateDirectionToTarget();
    }
  }

  /**
   * 设置目标偏移
   * @param offset 目标偏移向量
   */
  setTargetOffset(offset: THREE.Vector3): void {
    this.targetOffset.copy(offset);
    
    // 如果设置了目标节点且跟随模式为自动，立即更新方向
    if (this.targetNode && this.followMode === RaycastFollowMode.AUTO) {
      this.updateDirectionToTarget();
    }
  }

  /**
   * 设置跟随模式
   * @param mode 跟随模式
   */
  setFollowMode(mode: RaycastFollowMode): void {
    this.followMode = mode;
    
    // 如果设置为自动且有目标节点，立即更新方向
    if (mode === RaycastFollowMode.AUTO && this.targetNode) {
      this.updateDirectionToTarget();
    }
  }

  /**
   * 设置是否从目标节点发射射线
   * @param emit 是否从目标发射
   */
  setEmitFromTarget(emit: boolean): void {
    this.emitFromTarget = emit;
    this.updateHelper();
  }

  /**
   * 设置自定义射线起点
   * @param origin 自定义起点位置，传null则取消自定义起点
   */
  setCustomOrigin(origin: THREE.Vector3 | null): void {
    this.customOrigin = origin ? origin.clone() : null;
    this.updateHelper();
  }

  /**
   * 获取节点的前向向量（世界空间）
   * @param node 要获取前向向量的节点，默认为当前节点
   * @returns 前向向量
   */
  getForwardVector(node: Node3d | null = null): THREE.Vector3 {
    const targetNode = node || this;
    const forward = new THREE.Vector3(0, 0, -1); // 默认前向是负z轴
    
    // 获取节点的世界四元数
    const quaternion = new THREE.Quaternion();
    targetNode.getThreeObject().getWorldQuaternion(quaternion);
    
    // 应用旋转
    forward.applyQuaternion(quaternion);
    
    return forward.normalize();
  }

  /**
   * 一次性设置射线参数
   * @param origin 射线起点(相对于节点的本地坐标)
   * @param direction 射线方向
   * @param length 射线长度
   * @param color 射线颜色(可选)
   * @param useNodeOrientation 是否使用节点朝向(可选，默认为false)
   */
  setupRay(origin: THREE.Vector3, direction: THREE.Vector3, length: number, color?: THREE.Color, useNodeOrientation: boolean = false): void {
    
    // 设置起点偏移
    this.originOffset.copy(origin);
    
    // 设置方向
    this.direction.copy(direction.normalize());
    console.log(this.direction,'direction');
    // 设置最大距离
    this.maxDistance = length;
    
    // 设置是否使用节点朝向
    this.useNodeOrientation = useNodeOrientation;
    
    // 如果提供了颜色，设置颜色
    if (color) {
      this.helperColor.copy(color);
      
      // 如果辅助对象已存在，更新其颜色
      if (this.helper && this.helper.material instanceof THREE.LineBasicMaterial) {
        this.helper.material.color.copy(color);
      }
    }
    
    // 标记为已设置
    this.isSetup = true;
    
    // 如果已经创建了辅助对象，更新它
    if (this.helper) {
      this.updateHelper();
    } else if (this.showHelper) {
      // 否则创建辅助对象
      this.createHelper();
    }
  }
  
  /**
   * 重置射线
   * 将其标记为未设置状态，不会执行绘制和检测
   */
  resetRay(): void {
    this.isSetup = false;
    
    // 如果有辅助对象，隐藏它
    if (this.helper) {
      this.helper.visible = false;
    }
    
    // 清除上次结果
    this.lastResult = null;
    this.lastResults = [];
  }
  
  /**
   * 检查射线是否已设置
   * @returns 是否已设置
   */
  isRaySetup(): boolean {
    return this.isSetup;
  }

  /**
   * 手动触发一次射线检测
   * @returns 检测结果
   */
  castRay(): RaycastResult | RaycastResult[] | null {
    return this.performRaycast();
  }

  /**
   * 获取上次检测结果
   * @returns 检测结果或null
   */
  getLastResult(): RaycastResult | null {
    return this.lastResult ? { ...this.lastResult } : null;
  }

  /**
   * 获取上次所有检测结果
   * @returns 检测结果数组
   */
  getLastResults(): RaycastResult[] {
    return this.lastResults.map(result => ({ ...result }));
  }

  /**
   * 添加事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: (result: RaycastResult | RaycastResult[]) => void): void {
    this.events.on(event, callback);
  }

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  off(event: string, callback: Function): void {
    this.events.off(event, callback);
  }

  /**
   * 节点销毁时调用
   */
  destroy(): void {
    this.events.clear();
    
    // 清理辅助对象
    if (this.helper) {
      this.getThreeObject().remove(this.helper);
      this.helper.geometry.dispose();
      if (this.helper.material instanceof THREE.Material) {
        this.helper.material.dispose();
      }
      this.helper = null;
    }
  }

  /**
   * 获取对象的世界位置
   * @param object Three.js对象
   * @returns 世界位置
   */
  private getObjectWorldPosition(object: THREE.Object3D): THREE.Vector3 {
    const position = new THREE.Vector3();
    object.getWorldPosition(position);
    return position;
  }

  /**
   * 获取节点的世界位置
   * @returns 世界位置
   */
  private getWorldPosition(): THREE.Vector3 {
    const position = new THREE.Vector3();
    this.getThreeObject().getWorldPosition(position);
    return position;
  }
} 