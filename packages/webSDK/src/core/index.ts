import { StaticData, Context, ReportData } from "../interface";
import { EventType } from "../constance";
import Tracker from "../utils/tracker";
import { v4 as uuidv4 } from "uuid";
// 数据上报参数类型

export default class MonitorCore {
  private staticData: StaticData;
  private tracker: Tracker;
  constructor(url: string, staticData: StaticData) {
    this.staticData = staticData;
    this.tracker = new Tracker(url);
  }

  // 数据上报
  report(event_type: EventType, payload: any) {
    // 先对数据进行格式化
    const data = this.formatData(event_type, payload);
    // 在进行上报
    this.tracker.send(data);
  }

  // 格式化数据
  formatData(event_type: EventType, payload: any): ReportData {
    const timestamp = this.getTimestamp();
    const context = this.getContxt();
    const event_id = this.getEventId();
    return {
      project_id: this.staticData.project_id,
      id: event_id, // 每个事件的id
      user: this.staticData.user,
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

  // 获取事件uuid
  getEventId(): string {
    return uuidv4();
  }

  // 获取上下文信息
  getContxt(): Context {
    return {
      page_url: document.location.href,
      page_title: document.title,
      referrer: document.referrer,
    };
  }
}
