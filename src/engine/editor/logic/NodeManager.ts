/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:48:13
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 22:23:55
 * @FilePath: \todot\src\engine\editor\logic\NodeManager.ts
 * @Description: 节点管理器 - 负责管理节点的创建、删除和操作
 */
import * as THREE from 'three';
import { Node3d } from '../../core/Node3d';
// import { MeshInstance3D } from '../../core/MeshInstance3D';
// import { CameraNode3D } from '../../core/CameraNode3D';
import { PhysicsFactory } from '../../physics/PhysicsFactory';
import { Scene } from '../../core/Scene';
import { 
    getEngineInstance, 
    getActiveScene,
    getSelectedNodeType,
    getNodeNameInput
} from '../states/useEditorState';
import { setSelectedNode, getSelectedNode } from '../../states/useEditorMode';
import { setSelectedNodeId, getSelectedNodeId } from '../../states/selectedNodeState';
import { saveScene } from './SceneManager';
import { v4 as uuidv4 } from 'uuid';

/**
 * 节点类型信息接口
 */
export interface NodeTypeInfo {
    id: string;
    name: string;
    description: string;
    icon?: string;
    category: string;
    createNode: (name: string) => any; // 创建节点的函数
}

/**
 * 获取可用节点类型列表
 * @returns 节点类型列表
 */
export function getAvailableNodeTypes(): NodeTypeInfo[] {
    return [
        {
            id: 'empty',
            name: '空节点',
            description: '一个空的节点容器',
            icon: 'crop_square',
            category: '基础',
            createNode: (name: string) => new Node3d(name)
        },
        // {
        //     id: 'cube',
        //     name: '立方体',
        //     description: '3D立方体网格',
        //     icon: 'cube',
        //     category: '网格',
        //     createNode: (name: string) => {
        //         const geometry = new THREE.BoxGeometry(1, 1, 1);
        //         const material = new THREE.MeshStandardMaterial({ color: 0x3080ff });
        //         return new MeshInstance3D(name, geometry, material);
        //     }
        // },
        // {
        //     id: 'sphere',
        //     name: '球体',
        //     description: '3D球体网格',
        //     icon: 'circle',
        //     category: '网格',
        //     createNode: (name: string) => {
        //         const geometry = new THREE.SphereGeometry(0.5, 32, 16);
        //         const material = new THREE.MeshStandardMaterial({ color: 0x3080ff });
        //         return new MeshInstance3D(name, geometry, material);
        //     }
        // },
        // {
        //     id: 'camera',
        //     name: '摄像机',
        //     description: '场景摄像机',
        //     icon: 'videocam',
        //     category: '基础',
        //     createNode: (name: string) => new CameraNode3D(name)
        // },
        {
            id: 'light',
            name: '点光源',
            description: '发光的点光源',
            icon: 'light',
            category: '灯光',
            createNode: (name: string) => {
                const node = new Node3d(name);
                const light = new THREE.PointLight(0xffffff, 1, 100);
                node.getThreeObject().add(light);
                return node;
            }
        },
        // {
        //     id: 'physics-box',
        //     name: '物理立方体',
        //     description: '带有物理特性的立方体',
        //     icon: 'fitness_center',
        //     category: '物理',
        //     createNode: (name: string) => {
        //         return PhysicsFactory.createPhysicsBox(name);
        //     }
        // },
        // {
        //     id: 'physics-sphere',
        //     name: '物理球体',
        //     description: '带有物理特性的球体',
        //     icon: 'sports_baseball',
        //     category: '物理',
        //     createNode: (name: string) => {
        //         return PhysicsFactory.createPhysicsSphere(name);
        //     }
        // }
    ];
}

/**
 * 创建并添加节点到当前活动场景
 * @returns 创建的节点
 */
export async function createNode(): Promise<Node3d | null> {
    const activeScene = getActiveScene();
    if (!activeScene) return null;
    
    return createNodeInScene(activeScene);
}

/**
 * 创建并添加节点到指定场景
 * @param scene 目标场景
 * @param nodeTypeId 节点类型ID（可选，默认使用全局选定类型）
 * @param nodeName 节点名称（可选，默认使用全局输入名称或"新节点"）
 * @returns 创建的节点
 */
export async function createNodeInScene(
    scene: Scene, 
    nodeTypeId?: string, 
    nodeName?: string
): Promise<Node3d | null> {
    if (!scene) return null;
    
    // 如果没有指定，则使用全局选定的类型
    const finalNodeTypeId = nodeTypeId || getSelectedNodeType();
    if (!finalNodeTypeId) return null;
    
    // 如果没有指定，则使用全局输入的名称或默认值
    const finalNodeName = nodeName || getNodeNameInput() || '新节点';
    
    const nodeTypes = getAvailableNodeTypes();
    const nodeType = nodeTypes.find(type => type.id === finalNodeTypeId);
    
    if (!nodeType) return null;
    debugger
        // 创建节点
        const node = nodeType.createNode(finalNodeName);
        
        // 添加到指定场景
        scene.addNode(node);
        
        // 默认将节点放置在(0, 0, 0)位置上方
        node.position.set(0, 1, 0);
        
        // 选择新创建的节点
        selectNode(node);
        
        // 保存场景变更
        await saveScene(scene);
        
        return node;
   
}

/**
 * 创建节点并添加到指定父节点
 * @param parentNode 父节点
 * @param nodeTypeId 节点类型ID
 * @param nodeName 节点名称
 * @returns 创建的节点
 */
export async function createNodeUnderParent(
    parentNode: Node3d,
    nodeTypeId: string = 'empty',
    nodeName: string = '新节点'
): Promise<Node3d | null> {
    if (!parentNode) return null;
    
    // 查找包含父节点的场景
    const scene = findSceneContainingNode(parentNode);
    if (!scene) {
        console.error('未找到包含父节点的场景');
        return null;
    }
    
    const nodeTypes = getAvailableNodeTypes();
    const nodeType = nodeTypes.find(type => type.id === nodeTypeId);
    
    if (!nodeType) {
        console.error(`未找到节点类型: ${nodeTypeId}`);
        return null;
    }
    
    try {
        // 创建节点
        const node = nodeType.createNode(nodeName);
        
        // 添加到父节点
        parentNode.addChild(node);
        
        // 选择新创建的节点
        selectNode(node);
        
        // 保存场景变更
        await saveScene(scene);
        
        return node;
    } catch (error) {
        console.error(`创建节点失败(${nodeTypeId}):`, error);
        return null;
    }
}

/**
 * 创建节点并添加到选中的节点
 * @param nodeTypeId 节点类型ID
 * @param nodeName 节点名称
 * @returns 创建的节点
 */
export async function createNodeUnderSelected(
    nodeTypeId: string = 'empty',
    nodeName: string = '新节点'
): Promise<Node3d | null> {
    // 获取当前选中的节点
    const selectedNode = getSelectedNode();
    if (!selectedNode) {
        console.error('未选择父节点');
        // 回退到创建在活动场景根节点下
        return createNode();
    }
    
    return createNodeUnderParent(selectedNode, nodeTypeId, nodeName);
}

/**
 * 查找包含指定节点的场景
 * @param node 节点
 * @returns 包含节点的场景
 */
export function findSceneContainingNode(node: Node3d): Scene | null {
    const engine = getEngineInstance();
    if (!engine) return null;
    
    const allScenes = engine.getAllScenes();
    
    for (const scene of allScenes) {
        // 检查是否是根节点
        if (scene.getRootNode() === node) {
            return scene;
        }
        
        // 在场景中查找节点
        const found = findNodeInScene(scene, node);
        if (found) {
            return scene;
        }
    }
    
    return null;
}

/**
 * 在场景中查找节点
 * @param scene 场景
 * @param targetNode 目标节点
 * @returns 是否找到
 */
function findNodeInScene(scene: Scene, targetNode: Node3d): boolean {
    const rootNode = scene.getRootNode();
    
    // 递归查找
    function findInChildren(node: Node3d): boolean {
        if (node === targetNode) {
            return true;
        }
        
        for (const child of node.getChildren()) {
            if (findInChildren(child)) {
                return true;
            }
        }
        
        return false;
    }
    
    return findInChildren(rootNode);
}

/**
 * 删除节点
 * @param node 要删除的节点
 */
export async function deleteNode(node: Node3d): Promise<boolean> {
    if (!node) return false;
    
    try {
        // 查找包含节点的场景
        const scene = findSceneContainingNode(node);
        if (!scene) {
            console.error('未找到包含节点的场景');
            return false;
        }
        
        // 如果是根节点，不允许删除
        if (node === scene.getRootNode()) {
            console.error('不能删除场景根节点');
            return false;
        }
        
        // 删除节点
        scene.removeNode(node);
        
        // 如果删除的是当前选中的节点，清除选择
        const selectedNode = getSelectedNode();
        if (selectedNode && selectedNode === node) {
            selectNode(null);
        }
        
        // 保存场景变更
        await saveScene(scene);
        
        return true;
    } catch (error) {
        console.error('删除节点失败:', error);
        return false;
    }
}

/**
 * 删除选中的节点
 */
export async function deleteSelectedNode(): Promise<boolean> {
    const selectedNode = getSelectedNode();
    if (!selectedNode) {
        console.error('未选择节点');
        return false;
    }
    
    return deleteNode(selectedNode);
}

/**
 * 根据ID删除节点
 * @param nodeId 节点ID
 */
export async function deleteNodeById(nodeId: string): Promise<boolean> {
    // 查找节点
    const node = findNodeById(nodeId);
    if (!node) {
        console.error(`未找到ID为 ${nodeId} 的节点`);
        return false;
    }
    
    return deleteNode(node);
}

/**
 * 选择节点
 * @param node 要选择的节点，传null表示取消选择
 */
export function selectNode(node: Node3d | null): void {
    setSelectedNode(node);
    
    // 更新状态系统中的选中节点ID
    if (node) {
        setSelectedNodeId(node.getId?.() || null);
    } else {
        setSelectedNodeId(null);
    }
    
    // 如果有引擎实例且处于编辑模式，更新变换控制
    const engine = getEngineInstance();
    if (engine && node) {
        if (engine.isEditorMode()) {
            engine.updatePropertyPanelNode(node);
        }
    }
}

/**
 * 根据ID选择节点
 * @param nodeId 节点ID
 */
export function selectNodeById(nodeId: string | null): void {
    if (!nodeId) {
        selectNode(null);
        return;
    }
    
    const node = findNodeById(nodeId);
    if (node) {
        selectNode(node);
    } else {
        console.error(`未找到ID为 ${nodeId} 的节点`);
        selectNode(null);
    }
}

/**
 * 根据ID查找节点
 * @param nodeId 节点ID
 * @returns 找到的节点
 */
export function findNodeById(nodeId: string): Node3d | null {
    const engine = getEngineInstance();
    if (!engine) return null;
    
    // 在所有场景中查找
    const allScenes = engine.getAllScenes();
    
    for (const scene of allScenes) {
        const node = scene.getNodeById?.(nodeId);
        if (node) {
            return node;
        }
        
        // 如果Scene类没有getNodeById方法，则手动查找
        const found = findNodeByIdInScene(scene, nodeId);
        if (found) {
            return found;
        }
    }
    
    return null;
}

/**
 * 在场景中根据ID查找节点
 * @param scene 场景
 * @param nodeId 节点ID
 * @returns 找到的节点
 */
function findNodeByIdInScene(scene: Scene, nodeId: string): Node3d | null {
    const rootNode = scene.getRootNode();
    
    // 递归查找
    function findInChildren(node: Node3d): Node3d | null {
        if (node.getId?.() === nodeId) {
            return node;
        }
        
        for (const child of node.getChildren()) {
            const found = findInChildren(child);
            if (found) {
                return found;
            }
        }
        
        return null;
    }
    
    return findInChildren(rootNode);
}

/**
 * 复制节点
 * @param node 要复制的节点
 * @param newName 新节点名称，默认为原名称加上"副本"
 * @returns 复制的节点
 */
export async function duplicateNode(node: Node3d, newName?: string): Promise<Node3d | null> {
    if (!node) return null;
    
    try {
        // 查找包含节点的场景
        const scene = findSceneContainingNode(node);
        if (!scene) {
            console.error('未找到包含节点的场景');
            return null;
        }
        
        // 生成新名称
        const nodeName = newName || `${node.getName()} 副本`;
        
        // 获取父节点
        const parentNode = node.getParent() || scene.getRootNode();
        
        // 创建新节点
        // 注意：这里简单复制，实际使用时应根据节点类型进行适当的深度复制
        const newNode = new Node3d(nodeName);
        
        // 复制基本属性
        newNode.position.copy(node.position);
        newNode.rotation.copy(node.rotation);
        newNode.scale.copy(node.scale);
        
        // 添加到父节点
        parentNode.addChild(newNode);
        
        // 选择新节点
        selectNode(newNode);
        
        // 保存场景变更
        await saveScene(scene);
        
        return newNode;
    } catch (error) {
        console.error('复制节点失败:', error);
        return null;
    }
}

/**
 * 复制选中的节点
 * @param newName 新节点名称
 */
export async function duplicateSelectedNode(newName?: string): Promise<Node3d | null> {
    const selectedNode = getSelectedNode();
    if (!selectedNode) {
        console.error('未选择节点');
        return null;
    }
    
    return duplicateNode(selectedNode, newName);
}

/**
 * 获取选中的节点
 */
export function getSelectedNodeInstance(): Node3d | null {
    return getSelectedNode();
}

/**
 * 重命名节点
 * @param node 要重命名的节点
 * @param newName 新名称
 */
export async function renameNode(node: Node3d, newName: string): Promise<boolean> {
    if (!node || !newName.trim()) return false;
    
    try {
        // 查找包含节点的场景
        const scene = findSceneContainingNode(node);
        if (!scene) {
            console.error('未找到包含节点的场景');
            return false;
        }
        
        // 重命名节点
        node.setName(newName);
        
        // 保存场景变更
        await saveScene(scene);
        
        return true;
    } catch (error) {
        console.error('重命名节点失败:', error);
        return false;
    }
}

/**
 * 重命名选中的节点
 * @param newName 新名称
 */
export async function renameSelectedNode(newName: string): Promise<boolean> {
    const selectedNode = getSelectedNode();
    if (!selectedNode) {
        console.error('未选择节点');
        return false;
    }
    
    return renameNode(selectedNode, newName);
} 