import React, { useState } from 'react';
import { Card, Button, Input, Tabs, Typography, Space, Spin, Alert, message } from 'antd';
import { PlayCircleOutlined, FileTextOutlined, TranslationOutlined } from '@ant-design/icons';
import { analyzeYoutubeVideo, getFormattedTranscript, translateToChineseTranscript } from '../services/youtubeService';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const Home: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');
  const [formattedTranscript, setFormattedTranscript] = useState('');
  const [formatLoading, setFormatLoading] = useState(false);
  const [translation, setTranslation] = useState('');
  const [translateLoading, setTranslateLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      message.error('请输入YouTube视频链接');
      return;
    }

    setLoading(true);
    setFormatLoading(true);
    setTranslateLoading(true);
    setError('');
    setAnalysis(null);
    setFormattedTranscript('');
    setTranslation('');

    try {
      // 并行执行所有三个操作
      const [analysisResult, formattedResult] = await Promise.all([
        analyzeYoutubeVideo(url),
        getFormattedTranscript(url)
      ]);
      
      setAnalysis(analysisResult);
      setFormattedTranscript(formattedResult.formatted_transcript);
      setFormatLoading(false);
      
      // 获取格式化字幕后立即进行翻译
      const translatedResult = await translateToChineseTranscript(formattedResult.formatted_transcript);
      setTranslation(translatedResult);
      setTranslateLoading(false);
      
      message.success('视频分析、字幕格式化和翻译全部完成！');
    } catch (err: any) {
      setError(err.message || '处理失败，请检查视频链接是否正确');
      message.error('处理失败');
      setFormatLoading(false);
      setTranslateLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFormatTranscript = async () => {
    if (!url.trim()) {
      message.error('请先输入视频链接');
      return;
    }

    setFormatLoading(true);
    try {
      const formatted = await getFormattedTranscript(url);
      setFormattedTranscript(formatted.formatted_transcript);
      message.success('字幕格式化完成！');
    } catch (err: any) {
      message.error('格式化失败：' + (err.message || '未知错误'));
    } finally {
      setFormatLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!formattedTranscript) {
      message.error('请先格式化字幕');
      return;
    }

    setTranslateLoading(true);
    try {
      const translated = await translateToChineseTranscript(formattedTranscript);
      setTranslation(translated);
      message.success('翻译完成！');
    } catch (err: any) {
      message.error('翻译失败：' + (err.message || '未知错误'));
    } finally {
      setTranslateLoading(false);
    }
  };

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <PlayCircleOutlined style={{ marginRight: 8 }} />
          视频内容分析
        </span>
      ),
      children: (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>正在分析视频...</div>
            </div>
          ) : analysis ? (
             <Card title="视频内容分析" size="small">
               <div style={{ 
                 whiteSpace: 'pre-wrap', 
                 fontSize: '14px', 
                 lineHeight: '1.8',
                 fontFamily: 'monospace'
               }}>
                 {analysis}
               </div>
             </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <PlayCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <div>请输入YouTube链接并点击分析按钮开始</div>
            </div>
          )}
        </div>
      )
    },
    {
      key: '2',
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 8 }} />
          AI格式化字幕
        </span>
      ),
      children: (
        <div>

          
          {formatLoading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>正在格式化字幕...</div>
            </div>
          ) : formattedTranscript ? (
            <Card title="格式化后的字幕" size="small">
              <TextArea
                value={formattedTranscript}
                rows={15}
                readOnly
                style={{ fontFamily: 'monospace' }}
              />
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <FileTextOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
              <div>请先分析视频，然后点击格式化按钮</div>
            </div>
          )}
        </div>
      )
    },
    {
      key: '3',
      label: (
        <span>
          <TranslationOutlined style={{ marginRight: 8 }} />
          中文翻译
        </span>
      ),
      children: (
        <div>

          
          {translateLoading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>正在翻译...</div>
            </div>
          ) : translation ? (
            <Card title="中文翻译" size="small">
              <TextArea
                value={translation}
                rows={15}
                readOnly
                style={{ fontFamily: 'monospace' }}
              />
            </Card>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <TranslationOutlined style={{ fontSize: 48, color: '#fa8c16', marginBottom: 16 }} />
              <div>请先格式化字幕，然后点击翻译按钮</div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
        YouTube视频内容分析工具
      </Title>
      
      <Card style={{ marginBottom: '24px' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="请输入YouTube视频链接"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPressEnter={handleAnalyze}
            size="large"
          />
          <Button 
             type="primary" 
             size="large" 
             onClick={handleAnalyze}
             loading={loading}
           >
             一键解析
           </Button>
        </Space.Compact>
        
        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>

      {(analysis || formattedTranscript || translation || loading || formatLoading || translateLoading) && (
        <Card>
          <Tabs 
            defaultActiveKey="1" 
            items={tabItems}
            size="large"
          />
        </Card>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '32px', color: '#666' }}>
        <Text type="secondary">© 2024 YouTube视频分析工具</Text>
      </div>
    </div>
  );
};

export default Home;