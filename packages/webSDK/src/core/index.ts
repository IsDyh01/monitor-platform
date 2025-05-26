import { StaticData, Context, ReportData, BasePayload } from "../interface";
import { EventType } from "../constance";
import Tracker from "../utils/tracker";
import { v4 as uuidv4 } from "uuid";
import { Action, ActionStack } from "../utils/ActionStack";
import WebSDK from "../index";
// 数据上报参数类型

export default class MonitorCore {
  private staticData: StaticData;
  private actionStack: ActionStack;//新增行为记录栈
  private tracker: Tracker;
  constructor(sdkInstance: WebSDK, staticData: StaticData, url: string) {
    this.staticData = staticData;
    this.tracker = new Tracker(sdkInstance, { url });
    this.actionStack = new ActionStack(100);
  }
  
  // 数据上报
  report(event_type: EventType,event_name: string, payload: BasePayload) {
    // 先对数据进行格式化
    const data = this.formatData(event_type, event_name, payload);
    // 在进行上报
    this.tracker.send(data);
  }

  // 格式化数据
  formatData(event_type: EventType,event_name: string, payload: any): ReportData {
    const timestamp = this.getTimestamp();
    const context = this.getContxt();
    const event_id = this.getEventId();
    return {
      project_id: this.staticData.project_id,
      id: event_id, // 每个事件的id
      user: this.staticData.user,
      event_name,
      event_type,
      timestamp: timestamp,
      context,
      payload: {
        ...payload,
        // 仅在错误上报时添加行为栈
        ...(event_type === "error" ? { actionStack: this.getActionStack() } : {}),
      },
    };
  }

  
  // 获取行为栈用于错误上报
  getActionStack(): Action[] {
    return this.actionStack.getStack();
  }

  // 将行为添加到栈中
  pushAction(event_name: string, data: any): void {
    const action = {
      event_name,
      timestamp: Date.now(),
      data,
    };
    this.actionStack.push(action);
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
