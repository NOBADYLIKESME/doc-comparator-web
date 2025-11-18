import React, { useState, useCallback } from 'react';
import { Form, Button } from 'antd';

import FileUploader from '../components/FileUploader';
import CompareOptionsForm from '../components/CompareOptionsForm';
import DocumentEditorWrapper from '../components/DocumentEditorWrapper';
import useComparisonService from '../hooks/useComparisonService';
import { onDocumentReady, onLoadComponentError, onError } from '../utils/onlyofficeUtils';


// 生产服务器地址
// const ONLYOFFICE_DOCUMENT_SERVER_URL = "http://192.168.2.63:8090/"; 
// 本地测试服务器地址
const ONLYOFFICE_DOCUMENT_SERVER_URL = "http://192.168.77.171:8090/";

const DocumentComparatorPage = () => {
  const [form] = Form.useForm();
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [actionType, setActionType] = useState('preview');
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [documentConfig, setDocumentConfig] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState(null);

  const defaultOptions = {
    ignoreFormatting: true,
    ignoreHeadersAndFooters: true,
    ignoreCaseChanges: true,
    ignoreTables: true,
    ignoreFields: true,
    ignoreComments: true,
    ignoreTextboxes: true,
    ignoreFootnotes: true
  };

  // 添加测试函数 - 直接使用测试文档
  const testOnlyOfficeWithSample = () => {
    setEditorLoading(true);
    setShowDocumentEditor(true);

    const testDocumentUrl = "https://www.vertex42.com/WordTemplates/files/business-plan-template.docx";

    console.log('使用测试文档URL:', testDocumentUrl);
    setCurrentDocumentUrl(testDocumentUrl); // 存储文档URL

    const config = {
      document: {
        fileType: "docx",
        key: "test-doc-" + Date.now(),
        title: "business-plan-template.docx",
        url: testDocumentUrl,
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
          compactToolbar: true,
          feedback: false,
          help: false
        }
      },
      documentServerUrl: ONLYOFFICE_DOCUMENT_SERVER_URL,
      events: {
        onDocumentReady: onDocumentReady,
        onLoadComponentError: onLoadComponentError,
        onError: onError,
        onAppReady: (event) => {
          console.log('OnlyOffice 应用准备就绪:', event);
        }
      },
      // onlyoffice 窗口大小配置
      height: "97%",
      width: "100%"
    };

    console.log('测试配置:', config);
    setDocumentConfig(config);
  };

  // 自定义hook处理比较逻辑
  const { loading, startComparison } = useComparisonService(initializeDocumentEditor);

  // 处理文档编辑器配置
  function initializeDocumentEditor(documentUrl, fileId) {
    setEditorLoading(true);
    const config = {
      document: {
        fileType: "docx",
        key: fileId + '_' + Date.now(),
        title: `比较结果_${fileId}.docx`,
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
          compactToolbar: true,
          feedback: false,
          help: false,
          hideRightMenu: false,
          plugins: false
        }
      },
      documentServerUrl: ONLYOFFICE_DOCUMENT_SERVER_URL,
      events: {
        onDocumentReady: onDocumentReady(setEditorLoading),
        onLoadComponentError: onLoadComponentError(setEditorLoading),
        onError: onError
      }
    };

    console.log('最终编辑器配置:', config);
    setDocumentConfig(config);
    setShowDocumentEditor(true);
    setCurrentDocumentUrl(documentUrl);
  }

  // 处理文件变更 - 直接实现逻辑
  const onFileChange = useCallback((fileList, fileIndex) => {
    if (fileList && fileList.length > 0) {
      const file = fileList[0];

      // 验证文件类型
      const allowedTypes = ['.doc', '.docx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (allowedTypes.includes(fileExtension)) {
        if (fileIndex === 1) {
          setFile1(file);
        } else if (fileIndex === 2) {
          setFile2(file);
        }
      }
    }
  }, []);

  // 处理操作（预览/下载）
  const onAction = useCallback((type) => {
    setActionType(type);
    form.validateFields().then(values => {
      startComparison(file1, file2, values, type, ONLYOFFICE_DOCUMENT_SERVER_URL);
    });
  }, [file1, file2, form, startComparison]);

  return (
    <div className="document-comparator-page">
      <h1>文档比较工具</h1>
      {/* 添加测试按钮 */}
      <div style={{ marginBottom: '16px', visibility: 'hidden' }}>
        <Button
          type="dashed"
          onClick={testOnlyOfficeWithSample}
          style={{ marginRight: '8px' }}
        >
          测试 OnlyOffice (使用示例文档)
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          format: 'HTML',
          ...defaultOptions
        }}
      >
        <FileUploader
          file1={file1}
          file2={file2}
          onFileChange={onFileChange}
        />

        <CompareOptionsForm
          form={form}
          defaultOptions={defaultOptions}
          onAction={onAction}
        />
      </Form>

      <DocumentEditorWrapper
        visible={showDocumentEditor}
        loading={editorLoading}
        documentConfig={documentConfig}
        documentServerUrl={ONLYOFFICE_DOCUMENT_SERVER_URL}
        onDocumentReady={onDocumentReady(setEditorLoading)}
        onLoadComponentError={onLoadComponentError(setEditorLoading)}
        onClose={() => setShowDocumentEditor(false)}
      />
    </div>
  );
};

export default DocumentComparatorPage;