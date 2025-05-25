import MonitorCore from "../../core";
import ttiPolyfill from "tti-polyfill";
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
  private sdkCoreInstance: MonitorCore; // 监控核心实例
  private fp: number | null = null;
  private fcp: number | null = null;
  private lcp: number = 0;
  private ttfb: number | null = null;
  private tti: number | null = null;
  private cls: number = 0;
  private fid: number | null = null;
  private tbtTask: Array<{ startTime: number; duration: number }> = [];
  private tbt: number = 0;
  //CLS 相关
  private clsValue = 0; // 最终的 CLS 值
  private sessionValue = 0; // 当前会话窗口的分数
  private lastEntryTimestamp = -1; // 最后一次偏移的时间戳
  private observerTBT: PerformanceObserver | null = null; // TBT 观察器
  private observerCLS: PerformanceObserver | null = null; // CLS 观察器
  private observerLCP: PerformanceObserver | null = null; // LCP 观察器

  constructor(sdkCoreInstance: MonitorCore) {
    this.sdkCoreInstance = sdkCoreInstance;
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
    // 监听TTI
    await this.getTTI();
  }
  // 监听FP
  getFPAndFCP() {
    const observerFpAndFCP = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "paint") {
          if (entry.name === "first-paint") {
            this.fp = entry.startTime;
            this.sdkCoreInstance.report("performance", {
              metric: "fp",
              value: this.fp,
            });
          } else if (entry.name === "first-contentful-paint") {
            this.fcp = entry.startTime;
            this.sdkCoreInstance.report("performance", {
              metric: "fcp",
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
    this.reportOnVisibilityChange(() => {
      if (this.lcp > 0) {
        this.sdkCoreInstance.report("performance", {
          metric: "lcp",
          value: this.lcp,
        });
        this.lastEntryTimestamp = -1; // 重置最后一次偏移的时间戳
        this.observerLCP!.disconnect(); // 断开观察器
      }
    });
  }

  async getTTI() {
    // 监听 TTI
    try {
      this.tti = await ttiPolyfill.getFirstConsistentlyInteractive();
      this.sdkCoreInstance.report("performance", {
        metric: "tti",
        value: this.tti,
      });
      this.reportTBT();
    } catch (error) {
      console.error("获取TTI失败", error);
    }
  }

  // 监听FID
  getFID() {
    // 监听FID
    const observerFID = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      if (entries.length > 0) {
        this.fid = entries[0].processingEnd - entries[0].startTime;
        this.sdkCoreInstance.report("performance", {
          metric: "fid",
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
        this.sdkCoreInstance.report("performance", {
          metric: "cls",
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
          this.sdkCoreInstance.report("performance", {
            metric: "ttfb",
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
        if (entry.entryType === "long-task") {
          const taskDuration = entry.duration;
          this.tbtTask.push({
            startTime: entry.startTime,
            duration: taskDuration,
          });
        }
      });
    });
    this.observerTBT.observe({
      type: "long-task",
      buffered: true,
    });
  }

  reportTBT() {
    if (this.tbt > 0) {
      // 计算 TBT,在 FCP 之后，
      this.tbt = this.tbtTask
        .filter((task) => {
          return (
            task.startTime >= this.fcp! &&
            task.startTime + task.duration <= this.tti!
          ); // 过滤掉 FCP 之前的任务
        })
        .reduce((total, task) => {
          return total + Math.max(0, task.duration - 50); // 计算 TBT
        }, 0);
      this.sdkCoreInstance.report("performance", {
        metric: "tbt",
        value: this.tbt,
      });
      this.tbtTask = []; // 重置 TBT 任务列表
      this.tbt = 0; // 重置 TBT 值
      this.observerTBT?.disconnect(); // 断开观察器
      this.observerTBT = null; // 清空观察器
    }
  }

  private reportOnVisibilityChange(callback: () => void) {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        callback();
      }
    });
    window.addEventListener("pagehide", () => {
      callback();
    });
    window.addEventListener("beforeunload", () => {
      callback();
    });
  }
}
