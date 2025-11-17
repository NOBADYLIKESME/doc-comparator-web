import { Upload, Button, Form, Radio, Checkbox, message, Spin, Row, Col } from 'antd';
import { UploadOutlined, FileWordOutlined, ExportOutlined } from '@ant-design/icons';
import axios from 'axios';
import React, { useState, useRef, useEffect } from 'react';
import { DocumentEditor } from "@onlyoffice/document-editor-react";


const { Dragger } = Upload;

// 选择你想要使用的服务器地址
const ONLYOFFICE_DOCUMENT_SERVER_URL = "http://192.168.2.63:8090/"; 

// const ONLYOFFICE_DOCUMENT_SERVER_URL = "http://192.168.77.171:8090/";

const DocumentComparatorPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  
  // 添加新的状态来区分当前是预览还是下载操作
  const [actionType, setActionType] = useState('preview'); // 'preview' 或 'download'
  
  // 修改编辑器相关状态
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [documentConfig, setDocumentConfig] = useState(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState(null); // 新增：存储当前文档URL
  // const documentEditorRef = useRef(null);
  const placeholderRef = useRef(null);

  // 添加缺失的 defaultOptions
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

  // 添加缺失的 handleFileChange 函数
  const handleFileChange = (fileList, fileIndex) => {
    if (fileList && fileList.length > 0) {
      const file = fileList[0];

      // 验证文件类型
      const allowedTypes = ['.doc', '.docx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!allowedTypes.some(type => fileExtension.endsWith(type))) {
        message.error('请上传Word文档文件(.doc或.docx格式)');
        return;
      }

      // 验证文件大小（限制为50MB）
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        message.error('文件大小不能超过50MB');
        return;
      }

      if (fileIndex === 1) {
        setFile1(file);
      } else {
        setFile2(file);
      }
    } else {
      // 当文件列表为空时清除对应的文件
      if (fileIndex === 1) {
        setFile1(null);
      } else {
        setFile2(null);
      }
    }
  };

  // 修改事件处理函数 - 添加更详细的错误处理
  const onDocumentReady = React.useCallback((event) => {
    console.log("Document is loaded", event);
    setEditorLoading(false);
    message.success('文档加载完成');
  }, []);

  const onLoadComponentError = React.useCallback((error) => {
    console.error("编辑器加载错误详情:", error);
    console.error("错误代码:", error?.data?.errorCode);
    console.error("错误描述:", error?.data?.errorDescription);
    
    setEditorLoading(false);
    
    const errorMessages = {
      '-1': '加载编辑器组件时发生未知错误',
      '-2': '无法从文档服务器加载API，请检查OnlyOffice服务是否正常运行',
      '-3': '文档API未定义，请检查documentServerUrl配置',
      '-4': '文档下载失败，请检查文档URL是否可访问且没有认证要求',
      '-5': '文档服务器拒绝连接',
'-6': '文档格式不支持'
    };
    
    const errorCode = error?.data?.errorCode;
    const messageText = errorMessages[errorCode] || `编辑器加载失败: ${error?.data?.errorDescription || '未知错误'}`;
    
    message.error(messageText);
  }, []);

  const onError = React.useCallback((event) => {
    console.error('OnlyOffice 错误事件详情:', event);
    console.error('错误数据:', event.data);
    
    if (event.data && event.data.errorCode === -4) {
      message.error('文档下载失败，请检查网络连接和文档服务状态');
    }
  }, []);

  const onDocumentLoad = React.useCallback((event) => {
    console.log("文档内容加载完成");
  }, []);

  // 修改在新标签页打开预览的函数
  const openInNewTab = () => {
    if (currentDocumentUrl) {
      // 构建预览页面的URL
      const previewUrl = `${window.location.origin}/preview?url=${encodeURIComponent(currentDocumentUrl)}&title=${encodeURIComponent('文档比较结果')}`;
      console.log('预览页面URL:', previewUrl);
      
      // 打开新标签页
      window.open(previewUrl, '_blank');
    } else {
      message.warning('没有可用的文档链接');
    }
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
      height: "97%",
      width: "100%"
    };

    console.log('测试配置:', config);
    setDocumentConfig(config);
  };

  const initializeDocumentEditor = (documentUrl, fileId) => {
    setEditorLoading(true);
    setCurrentDocumentUrl(documentUrl); // 存储文档URL用于新标签页打开

    console.log('=== OnlyOffice 配置调试信息 ===');
    console.log('文档URL:', documentUrl);

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
        onDocumentReady: onDocumentReady,
        onLoadComponentError: onLoadComponentError,
        onError: onError
      },
      // height: "97%",
      // width: "100%"
    };

    console.log('最终编辑器配置:', config);
    setDocumentConfig(config);
    setShowDocumentEditor(true);
  };

  // 修改比较函数中的URL处理
  const startComparison = async (values) => {
    if (!file1 || !file2) {
      message.error('请上传两个文档文件');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file1', file1.originFileObj);
      formData.append('file2', file2.originFileObj);
      
      // 根据操作类型设置格式
      const format = values.format;
      formData.append('format', format);
      formData.append('options', JSON.stringify({
        ignoreFormatting: values.ignoreFormatting,
        ignoreHeadersAndFooters: values.ignoreHeadersAndFooters,
        ignoreCaseChanges: values.ignoreCaseChanges,
        ignoreTables: values.ignoreTables,
        ignoreFields: values.ignoreFields,
        ignoreComments: values.ignoreComments,
        ignoreTextboxes: values.ignoreTextboxes,
        ignoreFootnotes: values.ignoreFootnotes
      }));

      if (actionType === 'preview') {
        // 预览操作逻辑
        if (format === 'DOCX') {
          // DOCX格式预览：使用OnlyOffice
          console.log('前端检测到预览DOCX格式，准备发送请求');

          const response = await axios.post('/api/compare', formData);
          console.log('DOCX响应:', response);

          if (response.data && response.data.type === 'docx') {
            const fileId = response.data.fileId;
            
            // 使用IP地址（当前页面内嵌的OnlyOffice已经配置了允许私有IP）
            const documentUrl = `http://192.168.2.63:3000/api/compare/preview/${fileId}`;

            // const documentUrl = `http://192.168.77.144:3000/api/compare/preview/${fileId}`;


            console.log('文档访问URL:', documentUrl);
            initializeDocumentEditor(documentUrl, fileId);
            message.success('文档比较完成，结果将在下方显示');
          } else {
            console.error('无效的DOCX响应格式:', response.data);
            message.error('获取文档预览链接失败');
          }
        } else if (format === 'HTML') {
          // HTML格式预览：在新窗口打开
          console.log('前端检测到预览HTML格式，准备发送请求');
          
          const response = await axios.post('/api/compare', formData, {
            responseType: 'blob'
          });

          console.log('HTML响应状态:', response.status);
          
          if (response.status === 200) {
            const blob = new Blob([response.data], { type: 'text/html' });
            const htmlWindow = window.open('', '_blank');
            if (htmlWindow) {
              // 读取HTML内容并写入新窗口
              const reader = new FileReader();
              reader.onload = function(e) {
                htmlWindow.document.write(e.target.result);
                htmlWindow.document.close();
                htmlWindow.focus();
              };
              reader.readAsText(blob);
              message.success('文档比较完成，HTML结果已在新窗口中打开');
            } else {
              throw new Error('无法打开新窗口，请检查浏览器弹窗设置');
            }
          } else {
            throw new Error(`服务器返回状态: ${response.status}`);
          }
        } else if (format === 'PDF') {
          // PDF格式预览：在新窗口打开
          console.log('前端检测到预览PDF格式，准备发送请求');
          
          const response = await axios.post('/api/compare', formData, {
            responseType: 'blob'
          });

          console.log('PDF响应状态:', response.status);
          
          if (response.status === 200) {
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const pdfWindow = window.open('', '_blank');
            if (pdfWindow) {
              // 创建PDF对象URL并在新窗口中打开
              const pdfUrl = URL.createObjectURL(blob);
              pdfWindow.location.href = pdfUrl;
              message.success('文档比较完成，PDF结果已在新窗口中打开');
            } else {
              throw new Error('无法打开新窗口，请检查浏览器弹窗设置');
            }
          } else {
            throw new Error(`服务器返回状态: ${response.status}`);
          }
        }
      } else if (actionType === 'download') {
        // 下载操作：所有格式都直接下载文件，不预览
        console.log(`前端检测到下载${format}格式，准备发送请求`);
        
        const response = await axios.post('/api/compare', formData, {
          responseType: 'blob'
        });

        console.log(`${format}响应状态:`, response.status);
        
        // 检查响应类型
        const contentType = response.headers['content-type'];
        console.log('响应内容类型:', contentType);
        
        if (response.status === 200) {
          const blob = new Blob([response.data], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          
          // 根据格式设置文件名
          const filename = `comparison_result.${format.toLowerCase()}`;
          
          // 直接下载文件
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          message.success(`文档比较完成，${filename} 已开始下载`);
          
          // 释放URL对象
          window.URL.revokeObjectURL(url);
        } else {
          throw new Error(`服务器返回状态: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('比较文档时出错:', error);
      console.error('错误类型:', typeof error);
      console.error('错误对象完整信息:', error);
      
      // 详细错误处理
      if (error.response) {
        // 有响应对象，说明网络请求成功，但服务器返回了非2xx状态码
        console.error('错误响应状态:', error.response.status);
        console.error('错误响应头:', error.response.headers);
        
        // 尝试读取错误响应的内容
        if (error.response.data instanceof Blob) {
          const errorBlob = error.response.data;
          const reader = new FileReader();
          
          reader.onload = function() {
            try {
              const errorText = reader.result;
              console.error('错误响应内容:', errorText);
              
              // 尝试解析为JSON
              let errorMessage = '服务器内部错误';
              try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorMessage;
              } catch (e) {
                // 如果不是JSON，直接显示文本
                errorMessage = errorText.length > 100 ? '服务器处理错误' : errorText;
              }
              
              message.error(`服务器错误: ${errorMessage}`);
            } catch (e) {
              console.error('解析错误响应失败:', e);
              message.error('服务器内部错误，请查看控制台');
            }
          };
          
          reader.readAsText(errorBlob);
        } else {
          console.error('错误响应数据:', error.response.data);
          message.error(`服务器错误: ${error.response.status} - ${error.response.data?.message || '未知错误'}`);
        }
      } else if (error.request) {
        // 没有响应对象但有请求对象，这表示请求已发送但未收到响应
        console.error('没有收到响应:', error.request);
        console.error('请求对象详情:', error.request);
        
        // 检查请求状态
        if (error.request.readyState === 4 && error.request.status === 0) {
          message.error('网络连接失败，请检查服务器状态或防火墙设置');
        } else {
          message.error('请求已发送但未收到响应，请稍后重试');
        }
      } else {
        // 请求配置错误
        console.error('请求配置错误:', error.message);
        message.error(`请求配置错误: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 在线预览按钮的处理函数
  const handlePreview = () => {
    setActionType('preview');
    form.validateFields().then(values => {
      startComparison(values);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };
  
  // 下载结果按钮的处理函数
  const handleDownload = () => {
    setActionType('download');
    form.validateFields().then(values => {
      startComparison(values);
    }).catch(info => {
      console.log('表单验证失败:', info);
    });
  };

  return (
    <div className="document-comparator-page">
      <h1>文档比较工具</h1>

      {/* 添加测试按钮 */}
      
      <div style={{ marginBottom: '16px' }}>
        <Button 
          type="dashed" 
          onClick={testOnlyOfficeWithSample}
          style={{ marginRight: '8px' }}
        >
          测试 OnlyOffice (使用示例文档)
        </Button>
        <span style={{ color: '#666', fontSize: '12px' }}>
          点击此按钮测试 OnlyOffice 编辑器是否正常工作
        </span>
      </div>

      {/* 为OnlyOffice定义占位符div标签（根据官方文档要求） */}
      <div id="placeholder" ref={placeholderRef} style={{ display: 'none' }}></div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          format: 'HTML',
          ...defaultOptions
        }}
      >
        <div className="file-upload-section">
          <h3>上传需要对比的文档</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Dragger
                name="file1"
                multiple={false}
                beforeUpload={() => false}
                onChange={({ fileList }) => handleFileChange(fileList, 1)}
                fileList={file1 ? [file1] : []}
                accept=".doc,.docx"
                style={{ minHeight: '200px' }}
              >
                <p className="ant-upload-drag-icon">
                  <FileWordOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传第一个文档</p>
                <p className="ant-upload-hint">支持 .doc 和 .docx 格式文件</p>
              </Dragger>
            </Col>
            <Col span={12}>
              <Dragger
                name="file2"
                multiple={false}
                beforeUpload={() => false}
                onChange={({ fileList }) => handleFileChange(fileList, 2)}
                fileList={file2 ? [file2] : []}
                accept=".doc,.docx"
                style={{ minHeight: '200px' }}
              >
                <p className="ant-upload-drag-icon">
                  <FileWordOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传第二个文档</p>
                <p className="ant-upload-hint">支持 .doc 和 .docx 格式文件</p>
              </Dragger>
            </Col>
          </Row>
        </div>

        <div className="options-section">
          <h3>输出格式</h3>
          <Form.Item name="format">
            <Radio.Group>
              <Radio.Button value="HTML">HTML</Radio.Button>
              <Radio.Button value="DOCX">DOCX</Radio.Button>
              <Radio.Button value="PDF">PDF</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <h3>比较选项</h3>
          <div className="compare-options">
            <Form.Item name="ignoreFormatting" valuePropName="checked">
              <Checkbox>忽略格式差异</Checkbox>
            </Form.Item>
            <Form.Item name="ignoreHeadersAndFooters" valuePropName="checked">
              <Checkbox>忽略页眉页脚</Checkbox>
            </Form.Item>
            <Form.Item name="ignoreCaseChanges" valuePropName="checked">
              <Checkbox>忽略大小写变化</Checkbox>
            </Form.Item>
            <Form.Item name="ignoreTables" valuePropName="checked">
              <Checkbox>忽略表格</Checkbox>
            </Form.Item>
            <Form.Item name="ignoreFields" valuePropName="checked">
              <Checkbox>忽略字段</Checkbox>
            </Form.Item>
            <Form.Item name="ignoreComments" valuePropName="checked">
              <Checkbox>忽略批注</Checkbox>
            </Form.Item>
            <Form.Item name="ignoreTextboxes" valuePropName="checked">
              <Checkbox>忽略文本框</Checkbox>
            </Form.Item>
            <Form.Item name="ignoreFootnotes" valuePropName="checked">
              <Checkbox>忽略脚注</Checkbox>
            </Form.Item>
          </div>
        </div>

        <Form.Item>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              type="primary" 
              onClick={handlePreview} 
              loading={loading && actionType === 'preview'} 
              style={{ flex: 1 }}
            >
              在线预览
            </Button>
            <Button 
              type="default" 
              onClick={handleDownload} 
              loading={loading && actionType === 'download'} 
              style={{ flex: 1 }}
            >
              下载结果
            </Button>
          </div>
        </Form.Item>
      </Form>

      {/* 文档编辑器组件 - 当选择DOCX格式时显示 */}
      {showDocumentEditor && (
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
              onClick={() => {
                setShowDocumentEditor(false);
                // 刷新页面以清除文档配置
                window.location.reload();
              }}
            >
              关闭
            </Button>
          </div>
          {editorLoading && (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" tip="文档加载中，请稍后..." />
            </div>
          )}
          {documentConfig && (
            <DocumentEditor
              // ref={documentEditorRef}
              id="docxEditor"
              documentServerUrl={ONLYOFFICE_DOCUMENT_SERVER_URL}
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
      )}
    </div>
  );
};

export default DocumentComparatorPage;