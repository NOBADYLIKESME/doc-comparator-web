//无侧边栏配置
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import DocumentComparatorPage from './pages/DocumentComparatorPage';
import StandaloneDocumentComparatorPage from './pages/StandaloneDocumentComparatorPage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import './static/css/App.css';

// 统一应用内容组件 - 无侧边栏
const AppContent = () => {
  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<DocumentComparatorPage />} />
        <Route path="/compare" element={<DocumentComparatorPage />} />
        <Route path="/standalone-compare" element={<StandaloneDocumentComparatorPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
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
        <AppContent />
      </Router>
    </ConfigProvider>
  );
}

export default App;