
import store from "@lincode/reactivity"
import { GameObject } from "../core/GameObject"

export const [setGlobalState, getGlobalState] = store<GameObject | null>(null)
