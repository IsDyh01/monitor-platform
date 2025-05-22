import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
/*先注释掉sdk引入 */
// import WebSDK from "@monitor-platform/sdk";

// const config = {
//   project_id: "1234567890",
// };

// const webSDK = new WebSDK(config);
// console.log(webSDK);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
