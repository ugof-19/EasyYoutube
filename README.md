# EasyYoutube - YouTube 视频内容分析助手

## 项目简介

EasyYoutube 是一个帮助用户快速理解 YouTube 视频内容的工具。通过提取视频字幕并利用人工智能技术，我们能够为您提供视频内容的摘要和分析，让您在观看前就能了解视频的主要内容。这对于英语学习者特别有用，可以帮助他们决定哪些视频值得观看，提高学习效率。

## 功能特点

- **YouTube 视频分析**：只需粘贴 YouTube 视频链接，即可获取视频内容的智能分析
- **语言学习辅助**：帮助英语学习者快速了解视频内容，提高学习效率
- **AI 驱动**：使用先进的人工智能技术分析视频内容，提供准确的摘要

## 技术栈

- **前端**：React, TypeScript, Ant Design
- **后端**：Python, Flask
- **API**：YouTube Transcript API, OpenAI API

## 安装与运行

### 前端

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 后端

```bash
# 进入后端目录
cd server

# 创建虚拟环境（可选）
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate    # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
# 复制 .env.example 为 .env 并填入你的 OpenAI API 密钥
cp .env.example .env

# 启动服务器
python app.py
```

## 使用方法

1. 启动前端和后端服务
2. 在浏览器中访问 http://localhost:5173
3. 在输入框中粘贴 YouTube 视频链接
4. 点击「分析」按钮
5. 等待分析结果显示

## 注意事项

- 需要有效的 OpenAI API 密钥才能使用分析功能
- 视频必须有可用的字幕才能进行分析
- 分析结果的质量取决于字幕的质量和完整性

## 许可证

MIT
