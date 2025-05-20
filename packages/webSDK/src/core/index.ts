import { ReportData, EventType } from "../interface";
import { v4 as uuidv4 } from "uuid";
// 数据上报参数类型
interface UserInterface {
  user_id: string;
  device: string;
  browser: string;
  os: string;
}

interface ContextInterface {
  page_url: string; // 当前页面url
  page_title: string; // 当前页面标题
  referrer: string; // 来源页面url
}

export interface StaticDataInterface {
  project_id: string; // 项目id
  user: UserInterface;
}

export class MonitorCore {
  private staticData: StaticDataInterface;
  constructor(staticData: StaticDataInterface) {
    this.staticData = staticData;
  }

  // 格式化数据
  formatData(event_type: EventType, payload: any): ReportData {
    const timestamp = this.getTimestamp();
    const context = this.getContxt();
    return {
      project_id: this.staticData.project_id,
      user: this.staticData.user,
      id: uuidv4(), // 生成唯一ID
      event_type,
      timestamp: timestamp,
      context,
      payload,
    };
  }

  // 获取当前时间戳
  getTimestamp(): number {
    return Date.now();
  }

  // 获取上下文信息
  getContxt(): ContextInterface {
    return {
      page_url: document.location.href,
      page_title: document.title,
      referrer: document.referrer,
    };
  }
}
