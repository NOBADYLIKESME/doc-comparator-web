// CompareOptionsForm.jsx
import React from 'react';
import { Form, Radio, Checkbox, Button} from 'antd';

const CompareOptionsForm = ({ form, defaultOptions, onAction }) => { // 添加onAction到props中
  return (
    <>
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
          <Form.Item noStyle>
            <Button 
              type="primary" 
              onClick={() => onAction('preview')}
              style={{ flex: 1 }}
            >
              在线预览
            </Button>
          </Form.Item>
          <Form.Item noStyle>
            <Button 
              type="default" 
              onClick={() => onAction('download')}
              style={{ flex: 1 }}
            >
              下载结果
            </Button>
          </Form.Item>
        </div>
      </Form.Item>
    </>
  );
};

export default CompareOptionsForm;