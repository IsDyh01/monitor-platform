import express, { Router, Request, Response } from "express";
import cors from "cors";
import registerRoutes from "./routes";
const app = express();

app.use(cors({})); //跨域
app.use(express.json()); //解析json数据
app.use(express.text({ type: "*/*" })); // 解析sendBeacon数据

registerRoutes(app); //注册路由

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
