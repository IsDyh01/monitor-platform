import MonitorCore from "../../core";
import { ClickMonitor } from "./ClickMonitor";
import { ScrollMonitor } from "./ScrollMonitor";
import { PageLifeCycleMonitor } from "./PageLifeCycleMonitor";
import WebSDK from "../..";

export class BehaviorMonitor {
  public clickMonitor: ClickMonitor;
  public scrollMonitor: ScrollMonitor;
  public pageLifeCycleMonitor: PageLifeCycleMonitor;
  private sdkInstance: WebSDK;

  constructor(sdkInstance:WebSDK ) {
  this.sdkInstance = sdkInstance;
  // 初始化所有监控器
  this.clickMonitor = new ClickMonitor(sdkInstance);
  this.scrollMonitor = new ScrollMonitor(sdkInstance);
  this.pageLifeCycleMonitor = new PageLifeCycleMonitor(sdkInstance);
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
}