import WebSDK from "../..";
import MonitorCore from "../../core";
import { BasePayload} from "../../interface"; // 导入接口和事件类型

export class ClickMonitor {
  private monitorCore: MonitorCore;
  private sdkInstance: WebSDK;
  constructor(sdkInstance: WebSDK) {
    this.sdkInstance = sdkInstance;
    this.monitorCore = sdkInstance.monitorCoreInstance;
   
  }

  }
  