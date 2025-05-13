import { SDK_USER_ID } from "./constance";
import { MonitorCore } from "./core/index";
import { BehaviorMonitor } from "./plugins/behavior/index";
import { ErrorMonitor } from "./plugins/error/index";
import { PerformanceMonitor } from "./plugins/performance/index";
import getStorage from "./utils/storage";
import { v4 as uuidv4 } from "uuid";
interface WebSDKOptions {
  project_id: string; // 项目id
  user_id?: string; // 用户id 如果不传 sdk自动生成
}

interface UserInterface {
  user_id: string;
  device_name: string;
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
    let device_name = "";
    let browser = "";
    let os = "";
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

    return {
      user_id,
      device_name,
      browser,
      os,
    };
  }
}

export default WebSDK;
