@echo off
echo 正在启动 EasyYoutube 应用...

echo 启动后端服务...
start cmd /k "cd server && python app.py"

echo 等待后端服务启动...
timeout /t 5

echo 启动前端服务...
start cmd /k "npm run dev"

echo 应用启动完成！
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:5000