import WebSDK from "../../index";
// import MonitorCore from "../../core";
interface LayoutShift extends PerformanceEntry {
  value: number; // 本次偏移的分数
  hadRecentInput: boolean; // 是否由用户输入触发
  sources: Array<{
    node: Node; // 导致偏移的 DOM 元素
    previousRect: DOMRectReadOnly; // 偏移前的位置
    currentRect: DOMRectReadOnly; // 偏移后的位置
  }>;
}
export class PerformanceMonitor {
  private sdkInstance: WebSDK; // 监控核心实例
  private fp: number | null = null;
  private fcp: number | null = null;
  private lcp: number = 0;
  private ttfb: number | null = null;
  private cls: number = 0;
  private fid: number | null = null;
  private tbtTask: Array<{ startTime: number; duration: number }> = [];
  private tbt: number = 0;
  private fidStartTime: number = 0; // FID 开始时间,用于限制TBT的时间范围
  //CLS 相关
  private sessionValue = 0; // 当前会话窗口的分数
  private lastEntryTimestamp = 0; // 最后一次偏移的时间戳
  private observerTBT: PerformanceObserver | null = null; // TBT 观察器
  private observerCLS: PerformanceObserver | null = null; // CLS 观察器
  private observerLCP: PerformanceObserver | null = null; // LCP 观察器

  constructor(sdkInstance: WebSDK) {
    this.sdkInstance = sdkInstance;
    // 初始化性能监控
    this.init();
  }
  async init() {
    // 监听性能指标
    try {
      await this.getPerformance();
    } catch (error) {
      console.error("性能监控初始化失败", error);
    }
  }
  async getPerformance() {
    // 监听FP
    this.getFPAndFCP();
    // 监听LCP
    this.getLCP();
    // 监听TTFB
    this.getTTFB();
    // 监听FID
    this.getFID();
    // 监听CLS
    this.getCLS();
    // 监听TBT
    this.calculateTBT();
    this.reportOnVisibilityChange(this.reportTBT.bind(this));
  }
  // 监听FP
  getFPAndFCP() {
    const observerFpAndFCP = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "paint") {
          if (entry.name === "first-paint") {
            this.fp = entry.startTime;
            this.sdkInstance.monitorCoreInstance.report("performance",'fp', {
              value: this.fp,
            });
          } else if (entry.name === "first-contentful-paint") {
            this.fcp = entry.startTime;
            this.sdkInstance.monitorCoreInstance.report("performance",'fcp', {
              value: this.fcp,
            });
            observerFpAndFCP.disconnect(); // 断开观察器
          }
        }
      });
    });
    observerFpAndFCP.observe({ type: "paint", buffered: true });
  }
  // 监听LCP
  getLCP() {
    // 监听LCP
    this.observerLCP = new PerformanceObserver((list) => {
      const entries = list.getEntries() as LargestContentfulPaint[];
      if (entries.length > 0) {
        const latestEntty = entries[entries.length - 1];
        if (latestEntty && latestEntty.startTime > this.lcp) {
          this.lcp = latestEntty.startTime;
        }
      }
    });
    this.observerLCP.observe({
      type: "largest-contentful-paint",
      buffered: true,
    });
    const reportLCP = () => {
      if (this.lcp > 0) {
        this.sdkInstance.monitorCoreInstance.report("performance",'lcp', {
          value: this.lcp,
        });
        this.lastEntryTimestamp = 0; // 重置最后一次偏移的时间戳
        this.observerLCP!.disconnect(); // 断开观察器
      }
    };
    this.reportOnVisibilityChange(reportLCP);
  }

  // 监听FID
  getFID() {
    // 监听FID
    const observerFID = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      if (entries.length > 0) {
        this.fidStartTime = entries[0].startTime;
        this.fid = entries[0].processingEnd - entries[0].startTime;
        this.sdkInstance.monitorCoreInstance.report("performance", 'fid', {
          value: this.fid,
        });
        observerFID.disconnect(); // 断开观察器
      }
    });
    observerFID.observe({
      type: "first-input",
      buffered: true,
    });
  }
  getCLS() {
    this.observerCLS = new PerformanceObserver((list) => {
      const entries = list.getEntries() as LayoutShift[];
      entries.forEach((entry) => {
        if (entry.hadRecentInput) return; // 忽略用户输入引起的偏移
        if (entry.startTime - this.lastEntryTimestamp > 1000) {
          this.sessionValue = 0; // 重置当前会话窗口的分数
        } else {
          this.sessionValue += entry.value; // 累加当前会话窗口的分数
        }
        this.cls = Math.max(this.sessionValue, this.cls); // 更新最终的 CLS 值
      });
    });
    this.observerCLS.observe({
      type: "layout-shift",
      buffered: true,
    });
    this.reportOnVisibilityChange(() => {
      if (this.cls > 0) {
        this.sdkInstance.monitorCoreInstance.report("performance",'cls', {
          value: this.cls,
        });
        this.cls = 0; // 重置 CLS 值
        this.sessionValue = 0; // 重置当前会话窗口的分数
        this.lastEntryTimestamp = -1; // 重置最后一次偏移的时间戳
        this.observerCLS!.disconnect(); // 断开观察器
      }
    });
  }
  // 监听 TTFB
  getTTFB() {
    // 监听TTFB : responseStart - requestStart
    const observerTTFB = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const navigationEntries = entries[0] as PerformanceNavigationTiming;
      if (navigationEntries) {
        this.ttfb =
          navigationEntries.responseStart - navigationEntries.requestStart;
        if (this.ttfb > 0) {
          this.sdkInstance.monitorCoreInstance.report("performance",'ttfb', {
            value: this.ttfb,
          });
          observerTTFB.disconnect(); // 断开观察器
        }
      }
    });
    observerTTFB.observe({
      type: "navigation",
      buffered: true,
    });
  }

  calculateTBT() {
    this.observerTBT = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === "longtask") {
          const taskDuration = entry.duration;
          this.tbtTask.push({
            startTime: entry.startTime,
            duration: taskDuration,
          });
        }
      });
    });
    this.observerTBT.observe({
      type: "longtask",
      buffered: true,
    });
  }

  reportTBT() {
    if (this.tbtTask.length > 0) {
      // 计算 TBT,在 FCP 之后，
      this.tbt = this.tbtTask
        .filter((task) => {
          return (
            task.startTime >= this.fcp! &&
            task.startTime + task.duration <= this.fidStartTime!
          ); // 过滤掉 FCP 之前的任务
        })
        .reduce((total, task) => {
          return total + Math.max(0, task.duration - 50); // 计算 TBT
        }, 0);
      this.sdkInstance.monitorCoreInstance.report("performance",'tbt', {
        value: this.tbt,
      });
      this.tbtTask = []; // 重置 TBT 任务列表
      this.tbt = 0; // 重置 TBT 值
      this.observerTBT?.disconnect(); // 断开观察器
      this.observerTBT = null; // 清空观察器
    }
  }

  private reportOnVisibilityChange(callback: () => void) {
    const handler = () => {
      callback();
      // 在所有事件中移除 handler
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("pagehide", handler);
      window.removeEventListener("beforeunload", handler);
    };
    document.addEventListener("visibilitychange", handler, {
      once: true,
    });
    window.addEventListener("pagehide", handler, {
      once: true,
    });
    window.addEventListener("beforeunload", handler, {
      once: true,
    });
  }
}
