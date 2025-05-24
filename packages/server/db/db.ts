import mongoose from 'mongoose'
import {DBHOST,DBPORT,DBNAME,USER,PASSWORD,AUTHSOURCE}  from '../config/config'
import express from 'express'
const app=express()
export default async function (success:Function,error:Function){
  if(typeof error!=='function'){
    error=function(){
      console.log('连接数据库失败')
    }
  }
  try{
    
    await mongoose.connect(`mongodb://${USER}:${PASSWORD}@${DBHOST}:${DBPORT}/${DBNAME}?authSource=${AUTHSOURCE}`)
    console.log('连接数据库成功')
    success();
   
    
    await mongoose.connection.on('error',()=>{
      console.log('连接数据库失败')
      error();
    })
  }
  catch(err){
    console.log('数据库连接失败')
    error(err)
  }

}