import WebSDK from "../..";
import MonitorCore from "../../core";
import { BasePayload } from "../../interface";

export class ScrollMonitor {
  private monitorCore: MonitorCore;
  private sdkInstance: WebSDK;

  constructor(sdkInstance: WebSDK) {
    this.sdkInstance = sdkInstance;
    this.monitorCore = sdkInstance.monitorCoreInstance;
  }

}