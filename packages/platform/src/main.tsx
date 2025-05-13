import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import WebSDK from "@monitor-platform/sdk";

const config = {
  project_id: "1234567890",
};

const webSDK = new WebSDK(config);
console.log(webSDK);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
