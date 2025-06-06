import {Router,Request,Response} from 'express'
import fs from 'fs'
import path from 'path'

const dataPath=path.join(__dirname,'../byteStore')
const router=Router()

//

router.post('/', (req:Request, res:Response) => {
  const testData=JSON.parse(fs.readFileSync(path.join(dataPath,'test.json'),'utf-8'))
  testData.push(req.body)
  fs.writeFileSync(path.join(dataPath,'test.json'),JSON.stringify(testData,null,2))
  res.send({status:'success',message:'数据已保存'})
})

export default router