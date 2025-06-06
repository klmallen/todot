/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-27 15:15:31
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-05-18 18:12:45
 * @FilePath: \todot\src\engine\states\useEditorMode.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import store from "@lincode/reactivity"
import { Node3d } from "../core/Node3d"

// 编辑器是否处于活动状态
export const [setEditorActive, getEditorActive] = store<boolean>(false)

// 是否处于播放模式
export const [setIsPlaying, getIsPlaying] = store<boolean>(false)

// 当前选中的物体
export const [setSelectedObject, getSelectedObject] = store<THREE.Object3D | null>(null)

// 控制变换工具模式
export const [setTransformMode, getTransformMode] = store<'translate' | 'rotate' | 'scale'>('translate')

// 是否显示属性面板
export const [setShowPropertyPanel, getShowPropertyPanel] = store<boolean>(true)

// TransformControls 是否正在拖动
export const [setIsDragging, getIsDragging] = store<boolean>(false)
export const [setSelectedNode, getSelectedNode] = store<Node3d>(null)

// 是否场景发生变化
export const [setIsSceneChanged, getIsSceneChanged] = store<number>(0)

//全部场景
export const [setAllScenes, getAllScenes] = store<Scene[]>([])

// 场景切换器节点实例
export const [setSceneSwitcherNode, getSceneSwitcherNode] = store<any>(null)




