import React from 'react';
import './App.css'
import {Routes,Route} from 'react-router-dom'
import {useNavigate,useLocation,Navigate} from 'react-router-dom'
import {
  ContainerOutlined,
  DesktopOutlined,
  PieChartOutlined,

} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {Layout,  Menu } from 'antd';
const { Header, Sider, Content}=Layout

type MenuItem = Required<MenuProps>['items'][number];

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKeys = [location.pathname];
  
  const items: MenuItem[] = [
    { key: '/performance', icon: <PieChartOutlined />, label: '性能监控',},
    { key: '/error', icon: <DesktopOutlined />, label: '错误监控' },
    { key: '/behavior', icon: <ContainerOutlined />, label: '行为监控' },
    
  ];
  return (
    <Layout >
      <Sider width={220} theme="dark" style={{ height: '100vh'}} >
        <Header style={{ color: 'white', lineHeight: '64px' }}>
          监控平台
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
        </Routes>
      </Content>
    </Layout>
  );
};
const Performance: React.FC = () => <div>性能监控页面</div>;
const ErrorMonitor: React.FC = () => <div>错误监控页面</div>;
const BehaviorMonitor: React.FC = () => <div>行为监控页面</div>;
export default App;
