# 后端服务测试指南

本指南提供了完整的后端API测试方法，帮助你验证部署后的服务是否正常工作。

## 前提条件

确保你的后端服务已经部署并运行：
- HTTP服务：`http://150.158.107.5:8080`
- HTTPS服务：`https://150.158.107.5` (如果已配置SSL)

## 基础连接测试

### 1. 健康检查

```bash
# HTTP测试
curl http://150.158.107.5:8080/api/health

# HTTPS测试（如果已配置SSL）
curl -k https://150.158.107.5/api/health
```

**预期响应：**
```json
{
  "status": "healthy",
  "message": "EasyYoutube API is running"
}
```

### 2. 根路径测试

```bash
# 测试根路径
curl http://150.158.107.5:8080/
```

**预期响应：**
```json
{
  "message": "EasyYoutube API Server",
  "version": "1.0.0",
  "endpoints": [
    "/api/analyze",
    "/api/transcript",
    "/api/format-transcript",
    "/api/translate",
    "/api/health"
  ]
}
```

## API端点功能测试

### 3. 获取视频字幕 (/api/transcript)

```bash
# 测试获取字幕功能
curl -X POST http://150.158.107.5:8080/api/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

**预期响应：**
```json
{
  "error": false,
  "transcript": "字幕内容...",
  "video_id": "dQw4w9WgXcQ",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### 4. 格式化字幕 (/api/format-transcript)

```bash
# 测试字幕格式化功能
curl -X POST http://150.158.107.5:8080/api/format-transcript \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

**预期响应：**
```json
{
  "formatted_transcript": "格式化后的字幕内容...",
  "original_transcript": "原始字幕内容...",
  "video_id": "dQw4w9WgXcQ",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

### 5. 视频内容分析 (/api/analyze)

```bash
# 测试视频分析功能
curl -X POST http://150.158.107.5:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

**预期响应：**
```json
{
  "success": true,
  "analysis": {
    "summary": "视频内容摘要...",
    "key_points": ["要点1", "要点2", "要点3"],
    "topics": ["主题1", "主题2"]
  },
  "video_id": "dQw4w9WgXcQ"
}
```

### 6. 文本翻译 (/api/translate)

```bash
# 测试翻译功能
curl -X POST http://150.158.107.5:8080/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World"}'
```

**预期响应：**
```json
{
  "translated_text": "你好世界",
  "original_text": "Hello World"
}
```

## CORS测试

### 7. 测试跨域请求

```bash
# 测试CORS配置
curl -X POST http://150.158.107.5:8080/api/health \
  -H "Origin: https://easy-youtube-alpha.vercel.app" \
  -H "Content-Type: application/json" \
  -v
```

**检查响应头中是否包含：**
```
Access-Control-Allow-Origin: https://easy-youtube-alpha.vercel.app
```

### 8. OPTIONS预检请求测试

```bash
# 测试预检请求
curl -X OPTIONS http://150.158.107.5:8080/api/analyze \
  -H "Origin: https://easy-youtube-alpha.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

## 错误处理测试

### 9. 无效URL测试

```bash
# 测试无效YouTube URL
curl -X POST http://150.158.107.5:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://invalid-url.com"
  }'
```

**预期响应：**
```json
{
  "success": false,
  "error": "无效的YouTube URL"
}
```

### 10. 缺少参数测试

```bash
# 测试缺少必需参数
curl -X POST http://150.158.107.5:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{}'
```

**预期响应：**
```json
{
  "success": false,
  "error": "缺少必需的参数: url"
}
```

## 性能测试

### 11. 响应时间测试

```bash
# 测试API响应时间
time curl -X POST http://150.158.107.5:8080/api/health

# 或使用curl的时间统计
curl -X POST http://150.158.107.5:8080/api/health \
  -w "\n响应时间: %{time_total}s\n连接时间: %{time_connect}s\n"
```

### 12. 并发测试

```bash
# 简单并发测试（需要安装ab工具）
ab -n 10 -c 2 http://150.158.107.5:8080/api/health

# 或使用curl并发
for i in {1..5}; do
  curl -X GET http://150.158.107.5:8080/api/health &
done
wait
```

## 环境变量测试

### 13. 检查OpenAI配置

```bash
# 测试需要OpenAI的功能
curl -X POST http://150.158.107.5:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }' \
  -v
```

如果OpenAI配置有问题，会返回相关错误信息。

## 日志检查

### 14. 查看Docker容器日志

```bash
# 查看实时日志
docker logs -f easyyoutube-backend

# 查看最近的日志
docker logs --tail 50 easyyoutube-backend

# 查看特定时间的日志
docker logs --since "2024-01-01T00:00:00" easyyoutube-backend
```

## 自动化测试脚本

### 15. 创建测试脚本

创建 `test_backend.sh` 文件：

```bash
#!/bin/bash

# 后端服务自动化测试脚本
BASE_URL="http://150.158.107.5:8080"
TEST_VIDEO="https://www.youtube.com/watch?v=dQw4w9WgXcQ"

echo "=== 后端服务自动化测试 ==="
echo "测试服务器: $BASE_URL"
echo "测试视频: $TEST_VIDEO"
echo ""

# 1. 健康检查
echo "1. 健康检查测试"
curl -s "$BASE_URL/api/health" | jq .
echo ""

# 2. 根路径测试
echo "2. 根路径测试"
curl -s "$BASE_URL/" | jq .
echo ""

# 3. 获取字幕测试
echo "3. 获取字幕测试"
curl -s -X POST "$BASE_URL/api/transcript" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_VIDEO\"}" | jq .
echo ""

# 4. 视频分析测试
echo "4. 视频分析测试"
curl -s -X POST "$BASE_URL/api/analyze" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_VIDEO\"}" | jq .
echo ""

# 5. 格式化字幕测试
echo "5. 格式化字幕测试"
curl -s -X POST "$BASE_URL/api/format-transcript" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$TEST_VIDEO\"}" | jq .
echo ""

# 6. 翻译测试
echo "6. 翻译测试"
curl -s -X POST "$BASE_URL/api/translate" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World"}' | jq .
echo ""

# 7. CORS测试
echo "7. CORS测试"
curl -s -X POST "$BASE_URL/api/health" \
  -H "Origin: https://easy-youtube-alpha.vercel.app" \
  -v
echo ""

echo "=== 测试完成 ==="
```

运行测试脚本：
```bash
chmod +x test_backend.sh
./test_backend.sh
```

## 问题分析

### 腾讯云部署常见问题

根据你提供的日志分析，发现以下问题：

1. **405 Method Not Allowed 错误**
   ```
   180.101.244.15 - - [30/Jul/2025 13:03:40] "GET /api/transcript HTTP/1.1" 405 -
   ```
   **原因**：`/api/transcript` 端点只支持 POST 方法，但有请求使用了 GET 方法
   **解决**：确保所有API调用使用正确的HTTP方法（见上方测试命令）

2. **可疑的外部连接**
   ```
   185.91.127.107 - - [30/Jul/2025 13:05:04] "CONNECT pro.ip-api.com:443 HTTP/1.1" 404 -
   ```
   **原因**：可能是恶意扫描或代理请求
   **建议**：考虑配置防火墙规则限制访问

3. **字幕获取功能正常**
   ```
   正在获取视频字幕，视频ID: dQw4w9WgXcQ
   未找到英文字幕，尝试获取其他语言字幕
   ```
   **状态**：字幕获取逻辑工作正常，会自动尝试多种语言

### 快速修复建议

**立即测试正确的API调用：**

```bash
# 1. 测试健康检查（GET方法）
curl http://150.158.107.5:8080/api/health

# 2. 测试字幕获取（POST方法）
curl -X POST http://150.158.107.5:8080/api/transcript \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# 3. 测试视频分析（POST方法）
curl -X POST http://150.158.107.5:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**重要提醒：**
- 所有业务API端点（/api/transcript, /api/analyze, /api/format-transcript, /api/translate）都只支持POST方法
- 只有健康检查端点（/api/health, /）支持GET方法
- 必须设置正确的Content-Type头部：`application/json`
- 请求体必须是有效的JSON格式

## 故障排除

### 常见问题及解决方案

1. **连接被拒绝**
   ```bash
   # 检查服务是否运行
   docker ps | grep easyyoutube
   
   # 检查端口是否开放
   netstat -tlnp | grep 8080
   ```

2. **405 Method Not Allowed**
   ```bash
   # 确认使用正确的HTTP方法（所有API端点都使用POST）
   curl -X POST http://150.158.107.5:8080/api/transcript \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
   ```

3. **CORS错误**
   ```bash
   # 检查CORS配置
   curl -v -H "Origin: https://easy-youtube-alpha.vercel.app" \
     http://150.158.107.5:8080/api/health
   ```

4. **SSL证书错误**
   ```bash
   # 使用-k参数忽略证书验证
   curl -k https://150.158.107.5/api/health
   ```

5. **API返回500错误**
   ```bash
   # 查看详细错误日志
   docker logs easyyoutube-backend | tail -20
   ```

## 监控建议

### 持续监控脚本

创建 `monitor_backend.sh`：

```bash
#!/bin/bash

while true; do
    response=$(curl -s http://150.158.107.5:8080/api/health)
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [[ $response == *"healthy"* ]]; then
        echo "[$timestamp] ✅ 服务正常"
    else
        echo "[$timestamp] ❌ 服务异常: $response"
        # 可以在这里添加告警逻辑
    fi
    
    sleep 60  # 每分钟检查一次
done
```

这个测试指南涵盖了后端服务的所有主要功能，帮助你全面验证部署后的服务状态。