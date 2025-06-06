### 1.启动服务器
pnpm dev

### 2.接口
上报: POST 请求 http://127.0.0.1:3000/api/report 
获取: GET  请求 http://127.0.0.1:3000/api/getData?event_type=事件类型名

### 3.查询数据库

（1）mongodb查看 mongosh
https://www.mongodb.com/try/download/shell
在此地址下载mongoDB shell

下载完解压后，在bin中找到mongosh.exe，把bin文件夹的地址
添加到环境变量path

也可把除了mongosh.exe其他文件都可以删除了，
把mongosh.exe所在的目录添加到path就行了

在cmd输入：
mongosh "mongodb://admin:admin@47.98.115.184:27017/monitorData?authSource=admin"
即可连接云服务器的数据库

数据库的指令
show collections ：能查看当前数据库下有哪些集合
                   目前我把数据存在test集合中
                   可以在/server/config/config.ts中修改COLLECTIONNAME将数据存入不同的集合中

db.集合名字.find():查找该集合的所有数据

（2）使用可视化工具查看数据库
配置信息在config.ts中

