# 腾讯云服务器前后端连接配置指南

## 当前部署状态

- **后端服务器**: 腾讯云 CVM
- **公网IP**: 150.158.107.5
- **Flask端口**: 8080
- **前端部署**: Vercel

## 前后端连接配置

### 1. Vercel 环境变量配置

登录 [Vercel Dashboard](https://vercel.com/dashboard)，进入你的项目设置：

1. **进入项目设置**
   - 选择你的 EasyYoutube 项目
   - 点击 "Settings" 选项卡
   - 选择 "Environment Variables"

2. **添加环境变量**
   ```
   Name: VITE_API_URL
   Value: http://150.158.107.5:8080/api
   Environment: Production, Preview, Development
   ```

3. **重新部署**
   - 在 "Deployments" 选项卡中
   - 点击最新部署旁的三个点
   - 选择 "Redeploy"

### 2. 腾讯云服务器安全组配置

确保腾讯云安全组已开放必要端口：

```bash
# 登录腾讯云控制台 -> 云服务器 -> 安全组
# 添加入站规则：
协议端口: TCP:8080
授权对象: 0.0.0.0/0
策略: 允许
备注: Flask API 服务

# 如果需要 HTTPS，也要开放 443 端口
协议端口: TCP:443
授权对象: 0.0.0.0/0
策略: 允许
备注: HTTPS 服务
```

### 3. 服务器防火墙配置

在腾讯云服务器上配置防火墙：

```bash
# 检查防火墙状态
sudo ufw status

# 如果防火墙已启用，添加规则
sudo ufw allow 8080/tcp
sudo ufw allow 22/tcp  # SSH 端口，确保不被锁定
sudo ufw reload

# 验证规则
sudo ufw status numbered
```

### 4. CORS 配置验证

确保后端 Flask 应用已正确配置 CORS：

```python
# 在 app.py 中确认以下配置
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["*"])  # 生产环境建议限制具体域名
```

### 5. 测试连接

#### 5.1 测试后端 API

```bash
# 在本地或任意位置测试
curl http://150.158.107.5:8080/api/health

# 预期响应
{"status":"ok"}
```

#### 5.2 测试前端连接

1. **本地测试**
   ```bash
   # 在项目根目录
   npm run dev
   # 访问 http://localhost:5173，测试功能
   ```

2. **Vercel 部署测试**
   - 访问你的 Vercel 部署地址
   - 打开浏览器开发者工具 -> Network
   - 测试 YouTube 链接处理功能
   - 检查 API 请求是否成功

## 重要：解决Mixed Content错误

### 问题说明
当Vercel前端（HTTPS）尝试连接腾讯云后端（HTTP）时，浏览器会阻止请求并显示Mixed Content错误：
```
Mixed Content: The page at 'https://easy-youtube-alpha.vercel.app/' was loaded over HTTPS, but requested an insecure XMLHttpRequest endpoint 'http://150.158.107.5:8080/api/analyze'. This request has been blocked; the content must be served over HTTPS.
```

### 解决方案1：配置SSL证书（推荐）

#### 1.1 安装Nginx和Certbot
```bash
# 更新系统
sudo apt update
sudo apt upgrade -y

# 安装Nginx
sudo apt install nginx -y

# 安装Certbot
sudo apt install certbot python3-certbot-nginx -y
```

#### 1.2 配置域名（如果有域名）
如果你有域名，将域名解析到服务器IP：
```bash
# 创建Nginx配置
sudo nano /etc/nginx/sites-available/easyyoutube
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/easyyoutube /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com
```

#### 1.3 使用IP配置SSL（无域名情况）
如果没有域名，可以使用自签名证书：

```bash
# 生成自签名证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/easyyoutube.key \
    -out /etc/ssl/certs/easyyoutube.crt

# 配置Nginx使用HTTPS
sudo nano /etc/nginx/sites-available/easyyoutube-ssl
```

添加配置：
```nginx
server {
    listen 443 ssl;
    server_name 150.158.107.5;
    
    ssl_certificate /etc/ssl/certs/easyyoutube.crt;
    ssl_certificate_key /etc/ssl/private/easyyoutube.key;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name 150.158.107.5;
    return 301 https://$server_name$request_uri;
}
```

```bash
# 启用SSL配置
sudo ln -s /etc/nginx/sites-available/easyyoutube-ssl /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 解决方案2：临时开发解决方案

#### 2.1 在Vercel中设置环境变量
在Vercel项目设置中添加：
```
VITE_API_BASE_URL=http://150.158.107.5:8080/api
```

**注意：** 由于Mixed Content限制，这种方法在生产环境中不会生效。建议使用解决方案1或3。

#### 2.2 前端代码已更新
前端代码已更新为支持环境变量配置：
```typescript
const getApiBaseUrl = (): string => {
  // 开发环境或本地测试
  if (import.meta.env.DEV) {
    return 'http://localhost:8080/api';
  }
  
  // 生产环境 - 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 默认HTTPS地址（需要配置SSL）
  return 'https://150.158.107.5/api';
};
```

#### 2.3 浏览器临时解决方案（仅用于测试）
在Chrome中启动时添加参数（不推荐生产使用）：
```bash
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome_dev"
```

### 解决方案3：使用Cloudflare Tunnel（推荐）

#### 3.1 安装Cloudflare Tunnel
```bash
# 下载cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# 登录Cloudflare
cloudflared tunnel login

# 创建tunnel
cloudflared tunnel create easyyoutube

# 配置tunnel
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: easyyoutube
credentials-file: /home/ubuntu/.cloudflared/[tunnel-id].json

ingress:
  - hostname: your-subdomain.your-domain.com
    service: http://localhost:8080
  - service: http_status:404
EOF

# 运行tunnel
cloudflared tunnel run easyyoutube
```

## 安全优化建议

### 1. 限制 CORS 源

```python
# 在生产环境中，限制 CORS 到具体域名
CORS(app, origins=[
    "https://easy-youtube-alpha.vercel.app",
    "https://your-custom-domain.com"
])
```

### 2. 使用 HTTPS（推荐）

#### 2.1 安装 SSL 证书

```bash
# 安装 Certbot
sudo apt update
sudo apt install certbot

# 如果有域名，可以申请免费 SSL 证书
# sudo certbot certonly --standalone -d your-domain.com
```

#### 2.2 配置 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/easyyoutube
```

```nginx
server {
    listen 80;
    server_name 150.158.107.5;  # 或你的域名

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 头部
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/easyyoutube /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 更新安全组，开放 80 端口
# 更新 Vercel 环境变量为: http://150.158.107.5/api
```

### 3. 环境变量安全

```bash
# 在服务器上，确保 .env 文件权限正确
chmod 600 /path/to/your/app/.env
chown your-user:your-user /path/to/your/app/.env
```

## 监控和维护

### 1. 服务状态监控

```bash
# 检查 Flask 应用状态
ps aux | grep python

# 检查端口占用
sudo netstat -tlnp | grep :8080

# 查看应用日志
tail -f /path/to/your/app/logs/app.log
```

### 2. 自动重启配置

```bash
# 创建 systemd 服务文件
sudo nano /etc/systemd/system/easyyoutube.service
```

```ini
[Unit]
Description=EasyYoutube Flask Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/EasyYoutube/server
Environment=PATH=/home/ubuntu/EasyYoutube/server/venv/bin
ExecStart=/home/ubuntu/EasyYoutube/server/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable easyyoutube
sudo systemctl start easyyoutube
sudo systemctl status easyyoutube
```

## 故障排除

### 1. 连接被拒绝

```bash
# 检查服务是否运行
sudo systemctl status easyyoutube

# 检查端口是否监听
sudo netstat -tlnp | grep :8080

# 检查防火墙
sudo ufw status
```

### 2. CORS 错误

- 确认 Flask-CORS 已安装并配置
- 检查 Vercel 环境变量是否正确
- 验证 API 端点是否可访问

### 3. 502 Bad Gateway（使用 Nginx 时）

```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 检查后端服务
curl http://127.0.0.1:8080/api/health
```

## 性能优化

### 1. 使用 Gunicorn

```bash
# 安装 Gunicorn
pip install gunicorn

# 创建配置文件
cat > gunicorn.conf.py << EOF
bind = "0.0.0.0:8080"
workers = 2
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
timeout = 30
EOF

# 使用 Gunicorn 启动
gunicorn -c gunicorn.conf.py app:app
```

### 2. 启用 Gzip 压缩（Nginx）

```nginx
# 在 Nginx 配置中添加
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

## 总结

完成以上配置后，你的前后端应该能够正常通信：

- ✅ 前端（Vercel）: https://your-app.vercel.app
- ✅ 后端（腾讯云）: http://150.158.107.5:8080
- ✅ API 端点: http://150.158.107.5:8080/api/*

记得定期备份数据和监控服务状态！