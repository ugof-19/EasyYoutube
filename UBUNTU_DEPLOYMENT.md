# Ubuntu 系统部署指南

是的，该项目完全支持在 Ubuntu 系统服务器上部署！本指南将详细说明如何在 Ubuntu 服务器上部署 EasyYoutube 项目。

## 系统要求

- **操作系统**: Ubuntu 18.04 LTS 或更高版本
- **内存**: 最少 1GB RAM（推荐 2GB+）
- **存储**: 最少 5GB 可用空间
- **网络**: 稳定的互联网连接

## 部署方式

### 方式一：Docker 部署（推荐）

#### 1. 安装 Docker

```bash
# 更新系统包
sudo apt update
sudo apt upgrade -y

# 安装必要的包
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# 启动并启用 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组（可选）
sudo usermod -aG docker $USER
# 注销并重新登录以使组更改生效
```

#### 1.1 配置 Docker 镜像源（解决网络问题）

如果遇到 Docker Hub 连接超时问题，可以配置国内镜像源：

```bash
# 创建 Docker 配置目录
sudo mkdir -p /etc/docker

# 配置镜像加速器
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
  ],
  "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF

# 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证配置
docker info | grep -A 10 "Registry Mirrors"
```

#### 1.2 网络问题诊断和解决方案

如果仍然遇到网络超时问题，可以尝试以下解决方案：

**方案一：网络诊断**
```bash
# 测试网络连接
ping -c 4 registry-1.docker.io
nslookup registry-1.docker.io

# 测试 HTTPS 连接
curl -I https://registry-1.docker.io/v2/

# 检查 DNS 设置
cat /etc/resolv.conf
```

**方案二：使用代理（如果有）**
```bash
# 临时设置代理
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port

# 或者配置 Docker 代理
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf <<-'EOF'
[Service]
Environment="HTTP_PROXY=http://your-proxy:port"
Environment="HTTPS_PROXY=http://your-proxy:port"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

**方案三：使用本地镜像或离线安装**
```bash
# 如果有其他服务器可以访问 Docker Hub，可以先拉取镜像然后导出
# 在可访问的服务器上：
docker pull python:3.11-slim
docker save python:3.11-slim > python-3.11-slim.tar

# 传输到目标服务器后导入：
docker load < python-3.11-slim.tar
```

**方案四：修改 Dockerfile 使用国内基础镜像**
```bash
# 创建备用 Dockerfile
cp Dockerfile Dockerfile.china

# 修改基础镜像为国内源
sed -i 's|FROM python:3.11-slim|FROM registry.cn-hangzhou.aliyuncs.com/library/python:3.11-slim|g' Dockerfile.china

# 使用修改后的 Dockerfile 构建
docker build -f Dockerfile.china -t easyyoutube-backend .
```

#### 2. 部署应用

```bash
# 克隆项目（如果还没有）
git clone https://github.com/your-repo/EasyYoutube.git
cd EasyYoutube/server

# 创建环境变量文件
cp .env.example .env
nano .env  # 编辑并添加你的 API 密钥

# 构建 Docker 镜像
docker build -t easyyoutube-backend .

# 运行容器
docker run -d \
  --name easyyoutube-backend \
  -p 8080:8080 \
  --env-file .env \
  --restart unless-stopped \
  easyyoutube-backend
```

#### 3. 验证部署

```bash
# 检查容器状态
docker ps

# 查看日志
docker logs easyyoutube-backend

# 测试健康检查
curl http://localhost:8080/api/health
```

### 方式二：直接部署

#### 1. 安装 Python 和依赖

```bash
# 更新系统
sudo apt update
sudo apt upgrade -y

# 安装 Python 3.11 和相关工具
sudo apt install -y python3.11 python3.11-pip python3.11-venv python3.11-dev

# 安装系统依赖
sudo apt install -y gcc build-essential

# 安装 ffmpeg（yt-dlp 需要）
sudo apt install -y ffmpeg
```

#### 2. 设置应用环境

```bash
# 克隆项目
git clone https://github.com/your-repo/EasyYoutube.git
cd EasyYoutube/server

# 创建虚拟环境
python3.11 -m venv venv
source venv/bin/activate

# 安装 Python 依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
nano .env  # 编辑并添加你的 API 密钥
```

#### 3. 创建系统服务

```bash
# 创建服务文件
sudo nano /etc/systemd/system/easyyoutube.service
```

添加以下内容：

```ini
[Unit]
Description=EasyYoutube Backend Service
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

#### 4. 启动服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start easyyoutube

# 设置开机自启
sudo systemctl enable easyyoutube

# 检查服务状态
sudo systemctl status easyyoutube
```

### 方式三：使用 Nginx 反向代理

#### 1. 安装 Nginx

```bash
sudo apt install -y nginx
```

#### 2. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/easyyoutube
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或服务器IP

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 配置
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

#### 3. 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/easyyoutube /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## SSL 证书配置（可选）

### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 防火墙配置

```bash
# 启用 UFW 防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow ssh

# 允许 HTTP 和 HTTPS
sudo ufw allow 'Nginx Full'

# 或者直接允许端口
sudo ufw allow 8080
sudo ufw allow 80
sudo ufw allow 443

# 查看防火墙状态
sudo ufw status
```

## 监控和维护

### 查看应用日志

```bash
# Docker 部署
docker logs -f easyyoutube-backend

# 系统服务部署
sudo journalctl -u easyyoutube -f

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 系统资源监控

```bash
# 安装 htop
sudo apt install -y htop

# 监控系统资源
htop

# 查看磁盘使用情况
df -h

# 查看内存使用情况
free -h
```

### 备份和恢复

```bash
# 备份应用数据
tar -czf easyyoutube-backup-$(date +%Y%m%d).tar.gz /path/to/EasyYoutube

# 备份数据库（如果有）
# mysqldump -u username -p database_name > backup.sql
```

## 性能优化

### 1. 系统优化

```bash
# 增加文件描述符限制
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 2. 应用优化

```bash
# 使用 Gunicorn 作为 WSGI 服务器
pip install gunicorn

# 创建 Gunicorn 配置文件
cat > gunicorn.conf.py << EOF
bind = "0.0.0.0:8080"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
EOF

# 使用 Gunicorn 启动应用
gunicorn -c gunicorn.conf.py app:app
```

## 故障排除

### 常见问题

1. **OpenAI 客户端版本兼容性错误**
   ```bash
   # 错误信息：TypeError: Client.__init__() got an unexpected keyword argument 'proxies'
   # 解决方案：更新 OpenAI 包版本
   
   # 停止并删除旧容器
   docker stop easyyoutube-backend
   docker rm easyyoutube-backend
   
   # 重新构建镜像（使用更新的 requirements.txt）
   docker build -t easyyoutube-backend .
   # 或使用国内优化版本
   docker build -f Dockerfile.china -t easyyoutube-backend .
   
   # 重新运行容器
   docker run -d --name easyyoutube-backend -p 8080:8080 --env-file .env easyyoutube-backend
   ```

2. **端口被占用**
   ```bash
   sudo netstat -tlnp | grep :8080
   sudo kill -9 <PID>
   ```

3. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /path/to/EasyYoutube
   chmod +x /path/to/EasyYoutube/server/app.py
   ```

4. **依赖安装失败**
   ```bash
   sudo apt install -y python3.11-dev build-essential
   pip install --upgrade pip setuptools wheel
   ```

4. **内存不足**
   ```bash
   # 创建交换文件
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

## 安全建议

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置 fail2ban**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

3. **使用非 root 用户**
   ```bash
   sudo adduser easyyoutube
   sudo usermod -aG sudo easyyoutube
   ```

4. **配置 SSH 密钥认证**
   ```bash
   ssh-keygen -t rsa -b 4096
   ssh-copy-id user@server-ip
   ```

## 总结

该项目完全兼容 Ubuntu 系统，可以通过多种方式部署：

- ✅ **Docker 部署**：最简单，推荐用于生产环境
- ✅ **直接部署**：适合需要自定义配置的场景
- ✅ **Nginx 反向代理**：适合需要处理大量并发请求的场景

所有 Python 依赖都与 Ubuntu 系统兼容，项目使用的技术栈（Flask、yt-dlp、OpenAI SDK 等）都是跨平台的，在 Ubuntu 上运行没有任何问题。