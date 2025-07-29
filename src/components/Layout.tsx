import React from 'react';
import { Layout as AntLayout, Menu, Typography } from 'antd';
import { YoutubeOutlined, GithubOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKey = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname === '/about') return 'about';
    return 'home';
  };

  const handleMenuClick = (key: string) => {
    switch (key) {
      case 'home':
        navigate('/');
        break;
      case 'about':
        navigate('/about');
        break;
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1, 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <YoutubeOutlined style={{ fontSize: '24px', color: '#FF0000', marginRight: '10px' }} />
          <Title level={4} style={{ margin: 0 }}>EasyYoutube</Title>
        </div>
        <Menu
          mode="horizontal"
          style={{ marginLeft: 'auto', border: 'none' }}
          selectedKeys={[getSelectedKey()]}
          onClick={({ key }) => handleMenuClick(key)}
          items={[
            {
              key: 'home',
              label: '首页'
            },
            {
              key: 'about',
              label: '关于'
            }
          ]}
        />
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 20 }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        <div style={{ marginBottom: '10px' }}>
          EasyYoutube ©{new Date().getFullYear()} - 帮助您更好地理解YouTube视频内容
        </div>
        <div>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <GithubOutlined style={{ fontSize: '18px', marginRight: '5px' }} />
            GitHub
          </a>
        </div>
      </Footer>
    </AntLayout>
  );
};

export default Layout;