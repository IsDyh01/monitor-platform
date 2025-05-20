import { StaticDataInterface } from "../core/index";
// 自动收集浏览器环境信息
export async function collectBrowserInfo(): Promise<StaticDataInterface> {
  const ua = navigator.userAgent;
  const deviceInfo = await getDeviceInfo();
  return {
    project_id: localStorage.getItem("project_id") || "unknown-project",
    user: {
      user_id: localStorage.getItem("user_id") || "default_user_id",
      device: deviceInfo?.isMobile ? deviceInfo.model : deviceInfo?.platform,
      browser: parseBrowser(ua),
      os: parseOS(ua),
    },
  };
}

// 示例解析函数（需要根据实际需求完善）
function parseBrowser(ua: string): string {
  const match = ua.match(/(Chrome|Firefox|Safari)\/([\d.]+)/);
  return match ? `${match[1]}/${match[2]}` : "unknown-browser";
}

function parseOS(ua: string): string {
  if (ua.includes("Mac OS"))
    return `macOS ${ua.match(/Mac OS X (\d+_\d+)/)?.[1].replace("_", ".")}`;
  if (ua.includes("Windows")) return "Windows";
  return "unknown-os";
}
async function getDeviceInfo() {
  if ("userAgentData" in navigator) {
    const data = await (navigator as any).userAgentData.getHighEntropyValues([
      "platform", // 替代 navigator.platform
      "model", // 设备型号（如 "Pixel 7"）
      "mobile", // 是否移动设备
    ]);
    return {
      platform: data.platform,
      model: data.model,
      isMobile: data.mobile,
    };
  }
  return null; // 降级处理
}
