# AI 自媒体系统 SaaS 平台

> 版本：v1.0  
> 基于 OpenCode + Strapi + Zeabur 的 SaaS 产品化实现

## 项目结构

```
saas-platform/
├── portal/               # 路线 C 的客户门户（登录、导航、OpenCode 入口）
├── vendor/
│   └── opencode/         # 锁定到 v1.16.2 的 OpenCode 上游源码
├── strapi-backend/       # Strapi 运营后台
│   ├── schemas/          # 数据模型定义
│   ├── config/           # Strapi 配置
│   └── README.md         # 后台使用说明
├── deployment/           # 部署配置
│   └── env-templates/    # 环境变量模板
├── archive/
│   └── docker-legacy/    # 已归档的 Docker 封装链路与旧部署文档
├── scripts/              # 自动化脚本
│   ├── create-tenant.sh  # 客户开户脚本
│   ├── backup.sh         # 数据备份脚本
│   └── README.md         # 脚本使用说明
└── docs/                 # 文档
    ├── architecture.md   # 架构设计文档
    ├── deployment.md     # 部署指南
    ├── operation.md      # 运维手册
    └── customer-sop.md   # 客户开户SOP

```

## 核心架构

### 客户访问流程
```
[客户浏览器] → [客户门户 Portal] → [OpenCode Workbench] → [Zeabur Project]
```

### 运营者访问流程
```
[运营者浏览器] → [admin.yourdomain.com] → [Strapi Admin]
```

## 核心设计原则

1. **一客户一项目**：每个客户独立的 Zeabur 项目、数据库、Volume
2. **核心资产保护**：方法论、流程、提示词、skills 内置到镜像，客户不可见
3. **最小化代码**：优先使用开源方案和现成能力
4. **简化部署**：标准化的开户和部署流程

## 路线 C 当前实现

- 客户先登录 `portal/` 门户，而不是直接裸露 OpenCode 登录入口
- 门户当前采用“运营手动发号”的模式，不做自助注册，不做短信/邮箱验证码
- 门户提供中文导航、租户总览、项目中心、任务记录、文件资产和 OpenCode 工作台入口
- 门户已新增 6 个固定功能入口，并能创建标准化任务请求
- OpenCode 继续作为底层执行引擎，负责实际文件工作流与 Agent 执行

## 路线 B 当前进展

- 已将 OpenCode 上游源码纳入 `vendor/opencode`
- 当前锁定版本为 `v1.16.2`
- 当前以 `vendor/opencode/` 源码模式为主线
- 旧的 `opencode-service/` 与 `deployment/zeabur/` 已归档到 `archive/docker-legacy/`
- 排查 Zeabur 源码部署问题时，不再默认以 Docker 封装链路为依据

## 文件可见性策略

### 客户可见（/workspace/）
- `/workspace/users/<account-slug>/05-我方资料`
- `/workspace/users/<account-slug>/06-沉淀结论`
- `/workspace/users/<account-slug>/07-记录表`
- `/workspace/users/<account-slug>/08-对标账号`
- `/workspace/users/<account-slug>/09-对标内容`

### 系统私有（客户不可见）
- `vendor/opencode/meiling/assets/git/` - 核心资产（01-04目录、使用指南）
- `skills` / 方法论 / 提示词 / 系统内部目录
- 其他账号的 `/workspace/users/<other-account>/`

## 快速开始

### 部署 Strapi 后台
```bash
cd strapi-backend
npm install
npm run develop
```

### 启动 OpenCode 源码模式
```bash
cd saas-platform
AUTO_INSTALL_BUN=true bash scripts/bootstrap-opencode-source.sh

# 终端 1：源码后端
export DEEPSEEK_API_KEY=你的key
bash scripts/run-opencode-source-backend.sh

# 终端 2：源码前端
bash scripts/run-opencode-source-web.sh
```

### 构建并启动 OpenCode 生产二进制
```bash
cd saas-platform
bash scripts/build-opencode-binary.sh

# 运行阶段只启动编译产物
OPENCODE_PORT=4096 bash scripts/start-opencode-binary.sh
```

默认访问地址：

- 源码后端：`http://127.0.0.1:4300`
- 源码前端：`http://127.0.0.1:4444`
- 源码默认项目：`saas-platform` 根目录，可通过 `OPENCODE_DEFAULT_PROJECT_DIR` 覆盖

### 历史 Docker 链路

旧的 Docker 封装部署文件、Compose 配置和说明文档已移动到 `archive/docker-legacy/`，仅供追溯历史实现时参考。

### 启动客户门户
```bash
cd portal
cp .env.example .env.local
npm install
npm run dev
```

### 创建新客户
```bash
cd scripts
./create-tenant.sh c001 "客户名称"
```

## 环境要求

- Node.js 18+
- PostgreSQL 14+
- Zeabur 账号
- 域名（用于绑定客户子域名）

## 相关文档

- [产品方案](../saas产品方案.md) - 完整的产品设计规格
- [架构设计](docs/architecture.md) - 详细的架构说明
- [源码模式](docs/opencode-source-mode.md) - OpenCode 源码纳入与本地运行方式
- [历史 Docker 部署归档](archive/docker-legacy/docs/deployment.md) - 已归档的旧部署流程
- [运维手册](docs/operation.md) - 日常运维操作
- [上线清单](docs/production-readiness.md) - 正式上线前缺口和优先级

## 开发状态

- [x] 项目结构设计
- [x] 本地测试版一键部署
- [x] Workspace 访问控制测试链路
- [x] 路线 C 客户门户 MVP 骨架
- [x] OpenCode v1.16.2 源码纳入仓库
- [ ] 真实 OpenCode 生产链路验证
- [ ] 源码版 OpenCode 本地稳定运行验证
- [ ] 门户后端 API 与真实数据接入
- [ ] Strapi 后台工程落地
- [ ] 生产开户流程端到端验证
- [ ] 备份恢复演练

## 联系方式

内部项目 - 仅供团队使用
