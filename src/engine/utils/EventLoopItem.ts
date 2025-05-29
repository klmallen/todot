/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-27 17:31:47
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-04-27 17:50:20
 * @FilePath: \todot\src\engine\utils\EventLoopItem.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Cancellable } from "@lincode/promiselikes"
import { createEffect, GetGlobalState } from "@lincode/reactivity"

/**
 * 事件循环项基类，提供创建响应式效果和管理订阅的功能
 */
export default abstract class EventLoopItem  {
    private _proxy?: EventLoopItem
    public get proxy() {
        return this._proxy
    }
    public set proxy(val) {
        if (this._proxy === val) return
        //@ts-ignore
        this._proxy && (this._proxy.__target = undefined)
        this._proxy = val
        //@ts-ignore
        val && (val.__target = this)
    }

    /**
     * 标记组件是否已销毁
     */
    public done = false;

    /**
     * 存储所有可取消的订阅
     */
    private _subscriptions: Array<{ cancel: () => void }> = [];


    public queueMicrotask(cb: () => void) {
        queueMicrotask(() => !this.done && cb())
    }

    protected cancellable(cb?: () => void) {
        return this.watch(new Cancellable(cb))
    }

    protected createEffect(cb: () => (() => void) | void, getStates: Array<GetGlobalState<any> | any>) {
        return this.watch(createEffect(cb, getStates))
    }

    private _loopHandle?: Cancellable
    private _onLoop?: () => void
    public get onLoop(): (() => void) | undefined {
        return this._onLoop
    }
    public set onLoop(cb: (() => void) | undefined) {
        this._onLoop = cb
        this._loopHandle?.cancel()
        cb && (this._loopHandle = this.loop(cb))
    }

    /**
     * 监视可取消的订阅
     * @param subscription 可取消的订阅对象
     */
    protected watch(subscription: { cancel: () => void }): void {
        if (this.done) {
            subscription.cancel();
            return;
        }
        this._subscriptions.push(subscription);
    }

    /**
     * 销毁组件并取消所有订阅
     */
    public dispose(): void {
        if (this.done) return;
        
        this.done = true;
        
        // 取消所有订阅
        for (const subscription of this._subscriptions) {
            subscription.cancel();
        }
        
        // 清空订阅列表
        this._subscriptions = [];
    }
} 