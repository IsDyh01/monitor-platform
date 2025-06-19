import reportRouter from './report';
import getDataRouter from './getData';
import traceManageRouter from './traceManage';
import { Express } from 'express';


export default function regiserRoutes(app:Express) {
  app.use('/api/report', reportRouter);
  app.use('/api/getData', getDataRouter);
  app.use('/api/traceManage', traceManageRouter);
}