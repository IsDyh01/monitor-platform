import WebSDK from "../..";
import { BasePayload, ClickEventOptions} from "../../interface"; // 导入接口和事件类型

export class ClickMonitor {
  private sdkInstance: WebSDK;
  private options: ClickEventOptions;
  constructor(sdkInstance: WebSDK, options?: ClickEventOptions) {
    this.sdkInstance = sdkInstance;
    this.options = options || {};
    this.initClickMonitor();
  }

  initClickMonitor() {
    window.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      const {tagName, id, classList, innerText} = target;
      
      const clickPayload: BasePayload = {
        tagName,
        id,
        classList,
        innerText
      }
      
      if(this.options.allTarget) {
        
        this.sdkInstance.monitorCoreInstance.pushAction('click', clickPayload);
        this.sdkInstance.monitorCoreInstance.report('behavior', 'click', clickPayload);
        return;
      }
      if(id && this.options.targetId?.includes(id)) {
        
        this.sdkInstance.monitorCoreInstance.pushAction('click', clickPayload);
        this.sdkInstance.monitorCoreInstance.report('behavior', 'click', clickPayload);
        return;
      }
      if(classList && this.options.targetClass?.some(className => classList.contains(className))) {
        
        this.sdkInstance.monitorCoreInstance.pushAction('click', clickPayload);
        this.sdkInstance.monitorCoreInstance.report('behavior', 'click', clickPayload);
        return;
      }
      if(tagName && this.options.targetTag?.includes(tagName.toLowerCase())) {
        
        this.sdkInstance.monitorCoreInstance.pushAction('click', clickPayload);
        this.sdkInstance.monitorCoreInstance.report('behavior', 'click', clickPayload);
        return;
      }
      return;
    })
  }

}
  