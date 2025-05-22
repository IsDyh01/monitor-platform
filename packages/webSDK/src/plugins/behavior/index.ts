import MonitorCore from "../../core";
export class BehaviorMonitor {
  private sdkCoreInstance: MonitorCore; // 监控核心实例
  constructor(sdkCoreInstance: MonitorCore) {
    this.sdkCoreInstance = sdkCoreInstance;
    // 初始化用户行为监控
  }
}
