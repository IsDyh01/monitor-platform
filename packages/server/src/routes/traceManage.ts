import {Router,Request,Response} from 'express'
import mongoose from 'mongoose'
const router=Router()

//

router.post('/', (req:Request, res:Response) => {
    const traceData=req.body.values;
    mongoose.connection.collection('traceColl').insertOne(traceData)
    res.send('Trace Manage API is working')
})

router.get('/', (req:Request, res:Response) => {
  const data=mongoose.connection.collection(`traceColl`).find({}).toArray()
  data.then((data:any[])=>{
    res.send(data).status(200)
  }).catch((err:any)=>{
    res.status(500).send({status:'error',message:'数据获取失败',error:err.message})
  })
})

router.delete('/', (req:Request, res:Response) => {
  console.log(`删除请求接收到，ID为：${req.query._id}`)
  const id=new mongoose.Types.ObjectId(req.query._id as string); 
  const traceColl=mongoose.connection.collection(`traceColl`)
  traceColl.deleteOne({_id:id}).then((result:any)=>{
    if(result.deletedCount===1){
      res.status(200).send({message:'删除成功'})
      console.log(`删除成功，删除的记录ID为：${id}`)
      return
    }
    else{
      console.log(`未找到要删除的记录，ID为：${id}`)
      res.status(404).send({message:'未找到要删除的记录'})
    }
  })
})

router.patch('/', (req:Request, res:Response) => {
  console.log('更新请求接收到')
  console.log(req.body)
  const{event_name,event_type,payload,_id}=req.body
  const id=new mongoose.Types.ObjectId(_id as string); 
  const traceColl=mongoose.connection.collection(`traceColl`)
  traceColl.updateOne({_id:id},
    {$set:{event_name:event_name,event_type:event_type,payload:payload}}
  ).then((result:any)=>{
    if(result.matchedCount===1){
      res.status(200).send({message:'更新成功'})
      console.log(`更新成功，更新的记录ID为：${id}`)
      return
    }
    else{
      console.log(`未找到要更新的记录，ID为：${id}`)
      res.status(404).send({message:'未找到要更新的记录'})
    }
  })
})
export default router