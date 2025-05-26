import {Router,Request,Response} from 'express'
import mongoose from 'mongoose'
import {COLLECTIONNAME} from '../../config/config'
const router=Router()

router.post('/', (req:Request, res:Response) => {
  mongoose.connection.collection(`${COLLECTIONNAME}`).insertMany(req.body)
  console.log('数据已发送')
  res.send({status:'success',message:'数据已保存'})
})

export default router