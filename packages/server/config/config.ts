// #region 数据库地址及账号密码配置，别改！！！
const DBHOST='47.98.115.184'
const DBPORT='27017'
const USER='admin'
const PASSWORD='admin'
const AUTHSOURCE='admin'
//#endregion



const DBNAME='monitorData'  // 数据库名称

const COLLECTIONNAME='test'// 集合名称
const URL=`mongodb://${USER}:${PASSWORD}@${DBHOST}:${DBPORT}?authSource=${AUTHSOURCE}`
export {DBHOST,DBPORT,DBNAME,USER,PASSWORD,AUTHSOURCE,COLLECTIONNAME,URL}
