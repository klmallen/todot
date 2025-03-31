import store, { pull, push, reset } from "@lincode/reactivity"
// 添加scene相关的state
export const [ setEditorScene, getEditorScene ] = store<any | null>(null);
export const pushEditorScene = push(setEditorScene, getEditorScene)
export const pullEditorScene = pull(setEditorScene, getEditorScene)
export const resetEditorScene = reset(setEditorScene, getEditorScene)