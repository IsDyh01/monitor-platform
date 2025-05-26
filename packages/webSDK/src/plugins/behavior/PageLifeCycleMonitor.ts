import MonitorCore from "../../core";
import WebSDK from "../../index";
import { BasePayload } from "../../interface";

// 保存原始的 history 方法
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

// 重写 pushState 和 replaceState 以触发自定义事件
history.pushState = function (state, title, url) {
  originalPushState.call(history, state, title, url);
  window.dispatchEvent(new Event("customRouteChange")); // 触发自定义路由变化事件
};

history.replaceState = function (state, title, url) {
  originalReplaceState.call(history, state, title, url);
  window.dispatchEvent(new Event("customRouteChange")); // 触发自定义路由变化事件
};

export class PageLifeCycleMonitor {
  private monitorCore: MonitorCore;
  private sdkInstance: WebSDK;
  private pageLoadTime: number | null = null;

  constructor(sdkInstance: WebSDK) {
    this.sdkInstance = sdkInstance;
    this.monitorCore = sdkInstance.monitorCoreInstance;
    this.bindPageEvents();
  }

  private bindPageEvents(): void {
   

    // 监听 hash 变化
    window.addEventListener("hashchange", this.handleRouteChange.bind(this));

    // 监听 popstate（处理 go/back 等操作）
    window.addEventListener("popstate", this.handleRouteChange.bind(this));

    // 监听自定义路由变化事件（处理 pushState/replaceState）
    window.addEventListener("customRouteChange", this.handleRouteChange.bind(this));

    // 页面可见性变化
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        const payload: BasePayload = {
          timestamp: Date.now(),
        };
        this.monitorCore.report("behavior","page_hidden", payload);
      } else {
        const payload: BasePayload = {
          timestamp: Date.now(),
        };
        this.monitorCore.report("behavior","page_visible", payload);
      }
    });

    // 页面卸载
    window.addEventListener("beforeunload", () => {
      if (this.pageLoadTime === null) return;
      const stayTime = Date.now() - this.pageLoadTime;
      if (stayTime > 100) {
        const payload: BasePayload = {
          stayTime: stayTime,
        };
        this.monitorCore.pushAction("page_leave", payload);
        this.monitorCore.report("behavior","page_leave",payload);
      }
    });
  }

  // 处理路由变化的通用方法（上报 PV）
  private handleRouteChange() { 
  //   // 记录上一次URL，避免重复统计等待优化
  // if (this.lastUrl === window.location.href) return;
  // this.lastUrl = window.location.href;等待优化
    const payload: BasePayload = {
      url: window.location.href, // 当前页面 URL
      title: document.title, // 新增页面标题
      timestamp: Date.now(),
    };
    this.monitorCore.report("behavior","page_view",payload);
  }
}