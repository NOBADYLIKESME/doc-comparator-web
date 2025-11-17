// 侧边栏配置
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, theme } from 'antd';
import { 
  FileSearchOutlined, 
  HomeOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';
import DocumentComparatorPage from './pages/DocumentComparatorPage';
import StandaloneDocumentComparatorPage from './pages/StandaloneDocumentComparatorPage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import './static/css/App.css';

const { Header, Content, Footer, Sider } = Layout;

// 侧边栏组件
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getSelectedKey = () => {
    switch (location.pathname) {
      case '/':
        return '1';
      case '/compare':
        return '2';
      case '/about':
        return '3';
      default:
        return '1';
    }
  };

  const handleMenuClick = (e) => {
    switch (e.key) {
      case '1':
        navigate('/');
        break;
      case '2':
        navigate('/compare');
        break;
      case '3':
        navigate('/about');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <Sider
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100, // 确保侧边栏在其他内容之上
        width: 200, // 设置侧边栏的宽度
        overflow: 'auto', // 允许侧边栏内部内容滚动
      }}
      breakpoint="lg"
      collapsedWidth="0"
      onBreakpoint={(broken) => {
        console.log(broken);
      }}
      onCollapse={(collapsed, type) => {
        console.log(collapsed, type);
      }}
    >
      <div className="logo">
        <h2 style={{ color: 'white', textAlign: 'center', margin: '16px 0' }}>
          文档比较工具
        </h2>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={[
          {
            key: '1',
            icon: <HomeOutlined />,
            label: '首页',
          },
          {
            key: '2',
            icon: <FileSearchOutlined />,
            label: '文档比较',
          },
          {
            key: '3',
            icon: <InfoCircleOutlined />,
            label: '关于',
          },
        ]}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

// 新增：独立页面内容组件
const StandaloneAppContent = () => {
  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <Routes>
        <Route path="/standalone-compare" element={<StandaloneDocumentComparatorPage />} />
      </Routes>
    </div>
  );
};

// 修改：主应用组件
const AppContent = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  
  const location = useLocation();
  // 检查当前路径是否应该隐藏侧边栏
  const shouldHideSidebar = location.pathname === '/standalone-compare';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!shouldHideSidebar && <Sidebar />}
      <Layout style={{ marginLeft: shouldHideSidebar ? 0 : 200 }}>
        <Content style={{ margin: '0 16px 0' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/compare" element={<DocumentComparatorPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          文档比较工具 ©{new Date().getFullYear()} Created by 产品处
        </Footer>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/standalone-compare/*" element={<StandaloneAppContent />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;