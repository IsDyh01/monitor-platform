import type { ReportData, TrackConfig } from "../interface/index";
class Tracker {
  url: string;
  trackConfig: TrackConfig;
  constructor(url: string) {
    this.url = url;
    this.trackConfig = {
      idle: {
        timeout: 1000, // 空闲处理超时时间：1秒
        maxTasksPerIdle: 5, // 每次空闲处理最多 5 个任务
        fallbackInterval: 1000, // 降级轮询间隔：1秒
      },
      batch: {
        delay: 5000, // 批量发送间隔：5秒
        maxQueueSize: 20, // 队列最大长度：20 条
      },
      realtime: {
        enabled: true, // 默认启用实时发送
        retryDelay: 1000, // 重试间隔：1秒
      },
      maxRetries: 3, // 最多重试 3 次
      failedRetryDelay: 5 * 60 * 1000, // 重试间隔：五分钟
    };
    this.init({ url: this.url, trackConfig: this.trackConfig });
  }
  // 直接上报队列（优先级0）
  private immediateQueue: ReportData[] = [];
  // 空闲处理队列
  private idleQueue: ReportData[] = [];
  // 批量处理队列
  private batchQueue: ReportData[] = [];
  private isIdleScheduled = false;
  private retryMap = new Map<string, number>(); // 重试次数
  private batchTimer?: ReturnType<typeof setTimeout>; // 批量定时器
  private idleInterval?: ReturnType<typeof setInterval>; // 空闲定时器
  private retryFailedDataTimer?: ReturnType<typeof setInterval>; // 重试定时器

  generateDataHash(data: ReportData[]): string {
    // 生成稳定数据指纹（根据业务需求调整）
    return data
      .map(
        (item) =>
          // 提取核心特征（示例：事件类型+时间戳+用户ID）
          `${item.event_type}:${item.timestamp || Date.now()}|${item.id || "unknown"}`
      )
      .join("|");
  }
  // 初始化配置
  init(config: { url: string; trackConfig?: Partial<TrackConfig> }) {
    this.url = config.url;
    Object.assign(this.trackConfig, config.trackConfig);
    // 初始化失败数据重试定时器
    this.setupRetryScheduler();
    // 检测是本地存储是否有失败数据，如果有则上报
    this.retryFailedData();
  }
  // 销毁定时器
  destroy() {
    clearInterval(this.idleInterval);
    clearTimeout(this.batchTimer);
    clearInterval(this.retryFailedDataTimer);
  }
  //立即上报，如错误检测等比较紧急的数据
  flushImmediate() {
    // 立即上报
    while (this.immediateQueue.length > 0) {
      const data = this.immediateQueue.splice(0, this.immediateQueue.length);
      if (data.length > 0) {
        this.sendWithRetry(data);
      }
    }
  }
  // 空闲上报器
  setupIdleScheduler() {
    if ("requestIdleCallback" in window) {
      this.flushIdle(this.trackConfig.idle?.timeout);
    } else if ("setInterval" in window) {
      // 降级处理
      const fallbackInterval = this.trackConfig.idle?.fallbackInterval || 1000;
      this.idleInterval = setInterval(() => {
        if (this.idleQueue.length > 0) {
          const data = this.idleQueue.splice(
            0,
            this.trackConfig.idle?.maxTasksPerIdle || 5
          );
          // 处理数据
          if (data) {
            this.sendWithRetry(data);
          }
        } else {
          // 如果没有数据，清除定时器
          clearInterval(this.idleInterval);
          this.idleInterval = undefined;
        }
      }, fallbackInterval);
    }
  }

  flushIdle(idleTime: number = 3000) {
    if (this.isIdleScheduled) {
      return;
    }
    this.isIdleScheduled = true;
    try {
      requestIdleCallback(
        () => {
          const maxTasksPerIdle = this.trackConfig.idle?.maxTasksPerIdle || 5;
          const task = this.idleQueue.splice(0, maxTasksPerIdle);
          if (task.length > 0) {
            this.sendWithRetry(task);
          }
        },
        { timeout: idleTime }
      );
    } finally {
      this.isIdleScheduled = false;
      if (this.idleQueue.length > 0) {
        this.flushIdle(idleTime);
      }
    }
  }

  flushBatch() {
    if (this.batchQueue.length === 0) {
      return;
    }
    const batchSize = this.trackConfig.batch?.maxQueueSize || 20;
    if (this.batchQueue.length >= batchSize) {
      const batchData = this.batchQueue.splice(0, batchSize);
      this.sendWithRetry(batchData);
      return;
    }
    // 设置定时器，定时上报
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    this.batchTimer = setTimeout(() => {
      this.flushBatch();
    }, this.trackConfig.batch?.delay || 5000);
  }

  send(data: ReportData) {
    let queueType: string = "idle";
    if (data.event_type === "error") {
      queueType = "immediate";
    } else if (data.event_type === "performance") {
      queueType = "batch";
    } else {
      queueType = "idle";
    }
    // 立即上报
    if (queueType === "immediate") {
      this.immediateQueue.push(data);
      this.flushImmediate();
    } else if (queueType === "idle") {
      // 空闲上报
      this.idleQueue.push(data);
      if (!this.isIdleScheduled) {
        this.setupIdleScheduler();
      }
    } else if (queueType === "batch") {
      // 批量上报
      this.batchQueue.push(data);
      this.flushBatch();
    }
  }
  //  发送数据，包含重试逻辑
  async sendWithRetry(data: ReportData[]) {
    try {
      const success = await this.beacon(this.url, data);
      if (success) {
        // 清除重试次数
        const dataHash = this.generateDataHash(data);
        this.retryMap.delete(dataHash);
      }
    } catch (error) {
      //错误重试
      console.error("上报失败", error);
      // 生成数据指纹作为键
      const dataHash = this.generateDataHash(data);
      // 获取当前重试次数
      const retryCount = this.retryMap.get(dataHash) || 0;
      if (retryCount < (this.trackConfig.maxRetries || 3)) {
        this.retryMap.set(dataHash, retryCount + 1);
        setTimeout(() => {
          this.sendWithRetry(data);
        }, this.trackConfig.realtime?.retryDelay || 1000);
      } else {
        // 超过最大重试次数，保存到本地
        this.saveFailedData(data);
        console.error("超过最大重试次数，数据已保存到本地");
      }
    }
  }
  // 对发送逻辑做兼容处理
  beacon = (url: string, data: ReportData[]) => {
    return new Promise((resolve) => {
      if (navigator.sendBeacon(url, JSON.stringify(data))) {
        return resolve(true);
      } else {
        // 兼容处理
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true); // 使用异步请求
        xhr.setRequestHeader("Content-Type", "application/json");
        // 处理响应
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log("上报成功");
            resolve(true);
          } else {
            console.error("上报失败", xhr.statusText);
            resolve(false);
          }
        };
        // 处理错误和超时
        xhr.ontimeout = xhr.onerror = () => {
          console.error("上报失败", xhr.statusText);
          resolve(false); // 必须确保 Promise 最终会 resolve
        };
        xhr.timeout = 5000; // 设置超时时间
        // 发送数据
        xhr.send(JSON.stringify(data));
      }
    });
  };
  // 发送失败，保存到本地
  private saveFailedData(data: ReportData[]) {
    const STORAGE_KEY = "tracker_failed_data";
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const newData = [...existing, ...data];

      // 防止存储超过 1MB（localStorage 上限通常为 5MB）
      const encoder = new TextEncoder();
      const byteLength = encoder.encode(JSON.stringify(newData)).length;
      if (byteLength > 1024 * 1024) {
        console.warn("失败数据超过存储限制，丢弃最早数据");
        newData.splice(0, Math.floor(newData.length / 4));
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error("本地存储失败:", e);
    }
  }
  // 从本地存储中获取失败数据并且上报
  private async retryFailedData() {
    const STORAGE_KEY = "tracker_failed_data";
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (data.length > 0) {
        const success = await this.beacon(this.url, data);
        if (success) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("读取本地存储失败:", e);
    }
  }
  // 设置定时器，定时上报失败数据
  private setupRetryScheduler() {
    // 监听网络状态变化
    window.addEventListener("online", () => {
      this.retryFailedData();
    });
    if (this.retryFailedDataTimer) {
      clearInterval(this.retryFailedDataTimer);
    }
    this.retryFailedDataTimer = setInterval(
      () => {
        this.retryFailedData();
      },
      this.trackConfig.failedRetryDelay || 5 * 60 * 1000
    );
  }
}
export default Tracker;
