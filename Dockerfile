FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建阶段创建 data 目录，避免 next build 时 db.ts 找不到目录报错
RUN mkdir -p /app/data

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# tencentcloud-sdk-nodejs 含原生扩展，standalone output tracing 无法自动追踪，需手动复制
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/tencentcloud-sdk-nodejs ./node_modules/tencentcloud-sdk-nodejs

# 数据库通过 Docker Volume 挂载持久化，不打包进镜像
# 运行时挂载：-v /data/banxue:/app/data
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
# 关键修复：必须修改 /app 目录的所有权，否则 SQLite 无法创建临时文件
RUN chown nextjs:nodejs /app

# 启动脚本：确保 data 目录存在后再启动 node
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "entrypoint.sh"]
