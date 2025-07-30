#!/bin/bash

# Google Cloud Run 部署脚本
# 使用前请确保已安装并配置 gcloud CLI

set -e

# 配置变量
PROJECT_ID="your-gcp-project-id"  # 替换为你的GCP项目ID
SERVICE_NAME="easyyoutube-backend"
REGION="asia-east1"  # 可根据需要修改区域
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "开始部署 EasyYoutube 后端到 Google Cloud Run..."

# 检查是否已登录 gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "请先登录 Google Cloud: gcloud auth login"
    exit 1
fi

# 设置项目
echo "设置 GCP 项目: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 启用必要的API
echo "启用必要的 Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 构建Docker镜像
echo "构建 Docker 镜像..."
gcloud builds submit --tag $IMAGE_NAME .

# 部署到Cloud Run
echo "部署到 Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars PORT=8080

# 获取服务URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo "部署完成！"
echo "服务URL: $SERVICE_URL"
echo "健康检查: $SERVICE_URL/api/health"
echo ""
echo "请将以下URL设置为前端的 VITE_API_URL 环境变量:"
echo "$SERVICE_URL/api"
echo ""
echo "如需设置环境变量，请运行:"
echo "gcloud run services update $SERVICE_NAME --set-env-vars OPENAI_API_KEY=your_api_key --region $REGION"