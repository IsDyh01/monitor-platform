/**
 * 监控数据类型：所有上报数据必须包含的基础字段
 */
export interface BaseTrackingData {
  /** 监控类型标识 */
  type: "performance" | "error" | "behavior";
  /** 发生时间戳 */
  timestamp: number;
  /** 页面URL */
  pageUrl: string;
  /** 用户ID（可选） */
  userId?: string;
  /** 自定义扩展数据 */
  extra?: Record<string, unknown>;
}

/** 性能监控数据 */
export interface PerformanceData extends BaseTrackingData {
  type: "performance";
  /** 性能指标名称 */
  metric: "TTI" | "FCP" | "LCP" | "CLS" | string;
  /** 测量值 */
  value: number;
  /** 资源类型（仅资源监控时存在） */
  resourceType?: "script" | "css" | "image";
}

/** 错误监控数据 */
export interface ErrorData extends BaseTrackingData {
  type: "error";
  /** 错误信息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 错误代码 */
  errorCode?: number;
  /** 错误等级 */
  level?: "fatal" | "error" | "warning";
}

/** 用户行为数据 */
export interface BehaviorData extends BaseTrackingData {
  type: "behavior";
  /** 行为类型 */
  action: "click" | "scroll" | "navigation" | string;
  /** 目标元素（可选） */
  targetElement?: string;
  /** 附加参数 */
  params?: Record<string, unknown>;
}

/** 通用数据格式 */
export type TrackingData =
  | PerformanceData
  | ErrorData
  | BehaviorData
  | BaseTrackingData;

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
}
