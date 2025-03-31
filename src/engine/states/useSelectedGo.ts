import store from "@lincode/reactivity"
import { GameObject } from "../core/GameObject"

export const [setSelectGameObject, getSelectGameObject] = store<GameObject | null>(null)