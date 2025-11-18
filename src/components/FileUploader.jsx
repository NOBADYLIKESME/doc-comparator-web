// FileUploader.jsx
import React from 'react';
import { Upload, message, Row, Col } from 'antd';
import { FileWordOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

const FileUploader = ({ file1, file2, onFileChange }) => {
  return (
    <div className="file-upload-section">
      <h3>上传需要对比的文档</h3>
      <Row gutter={16}>
        <Col span={12}>
          <Dragger
            name="file1"
            multiple={false}
            beforeUpload={() => false}
            onChange={({ fileList }) => onFileChange(fileList, 1)}
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
            onChange={({ fileList }) => onFileChange(fileList, 2)}
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
  );
};

export default FileUploader;