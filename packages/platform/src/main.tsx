import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
/*先注释掉sdk引入 */
import WebSDK from "@monitor-platform/sdk";

const config = {
  project_id: "1234567890",
  url: "http://localhost:3000/api/getData", // 上报地址
};
const sdk = new WebSDK(config);
console.log(sdk);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
