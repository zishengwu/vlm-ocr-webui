FROM docker.1ms.run/node:18

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 设置环境变量
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 安装依赖并构建
# RUN npm config set registry https://registry.npmmirror.com
# RUN npm ci && npm run build

RUN npm install
RUN npm run build

# # 暴露端口
# EXPOSE 3000

# # 启动应用
CMD ["node", "server.js"]