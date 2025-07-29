import React from 'react';
import { Typography, Card, Space, Divider } from 'antd';
import { YoutubeOutlined, TranslationOutlined, RobotOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const About: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
        关于 EasyYoutube
      </Title>

      <Card>
        <Paragraph>
          <Text strong>EasyYoutube</Text> 是一个帮助用户快速理解 YouTube 视频内容的工具。通过提取视频字幕并利用人工智能技术，我们能够为您提供视频内容的摘要和分析，让您在观看前就能了解视频的主要内容。
        </Paragraph>

        <Divider />

        <Title level={4}>主要功能</Title>
        <Space direction="vertical" size="middle" style={{ display: 'flex', marginBottom: '20px' }}>
          <Card size="small">
            <Space>
              <YoutubeOutlined style={{ fontSize: '24px', color: '#FF0000' }} />
              <div>
                <Text strong>YouTube 视频分析</Text>
                <Paragraph style={{ marginBottom: 0 }}>
                  只需粘贴 YouTube 视频链接，即可获取视频内容的智能分析
                </Paragraph>
              </div>
            </Space>
          </Card>

          <Card size="small">
            <Space>
              <TranslationOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div>
                <Text strong>语言学习辅助</Text>
                <Paragraph style={{ marginBottom: 0 }}>
                  帮助英语学习者快速了解视频内容，提高学习效率
                </Paragraph>
              </div>
            </Space>
          </Card>

          <Card size="small">
            <Space>
              <RobotOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              <div>
                <Text strong>AI 驱动</Text>
                <Paragraph style={{ marginBottom: 0 }}>
                  使用先进的人工智能技术分析视频内容，提供准确的摘要
                </Paragraph>
              </div>
            </Space>
          </Card>
        </Space>

        <Divider />

        <Title level={4}>使用场景</Title>
        <Paragraph>
          <ul>
            <li>学习英语时，快速了解视频内容，决定是否值得观看</li>
            <li>研究特定主题时，从多个视频中筛选最相关的内容</li>
            <li>提高学习效率，节省时间</li>
            <li>克服语言障碍，更好地理解英语视频内容</li>
          </ul>
        </Paragraph>

        <Divider />

        <Title level={4}>技术实现</Title>
        <Paragraph>
          EasyYoutube 使用 React 和 TypeScript 构建前端界面，使用 Python Flask 作为后端服务。我们通过 YouTube API 获取视频字幕，并使用大型语言模型进行内容分析和摘要生成。
        </Paragraph>
      </Card>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <Paragraph type="secondary">
          如有任何问题或建议，请联系我们
        </Paragraph>
      </div>
    </div>
  );
};

export default About;