# 🧱 第一阶段：构建前端
FROM node:18 AS frontend-builder
WORKDIR /app/front
COPY front-end/package*.json ./
RUN npm install
COPY front-end/ .
RUN npm run build

# 🧱 第二阶段：构建后端
FROM node:18-slim AS backend-builder
RUN apt-get update && apt-get install -y openssl
WORKDIR /app
COPY back-end/package*.json ./
RUN npm install
COPY back-end/tsconfig.json ./
COPY back-end/prisma ./prisma
COPY back-end/src ./src
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npx tsc -p ./tsconfig.json

# 🚀 最终阶段：运行后端 + 服务前端
FROM node:18-slim
RUN apt-get update && apt-get install -y openssl
WORKDIR /app

# 拷贝后端
COPY --from=backend-builder /app .

# 拷贝前端构建产物
COPY --from=frontend-builder /app/front/dist ./public

# Fastify 静态服务会使用 ./public
CMD ["node", "dist/server.js"]
