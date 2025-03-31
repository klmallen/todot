import { Cancellable } from "@lincode/promiselikes";
import { getGlobalState } from "../engine/states/GlobalState";
import { createEffect, createMemo, createRef, createPrevious } from "@lincode/reactivity";

export default class ReactiveBase {
    private _effects: Cancellable[] = [];
    
    /**
     * 创建响应式效果
     * @param effectBody 效果函数体
     * @param getStates 依赖状态数组
     * @returns 取消订阅的函数
     */
    protected effect(
        effectBody: () => (() => void) | void, 
        getStates: Array<getGlobalState<any> | undefined>
    ): Cancellable {
        const cancellable = createEffect(effectBody, getStates);
        this._effects.push(cancellable);
        return cancellable;
    }
    
    /**
     * 创建记忆化值
     * @param value 计算函数
     * @param getStates 依赖状态数组
     * @returns 记忆化的值
     */
    protected memo<T>(
        value: () => T, 
        getStates: Array<getGlobalState<any> | any>
    ): T {
        return createMemo(value, getStates);
    }
    
    /**
     * 创建引用对象
     * @param value 初始值
     * @returns 引用对象
     */
    protected ref<T>(value?: T | (() => T)): { current: T } {
        return createRef<T>(value);
    }
    
    /**
     * 获取前一个值
     * @param value 当前值
     * @returns 前一个值
     */
    protected previous<T>(value: T): T {
        return createPrevious(value);
    }
    
    /**
     * 清理所有效果
     */
    dispose(): void {
        for (const effect of this._effects) {
            effect.cancel();
        }
        this._effects = [];
    }
}