import MonitorCore from "../../core";
export class ErrorMonitor {
  private sdkCoreInstance: MonitorCore; // 监控核心实例
  constructor(sdkCoreInstance: MonitorCore) {
    this.sdkCoreInstance = sdkCoreInstance;
    // 初始化错误监控
  }
}
