/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-05-06 17:42:55
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-08 15:36:22
 * @FilePath: \todot\src\engine\editor\logic\SceneManager.ts
 * @Description: 场景管理器 - 负责管理场景的创建、加载和保存
 */
import * as THREE from 'three';
import { Scene } from '../../core/Scene';
import { ProjectManager } from '../../core/project/ProjectManager';
import { 
    getEngineInstance, 
    setActiveScene, 
    getActiveScene,
    setScenes,
    getScenes
} from '../states/useEditorState';
import { setScenes as setGlobalScenes } from '../../states/scenesState';
import { 
    activateScene as activateSceneState, 
    deactivateScene as deactivateSceneState,
    isSceneActive
} from '../../states/activeSceneState';

// 获取项目管理器实例
const getProjectManager = () => ProjectManager.getInstance();

/**
 * 创建新场景
 * @param name 场景名称
 * @returns 创建的场景
 */
export async function createScene(name: string = '新场景'): Promise<Scene | null> {
    const engine = getEngineInstance();
    const projectManager = getProjectManager();
    
    if (!engine || !projectManager) return null;
    
    try {
        // 创建新场景
        const scene = new Scene(name);
        
        // 添加基本光源
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);
        
        // 添加网格辅助线
        const gridHelper = new THREE.GridHelper(20, 20);
        scene.add(gridHelper);
        
        // 将场景添加到引擎
        engine.addScene(scene);
        
        // 更新场景列表
        const currentScenes = getScenes();
        const newScenes = [...currentScenes, scene];
        setScenes(newScenes);
        setGlobalScenes(newScenes);
        
        // 修改：总是激活新创建的场景
        engine.activateScene(name);
        setActiveScene(scene);
        activateSceneState(name);
        
        // 保存场景到文件
        await projectManager.saveScene(scene);
        
        return scene;
    } catch (error) {
        console.error('创建场景失败:', error);
        return null;
    }
}

/**
 * 切换到指定场景
 * @param sceneName 场景名称
 * @param exclusive 是否独占激活（停用其他场景）
 */
export function switchScene(sceneName: string, exclusive: boolean = true): void {
    const engine = getEngineInstance();
    if (!engine) return;
    
    try {
        engine.activateScene(sceneName, exclusive);
        const scene = engine.getSceneByName(sceneName);
        
        if (scene) {
            setActiveScene(scene);
            
            // 更新状态系统
            if (exclusive) {
                activateSceneState(sceneName, true);
            } else {
                activateSceneState(sceneName, false);
            }
        }
    } catch (error) {
        console.error('切换场景失败:', error);
    }
}

/**
 * 激活或停用场景
 * @param sceneName 场景名称
 * @param active 是否激活
 * @param exclusive 是否独占激活（仅当active为true时有效）
 */
export function setSceneActive(sceneName: string, active: boolean, exclusive: boolean = false): void {
    const engine = getEngineInstance();
    if (!engine) return;
    
    try {
        if (active) {
            engine.activateScene(sceneName, exclusive);
            
            // 更新状态系统
            activateSceneState(sceneName, exclusive);
            
            // 如果是独占模式，设置为当前活动场景
            if (exclusive) {
                const scene = engine.getSceneByName(sceneName);
                setActiveScene(scene || null);
            }
        } else {
            engine.deactivateScene(sceneName);
            
            // 更新状态系统
            deactivateSceneState(sceneName);
            
            // 如果停用的是当前活动场景，尝试切换到另一个场景
            const currentActiveScene = getActiveScene();
            if (currentActiveScene && currentActiveScene.getName() === sceneName) {
                // 找到另一个激活的场景作为新的活动场景
                const scenes = getScenes();
                const otherActiveScene = scenes.find(s => 
                    s.getName() !== sceneName && isSceneActive(s.getName())
                );
                
                if (otherActiveScene) {
                    setActiveScene(otherActiveScene);
                } else {
                    setActiveScene(null);
                }
            }
        }
    } catch (error) {
        console.error(`${active ? '激活' : '停用'}场景失败:`, error);
    }
}

/**
 * 删除指定场景
 * @param sceneName 场景名称
 */
export async function deleteScene(sceneName: string): Promise<boolean> {
    const engine = getEngineInstance();
    const projectManager = getProjectManager();
    
    if (!engine || !projectManager) return false;
    
    try {
        const currentActiveScene = getActiveScene();
        const scenes = getScenes();
        
        // 如果要删除的是当前激活的场景，先切换到另一个场景
        if (currentActiveScene && currentActiveScene.getName() === sceneName) {
            const otherScene = scenes.find(s => s.getName() !== sceneName);
            if (otherScene) {
                switchScene(otherScene.getName());
            } else {
                setActiveScene(null);
            }
        }
        
        // 停用场景
        setSceneActive(sceneName, false);
        
        // 从引擎中移除场景
        engine.removeScene(sceneName);
        
        // 从项目中删除场景文件
        const success = await projectManager.deleteScene(sceneName);
        if (!success) {
            console.error(`删除场景文件失败: ${sceneName}`);
            return false;
        }
        
        // 更新场景列表
        const updatedScenes = scenes.filter(s => s.getName() !== sceneName);
        setScenes(updatedScenes);
        setGlobalScenes(updatedScenes);
        
        return true;
    } catch (error) {
        console.error('删除场景失败:', error);
        return false;
    }
}

/**
 * 重命名场景
 * @param oldName 原场景名称
 * @param newName 新场景名称
 */
export async function renameScene(oldName: string, newName: string): Promise<boolean> {
    const engine = getEngineInstance();
    const projectManager = getProjectManager();
    
    if (!engine || !projectManager) return false;
    
    try {
        // 检查新名称是否已存在
        const scenes = getScenes();
        if (scenes.some(s => s.getName() === newName)) {
            console.error(`场景名称 "${newName}" 已存在`);
            return false;
        }
        
        // 使用项目管理器重命名场景
        const success = await projectManager.renameScene(oldName, newName);
        if (!success) {
            console.error(`重命名场景文件失败: ${oldName} -> ${newName}`);
            return false;
        }
        
        // 刷新场景列表
        await refreshScenes();
        
        return true;
    } catch (error) {
        console.error('重命名场景失败:', error);
        return false;
    }
}

/**
 * 保存场景
 * @param scene 要保存的场景
 */
export async function saveScene(scene: Scene): Promise<boolean> {
    const projectManager = getProjectManager();
    
    if (!projectManager) return false;
    
    try {
        // 保存场景到文件
        return await projectManager.saveScene(scene);
    } catch (error) {
        console.error('保存场景失败:', error);
        return false;
    }
}

/**
 * 加载场景
 * @param sceneName 场景名称
 */
export async function loadScene(sceneName: string): Promise<Scene | null> {
    const engine = getEngineInstance();
    const projectManager = getProjectManager();
    
    if (!engine || !projectManager) return null;
    
    try {
        // 检查场景是否已经加载
        const existingScene = engine.getSceneByName(sceneName);
        if (existingScene) {
            return existingScene;
        }
        
        // 加载场景
        const success = await projectManager.loadScene(sceneName);
        if (!success) {
            console.error(`加载场景失败: ${sceneName}`);
            return null;
        }
        
        // 获取新加载的场景
        const loadedScene = engine.getSceneByName(sceneName);
        if (!loadedScene) {
            console.error(`加载场景后未找到场景对象: ${sceneName}`);
            return null;
        }
        
        // 刷新场景列表
        refreshScenes();
        
        return loadedScene;
    } catch (error) {
        console.error('加载场景失败:', error);
        return null;
    }
}

/**
 * 刷新场景列表
 */
export async function refreshScenes(): Promise<void> {
    const engine = getEngineInstance();
    if (!engine) return;
    
    try {
        const allScenes = engine.getAllScenes();
        setScenes(allScenes);
        setGlobalScenes(allScenes);
        
        // 设置当前激活的场景
        const activeScenes = engine.getActiveScenes();
        if (activeScenes.length > 0) {
            setActiveScene(activeScenes[0]);
        } else {
            setActiveScene(null);
        }
    } catch (error) {
        console.error('刷新场景列表失败:', error);
    }
}

/**
 * 检查是否有场景
 * @returns 是否有场景
 */
export function hasScenes(): boolean {
    return getScenes().length > 0;
}

/**
 * 获取所有场景
 * @returns 场景列表
 */
export function getAllScenes(): Scene[] {
    return getScenes();
}

/**
 * 获取当前活动场景
 * @returns 活动场景
 */
export function getCurrentActiveScene(): Scene | null {
    return getActiveScene();
}

/**
 * 获取所有活动场景
 * @returns 活动场景列表
 */
export function getActiveScenes(): Scene[] {
    const engine = getEngineInstance();
    if (!engine) return [];
    
    return engine.getActiveScenes();
}

/**
 * 创建场景的副本
 * @param sceneName 场景名称
 * @param newName 新场景名称
 */
export async function duplicateScene(sceneName: string, newName: string): Promise<Scene | null> {
    const engine = getEngineInstance();
    if (!engine) return null;
    
    try {
        // 获取原场景
        const originalScene = engine.getSceneByName(sceneName);
        if (!originalScene) {
            console.error(`未找到场景: ${sceneName}`);
            return null;
        }
        
        // 序列化场景
        const sceneData = JSON.parse(JSON.stringify(originalScene));
        
        // 修改名称
        sceneData.name = newName;
        
        // 创建新场景
        const newScene = await createScene(newName);
        if (!newScene) {
            return null;
        }
        
        // TODO: 复制场景内容，根据实际场景序列化和反序列化的实现来完成
        
        return newScene;
    } catch (error) {
        console.error('复制场景失败:', error);
        return null;
    }
} 