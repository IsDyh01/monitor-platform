import { EventType } from "../constance";
export interface WebSDKOptions {
  project_id: string; // 项目id
  url: string; // 上报服务器地址
  user_id?: string; // 用户id 如果不传 sdk自动生成
}

export interface StaticData {
  project_id: string; // 项目id
  user: User;
}

/** 用户信息 */
export interface User {
  user_id: string; // 必填，用户唯一标识
  device?: string; // 可选，设备名称（如 "mac-os"）
  browser?: string; // 可选，浏览器（如 "Chrome 120"）
  os?: string; // 可选，操作系统（如 "iOS 16.4.1"）
}

/** 上下文信息 */
export interface Context {
  page_url: string; // 必填，当前页面完整URL
  referrer: string; // 必填，来源页面URL
  page_title?: string; // 可选，页面标题
}

/** 负载数据基类（所有 payload 必须包含 `metric` 字段） */
export interface BasePayload {
  metric: string; // 必填，指标类型（如 "fcp", "lcp"）
  [key: string]: any; // 允许扩展其他动态字段
}

// ------------------------- 上报数据主类型 -------------------------
/** 完整上报数据结构 */
export interface ReportData {
  project_id: string; // 项目唯一ID
  id: string; // 事件唯一ID（SDK自动生成UUIDv4）
  event_type: EventType; // 事件类型
  timestamp: number; // Unix毫秒时间戳
  user: User; // 用户标识信息
  context: Context; // 环境上下文
  payload: BasePayload; // 具体指标数据
}
/**
 * 上报策略配置
 */
/** 完整配置类型 */
export interface TrackConfig {
  /** 空闲队列配置 */
  idle?: {
    /** 浏览器空闲处理的超时时间（毫秒，默认 1000） */
    timeout?: number;
    /** 每次空闲处理的最大任务数（默认 5） */
    maxTasksPerIdle?: number;
    /** 降级处理的时间间隔（当不支持 requestIdleCallback 时，默认 1000ms） */
    fallbackInterval?: number;
  };
  /** 批量队列配置 */
  batch?: {
    /** 批量发送间隔（默认 5000ms） */
    delay?: number;
    /** 队列最大长度，超过后强制触发发送（默认 200） */
    maxQueueSize?: number;
  };

  /** 实时队列配置 */
  realtime?: {
    /** 是否启用实时发送（默认 true） */
    enabled?: boolean;
    /** 重试间隔（默认 1000ms） */
    retryDelay?: number;
  };
  /** 发送失败时的最大重试次数（默认 3） */
  maxRetries?: number;
  failedRetryDelay?: number; // 失败重试间隔（默认 5 * 60 * 1000ms）
}
