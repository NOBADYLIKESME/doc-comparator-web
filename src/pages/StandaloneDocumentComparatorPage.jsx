import React from 'react';
import { ConfigProvider } from 'antd';
import DocumentComparatorPage from './DocumentComparatorPage';
import '../static/css/App.css';

const StandaloneDocumentComparatorPage = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div style={{ 
        padding: '24px', 
        minHeight: '100vh',
        backgroundColor: '#f0f2f5'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}>
          <DocumentComparatorPage />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default StandaloneDocumentComparatorPage;