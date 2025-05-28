import MonitorCore from "../../core";
import WebSDK from "../../index";
import { BasePayload } from "../../interface";

// 监听哈希变化（通过popstate统一处理，因为popstate也能监听哈希变化）
const proxyPopstate = (handler: (e: Event) => void) => {
  window.addEventListener('popstate', (e) => handler(e));
};

// 重写history API，触发自定义事件
const originalPush = history.pushState;
const originalReplace = history.replaceState;
history.pushState = (...args) => {
  originalPush.apply(history, args);
  window.dispatchEvent(new Event('pushstate'));
};
history.replaceState = (...args) => {
  originalReplace.apply(history, args);
  window.dispatchEvent(new Event('replacestate'));
};

// 监听history API自定义事件
const proxyHistoryAPI = (handler: (e: Event) => void) => {
  window.addEventListener('pushstate', (e) => handler(e));
  window.addEventListener('replacestate', (e) => handler(e));
};

export class PageLifeCycleMonitor {
  private monitorCore: MonitorCore;
  private sdk: WebSDK;
  private lastRoute: string = ''; // 路由去重标记
  private lastHash: string = ''; // 哈希去重标记（新增）

  constructor(sdk: WebSDK) {
    this.sdk = sdk;
    this.monitorCore = sdk.monitorCoreInstance;
    this.initRouter();
    this.initPV();
  }

  // 解析触发源（类内部方法，可访问类属性）
  private getTrigger(e: Event): string {
    const currentHash = window.location.hash;
    const isHashChanged = currentHash !== this.lastHash;
    this.lastHash = currentHash; // 更新哈希记录

    switch (e.type) {
      case 'pushstate':
        return isHashChanged ? 'hash_push' : 'push';
      case 'replacestate':
        return isHashChanged ? 'hash_replace' : 'replace';
      case 'popstate':
        return isHashChanged ? 'hash_pop' : 'pop';
      default:
        return 'unknown';
    }
  }

  // 路由监控
  private initRouter(): void {
    const handleRoute = (e: Event) => {
      const current = window.location.href;
      if (current === this.lastRoute) return; // 路由去重

      this.lastRoute = current;
      const payload: BasePayload = {
        url: current,
        title: document.title,
        timestamp: Date.now(),
        trigger: this.getTrigger(e), // 调用类内部方法
        query: new URLSearchParams(window.location.search).toString(),
        hash: window.location.hash,
      };

      this.monitorCore.report('behavior', 'route_change', payload);
      this.monitorCore.pushAction('behavior', payload);
    };

    // 监听popstate（包含哈希变化和浏览器导航）
    proxyPopstate(handleRoute);
    // 监听history API自定义事件（push/replace）
    proxyHistoryAPI(handleRoute);
  }

  // PV监控
  private initPV(): void {
    window.addEventListener('load', () => {
      const initialPayload: BasePayload = {
        url: window.location.href,
        title: document.title,
        timestamp: Date.now(),
        isInitial: true,
      };
      this.monitorCore.report('behavior', 'page_view', initialPayload);
    });

    const handlePV = (e: Event) => {
      const current = window.location.href;
      if (current === this.lastRoute) return;

      const payload: BasePayload = {
        url: current,
        title: document.title,
        timestamp: Date.now(),
        trigger: this.getTrigger(e),
        query: new URLSearchParams(window.location.search).toString(),
        hash: window.location.hash,
      };

      this.monitorCore.report('behavior', 'page_view', payload);
    };

    proxyPopstate(handlePV);
    proxyHistoryAPI(handlePV);
  }
}