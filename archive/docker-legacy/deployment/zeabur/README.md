# Zeabur 部署配置

本目录包含 Zeabur 平台的部署配置文件。

## 文件说明

- `zeabur.yaml` - Zeabur 服务定义配置
- `docker-compose.yml` - 本地测试用 Docker Compose 配置
- `README.md` - 本文件

## Zeabur 项目结构

### 管理后台项目（admin-panel）

```
Services:
- strapi-admin (Strapi 后台)
- postgres-admin (Strapi 数据库)
```

域名：`admin.yourdomain.com`

### 客户项目（tenant-c001, tenant-c002, ...）

每个客户一个独立项目：

```
Services:
- opencode-c001 (OpenCode 服务)
- postgres-c001 (客户数据库)

Volumes:
- workspace-c001 (客户工作空间)
```

域名：`c001.yourdomain.com`

## 部署步骤

### 1. 部署管理后台

1. 在 Zeabur 创建新项目：`admin-panel`
2. 添加 PostgreSQL 服务：`postgres-admin`
3. 添加 Strapi 服务，配置环境变量
4. 绑定域名：`admin.yourdomain.com`

### 2. 部署客户实例

使用 `create-tenant.sh` 脚本自动创建客户项目。

手动部署步骤：

1. 在 Zeabur 创建新项目：`tenant-c001`
2. 添加 PostgreSQL 服务：`postgres-c001`
3. 创建 Volume：`workspace-c001`
4. 添加 OpenCode 服务（使用自定义镜像）
5. 配置环境变量（参考 `env.template`）
6. 挂载 Volume 到 `/workspace`
7. 绑定域名：`c001.yourdomain.com`

## 环境变量配置

### OpenCode 服务必需变量

```env
TENANT_ID=c001
TENANT_NAME=客户名称
OPENCODE_SERVER_USERNAME=opencode
OPENCODE_SERVER_PASSWORD=strong_password
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
MODEL_PROVIDER=anthropic
MODEL_NAME=claude-3-5-sonnet-20241022
```

### Strapi 后台必需变量

```env
DATABASE_URL=postgresql://...
APP_KEYS=...
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
TRANSFER_TOKEN_SALT=...
JWT_SECRET=...
```

## 域名配置

在 Cloudflare 添加 DNS 记录：

```
A    admin    -> Zeabur IP
A    c001     -> Zeabur IP
A    c002     -> Zeabur IP
...
```

或使用 CNAME：

```
CNAME admin   -> admin-panel.zeabur.app
CNAME c001    -> tenant-c001.zeabur.app
CNAME c002    -> tenant-c002.zeabur.app
```

## 监控和维护

### 健康检查

每个 OpenCode 服务都提供健康检查端点：

```bash
curl https://c001.yourdomain.com/health
```

### 日志查看

在 Zeabur 控制台查看服务日志：

1. 进入项目
2. 选择服务
3. 查看 Logs 标签

### 备份策略

- **数据库备份**：Zeabur 自动备份 PostgreSQL
- **Volume 备份**：定期导出客户 workspace 数据
- **配置备份**：保存所有环境变量和配置

## 故障排查

### 服务无法启动

1. 检查环境变量是否完整
2. 查看服务日志
3. 验证数据库连接
4. 检查镜像版本

### 域名无法访问

1. 验证 DNS 解析
2. 检查域名绑定配置
3. 验证 SSL 证书状态
4. 检查 Cloudflare 代理设置

### 文件访问问题

1. 检查 Volume 挂载
2. 验证文件权限
3. 查看访问控制日志

## 成本优化

- 使用合适的服务规格（根据客户使用量）
- 定期清理不活跃客户的资源
- 归档旧数据到 R2（冷存储）
- 监控资源使用情况

## 扩展建议

### 当客户增长时

- 使用自动化开户脚本
- 实施监控和告警
- 建立客户分级管理
- 考虑多区域部署

### 性能优化

- 启用 CDN 缓存静态资源
- 优化数据库查询
- 实施任务队列
- 增加缓存层
