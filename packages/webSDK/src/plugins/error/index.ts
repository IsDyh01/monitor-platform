import MonitorCore from "../../core";
import WebSDK from "../../index";
export interface ErrorMonitorOptions {
  reportError: (payload: Record<string, any>) => void;
}
enum MetricsName {
  JS_ERROR = 'js_error',
  RESOURCE_ERROR = 'resource_error',
  PROMISE_ERROR = 'promise_error',
  INTERFACE_ERROR = 'interface_error',
  XHR_ERROR = 'xhr_error',
  NETWORK_ERROR = 'network_error',
  HTTP_ERROR = 'http_error',
}
export class ErrorMonitor {
  private reportError: ErrorMonitorOptions["reportError"];
  private options: ErrorMonitorOptions;
  private sdkCoreInstance: MonitorCore; // 监控核心实例
  private sdkInstance: WebSDK;
  constructor(sdkInstance: WebSDK, sdkCoreInstance: MonitorCore,options: ErrorMonitorOptions) {
    this.sdkCoreInstance = sdkCoreInstance;
    this.options = options;
    this.sdkInstance = sdkInstance;
    // 初始化错误监控
    if(!options || typeof options.reportError !== "function"){
      throw new Error("[ErrorMonitor] 必须传入 reportError 方法");
    }
    this.reportError = options.reportError

    //初始化监听
    this.initJsError();
    this.initResourceError();
    this.initPromiseError();
    this.initInterfaceError();
    this.initXhrError();
  }

  //捕获同步js错误
  private initJsError(){  
    window.onerror = (message, source, lineno, colno, error) => {
      const errorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      this.sdkInstance.monitorCoreInstance.report('error', {
        metric: MetricsName.JS_ERROR
      });
      
      this.reportError({
        errorId,
        type: "js-error",
        message,
        source,
        lineno,
        colno,
        stack: error?.stack,
        timestamp: Date.now,
      });
    };
  }
  //捕获资源加载错误
  private initResourceError(){
    window.addEventListener(
      "error",
      (event:any) => {
        const errorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const target = event.target;
        if(target && (target.src || target.href)) {
          this.sdkInstance.monitorCoreInstance.report('error', {
            metric: MetricsName.RESOURCE_ERROR
          });
          
          this.reportError({
            errorId,
            type: "resource-error",
            tagName: target.tagName,
            url: target.src || target.href,
            outerHTML: target.outerHTML,
            timestamp: Date.now(),
          });
        }
      },
      true
    );
  }
  //捕获未处理的Promise异常
  private initPromiseError(){
    window.addEventListener("unhandledrejection",(event)=>{
      const errorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      this.sdkInstance.monitorCoreInstance.report('error', {
        metric: MetricsName.PROMISE_ERROR
      });
      
      this.reportError({
        errorId,
        type: "promise-error",
        reason: event.reason,
        timestamp: Date.now(),
      });
    });
  }
  //捕获接口异常
  private initInterfaceError(){
    const originalFetch = window.fetch.bind(window);
    const fetchProxy =new Proxy (originalFetch, {
      apply: (target, thisArg, args: Parameters<typeof fetch>) => {
        const errorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const start = Date.now()
        const resource = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        const method = (args[1] as RequestInit)?.method || 'GET';
        return target.apply(thisArg, args,)
        .then((response: Response) => {
          if(!response.ok) {
            this.sdkInstance.monitorCoreInstance.report('error', {
              metric: MetricsName.INTERFACE_ERROR
            });
            
            this.reportError({
              errorId,
              type:'interface-error',
              url: resource,
              status: response.status,
              statusText: response.statusText,
              duration: Date.now() - start,
              timestamp: Date.now(),
            });
          };
            return response;
        })
        .catch((err: any) => {
          const duration = Date.now() -start;
          //fetch抛出的错误，可能是网络断开或cors拦截等
          const isCors = err instanceof TypeError && err.message === 'Failed to fetch';
          this.sdkInstance.monitorCoreInstance.report('error', {
            metric: MetricsName.NETWORK_ERROR
          });

          this.reportError({
            errorId,
            type: isCors ? 'cors-error' : 'http-error',
            url: resource,
            method,
            duration,
            timestamp: Date.now(),
          });
          return Promise.reject(err);
        }); 
      }
    });
    Object.defineProperty(window, 'fetch', {
      value: fetchProxy,
      writable: true,
      configurable: true,
    });
  }
  //拦截 XMLHttpRequest
  private initXhrError() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const self = this;
    //拦截open，缓存method/url
    (XMLHttpRequest.prototype as any).open = function(this: XMLHttpRequest, ...args: Parameters<XMLHttpRequest['open']>) {
      const [method, url] = args;
      (this as any).__method = args[0];
      (this as any).__url = args[1];
      return originalOpen.apply(this, args)
    }
    //拦截send，绑定事件
    XMLHttpRequest.prototype.send = function(body?: any){
      const xhr = this as XMLHttpRequest & { __method?: string; __url?: string };
      const start = Date.now();
      const onLoadend = () => {
        const status = xhr.status;
        //如果status >= 400 或 status === 0 (可能是跨域或网络错误)
        if (status >= 400 || status === 0) {
          const duration = Date.now() - start;
          self.sdkInstance.monitorCoreInstance.report('error', {
            metric: MetricsName.NETWORK_ERROR
          });

          self.reportError({
            type: status === 0 ? 'cors-error' : 'http-error',
            url: xhr.__url || '',
            method: xhr.__method || 'GET',
            status: status === 0 ? undefined : status,
            statusText: xhr.statusText || undefined,
            duration,
            timestamp: Date.now(),
          });
          cleanup();
        };
      }
      const onError = () => {
        const duration = Date.now() - start;
        self.sdkInstance.monitorCoreInstance.report('error', {
          metric: MetricsName.HTTP_ERROR
        });

        self.reportError({
          type: 'http-error',
          url: xhr.__url || '',
          method: xhr.__method || 'GET',
          duration,
          timestamp: Date.now(),
        });
        cleanup();
      };
      const onTimeout = () => {
        const duration = Date.now() - start;
        self.sdkInstance.monitorCoreInstance.report('error', {
          metric: MetricsName.HTTP_ERROR
        });

        self.reportError({
          type: 'http-error',
          url: xhr.__url || '',
          method: xhr.__method || 'GET',
          status: 0,
          statusText: 'timeout',
          duration,
          timestamp: Date.now(),
        });
        cleanup();
      };
      const cleanup = () => {
        xhr.removeEventListener('loadend', onLoadend);
        xhr.removeEventListener('error', onError);
        xhr.removeEventListener('timeout', onTimeout);
      };
      xhr.addEventListener('loadend', onLoadend);
      xhr.addEventListener('error', onError);
      xhr.addEventListener('timeout', onTimeout);

      return originalSend.apply(this, arguments as any);
    }
  }
}

