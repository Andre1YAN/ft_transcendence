# back-end/Dockerfile

FROM node:18

WORKDIR /app

# 安装依赖前先只复制 package.json 相关文件，提升构建缓存命中率
COPY package*.json ./

RUN npm install

COPY .env .env

# 复制所有源代码（包括 Prisma schema）
COPY . .
COPY prisma ./prisma

# 编译 TypeScript → dist/
RUN npx tsc

# 生成 Prisma Client
RUN npx prisma generate

# 自动同步 schema 到 SQLite（可选）
# RUN npx prisma db push

CMD ["node", "dist/server.js"]
