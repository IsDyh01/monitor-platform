import WebSDK from "../../index";
import { HttpHandlerPayloadType } from "../../interface";
enum MetricsName {
  JS_ERROR = 'js_error',
  JS_CORS_ERROR = 'js_cors_error',
  RESOURCE_ERROR = 'resource_error',
  PROMISE_ERROR = 'promise_error',
  XHR_ERROR = 'xhr_error',
  FETCH_ERROR = 'fetch_error'
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

export function proxyXhrHandler(loadHandler: (data: HttpHandlerPayloadType)=> void) {
  if('XMLHttpRequest' in window && typeof window.XMLHttpRequest === 'function'){
    const oXMLHttpRequest = window.XMLHttpRequest;
    let metrics: HttpHandlerPayloadType = {} as HttpHandlerPayloadType;
    (window as any).XMLHttpRequest = function() {
      const xhr = new oXMLHttpRequest();
      const {open, send} = xhr;
      
      //拦截 open，缓存method/url
      xhr.open = function (
        method: string,
        url: string,
        async?: boolean,
        username?: string | null,
        password?: string | null
      ) {
        metrics.method = method;
        metrics.url = url;
        
        return open.apply(xhr, arguments as any);
      };
      //拦截send, 绑定loadend/error/timeout
      xhr.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
        metrics.startTime = new Date().getTime();
        metrics.body = body;

        return send.apply(xhr, arguments as any);
      }

      xhr.addEventListener('loadend', () => {
        metrics.endTime = new Date().getTime();
        metrics.status = xhr.status;
        metrics.statusText = xhr.statusText;
        metrics.response = xhr.response;
        if(typeof loadHandler === 'function') {
          loadHandler(metrics);
        }
      })

      return xhr;
    }
  }
}

export function proxyFetchHandler(loadHandler: (data: HttpHandlerPayloadType) => void ): void {
  const oFetch = window.fetch;
  (window as any).fetch = async (input: any, init: RequestInit) => {
    
    // init 是用户手动传入的 fetch 请求互数据，包括了 method、body、headers，要做统一拦截数据修改，直接改init即可
    let metrics = {} as HttpHandlerPayloadType;

    metrics.method = init?.method || '';
    metrics.url = (input && typeof input !== 'string' ? input?.url : input) || ''; // 请求的url
    metrics.body = init?.body || '';
    metrics.startTime = new Date().getTime();

    return oFetch.call(window, input, init).then(async (response) => {
      // clone 出一个新的 response,再用其做.text(),避免 body stream already read 问题
      const res = response.clone();
      metrics = {
        ...metrics,
        status: res.status,
        statusText: res.statusText,
        response: await res.text(),
        endTime: new Date().getTime(),
      };
      if (typeof loadHandler === 'function') loadHandler(metrics);
      return response;
    }).catch((error: any) => {
      metrics = {
        ...metrics,
        status: -1,
        statusText: '',
        response: '',
        endTime: new Date().getTime(),
      };
      if (typeof loadHandler === 'function') loadHandler(metrics);
      return Promise.reject(error)
    });
  };
}

export class ErrorMonitor {
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
  
  constructor(sdkInstance: WebSDK) {
    this.sdkInstance = sdkInstance;
    // 初始化错误监控
    //初始化监听
    this.initJsError();
    this.initResourceError();
    this.initPromiseError();
    this.initFetchError();
    this.initXhrError();
  }
  private handlerReportError(
    event_type: 'error',
    event_name: MetricsName,
    payload: Record<string, any>
  ){
    const errorId = payload.errorId;
    if(this.seenErrorIds.has(errorId)){
      return; //重复错误，跳过上报
    }
    this.seenErrorIds.add(errorId);
    
    this.sdkInstance.monitorCoreInstance.report(
      event_type,
      event_name,
      payload
    );
  }

  //捕获同步js错误
  private initJsError(){  
    window.addEventListener('error', (event: ErrorEvent) => {
      const type = getErrorType({event, isResource: false});
      //如果是跨域脚本错误，单独上报并阻止默认
      if(type === MetricsName.JS_CORS_ERROR) {
        const pageURL = window.location.href;
        const userAgent = navigator.userAgent;
        const message = event.message;
        const filename = event.filename || '';
        const rawCtx = [type, pageURL, userAgent, message, filename].join('|');
        const errorId = this.hashString(rawCtx);
        const payload = {
          errorId,
          message,
          pageURL,
          userAgent,
          timestamp: Date.now(),
        };
        this.handlerReportError('error',type,payload)
        event.preventDefault();
        return;
      }
      //纯资源错误交给initResourceError
      if(type !== MetricsName.JS_ERROR) {
        return;
      }
      const { message, filename: source, lineno, colno, error } = event;
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
        this.handlerReportError(
          'error',
          type,
          payload
        );
    },true);
  }
  //捕获资源加载错误
  private initResourceError(){
    window.addEventListener(
      "error",
      (event:Event) => {
        const type = getErrorType({isResource:true});
        if(type !== MetricsName.RESOURCE_ERROR){return};
        const target = event.target as HTMLElement;
        const url = (target as any).src || (target as any).href;
        if(!url){
          return;
        }
        const rawCtx = [type, target.tagName, url].join('|');
        const errorId = this.hashString(rawCtx);
        const payload = {
          errorId,
          tagName: target.tagName,
          url,
          outerHTML: target.outerHTML,
          timestamp: Date.now()
        }
        this.handlerReportError(
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

      const rawCtx = [type, message].join("|");
      const errorId = this.hashString(rawCtx);
      const payload = {
        errorId,
        message,
        reason: event.reason,
        timestamp: Date.now(),
      }
      this.handlerReportError(
        'error',
        type,
        payload
      );
    });
  }
  //捕获fetch异常
  private initFetchError(){
    
    const loadHandler = (params: HttpHandlerPayloadType) => {
      
      const {method, url, status, statusText, startTime, endTime, body, response } = params;
      if(status !== undefined && status < 400 && status !== -1 ){
        return
      }
      const rawCtx = [
        MetricsName.FETCH_ERROR,
        url,
        method,
        status === 0 ? 'network' : String(status)
      ].join('|');
      const errorId = this.hashString(rawCtx);
      const payload = {
        errorId,
        url,
        method,
        status,
        statusText,
        startTime,
        endTime,
        body,
        response
      };
      this.handlerReportError('error', MetricsName.FETCH_ERROR, payload);
    }
    proxyFetchHandler(loadHandler);
  }
  //拦截 XMLHttpRequest
  private initXhrError() {
    const loadHandler = (params: HttpHandlerPayloadType) => {
      const {method, url, status, statusText, startTime, endTime, response, body } = params;
      // 如果状态码为400以下都相当于请求成功，除了0 网络失败 -1 请求中断
      if(status !== undefined && status < 400 && status !== 0 && status !== -1){
        return
      }
      const rawCtx = [
        MetricsName.XHR_ERROR,
        url,
        method,
        status === 0 ? 'network' : status === -1 ? 'abort' : String(status)
      ].join('|');
      const errorId = this.hashString(rawCtx);
      const payload = {
        errorId,
        url,
        method,
        status,
        statusText,
        startTime, 
        endTime, 
        response,
        body
      };
      this.handlerReportError('error', MetricsName.XHR_ERROR, payload);
    }
    proxyXhrHandler(loadHandler);
  }
}
