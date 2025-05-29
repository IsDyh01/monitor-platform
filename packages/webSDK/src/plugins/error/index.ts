import MonitorCore from "../../core";
import WebSDK from "../../index";
enum MetricsName {
  JS_ERROR = 'js_error',
  JS_CORS_ERROR = 'js_cors_error',
  RESOURCE_ERROR = 'resource_error',
  PROMISE_ERROR = 'promise_error',
  HTTP_ERROR = 'http_error',
}
//判断js_error  js_cors_error  resource_error
function getErrorType(params: {
    event?: ErrorEvent;
    isResource?: boolean;
}): MetricsName {
  const { event, isResource } = params;
  if(isResource) {
    return MetricsName.RESOURCE_ERROR;
  }
  if(event?.message === 'Script error.' && !event.lineno && !event.colno) {
    return MetricsName.JS_CORS_ERROR;
  }
  return MetricsName.JS_ERROR;
}

export class ErrorMonitor {
  private sdkCoreInstance: MonitorCore; // 监控核心实例
  private sdkInstance: WebSDK;
  private seenErrorIds = new Set<string>();//用来存已经上报过的errorId，防止重复上报
  private hashString(str: string): string{
    let hash = 0;
    for (let i = 0; i<str.length; i++){
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return 'e' + Math.abs(hash).toString(36);
  }
  
  constructor(sdkInstance: WebSDK, sdkCoreInstance: MonitorCore) {
    this.sdkCoreInstance = sdkCoreInstance;
    this.sdkInstance = sdkInstance;
    // 初始化错误监控
    //初始化监听
    this.initJsError();
    this.initResourceError();
    this.initPromiseError();
    this.initInterfaceError();
    this.initXhrError();
  }

  //捕获同步js错误
  private initJsError(){  
    window.addEventListener('error', (event: ErrorEvent) => {
      //纯资源错误交给initResourceError
      if(!event.error) {
        return;
      }
      const { message, filename: source, lineno, colno, error } = event;
      const type = getErrorType({event, isResource: false});
      const rawCtx = [type, source, lineno, colno].join('|');
      const errorId = this.hashString(rawCtx);
      //BasePayload
      const payload = {
        errorId,
        message,
        source,
        lineno,
        colno,
        stack: error.stack
      };
        this.sdkInstance.monitorCoreInstance.report(
          'error',
          type,
          payload
        );
        if(type === MetricsName.JS_CORS_ERROR) {event.preventDefault();}
    },true);
  }
  //捕获资源加载错误
  private initResourceError(){
    window.addEventListener(
      "error",
      (event:Event) => {
        const target = event.target as HTMLElement;
        const url = (target as any).src || (target as any).href;
        if(!url){
          return;
        }
        const type = getErrorType({isResource:true});
        const rawCtx = [type, target.tagName, url].join('|');
        const errorId = this.hashString(rawCtx);
        const payload = {
          errorId,
          tagName: target.tagName,
          url,
          outerHTML: target.outerHTML,
          timestamp: Date.now()
        }
        this.sdkInstance.monitorCoreInstance.report(
          'error',
          type,
          payload
        );
      },
      true
    );
  }
  //捕获未处理的Promise异常
  private initPromiseError(){
    window.addEventListener("unhandledrejection",(event:PromiseRejectionEvent)=>{
      const type = MetricsName.PROMISE_ERROR;
      const reason = event.reason;
      const message = reason?.message ?? String(reason);
      const stack = reason?.stack ?? "";
      const rawCtx = [type, message, stack].join("|");
      const errorId = this.hashString(rawCtx);
      const payload = {
        errorId,
        message,
        reason: event.reason,
        timestamp: Date.now(),
      }
      this.sdkInstance.monitorCoreInstance.report(
        'error',
        type,
        payload
      );
    });
  }
  //捕获接口异常
  private initInterfaceError(){
    const originalFetch = window.fetch.bind(window);
    const fetchProxy =new Proxy (originalFetch, {
      apply: (target, thisArg, args: Parameters<typeof fetch>) => {
        const start = Date.now()
        const resource = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        const method = (args[1] as RequestInit)?.method || 'GET';
        return target.apply(thisArg, args,)
        .then((response: Response) => {
          const type = MetricsName.HTTP_ERROR;
          const rawCtx = [type, resource, method, response.status].join('|');
          const errorId = this.hashString(rawCtx);
          if(!response.ok ) {
            const payload = {
              errorId,
              url: resource,
              method,
              status: response.status,
              statusText: response.statusText,
              duration: Date.now() - start,
              timestamp: Date.now(),
            }
            this.sdkInstance.monitorCoreInstance.report(
              'error',
              type,
              payload
            );
          };
            return response;
        })
        .catch((err: any) => {
          const duration = Date.now() -start;
          const type = MetricsName.HTTP_ERROR;
          const rawCtx = [type, resource, method, err.message].join('|');
          const errorId = this.hashString(rawCtx);
          const payload = {
              errorId,
              url: resource,
              method,
              duration,
              timestamp: Date.now(),
          }
          this.sdkInstance.monitorCoreInstance.report(
            'error',
            type,
            payload
          );
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
          const type = MetricsName.HTTP_ERROR;
          const rawCtx = [type, xhr.__url, xhr.__method, status === 0 ? 'network': String(status)].join('|');
          const errorId = self.hashString(rawCtx);
          const payload = {
            errorId,
            url: xhr.__url || '',
            method: xhr.__method || 'GET',
            status: status === 0 ? undefined : status,
            statusText: xhr.statusText || undefined,
            duration,
            timestamp: Date.now(),
          }
          self.sdkInstance.monitorCoreInstance.report(
            'error',
            type,
            payload
          );
          cleanup();
        };
      }
      const onError = () => {
        const duration = Date.now() - start;
        const type = MetricsName.HTTP_ERROR;
        const rawCtx = [type, xhr.__url, xhr.__method, 'error'].join('|');
        const errorId = self.hashString(rawCtx);
        const payload = {
          errorId,
          url: xhr.__url || '',
          method: xhr.__method || 'GET',
          duration,
          timestamp: Date.now(),
        }
        self.sdkInstance.monitorCoreInstance.report(
          'error',
          type,
          payload
        );
        cleanup();
      };
      const onTimeout = () => {
        const duration = Date.now() - start;
        const type = MetricsName.HTTP_ERROR;
        const rawCtx = [type, xhr.__url, xhr.__method, 'timeout'].join('|');
        const errorId = self.hashString(rawCtx);
        const payload = {
          errorId,
          url: xhr.__url || '',
          method: xhr.__method || 'GET',
          status: 0,
          statusText: 'timeout',
          duration,
          timestamp: Date.now(),
        }
        self.sdkInstance.monitorCoreInstance.report(
          'error',
          type,
          payload  
        );
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
