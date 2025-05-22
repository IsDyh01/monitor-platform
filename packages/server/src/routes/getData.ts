import {Router,Request,Response} from 'express'
import fs from 'fs'
import path from 'path'

const dataPath=path.join(__dirname,'../byteStore')
const router=Router()

//

router.get('/', (req:Request, res:Response) => {
  const testData=JSON.parse(fs.readFileSync(path.join(dataPath,'test.json'),'utf-8'))
  const event_type=req.query.event_type
  res.send(testData.filter((item:any) => {
    return item.event_type === event_type
  }))
})

export default router