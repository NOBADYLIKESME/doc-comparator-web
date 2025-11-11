import React from 'react';
import { Card, Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

const AboutPage = () => {
  return (
    <div>
      <Title level={2}>关于文档比较工具</Title>
      
      <Card>
        <Title level={4}>技术架构</Title>
        <Paragraph>
          本工具采用前后端分离架构：
        </Paragraph>
        <ul>
          <li><strong>前端：</strong>React.js + Ant Design</li>
          <li><strong>后端：</strong>Spring Boot + Aspose.Words</li>
          {/* <li><strong>部署：</strong>Docker容器化部署</li> */}
        </ul>
      </Card>

      <Divider />

      <Card>
        <Title level={4}>功能说明</Title>
        <Paragraph>
          本文档比较工具有以下核心功能：
        </Paragraph>
        <ul>
          <li>精确的文档内容比较</li>
          <li>多种输出格式支持（HTML、DOCX、PDF）</li>
          <li>灵活的比较选项配置</li>
          <li>直观的用户界面</li>
          <li>高效的处理性能</li>
        </ul>
      </Card>

      <Divider />

      <Card>
        <Title level={4}>使用说明</Title>
        <Paragraph>
          <strong>文档要求：</strong>
        </Paragraph>
        <ul>
          <li>支持Microsoft Word文档格式（.doc, .docx）</li>
          <li>文档大小建议不超过50MB</li>
          <li>确保文档未受密码保护</li>
        </ul>

        <Paragraph>
          <strong>比较选项：</strong>
        </Paragraph>
        <ul>
          <li><strong>忽略格式差异：</strong>仅比较文本内容，忽略字体、颜色等格式差异</li>
          <li><strong>忽略页眉页脚：</strong>不比较文档的页眉和页脚内容</li>
          <li><strong>忽略大小写变化：</strong>将大小写变化视为无差异</li>
          <li><strong>忽略表格：</strong>跳过表格内容的比较</li>
          <li><strong>忽略字段：</strong>不比较文档字段内容</li>
          <li><strong>忽略批注：</strong>跳过批注内容的比较</li>
          <li><strong>忽略文本框：</strong>不比较文本框内的内容</li>
          <li><strong>忽略脚注：</strong>跳过脚注内容的比较</li>
        </ul>
      </Card>

      <Divider />

      <Card>
        <Title level={4}>注意事项</Title>
        <ul>
          <li>处理大型文档可能需要较长时间，请耐心等待</li>
          <li>比较结果会高亮显示文档间的差异</li>
          <li>生成的文件会在24小时后自动清理</li>
          <li>如有任何问题，请联系产品处刘瑞</li>
        </ul>
      </Card>
    </div>
  );
};

export default AboutPage;