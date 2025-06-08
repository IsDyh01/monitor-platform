import React,{useState,useEffect} from 'react';
import {Layout,Table,type TableColumnsType,type GetProps, Input,Button,Modal, ConfigProvider} from 'antd';
import {Form,Space,Card,Select,Checkbox,message} from'antd'
import { CloseOutlined} from '@ant-design/icons';
import {CheckModal,UpdataModal} from './components'
import './index.css'; 
const { Header, Content } = Layout;
const { Search } = Input;
type SearchProps = GetProps<typeof Input.Search>;
const onSearch: SearchProps['onSearch'] = (value) => console.log(value);

interface DataType {
  _id: string;
  event_name: string;
  event_type: string;
  payload: object;
}

interface submitFormValues {
  event_name: string;
  event_type: string;
  payload: { key: string; type: string; Required?: boolean }[];
}


async function getData(): Promise<DataType[]> {
  try {
    const response = await fetch('http://localhost:3000/api/traceManage', {
      method: 'GET',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取数据失败:', error);
    return []; // 或返回默认值
  }
}


const TraceManage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); // 是否打开模态框
  const [form] = Form.useForm(); // 使用 Ant Design 的 Form 组件来处理表单数据
  const [messageApi, contextHolder] = message.useMessage();
  const [data,setData]=useState<DataType[]>([]); // 存储表格数据
  const [selectReCord,setSelectRecord]=useState<DataType>()//选中行的数据，用于渲染【查看、更新模态框】
  const [isCheckModalOpen,setIsCheckModalOpen]=useState(false) // 是否打开查看模态框
  const [isUpdateModalOpen,setIsUpdateModalOpen]=useState(false)// 是否打开更新模态框
  useEffect(() => {
    // 在组件加载时获取数据
    getData().then((data) => {
      setData(data);
    });
  }, []);
  const columns: TableColumnsType<DataType> = [
    { title: '事件名', dataIndex: 'event_name', key: 'name', width: '15%' ,align:'center'},
    { title: '事件类型', dataIndex: 'event_type', key: 'evet_type',width: '15%' ,align:'center'},
    
    
    {
      title: 'Action',
      dataIndex: '',
      width: '30%',
      align:'center',
      key: 'x',
      render: (_,record) => {
      return (
        <Space size={'middle'}>
          <Button color="cyan" variant="outlined" onClick={()=>handleCheck(record)}>
            查看
          </Button>
          <Button color="purple" variant="outlined" onClick={()=>handleUpdate(record)}>
            更改
          </Button>
          <Button color="danger" variant="outlined" onClick={()=>deleteItem(record._id)}>
            删除
          </Button> 
        </Space>
      )},
    },
  ];
//#region  函数
  type MessageType='success'|'error'|'warning'|'info'|'loading';
  const openMessage=(type:MessageType,content:string)=>{
    messageApi.open({
      type: type,
      content: content,
    });
  }
  const upDataTable=()=>{
    getData().then((data) => {
      setData(data);
    });
  }
  const showModal = () => {
    setIsModalOpen(true);
  };
  const submmitForm=(values:submitFormValues)=>{
    console.log('提交数据：',values);
    fetch('http://localhost:3000/api/traceManage', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({values
      }),
    })
    .then(response =>{ 
      response.text()
      form.resetFields(); // 重置表单字段
    }

    ).then(data => {
      console.log(data);
    }).then(()=>{
      messageApi.open({
        type: 'success',
        content: '添加成功',
      });
    }).then(()=>{
      setIsModalOpen(false)
    }).then(()=>{
      getData().then((data) => {
        setData(data);
      });
    }).catch((error) => {
      console.error('Error:', error);
      messageApi.open({
        type: 'error',
        content: '添加失败，请稍后再试',
      });
    });
  }
  // 删除行
  const deleteItem=async (_id:string)=>{
    try {
      const res=await fetch(`http://localhost:3000/api/traceManage?_id=${_id}`,{
        method:'DELETE',
        headers: {  
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        messageApi.open({
          type: 'success',
          content: '删除数据成功',
        });
        // 更新数据
        getData().then((data) => {
          setData(data);
        });
      } else {
        throw new Error('网络错误');
      }
    }
    catch (error){
      console.error('删除数据失败:', error);
      messageApi.open({
        type: 'error',
        content: '删除数据失败，请稍后再试',
      });
      return;
    }
  }
  // 查看模态框
  const handleCheck=async (record:DataType)=>{
    try{
      setSelectRecord(record)
      
      await localStorage.setItem('record',JSON.stringify(record))
      await window.open('./check.html')
      
    }
    catch(err){
      console.log(err)
    }
    
  }
  const handleUpdate=(recod:DataType)=>{
    setSelectRecord(recod);
    setIsUpdateModalOpen(true);
  }
//#endregion
 
  return (
    <ConfigProvider
      theme={{
        components:{
          Layout:{
            bodyBg:'#f0f2f5',
          },
          Table:{
            cellPaddingInline:30,
          }
        }
      }}
    >
      <Layout >
        {contextHolder}
        <Header 
          className="header" 
          style={{
            height:'80px',
            justifyContent:'space-between', 
            display:'flex'
          }}
          >  
          <Search 
            placeholder="请输入关键字搜索..."
            allowClear
            enterButton="搜索"
            size="large"
            onSearch={onSearch}
            style={{ width: 400, marginLeft: -20, marginTop: 20 }}
          />
          <Button 
            color="orange" 
            variant="solid"
            style={{height:'40px', marginTop: '20px',fontSize: '16px'}}
            onClick={showModal}
          >
              新增埋点
          </Button>
          {/* 新增埋点Modal 弹窗 */}
          <Modal
            title={<div style={{ textAlign: 'center' }}>新增埋点</div>}
            open={isModalOpen}
            footer={null}
            onCancel={() => setIsModalOpen(false)}
          >
          <Form
            form={form}
            layout="vertical"
            onFinish={submmitForm}
            autoComplete="off"
          >
            <Form.Item
              label="事件名:"
              name="event_name"
              rules={[{ required: true, message: '请输入事件名' }]}
            >
              <Input placeholder="请输入事件名" />
            </Form.Item>

            <Form.Item
              label="事件类型:"
              name="event_type"
              rules={[{ required: true, message: '请输入事件类型' }]}
            >
              <Input placeholder="请输入事件类型" />
            </Form.Item>

            <Card title="Payload" size="small">
              <Form.List name="payload">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => (
                      <Space key={field.key} align="baseline" style={{ marginBottom: 8 }}>
                        <Form.Item
                          name={[field.name, 'key']}
                          rules={[{ required: true, message: '请输入 key' }]}
                        >
                          <Input placeholder="key" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'type']}
                          rules={[{ required: true, message: '请选择类型' }]}
                        >
                          <Select placeholder="类型" style={{ width: 150 }}>
                            <Select.Option value="String">String</Select.Option>
                            <Select.Option value="Number">Number</Select.Option>
                            <Select.Option value="Boolean">Boolean</Select.Option>
                            <Select.Option value="Object">Object</Select.Option>
                            <Select.Option value="Array">Array</Select.Option>
                          </Select>
                        </Form.Item>
                        <Form.Item name={[field.name,"Required"]} valuePropName='checked' initialValue={false} >
                          <Checkbox>Required</Checkbox>
                        </Form.Item>
                        <CloseOutlined
                          onClick={() => remove(field.name)}
                        />
                      </Space>
                    ))}

                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block>
                        + 添加字段
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Card>
            <Form.Item style={{ marginTop: 24 }}>
              <Button type="primary" htmlType="submit" block>
                提交
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        {/* 查看埋点Modal 弹窗 */}
        </Header>
        <Content style={{height:'60vx'}}>
            <Table<DataType>
              columns={columns}
              dataSource={data}
              rowKey="_id"
              style={{padding:'20px'}}
              pagination={{
                pageSize: 8,}}
            />
        </Content>
      </Layout>
      {/* 查看模态框 */}
      <CheckModal
        open={isCheckModalOpen}
        onCancel={()=>setIsCheckModalOpen(false)}
        data={selectReCord}
        
      />
      {/* 更新模态框 */}
      <UpdataModal
        open={isUpdateModalOpen}
        onCancel={()=>setIsUpdateModalOpen(false)}
        data={selectReCord}
        openMessage={openMessage}
        setData={upDataTable} 
      />
    </ConfigProvider>
  );
};

export default TraceManage;
