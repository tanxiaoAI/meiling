# 本地测试部署指南

## 快速开始

由于 OpenCode 的具体镜像和启动方式需要根据实际情况调整，我们先创建一个简化的测试版本。

### 步骤 1：准备核心资产

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform/opencode-service

# 创建核心资产目录
mkdir -p core-assets

# 复制核心文件
cp -r ../../skill文件/01-系统层 core-assets/
cp -r ../../skill文件/02-业务方法论 core-assets/
cp -r ../../skill文件/03-执行流程 core-assets/
cp -r ../../skill文件/04-提示词 core-assets/

# 验证文件已复制
ls -la core-assets/
```

### 步骤 2：创建测试用 Dockerfile

由于我们需要验证核心逻辑（访问控制、目录隔离等），我创建了一个基于 Node.js 的测试版本：

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform
```

### 步骤 3：启动测试环境

```bash
# 设置 API 密钥
export ANTHROPIC_API_KEY="your-api-key"

# 启动服务
cd deployment/zeabur
docker-compose up -d

# 查看日志
docker-compose logs -f opencode
```

### 步骤 4：验证部署

```bash
# 测试数据库
docker-compose exec postgres psql -U testuser -d testdb -c "SELECT version();"

# 测试 OpenCode 服务（等待启动后）
curl http://localhost:3000/health

# 查看工作空间
docker-compose exec opencode ls -la /workspace
docker-compose exec opencode ls -la /opt/core-assets

# 测试访问控制
docker-compose exec opencode node /app/config/test-access-control.js
```

### 步骤 5：停止和清理

```bash
# 停止服务
docker-compose down

# 清理数据（可选）
docker-compose down -v
```

## 当前限制

由于 OpenCode 的实际实现细节未知，当前版本主要用于验证：
1. ✅ Dockerfile 构建逻辑
2. ✅ 核心资产内置
3. ✅ 目录结构创建
4. ✅ 访问控制逻辑
5. ✅ 环境变量配置
6. ⏳ OpenCode Web 界面（需要实际的 OpenCode 镜像）

## 下一步

1. **获取 OpenCode 镜像信息**：
   - 确认 OpenCode 的实际镜像名称
   - 了解 OpenCode 的启动命令
   - 确认 OpenCode 的配置方式

2. **调整 Dockerfile**：
   - 使用正确的基础镜像
   - 调整启动命令
   - 配置 OpenCode 特定参数

3. **完整测试**：
   - 测试 Web 界面
   - 测试文件上传
   - 测试 AI 功能
