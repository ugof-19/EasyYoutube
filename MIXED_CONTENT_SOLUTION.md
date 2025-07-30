# Mixed Content 错误快速解决方案

## 问题描述

当Vercel前端（HTTPS）尝试连接腾讯云后端（HTTP）时，浏览器会阻止请求：

```
Mixed Content: The page at 'https://easy-youtube-alpha.vercel.app/' was loaded over HTTPS, 
but requested an insecure XMLHttpRequest endpoint 'http://150.158.107.5:8080/api/analyze'. 
This request has been blocked; the content must be served over HTTPS.
```

## 立即解决方案

### 方案1：使用Nginx配置SSL（推荐）

#### 步骤1：安装Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

#### 步骤2：创建自签名SSL证书
```bash
# 生成SSL证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/easyyoutube.key \
    -out /etc/ssl/certs/easyyoutube.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=EasyYoutube/CN=150.158.107.5"
```

#### 步骤3：配置Nginx
```bash
# 创建Nginx配置文件
sudo tee /etc/nginx/sites-available/easyyoutube-ssl > /dev/null <<EOF
server {
    listen 443 ssl;
    server_name 150.158.107.5;
    
    ssl_certificate /etc/ssl/certs/easyyoutube.crt;
    ssl_certificate_key /etc/ssl/private/easyyoutube.key;
    
    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://easy-youtube-alpha.vercel.app";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }
}

server {
    listen 80;
    server_name 150.158.107.5;
    return 301 https://\$server_name\$request_uri;
}
EOF
```

#### 步骤4：启用配置
```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/easyyoutube-ssl /etc/nginx/sites-enabled/

# 删除默认配置（如果存在）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx
```

#### 步骤5：配置防火墙
```bash
# 开放443端口（HTTPS）
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp

# 检查防火墙状态
sudo ufw status
```

#### 步骤6：测试HTTPS连接
```bash
# 测试HTTPS连接
curl -k https://150.158.107.5/api/health

# 如果没有health端点，测试主页
curl -k https://150.158.107.5/
```

### 方案2：使用Cloudflare Tunnel（最简单）

#### 步骤1：安装cloudflared
```bash
# 下载并安装
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

#### 步骤2：创建免费隧道
```bash
# 创建临时隧道（无需域名）
cloudflared tunnel --url http://localhost:8080
```

这将生成一个类似 `https://xxx.trycloudflare.com` 的临时HTTPS地址。

#### 步骤3：更新Vercel环境变量
在Vercel项目设置中添加：
```
VITE_API_BASE_URL=https://xxx.trycloudflare.com/api
```

### 方案3：临时测试解决方案

#### 在Chrome中禁用安全检查（仅用于测试）
```bash
# Windows
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome_dev" --allow-running-insecure-content

# 或者启动时添加参数
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --user-data-dir="C:/temp/chrome_dev"
```

## 验证解决方案

### 1. 检查HTTPS访问
```bash
# 测试HTTPS端点（-k 忽略证书验证）
curl -k https://150.158.107.5/api/analyze -X POST \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=test"}'
```

### 2. 解决证书验证错误

如果遇到 `ERR_CERT_AUTHORITY_INVALID` 错误，这是因为使用了自签名证书。有以下解决方案：

#### 方案A：获取受信任的SSL证书（推荐）
```bash
# 如果有域名，使用Let's Encrypt免费证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 方案B：在浏览器中接受自签名证书
1. 直接访问 `https://150.158.107.5`
2. 点击"高级"或"Advanced"
3. 点击"继续访问"或"Proceed to 150.158.107.5 (unsafe)"
4. 这将添加证书例外，允许HTTPS访问

#### 方案C：使用Cloudflare Tunnel（最简单）
```bash
# 这将提供受信任的HTTPS证书
cloudflared tunnel --url http://localhost:8080
# 使用生成的 https://xxx.trycloudflare.com 地址
```

### 3. 检查浏览器控制台
打开 https://easy-youtube-alpha.vercel.app/ 并检查：
- 不再有Mixed Content错误
- 不再有ERR_CERT_AUTHORITY_INVALID错误
- API请求成功发送
- 服务器响应正常

### 4. 测试完整功能
- 输入YouTube URL
- 点击分析按钮
- 检查是否正常获取结果

## 推荐配置

**生产环境推荐：** 方案1（Nginx + SSL）
- 稳定可靠
- 完全控制
- 支持自定义配置

**快速测试推荐：** 方案2（Cloudflare Tunnel）
- 无需配置SSL
- 自动HTTPS
- 快速部署

## 重要更新：CORS配置已修复

后端代码已更新，现在包含正确的CORS配置以允许来自 `https://easy-youtube-alpha.vercel.app` 的请求。

### 重新部署后端服务

更新CORS配置后，需要重新构建和部署Docker容器：

```bash
# 停止当前容器
docker stop easyyoutube-backend
docker rm easyyoutube-backend

# 重新构建镜像（使用国内优化版本）
docker build -f Dockerfile.china -t easyyoutube-backend .

# 重新运行容器
docker run -d --name easyyoutube-backend \
  -p 8080:8080 \
  -p 443:443 \
  --env-file .env \
  easyyoutube-backend
```

如果使用Nginx SSL配置，还需要重新配置：

```bash
# 重新启动Nginx（如果已配置）
sudo systemctl restart nginx

# 测试HTTPS和CORS
curl -k -H "Origin: https://easy-youtube-alpha.vercel.app" \
  https://150.158.107.5/api/health
```

## 故障排除

### ERR_CERT_AUTHORITY_INVALID 错误（重要）

这是最常见的错误，表示浏览器不信任自签名证书。

#### 立即解决方案：

**方法1：浏览器接受证书（最快）**
1. 在新标签页中访问：`https://150.158.107.5`
2. 看到安全警告时，点击"高级"或"Advanced"
3. 点击"继续访问 150.158.107.5（不安全）"或"Proceed to 150.158.107.5 (unsafe)"
4. 刷新你的 Vercel 前端页面，错误应该消失

**方法2：使用 Cloudflare Tunnel（推荐）**
```bash
# 在服务器上运行
cloudflared tunnel --url http://localhost:8080

# 复制生成的 https://xxx.trycloudflare.com 地址
# 在 Vercel 环境变量中设置：
# VITE_API_BASE_URL=https://xxx.trycloudflare.com/api
```

**方法3：获取真实SSL证书**
```bash
# 如果你有域名
sudo certbot --nginx -d your-domain.com

# 如果没有域名，考虑购买一个便宜的域名
# 然后使用 Let's Encrypt 免费证书
```

### 如果Nginx配置失败
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载配置
sudo nginx -s reload
```

### 如果SSL证书问题
```bash
# 重新生成证书
sudo rm /etc/ssl/private/easyyoutube.key /etc/ssl/certs/easyyoutube.crt

# 重新执行证书生成命令
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/easyyoutube.key \
    -out /etc/ssl/certs/easyyoutube.crt \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=EasyYoutube/CN=150.158.107.5"
```

### 如果端口被占用
```bash
# 检查端口占用
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :80

# 停止占用端口的服务
sudo systemctl stop apache2  # 如果安装了Apache
```

## 下一步

配置完成后，建议：
1. 重新部署Vercel项目以应用环境变量
2. 测试所有API端点
3. 监控服务器性能
4. 考虑申请正式域名和SSL证书