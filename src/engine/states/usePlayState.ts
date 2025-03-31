import store from "@lincode/reactivity"

export const [ setIsPlaying, getIsPlaying] = store<boolean | null>(null)