# 客户门户 Portal

这是路线 C 的第一阶段门户层，实现目标是：

- 由运营手动创建账号并发给客户
- 客户通过门户登录，而不是直接暴露 OpenCode 登录入口
- 门户展示租户、项目、任务、文件资产概览
- 门户提供跳转 OpenCode 工作台的统一入口
- 门户提供固定功能入口，并生成标准化任务请求

## 本地运行

```bash
npm install
npm run dev
```

默认访问：`http://localhost:3000`

## 环境变量

复制 `.env.example` 到 `.env.local`，至少配置：

- `PORTAL_SESSION_SECRET`：门户登录 Cookie 的签名密钥
- `PORTAL_OPENCODE_URL`：默认 OpenCode 后端地址
- `PORTAL_OPENCODE_APP_URL`：默认 OpenCode 对话页地址
- `PORTAL_USERS_JSON`：手动发号账号列表，JSON 数组格式

## 演示账号

- 账号：`demo@aimedia.local`
- 密码：`Demo123456`

## 当前已实现的固定入口

- `账号诊断`
- `对标账号分析`
- `对标内容分析`
- `选题生成`
- `内容框架生成`
- `终稿优化`

这些入口当前会在门户中创建一条标准化任务请求，并进入任务记录页。下一步会继续把这些请求对接到底层 skill 或 workflow 执行层。

## 当前边界

- 不做自助注册
- 不做短信验证码
- 不做邮箱验证码
- 不做支付与计费
- 不做 OpenCode 前端改造，固定入口先在门户侧实现
- 不做真实后台 API，当前先使用本地种子数据和本地任务存储承接 UI
