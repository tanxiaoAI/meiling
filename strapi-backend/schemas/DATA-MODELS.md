# Strapi 运营后台

Strapi 后台用于运营者管理客户、配额、任务记录等信息。

## 数据模型

### 1. Customer（客户）

客户基础信息和状态管理。

**字段：**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| tenantId | String | 是 | 租户 ID（如 c001），唯一标识 |
| name | String | 是 | 客户名称 |
| domain | String | 是 | 客户域名（如 c001.yourdomain.com） |
| status | Enum | 是 | 状态：active, suspended, expired |
| plan | String | 是 | 套餐类型：basic, pro, enterprise |
| quotaLimit | Integer | 是 | 配额限制（次数或容量） |
| quotaUsed | Integer | 是 | 已使用配额 |
| expiresAt | DateTime | 是 | 到期时间 |
| createdAt | DateTime | 自动 | 创建时间 |
| updatedAt | DateTime | 自动 | 更新时间 |
| notes | Text | 否 | 备注信息 |
| contactEmail | String | 否 | 联系邮箱 |
| contactPhone | String | 否 | 联系电话 |

**索引：**
- tenantId（唯一）
- domain（唯一）
- status
- expiresAt

---

### 2. TenantProject（租户项目）

记录每个客户的 Zeabur 部署信息。

**字段：**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| tenantId | String | 是 | 关联的租户 ID |
| zeaburProjectName | String | 是 | Zeabur 项目名称（如 tenant-c001） |
| zeaburProjectId | String | 否 | Zeabur 项目 ID |
| opencodeServiceName | String | 是 | OpenCode 服务名称 |
| postgresServiceName | String | 是 | PostgreSQL 服务名称 |
| volumeName | String | 否 | Volume 名称 |
| domain | String | 是 | 绑定的域名 |
| version | String | 是 | 镜像版本号 |
| deployStatus | Enum | 是 | 部署状态：deploying, running, stopped, error |
| deployedAt | DateTime | 否 | 部署时间 |
| lastHealthCheck | DateTime | 否 | 最后健康检查时间 |
| healthStatus | Enum | 否 | 健康状态：healthy, unhealthy, unknown |
| createdAt | DateTime | 自动 | 创建时间 |
| updatedAt | DateTime | 自动 | 更新时间 |

**关系：**
- belongsTo: Customer (tenantId)

**索引：**
- tenantId
- zeaburProjectName（唯一）
- deployStatus

---

### 3. TaskRecord（任务记录）

记录客户执行的所有任务。

**字段：**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| tenantId | String | 是 | 关联的租户 ID |
| taskId | String | 是 | 任务唯一 ID |
| taskType | Enum | 是 | 任务类型：account-analysis, content-analysis, topic-generation, content-production |
| status | Enum | 是 | 状态：pending, running, completed, failed |
| priority | Integer | 否 | 优先级（1-10） |
| startedAt | DateTime | 否 | 开始时间 |
| completedAt | DateTime | 否 | 完成时间 |
| duration | Integer | 否 | 执行时长（秒） |
| errorMessage | Text | 否 | 错误信息 |
| errorStack | Text | 否 | 错误堆栈 |
| inputSummary | JSON | 否 | 输入摘要 |
| outputSummary | JSON | 否 | 输出摘要 |
| resourceUsage | JSON | 否 | 资源使用情况（tokens, API调用次数等） |
| createdAt | DateTime | 自动 | 创建时间 |
| updatedAt | DateTime | 自动 | 更新时间 |

**关系：**
- belongsTo: Customer (tenantId)

**索引：**
- tenantId
- taskId（唯一）
- taskType
- status
- startedAt
- completedAt

---

### 4. FileRecord（文件记录）

索引客户的所有文件，便于管理和追踪。

**字段：**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| tenantId | String | 是 | 关联的租户 ID |
| fileId | String | 是 | 文件唯一 ID |
| fileName | String | 是 | 文件名 |
| fileType | Enum | 是 | 文件类型：input, benchmark-account, benchmark-content, output, result, temp |
| relativePath | String | 是 | 相对路径（相对于 workspace） |
| fullPath | String | 是 | 完整路径 |
| fileSize | Integer | 否 | 文件大小（字节） |
| mimeType | String | 否 | MIME 类型 |
| visibleToCustomer | Boolean | 是 | 客户是否可见 |
| downloadable | Boolean | 是 | 客户是否可下载 |
| editable | Boolean | 是 | 客户是否可编辑 |
| checksum | String | 否 | 文件校验和（MD5 或 SHA256） |
| metadata | JSON | 否 | 文件元数据 |
| relatedTaskId | String | 否 | 关联的任务 ID |
| archivedAt | DateTime | 否 | 归档时间（如果已归档到 R2） |
| archivedUrl | String | 否 | 归档 URL |
| createdAt | DateTime | 自动 | 创建时间 |
| updatedAt | DateTime | 自动 | 更新时间 |

**关系：**
- belongsTo: Customer (tenantId)
- belongsTo: TaskRecord (relatedTaskId, 可选)

**索引：**
- tenantId
- fileId（唯一）
- fileType
- visibleToCustomer
- createdAt

---

### 5. UsageLog（使用日志）

记录配额使用情况，用于计费和统计。

**字段：**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| tenantId | String | 是 | 关联的租户 ID |
| logType | Enum | 是 | 日志类型：task, storage, api-call |
| resourceType | String | 是 | 资源类型：tokens, api-calls, storage-mb |
| amount | Integer | 是 | 使用量 |
| relatedTaskId | String | 否 | 关联的任务 ID |
| timestamp | DateTime | 是 | 记录时间 |
| metadata | JSON | 否 | 额外信息 |

**关系：**
- belongsTo: Customer (tenantId)
- belongsTo: TaskRecord (relatedTaskId, 可选)

**索引：**
- tenantId
- logType
- timestamp

---

### 6. SystemConfig（系统配置）

全局系统配置项。

**字段：**

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| key | String | 是 | 配置键（唯一） |
| value | JSON | 是 | 配置值 |
| description | Text | 否 | 配置说明 |
| category | String | 否 | 配置分类 |
| updatedAt | DateTime | 自动 | 更新时间 |

**索引：**
- key（唯一）

---

## 数据模型关系图

```
Customer (1) ----< (N) TenantProject
    |
    +----< (N) TaskRecord
    |
    +----< (N) FileRecord
    |
    +----< (N) UsageLog

TaskRecord (1) ----< (N) FileRecord
TaskRecord (1) ----< (N) UsageLog
```

## 权限设计

### 角色定义

1. **Super Admin（超级管理员）**
   - 完全访问权限
   - 可以管理所有客户和系统配置

2. **Operator（运营人员）**
   - 可以查看和管理客户
   - 可以查看任务和文件记录
   - 不能修改系统配置

3. **Viewer（只读用户）**
   - 只能查看数据
   - 不能进行任何修改操作

### 权限矩阵

| 资源 | Super Admin | Operator | Viewer |
|------|-------------|----------|--------|
| Customer | CRUD | CRUD | R |
| TenantProject | CRUD | CRUD | R |
| TaskRecord | CRUD | R | R |
| FileRecord | CRUD | R | R |
| UsageLog | CRUD | R | R |
| SystemConfig | CRUD | R | - |

## API 端点设计

### Customer API

```
GET    /api/customers              # 获取客户列表
GET    /api/customers/:id          # 获取客户详情
POST   /api/customers              # 创建客户
PUT    /api/customers/:id          # 更新客户信息
DELETE /api/customers/:id          # 删除客户
POST   /api/customers/:id/suspend  # 暂停客户
POST   /api/customers/:id/resume   # 恢复客户
```

### TenantProject API

```
GET    /api/tenant-projects                    # 获取项目列表
GET    /api/tenant-projects/:id                # 获取项目详情
POST   /api/tenant-projects                    # 创建项目
PUT    /api/tenant-projects/:id                # 更新项目
DELETE /api/tenant-projects/:id                # 删除项目
POST   /api/tenant-projects/:id/health-check   # 执行健康检查
```

### TaskRecord API

```
GET    /api/task-records                   # 获取任务列表
GET    /api/task-records/:id               # 获取任务详情
GET    /api/task-records/tenant/:tenantId  # 获取指定租户的任务
POST   /api/task-records                   # 创建任务记录
PUT    /api/task-records/:id               # 更新任务状态
```

### FileRecord API

```
GET    /api/file-records                   # 获取文件列表
GET    /api/file-records/:id               # 获取文件详情
GET    /api/file-records/tenant/:tenantId  # 获取指定租户的文件
POST   /api/file-records                   # 创建文件记录
PUT    /api/file-records/:id               # 更新文件信息
DELETE /api/file-records/:id               # 删除文件记录
```

## 使用说明

详细的 Strapi 配置和使用说明请参考 `strapi-backend/README.md`。
