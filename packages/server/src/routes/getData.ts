import {Router,Request,Response} from 'express'
import { COLLECTIONNAME } from '../../config/config' 
import mongoose from 'mongoose'
const router=Router()

//

router.get('/', async (req:Request, res:Response): Promise<void> => {
  console.log('获取数据请求')
  console.log(req.query)
  const { event_type, event_name, payload } = req.query
  const Event_Type = ['performance', 'behavior', 'error', 'custom']

  // 构造查询条件
  const query: any = {}
  if (event_type && Event_Type.includes(event_type as string)) {
    query.event_type = event_type
  }
  if (event_name) {
    query.event_name = event_name
  }

  // 处理payload
  if (payload) {
    let rawPayload: any
    try {
      rawPayload = typeof payload === 'string' ? JSON.parse(decodeURIComponent(payload as string)) : payload
      console.log('rawPayload',rawPayload)
    } catch (e) {
      res.status(400).send({ status: 'error', message: 'payload格式错误' })
      return
    }
    // 构造payload的查询条件
    const payloadQuery: any = {}
    for (const key in rawPayload) {
      if (rawPayload[key] === undefined || rawPayload[key] === null || rawPayload[key] === '') {
        payloadQuery[`payload.${key}`] = { $exists: true }
      } else {
        payloadQuery[`payload.${key}`] = rawPayload[key]
      }
    }
    Object.assign(query, payloadQuery)
  }

  try {
    const data = await mongoose.connection.collection(`${COLLECTIONNAME}`).find(query).toArray()
    if (!data || data.length === 0) {
      res.status(404).send({ status: 'error', message: '无匹配数据' })
      return
    }
    res.status(200).send({ status: 'success', message: '数据获取成功', data })
  } catch (err) {
    console.log('查询数据库失败', err)
    res.status(500).send({ status: 'error', message: '数据库查询失败' })
  }
})

export default router