import React, { useState, useRef, useEffect } from 'react';
import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { Spin, message } from 'antd';
import { useSearchParams } from 'react-router-dom';

const DocumentPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const [documentConfig, setDocumentConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const documentEditorRef = useRef(null);

  // 获取URL参数中的文档URL
  const documentUrl = searchParams.get('url');
  const title = searchParams.get('title') || '文档预览';

  // OnlyOffice 事件处理
  const onDocumentReady = React.useCallback((event) => {
    console.log("Document is loaded", event);
    setLoading(false);
    message.success('文档加载完成');
  }, []);

  const onLoadComponentError = React.useCallback((error) => {
    console.error("编辑器加载错误:", error);
    setLoading(false);
    message.error(`编辑器加载失败: ${error?.data?.errorDescription || '未知错误'}`);
  }, []);

  const onError = React.useCallback((event) => {
    console.error('OnlyOffice 错误事件:', event);
    message.error('文档加载出错');
  }, []);

  // 初始化编辑器
  useEffect(() => {
     console.log('=== 预览页面调试信息 ===');
      console.log('文档URL:', documentUrl);
      console.log('页面URL:', window.location.href);
      console.log('搜索参数:', Object.fromEntries(searchParams));
    if (documentUrl) {
      console.log('初始化预览页面，文档URL:', documentUrl);
      
      const config = {
        document: {
          fileType: "docx",
          key: "preview-" + Date.now(),
          title: title,
          url: documentUrl,
          permissions: {
            edit: false,
            download: true,
            review: true,
            print: true
          }
        },
        documentType: "word",
        editorConfig: {
          mode: "view",
          lang: "zh-CN",
          customization: {
            autosave: false,
            comments: false,
            compactToolbar: false,
            feedback: false,
            help: false,
            hideRightMenu: false
          }
        },
        documentServerUrl: "http://192.168.77.171:8090/",
        events: {
          onDocumentReady: onDocumentReady,
          onLoadComponentError: onLoadComponentError,
          onError: onError
        },
        height: "100%",
        width: "100%"
      };

      setDocumentConfig(config);
    } else {
      message.error('缺少文档参数');
      setLoading(false);
    }
  }, [documentUrl, title, onDocumentReady, onLoadComponentError, onError]);

  if (!documentUrl) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>文档预览</h2>
        <p>缺少文档参数，请从文档比较页面打开预览。</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #d9d9d9',
        backgroundColor: '#f5f5f5'
      }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}>
            <Spin size="large" tip="文档加载中..." />
          </div>
        )}
        
        {documentConfig && (
          <DocumentEditor
            ref={documentEditorRef}
            id="previewEditor"
            documentServerUrl="http://192.168.77.171:8090/"
            config={documentConfig}
            events_onDocumentReady={onDocumentReady}
            onLoadComponentError={onLoadComponentError}
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentPreviewPage;