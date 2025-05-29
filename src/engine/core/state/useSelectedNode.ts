import store from "@lincode/reactivity"
import { SceneNode } from "../UINode/SceneNode"

export const [setSelectGameSceneNode, getSelectGameSceneNode] = store<SceneNode | null>(null)