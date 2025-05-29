import React,{useState,useEffect} from 'react';
import {Layout,Table,type TableColumnsType,type GetProps, Input,Button,Modal} from 'antd';
import {Form,Space,Card,Select,Checkbox,message} from'antd'
import { CloseOutlined} from '@ant-design/icons';
import './index.css'; 
const { Header, Content } = Layout;
const { Search } = Input;
type SearchProps = GetProps<typeof Input.Search>;
const onSearch: SearchProps['onSearch'] = (value) => console.log(value);

interface DataType {
  key: React.Key;
  event_name: string;
  event_type: string;
  payload: object;
}

interface submitFormValues {
  event_name: string;
  event_type: string;
  payload: { key: string; type: string; Required?: boolean }[];
}
const columns: TableColumnsType<DataType> = [
  { title: '事件名', dataIndex: 'event_name', key: 'name' },
  { title: '事件类型', dataIndex: 'event_type', key: 'evet_type' },
  {
    title: 'Action',
    dataIndex: '',
    key: 'x',
    render: () => {
    return (
      <div>
        <a>查看 </a> 
        <a>更改 </a> 
        <a>删除</a> 
      </div>
    )},
  },
];

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
  useEffect(() => {
    // 在组件加载时获取数据
    getData().then((data) => {
      setData(data);
    });
  }, []);
//#region  函数
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
    .then(response => response.text()
    ).then(data => {
      console.log(data);
    }).then(()=>{
      messageApi.open({
        type: 'success',
        content: 'This is a success message',
      });
    }).then(()=>{
      setIsModalOpen(false)
    }).then(()=>{
      getData().then((data) => {
        setData(data);
      });
    })
  }
  
//#endregion
 
  return (
    <Layout >
      {contextHolder}
      <Header className="header" style={{height:'80px',justifyContent:'space-between', display:'flex'}}>  
        <Search 
          placeholder="请输入关键字搜索..."
          allowClear
          enterButton="搜索"
          size="large"
          onSearch={onSearch}
          style={{ width: 400, marginLeft: -30, marginTop: 20 }}
        />
        <Button 
          color="orange" 
          variant="solid"
          style={{height:'40px', marginTop: '20px',fontSize: '16px'}}
          onClick={showModal}
        >
            新增埋点
        </Button>
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
                      <Form.Item name={[field.name,"Required"]} valuePropName='checked'  >
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
      </Header>
      <Content >
        <Table<DataType>
          columns={columns}
          dataSource={data}
        />
      </Content>
    </Layout>
  );
};

export default TraceManage;
