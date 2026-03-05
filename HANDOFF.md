# 项目交接说明书 (Project Handoff for CodeBuddy)

## 1. 项目简介
这是一个基于 **Next.js 16** 构建的家长账号分发系统。核心功能是让家长通过手机号登录（支持测试模式下的 666666 万能码），并根据后端算法自动分发学习账号。

## 2. 腾讯云迁移建议 (For CodeBuddy)

### 2.1 部署方式
建议部署到 **腾讯云 Lighthouse (轻量应用服务器)**。已经配置为支持外部 MySQL。

### 2.2 数据库 (MySQL)
- 连接逻辑位于 `src/lib/db.ts`。
- 本地开发使用 SQLite，公网部署请通过环境变量 `DB_TYPE=mysql` 切换。
- 需要在腾讯云 Lighthouse 或 CDB 中创建数据库 `companion_dist`。

### 2.3 必须填写的腾讯云 SDK 逻辑
以下 API 路由已预留抽象接口，请 CodeBuddy 协助填入腾讯云官方 SDK 调用逻辑：

- **验证码 (Captcha)**: `src/app/api/parent/send-code/route.ts` 
  - 接入：[腾讯云验证码 (Captcha)](https://cloud.tencent.com/document/product/1110)
  - 替换函数：`verifyTencentCaptcha`
- **短信 (SMS)**: `src/app/api/parent/send-code/route.ts`
  - 接入：[腾讯云短信 (SMS)](https://cloud.tencent.com/document/product/382)
  - 替换函数：`sendTencentSms`

## 3. 环境变量配置 (.env)
部署到腾讯云时，请在 Lighthouse 的控制台或 GitHub Actions 中设置以下变量：

```bash
# 数据库
DB_TYPE=mysql
MYSQL_HOST=your-tencent-cdb-dns (如果是内网部署请填内网IP)
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=companion_dist

# 腾讯云密钥 (由 CodeBuddy 用于初始化 SDK)
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
TENCENT_SMS_APP_ID=your_sms_app_id
TENCENT_SMS_SIGN=your_sms_sign
TENCENT_SMS_TEMPLATE_ID=your_template_id
```

## 4. 目录结构说明
- `/src/app/parent`: 家长登录与查询前端。
- `/src/app/admin`: 后台管理模块。
- `/src/lib/distribution.ts`: 核心账号轮询分发算法。
- `/src/lib/db.ts`: 数据库适配层。

---
*Antigravity (AG) 交付于 2026-03-05*
