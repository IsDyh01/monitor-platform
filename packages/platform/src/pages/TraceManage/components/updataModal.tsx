import React,{useEffect} from 'react'
import {Modal,Form,Input,Card,Space,Select,Button,Checkbox} from 'antd'
import {CloseOutlined} from '@ant-design/icons'
interface submitFormValues {
  event_name: string;
  event_type: string;
  payload: { key: string; type: string; Required?: boolean }[];
}
interface CheckModalProps{
  open:boolean;
  onCancel:()=>void;
  data: DataType | undefined;
  openMessage: (type: 'success' | 'error', content: string) => void; // 用于显示消息的函数
  setData:()=>void;
}
interface DataType {
  _id: string;
  event_name: string;
  event_type: string;
  payload: object;
}
const UpdataModal: React.FC<CheckModalProps> = ({open,onCancel,data,openMessage,setData}) => {
  const [form] = Form.useForm();
  useEffect(()=>{
    if(data){
      form.setFieldsValue({
        event_name:data?.event_name||'',
        event_type:data?.event_type||'',
        payload: data?.payload ||[],
        _id:data?._id||''
      })
    }
  },[data,form])
  const handdleSubmit=(values:submitFormValues)=>{
    fetch('http://localhost:3000/api/traceManage', {
      method: 'PATCH', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({...values,_id:data?._id
      }),
    }).then(()=>{
      setData();
      openMessage('success', '更新成功！');
    }).then(()=>{
      onCancel(); // 关闭模态框
      form.resetFields(); // 重置表单字段
    }).catch((error) => {
      console.error('更新失败:', error);
      openMessage('error', '更新失败，请重试！');
    });
  }
  return (
    <Modal
            title={<div style={{ textAlign: 'center' }}>埋点详情</div>}
            open={open}
            footer={null}
            onCancel={onCancel}
          >
          <Form
            form={form}
            layout="vertical"
            onFinish={handdleSubmit}
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
                        <CloseOutlined onClick={() => remove(field.name)} />
                        
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
              <Button variant="solid" htmlType="submit" color="purple" block>
                更改
              </Button>
            </Form.Item>
          </Form>
        </Modal>
  )
}
export default UpdataModal