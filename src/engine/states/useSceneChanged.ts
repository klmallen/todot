import store from "@lincode/reactivity"

// 添加scene相关的state
export const [setSceneChanged, getSceneChanged] = store<boolean>(false);