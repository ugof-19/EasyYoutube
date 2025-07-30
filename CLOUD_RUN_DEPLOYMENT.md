# Google Cloud Run 部署指南

本指南将帮助您将 EasyYoutube 后端从 Railway 迁移到 Google Cloud Run。

## 前置要求

1. **Google Cloud Platform 账户**
   - 创建或使用现有的 GCP 项目
   - 启用计费功能

2. **安装 Google Cloud CLI**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Windows
   # 下载并安装: https://cloud.google.com/sdk/docs/install
   
   # Ubuntu/Debian
   sudo apt-get install google-cloud-cli
   ```

3. **登录并配置 gcloud**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

## 部署步骤

### 方法一：使用自动化脚本（推荐）

1. **配置部署脚本**
   ```bash
   cd server
   chmod +x deploy.sh
   
   # 编辑 deploy.sh，替换 PROJECT_ID
   nano deploy.sh
   ```

2. **执行部署**
   ```bash
   ./deploy.sh
   ```

### 方法二：手动部署

1. **启用必要的 API**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

2. **构建并推送镜像**
   ```bash
   cd server
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/easyyoutube-backend
   ```

3. **部署到 Cloud Run**
   ```bash
   gcloud run deploy easyyoutube-backend \
     --image gcr.io/YOUR_PROJECT_ID/easyyoutube-backend \
     --platform managed \
     --region asia-east1 \
     --allow-unauthenticated \
     --port 8080 \
     --memory 1Gi \
     --cpu 1 \
     --max-instances 10
   ```

4. **设置环境变量**
   ```bash
   gcloud run services update easyyoutube-backend \
     --set-env-vars OPENAI_API_KEY=your_deepseek_api_key \
     --region asia-east1
   ```

## 前端配置

部署完成后，您需要更新前端的环境变量：

### Vercel 部署

1. 在 Vercel 项目设置中添加环境变量：
   ```
   VITE_API_URL=https://your-cloud-run-service-url/api
   ```

2. 重新部署前端项目

### 本地开发

创建 `.env.local` 文件：
```env
VITE_API_URL=https://your-cloud-run-service-url/api
```

## 成本优化

### 自动缩放配置
```bash
# 设置最小实例数为0（按需启动）
gcloud run services update easyyoutube-backend \
  --min-instances 0 \
  --max-instances 10 \
  --region asia-east1
```

### 内存和CPU优化
```bash
# 根据实际使用情况调整资源
gcloud run services update easyyoutube-backend \
  --memory 512Mi \
  --cpu 0.5 \
  --region asia-east1
```

## 监控和日志

### 查看服务状态
```bash
gcloud run services describe easyyoutube-backend --region asia-east1
```

### 查看日志
```bash
gcloud logs read --service easyyoutube-backend --region asia-east1
```

### 实时日志监控
```bash
gcloud logs tail --service easyyoutube-backend --region asia-east1
```

## 域名配置（可选）

### 自定义域名
```bash
gcloud run domain-mappings create \
  --service easyyoutube-backend \
  --domain api.yourdomain.com \
  --region asia-east1
```

## 安全配置

### 使用 Secret Manager 存储敏感信息
```bash
# 创建密钥
echo "your_deepseek_api_key" | gcloud secrets create openai-api-key --data-file=-

# 更新服务使用密钥
gcloud run services update easyyoutube-backend \
  --update-env-vars OPENAI_API_KEY_SECRET=openai-api-key \
  --region asia-east1
```

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Dockerfile 语法
   - 确保 requirements.txt 包含所有依赖

2. **服务无法启动**
   - 检查端口配置（必须是8080）
   - 查看服务日志

3. **API 调用失败**
   - 验证 CORS 配置
   - 检查环境变量设置

### 健康检查
```bash
curl https://your-cloud-run-service-url/api/health
```

## 成本估算

基于典型使用情况：
- **请求数**: 1000次/月
- **内存**: 512Mi
- **CPU**: 0.5核
- **预估成本**: $1-5/月

## 迁移检查清单

- [ ] GCP 项目已创建并启用计费
- [ ] gcloud CLI 已安装并配置
- [ ] 后端服务已部署到 Cloud Run
- [ ] 环境变量已正确设置
- [ ] 前端环境变量已更新
- [ ] API 健康检查通过
- [ ] 功能测试完成
- [ ] Railway 服务已停用（可选）

## 支持

如遇到问题，请检查：
1. [Google Cloud Run 文档](https://cloud.google.com/run/docs)
2. [项目 GitHub Issues](https://github.com/your-repo/issues)
3. Google Cloud 支持