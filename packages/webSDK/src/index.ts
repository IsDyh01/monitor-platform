import { SDK_DEVICE_INFO, SDK_USER_ID } from "./constance";
import MonitorCore from "./core/index";
import { BehaviorMonitor } from "./plugins/behavior/index";
import { ErrorMonitor } from "./plugins/error/index";
import { PerformanceMonitor } from "./plugins/performance/index";
import getStorage from "./utils/storage";
import { v4 as uuidv4 } from "uuid";
import { UAParser } from "ua-parser-js";
import { WebSDKOptions, User, StaticData } from "./interface";

class WebSDK {
  private options: WebSDKOptions;
  private sessionStorage: ReturnType<typeof getStorage>;
  private localStorage: ReturnType<typeof getStorage>;
  private staticData: StaticData; // 静态数据 可以在初始化sdk时直接获取并存储 后续不需要改变
  monitorCoreInstance: MonitorCore; // 监控核心实例 私有字段 需要把内核实例传递到插件中，插件中需要使用内核的方法
  constructor(options: WebSDKOptions) {
    this.options = options;
    this.sessionStorage = getStorage("session");
    this.localStorage = getStorage("local");

    this.staticData = {
      project_id: this.getProjectId(),
      user: this.getUserInfo(),
    };
    // 初始化内核
    this.monitorCoreInstance = new MonitorCore(
      this.options.url,
      this.staticData
    );

    // 初始化监控插件
    new PerformanceMonitor();
    new ErrorMonitor();
    new BehaviorMonitor();
  }

  // 获取项目id
  private getProjectId() {
    return this.options.project_id;
  }

  // 初始化时获取用户信息
  private getUserInfo(): User {
    let user_id;
    let device = "";
    let browser = "";
    let os = "";

    // 获取用户id
    if (this.localStorage.getItem(SDK_USER_ID)) {
      user_id = this.localStorage.getItem(SDK_USER_ID);
    } else {
      if (this.options.user_id) {
        user_id = this.options.user_id;
      } else {
        user_id = uuidv4();
      }
      this.localStorage.setItem(SDK_USER_ID, user_id);
    }

    const deviceInfo = this.getDeviceInfo();
    device = deviceInfo.device;
    browser = deviceInfo.browser;
    os = deviceInfo.os;

    return {
      user_id,
      device,
      browser,
      os,
    };
  }

  // 获取用户设备信息
  private getDeviceInfo() {
    if (this.localStorage.getItem(SDK_DEVICE_INFO)) {
      return this.localStorage.getItem(SDK_DEVICE_INFO);
    }
    const userAgent = navigator.userAgent;

    const { os, browser, device } = UAParser(userAgent);
    const info = {
      os: os.name,
      browser: browser.name,
      device: device.vendor + "-" + device.model,
    };
    this.localStorage.setItem(SDK_DEVICE_INFO, info);

    return info;
  }
}
export default WebSDK;
