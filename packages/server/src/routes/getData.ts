import {Router,Request,Response} from 'express'
import { COLLECTIONNAME } from '../../config/config' 
import mongoose from 'mongoose'
const router=Router()

//

router.get('/', (req:Request, res:Response) => {
  const event_type=req.query.event_type
  const Event_Type = ['performance' ,'behavior' , 'error' , 'custom'];
  if(Event_Type.includes(event_type as string)) {
    const data=mongoose.connection.collection(`${COLLECTIONNAME}`).find({}).toArray()
    data.then((data:any[])=>{
      data=data.filter((item:any)=>item.event_type===event_type)
          res.send({status:'success',message:'数据获取成功',data:data}).status(200)
    })
  }
  else{
    res.status(400).send({status:'error',message:'无效的事件类型'})
  }
})

export default router