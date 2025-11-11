import React from 'react';
import { Card, Col, Row, Typography, Button } from 'antd';
import { FileSearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Title level={2}>欢迎使用文档比较工具</Title>
      <Paragraph>
        这是一个基于Aspose.Words的强大文档比较工具，可以帮助您快速识别两个Word文档之间的差异。
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card 
            title="开始比较" 
            bordered={false} 
            hoverable
            onClick={() => navigate('/compare')}
          >
            <FileSearchOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Paragraph style={{ marginTop: '16px' }}>
              上传两个Word文档进行比较，查看它们之间的差异
            </Paragraph>
            <Button type="primary" onClick={() => navigate('/compare')}>
              立即比较
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card 
            title="功能特性" 
            bordered={false}
          >
            <ul>
              <li>支持DOC和DOCX格式</li>
              <li>多种输出格式（HTML、DOCX、PDF）</li>
              <li>详细的比较选项</li>
              <li>直观的可视化结果</li>
              <li>快速高效的处理</li>
            </ul>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card 
            title="关于我们" 
            bordered={false}
            onClick={() => navigate('/about')}
          >
            <InfoCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
            <Paragraph style={{ marginTop: '16px' }}>
              了解我们的技术架构和使用说明
            </Paragraph>
            <Button onClick={() => navigate('/about')}>
              查看详情
            </Button>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>如何使用</Title>
        <ol>
          <li>点击"开始比较"按钮进入文档比较页面</li>
          <li>上传两个需要比较的Word文档</li>
          <li>选择输出格式和比较选项</li>
          <li>点击"开始比较"按钮</li>
          <li>下载比较结果文件</li>
        </ol>
      </Card>
    </div>
  );
};

export default HomePage;