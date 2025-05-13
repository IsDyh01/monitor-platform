// 数据上报参数类型
interface UserInterface {
  user_id: string;
  device_name: string;
  browser: string;
  os: string;
}

interface ContextInterface {
  page_url: string; // 当前页面url
  page_title: string; // 当前页面标题
  referrer: string; // 来源页面url
}

interface DataInterface {
  project_id: string; // 项目id
  event_type: string; // 事件类型
  timestamp: number; // 上报时间
  user: UserInterface; // 用户相关标识
  context: ContextInterface; // 上下文信息
  payload: any; // 与event_type相关的上报数据
}

interface StaticDataInterface {
  project_id: string; // 项目id
  user: UserInterface;
}

export class MonitorCore {
  private staticData: StaticDataInterface;
  constructor(staticData: StaticDataInterface) {
    this.staticData = staticData;
  }

  // 格式化数据
  formatData(event_type: string, payload: any): DataInterface {
    const timestamp = this.getTimestamp();
    const context = this.getContxt();
    return {
      project_id: this.staticData.project_id,
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

  // 获取上下文信息
  getContxt(): ContextInterface {
    return {
      page_url: document.location.href,
      page_title: document.title,
      referrer: document.referrer,
    };
  }
}
