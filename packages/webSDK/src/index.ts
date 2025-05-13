import { SDK_DEVICE_INFO, SDK_USER_ID } from "./constance";
import { MonitorCore } from "./core/index";
import { BehaviorMonitor } from "./plugins/behavior/index";
import { ErrorMonitor } from "./plugins/error/index";
import { PerformanceMonitor } from "./plugins/performance/index";
import getStorage from "./utils/storage";
import { v4 as uuidv4 } from "uuid";
import { UAParser } from "ua-parser-js";
interface WebSDKOptions {
  project_id: string; // 项目id
  user_id?: string; // 用户id 如果不传 sdk自动生成
}

interface UserInterface {
  user_id: string;
  device: string;
  browser: string;
  os: string;
}

interface StaticData {
  project_id: string; // 项目id
  user: UserInterface;
}

class WebSDK {
  private options: WebSDKOptions;
  private sessionStorage: ReturnType<typeof getStorage>;
  private localStorage: ReturnType<typeof getStorage>;
  private staticData: StaticData;
  constructor(options: WebSDKOptions) {
    this.options = options;
    this.sessionStorage = getStorage("session");
    this.localStorage = getStorage("local");

    this.staticData = {
      project_id: this.getProjectId(),
      user: this.getUserInfo(),
    };
    // 初始化内核
    new MonitorCore(this.staticData);

    // 初始化监控插件
    new PerformanceMonitor();
    new ErrorMonitor();
    new BehaviorMonitor();
  }

  // 获取项目id
  getProjectId() {
    return this.options.project_id;
  }

  // 初始化时获取用户信息
  getUserInfo(): UserInterface {
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
  getDeviceInfo() {
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
