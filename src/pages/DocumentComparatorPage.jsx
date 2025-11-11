import React, { useState } from 'react';
import { Upload, Button, Form, Radio, Checkbox, message } from 'antd';
import { UploadOutlined, FileWordOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Dragger } = Upload;

const DocumentComparatorPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);

  // 默认比较选项
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

  // 处理文件上传
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
    }
  };

  // 开始比较
  const startComparison = async (values) => {
    if (!file1 || !file2) {
      message.error('请上传两个文档文件');
      return;
    }
  
    setLoading(true);
  
    try {
      // 构建FormData
      const formData = new FormData();
      formData.append('file1', file1.originFileObj);
      formData.append('file2', file2.originFileObj);
      formData.append('format', values.format);
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
  
      // 发送请求
      const response = await axios.post('/api/compare', formData, {
        responseType: 'blob'
      });
  
      // 处理响应，在新标签页打开文件
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      
      // 在新标签页打开文件
      window.open(url, '_blank');
      
      message.success('文档比较完成，结果已在新标签页打开');
    } catch (error) {
      console.error('比较文档时出错:', error);
      message.error('比较文档时出错，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-comparator-page">
      <h1>文档比较工具</h1>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={startComparison}
        initialValues={{
          format: 'HTML',
          ...defaultOptions
        }}
      >
        <div className="file-upload-section">
          <h3>上传第一个文档</h3>
          <Dragger
            name="file1"
            multiple={false}
            beforeUpload={() => false}
            onChange={({ fileList }) => handleFileChange(fileList, 1)}
            fileList={file1 ? [file1] : []}
          >
            <p className="ant-upload-drag-icon">
              <FileWordOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 .doc 和 .docx 格式文件</p>
          </Dragger>
        </div>

        <div className="file-upload-section">
          <h3>上传第二个文档</h3>
          <Dragger
            name="file2"
            multiple={false}
            beforeUpload={() => false}
            onChange={({ fileList }) => handleFileChange(fileList, 2)}
            fileList={file2 ? [file2] : []}
          >
            <p className="ant-upload-drag-icon">
              <FileWordOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 .doc 和 .docx 格式文件</p>
          </Dragger>
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
          <Button type="primary" htmlType="submit" loading={loading} block>
            开始比较
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default DocumentComparatorPage;