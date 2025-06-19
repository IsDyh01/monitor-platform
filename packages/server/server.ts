import express from 'express'
import cors from 'cors'
import registerRoutes from './src/routes'
import db from './db/db'

db(()=>{

    const app=express()

    app.use(cors({}))  //跨域
    app.use(express.json()) //解析json数据

    registerRoutes(app) //注册路由
        

    app.listen(3000,()=>{
        console.log('Server is running on port 3000')
    })
},()=>{
    console.log('数据库连接失败')
})

