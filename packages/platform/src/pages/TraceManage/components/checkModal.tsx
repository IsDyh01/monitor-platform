/*查看Modal组件 */
import React from 'react'
import {Modal,Table,type TableColumnsType} from 'antd'
interface DataType {
  _id: string;
  event_name: string;
  event_type: string;
  payload: object;
}
interface CheckModalProps {
  open: boolean;
  onCancel: () => void;
  data: DataType | undefined;  
}
interface TableDataType {
  name: string;
  type: string;
  Required: boolean;
}
const CheckModal: React.FC<CheckModalProps> = ({open,onCancel,data}) => {
  console.log(data?.payload)
  const dataSource: TableDataType[] = data?.payload ? Object.entries(data.payload).map(([, value]) => ({
    name: value.key,
    type:  value.type,
    Required: value.Required, // 假设默认值为 false，实际应用中可能需要根据具体逻辑设置
  })) : [];
  const columns: TableColumnsType<TableDataType> = [
    { title: '属性名', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { 
      title: 'Required', 
      dataIndex: 'Required',
       key: 'Required' ,
      render: (required: boolean) => (required ? '✅' : '❌')
    },
  ];
  
  return (
    
      <Modal 
        open={open} 
        onCancel={onCancel} 
        footer={null} 
        title={
          <div style={{textAlign: 'center'}}>
            <span style={{marginLeft:'-40px'}}>{data?.event_name}</span>
          </div>
        }
        >
          
            <Table<TableDataType>
              title={
                () => 
                  <div style={{height:'30px', marginBottom:'-10px',marginLeft:'-20px'}}>
                    <p><strong>Payload</strong></p>
                  </div>
                }
              dataSource={dataSource}
              rowKey='name'
              columns={columns}
              pagination={false}
              scroll={{ y: 220 }}
            /> 
      </Modal>
    
  )
}
export default CheckModal