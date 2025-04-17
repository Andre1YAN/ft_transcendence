# front-end/Dockerfile

# 🧱 Build 阶段：使用 node 构建 Vite 项目
FROM node:18 AS builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# 🚀 Serve 阶段：用 nginx 提供静态文件
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
