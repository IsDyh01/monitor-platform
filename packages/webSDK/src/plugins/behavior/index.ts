import MonitorCore from "../../core";
import { ClickMonitor } from "./ClickMonitor";
import { ScrollMonitor } from "./ScrollMonitor";
import { PageLifeCycleMonitor } from "./PageLifeCycleMonitor";
import WebSDK from "../..";
import CustomEvent from "./CustomEvent";
export class BehaviorMonitor {
  public clickMonitor: ClickMonitor| undefined;
  public scrollMonitor: ScrollMonitor| undefined;
  public pageLifeCycleMonitor: PageLifeCycleMonitor| undefined;
  public customEvent: CustomEvent| undefined;
  private sdkInstance: WebSDK;

  constructor(sdkInstance:WebSDK ) {
  this.sdkInstance = sdkInstance;
  // 初始化所有监控器
  this.initAllMonitors();
  }
  private initAllMonitors(): void {
    this. pageLifeCycleMonitor = new PageLifeCycleMonitor(this.sdkInstance);   
     // 页面生命周期指标
    this.clickMonitor = new ClickMonitor(this.sdkInstance);
    this.scrollMonitor = new ScrollMonitor(this.sdkInstance);
    this.customEvent = new CustomEvent(this.sdkInstance);
  }
  // 可选：提供统一销毁方法
    public destroy() {
      // 假设后续会在各监控器类中添加 destroy 方法，此处先做类型断言检查
      if (this.clickMonitor && typeof (this.clickMonitor as any).destroy === "function") {
        (this.clickMonitor as any).destroy();
      }
      if (this.scrollMonitor && typeof (this.scrollMonitor as any).destroy === "function") {
        (this.scrollMonitor as any).destroy();
      }
      if (this.pageLifeCycleMonitor && typeof (this.pageLifeCycleMonitor as any).destroy === "function") {
        (this.pageLifeCycleMonitor as any).destroy();
      }
    }

    // 提供自定义事件上报方法
    public customEventDataReport(event_name: string, payload: Record<string, any>) {
      this.customEvent?.customEventDataReport(event_name, payload);
    }
}