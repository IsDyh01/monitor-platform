import {Router,Request,Response} from 'express'
import mongoose from 'mongoose'
import {COLLECTIONNAME} from '../../config/config'
const router=Router()



router.post('/', (req:Request, res:Response) => {
  const data=req.body
  data.forEach((element:any) => {
   if(['performance' ,'behavior' , 'error' , 'custom'].includes(element.event_type)){
      mongoose.connection.collection(`${COLLECTIONNAME}`).insertOne(element)
   }
  })
  res.status(200).send({status:'success',message:'数据已发送'})
  console.log('数据已发送')
  
})

export default router