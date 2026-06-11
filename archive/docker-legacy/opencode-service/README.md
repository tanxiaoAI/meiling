# OpenCode 服务

OpenCode 服务是客户使用的主要界面，基于 OpenCode Web 构建。

## 目录结构

```
opencode-service/
├── Dockerfile              # 镜像构建文件
├── .dockerignore          # Docker 忽略文件
├── config/                # 服务配置
│   └── opencode.config.js # OpenCode 配置文件
├── scripts/               # 启动脚本
│   ├── entrypoint.sh      # 容器入口脚本
│   └── init-workspace.sh  # 工作空间初始化脚本
└── README.md              # 本文件
```

## 核心设计

### 目录隔离

**客户可见目录**（/workspace/）：
- `inputs/` - 客户上传的输入文件
- `benchmark-accounts/` - 对标账号资料
- `benchmark-contents/` - 对标内容资料
- `outputs/` - 系统生成的输出
- `results/` - 分析结果

**系统私有目录**（客户不可见）：
- `/opt/core-assets/` - 核心资产（方法论、流程、提示词、skills）
- `/workspace-internal/` - 临时文件、缓存、日志

### 核心资产保护

核心资产在镜像构建时内置到 `/opt/core-assets/`，包括：
- `system/` - 01-系统层
- `methodology/` - 02-业务方法论
- `workflows/` - 03-执行流程
- `prompts/` - 04-提示词
- `skills/` - Claude 和 Trae skills

这些目录设置为只读，并且不会出现在客户的文件树中。

## 构建镜像

### 准备核心资产

首先，创建 `core-assets/` 目录并复制核心文件：

```bash
# 在 opencode-service 目录下
mkdir -p core-assets

# 复制核心资产（从主项目目录）
cp -r ../../skill文件/01-系统层 core-assets/01-系统层
cp -r ../../skill文件/02-业务方法论 core-assets/02-业务方法论
cp -r ../../skill文件/03-执行流程 core-assets/03-执行流程
cp -r ../../skill文件/04-提示词 core-assets/04-提示词
cp -r ../../skill文件/.claude core-assets/.claude
cp -r ../../skill文件/.trae core-assets/.trae
```

### 构建镜像

```bash
docker build -t ai-media-opencode:latest .
```

### 带版本号构建

```bash
docker build -t ai-media-opencode:v1.0.0 .
```

## 运行容器

### 基础运行

```bash
docker run -d \
  --name opencode-c001 \
  -p 3000:3000 \
  -e TENANT_ID=c001 \
  -e TENANT_NAME="客户001" \
  -e OPENCODE_SERVER_PASSWORD=secure_password \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e ANTHROPIC_API_KEY=your_api_key \
  -v /path/to/workspace:/workspace \
  ai-media-opencode:latest
```

### 使用环境变量文件

```bash
docker run -d \
  --name opencode-c001 \
  -p 3000:3000 \
  --env-file .env.c001 \
  -v opencode-c001-workspace:/workspace \
  ai-media-opencode:latest
```

## 环境变量

### 必需变量

- `TENANT_ID` - 租户 ID（如 c001）
- `OPENCODE_SERVER_PASSWORD` - 服务访问密码
- `DATABASE_URL` - PostgreSQL 数据库连接字符串
- `ANTHROPIC_API_KEY` - Anthropic API 密钥

### 可选变量

- `TENANT_NAME` - 租户显示名称（默认: Customer）
- `OPENCODE_SERVER_USERNAME` - 服务用户名（默认: opencode）
- `MODEL_PROVIDER` - AI 模型提供商（默认: anthropic）
- `MODEL_NAME` - AI 模型名称（默认: claude-3-5-sonnet-20241022）
- `PORT` - 服务端口（默认: 3000）
- `HOST` - 服务主机（默认: 0.0.0.0）
- `WORKSPACE_DIR` - 工作目录（默认: /workspace）
- `CORE_ASSETS_DIR` - 核心资产目录（默认: /opt/core-assets）
- `INTERNAL_DIR` - 内部目录（默认: /workspace-internal）

## 访问控制

### 文件访问规则

1. **客户可读写**：`/workspace/inputs/`
2. **客户只读**：`/workspace/benchmark-accounts/`, `/workspace/benchmark-contents/`, `/workspace/outputs/`, `/workspace/results/`
3. **客户不可见**：`/opt/core-assets/`, `/workspace-internal/`

### 安全限制

- 禁止访问 `.env`、`.key`、`.pem` 等敏感文件
- 禁止访问包含 `secret`、`private`、`credential` 关键词的文件
- 禁止访问 `.git` 目录

## 健康检查

容器包含健康检查端点：

```bash
curl http://localhost:3000/health
```

## 日志查看

```bash
# 查看容器日志
docker logs opencode-c001

# 实时跟踪日志
docker logs -f opencode-c001

# 查看最近 100 行日志
docker logs --tail 100 opencode-c001
```

## 故障排查

### 容器无法启动

1. 检查必需的环境变量是否设置
2. 检查端口是否被占用
3. 查看容器日志：`docker logs opencode-c001`

### 核心资产缺失

如果启动时提示核心资产不存在：
1. 确认构建镜像时已复制核心资产
2. 检查 `core-assets/` 目录是否完整
3. 重新构建镜像

### 工作空间权限问题

```bash
# 进入容器检查权限
docker exec -it opencode-c001 bash
ls -la /workspace
ls -la /opt/core-assets
```

## 升级流程

1. 构建新版本镜像
2. 停止旧容器：`docker stop opencode-c001`
3. 备份数据（如有必要）
4. 启动新容器，使用相同的 Volume
5. 验证服务正常运行

## 注意事项

- 核心资产内置在镜像中，更新需要重新构建镜像
- 每个客户使用独立容器和 Volume
- 不要在生产环境中使用 `latest` 标签，使用具体版本号
- 定期备份客户的 workspace 数据
