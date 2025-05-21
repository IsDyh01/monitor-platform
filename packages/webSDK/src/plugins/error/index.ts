export interface ErrorMonitorOptions {
  reportError: (payload: Record<string, any>) => void;
}
export class ErrorMonitor {
  private reportError: ErrorMonitorOptions["reportError"];
  constructor(options: ErrorMonitorOptions) {
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
  }

  //捕获同步js错误
  private initJsError(){  
    window.onerror = (message, source, lineno, colno, error) => {
      const errorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
} 