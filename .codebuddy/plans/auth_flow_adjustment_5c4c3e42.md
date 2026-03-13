---
name: auth_flow_adjustment
overview: 调整家长端登录逻辑：暂时移除短信逻辑，改用“账号（手机号）+密码+腾讯图形验证码”的注册和登录模式。
todos:
  - id: db-schema-update
    content: 更新 src/lib/db.ts 在 parents 表中增加 password_hash 字段并安装 bcryptjs
    status: completed
  - id: captcha-util
    content: 创建 src/lib/captcha.ts 提取腾讯云验证码校验逻辑为公共函数
    status: completed
  - id: parent-api-register
    content: 实现 /api/parent/register 接口，支持手机号注册与密码加密存储
    status: completed
    dependencies:
      - db-schema-update
      - captcha-util
  - id: parent-api-login
    content: 实现 /api/parent/login 接口，支持手机号密码校验并分配伴学账号
    status: completed
    dependencies:
      - db-schema-update
      - captcha-util
  - id: parent-ui-refactor
    content: 重构 src/app/parent/page.tsx 增加登录/注册切换、密码框及验证码调用
    status: completed
    dependencies:
      - parent-api-register
      - parent-api-login
  - id: deploy-tencent-cloud
    content: 使用 [integration:lighthouse] 或 [integration:eop] 将项目部署至腾讯云公网环境
    status: completed
    dependencies:
      - parent-ui-refactor
---

## 用户需求

由于短信备案流程较长，用户决定将原有的短信验证码登录流程改为“手机号 + 密码 + 腾讯云图形验证码”模式，以实现快速上线。

## 核心功能

- **账号注册**：家长输入手机号、设置密码并完成腾讯图形验证码校验后进行注册，注册成功后自动登录并分配伴学账号。
- **账号登录**：已注册家长输入手机号、密码并完成图形验证码校验后登录，查看已分配的伴学账号。
- **腾讯云集成**：保留并强化腾讯图形验证码（Captcha）的安全校验，移除短信相关逻辑。
- **公网部署**：将项目部署至腾讯云，确保在中国大陆环境正常访问。

## 技术栈

- **后端**: Next.js API Routes, `bcryptjs` (密码加密)
- **数据库**: SQLite (本地/开发), MySQL (腾讯云生产环境)
- **安全**: 腾讯云图形验证码 (Tencent Cloud Captcha)
- **部署**: 腾讯云轻量应用服务器 (Lighthouse) 或 EdgeOne Pages (EOP)

## 架构设计

- **数据库设计**: 在 `parents` 表中新增 `password_hash` 字段，存储加密后的用户密码。
- **安全校验**: 注册与登录接口均强制进行腾讯云图形验证码服务端校验，防止撞库和暴力破解。
- **账号分配**: 登录或注册成功后，调用现有的轮询逻辑 (`getAssignedAccount`) 为用户分配或获取已分配账号。

## 目录结构修改

```
src/
├── lib/
│   ├── db.ts           # [MODIFY] 更新 parents 表结构，增加 password_hash 字段
│   └── captcha.ts      # [NEW] 提取腾讯云验证码校验公共函数
├── app/
│   ├── api/
│   │   └── parent/
│   │       ├── register/
│   │       │   └── route.ts # [NEW] 家长注册接口
│   │       └── login/
│   │           └── route.ts # [NEW] 家长登录接口 (替换原来的 get-account)
│   └── parent/
│       └── page.tsx    # [MODIFY] 重构前端页面，支持登录/注册切换及密码输入
```