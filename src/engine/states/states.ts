import hook from "./hook"
import { setEditorScene, getEditorScene } from "./useScene"

export const  useCurrentScene = hook(setEditorScene,getEditorScene)
