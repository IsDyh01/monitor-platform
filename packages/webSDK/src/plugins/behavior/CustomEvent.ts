import SDKInstance from "../../index";

class CustomEvent {
    private sdkInstance: SDKInstance;
    constructor(sdkInstance: SDKInstance) {
        this.sdkInstance = sdkInstance;
    }

    customEventDataReport(event_name: string, payload: Record<string, any>) {
        this.sdkInstance.monitorCoreInstance.report('custom', event_name, payload);
        this.sdkInstance.monitorCoreInstance.pushAction('custom', payload);
    }
}

export default CustomEvent;
