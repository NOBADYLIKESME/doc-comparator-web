// DocumentEditorWrapper.jsx
import React, { useRef } from 'react';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { Button, Spin } from 'antd';

const DocumentEditorWrapper = ({ 
  visible, 
  loading, 
  documentConfig, 
  documentServerUrl, 
  onDocumentReady, 
  onLoadComponentError, 
  onClose 
}) => {
  const placeholderRef = useRef(null);
  
  if (!visible) return null;
  
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'white',
      zIndex: 1000,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px',
        padding: '0 10px'
      }}>
        <h3 style={{ margin: 0 }}>文档预览</h3>
        <Button 
          type="primary" 
          onClick={onClose}
        >
          关闭
        </Button>
      </div>
      <div id="placeholder" ref={placeholderRef} style={{ display: 'none' }}></div>
      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="文档加载中，请稍后..." />
        </div>
      )}
      {documentConfig && (
        <DocumentEditor
          id="docxEditor"
          documentServerUrl={documentServerUrl}
          config={documentConfig}
          events_onDocumentReady={onDocumentReady}
          onLoadComponentError={onLoadComponentError}
          style={{ 
            height: '97%',
            width: '100%',
            border: 'none',
            display: 'block'
          }}
        />
      )}
    </div>
  );
};

export default DocumentEditorWrapper;