import React from 'react';
import './App.css'
import {Routes,Route} from 'react-router-dom'
import {useNavigate,useLocation,Navigate} from 'react-router-dom'
import {
  UserSwitchOutlined,
  BugOutlined ,
  PieChartOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {Layout,  Menu } from 'antd';
import {TraceManage,BehaviorMonitor,ErrorMonitor,Performance} from './pages';

const { Header, Sider, Content}=Layout

type MenuItem = Required<MenuProps>['items'][number];

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKeys = [location.pathname];
  
  const items: MenuItem[] = [
    { key: '/performance', icon: <PieChartOutlined />, label: '性能监控',},
    { key: '/error', icon: <BugOutlined />, label: '错误监控' },
    { key: '/behavior', icon: <UserSwitchOutlined />, label: '行为监控' },
    { key: '/manage', icon:<UnorderedListOutlined />, label: '埋点管理'},
    
  ];

  return (
    <Layout >
      <Sider width={220} theme="dark" style={{ height: '100vh'}} >
        <Header style={{ 
          color: 'white', 
          lineHeight: '55px' ,
          height:'50px', 
          fontSize:'18px',
          fontFamily: 'Georgia, serif',
          paddingLeft:'30px',
          paddingBottom:'0'
          }}>
          <span>PLATFORM</span>
        </Header>
        <div style={{ width: 220 }}>
          <Menu
            selectedKeys={selectedKeys}
            mode="inline"
            theme="dark"
            items={items}
            onClick={({ key }:{key:string}) => {
              navigate(key);
            }}
          />
        </div>
      </Sider>
      <Content>
        <Routes>
          <Route path="/" element={<Navigate to="/performance" replace />} />
          <Route path="/performance" element={<Performance/>}/>
          <Route path="/error" element={<ErrorMonitor/>}/>
          <Route path="/behavior" element={<BehaviorMonitor/>}/>
          <Route path="/manage" element={<TraceManage />}></Route>
        </Routes>
      </Content>
    </Layout>
  );
};


export default App;
