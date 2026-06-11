# AI 自媒体系统 SaaS - 部署指南

> 版本：v1.0  
> 更新日期：2026-06-09

## 1. 部署前准备

### 1.1 必需账号和工具

**账号准备**：
- Zeabur 账号（https://zeabur.com）
- Cloudflare 账号（用于域名管理）
- Anthropic API 密钥（https://console.anthropic.com）
- GitHub/GitLab 账号（用于代码托管）

**本地工具**：
```bash
# 安装 Node.js 18+
node --version  # 确认版本 >= 18

# 安装 Docker
docker --version  # 确认已安装

# 安装 Zeabur CLI
npm install -g @zeabur/cli
zeabur --version

# 安装 Git
git --version
```

### 1.2 域名配置

在 Cloudflare 添加你的域名，并准备以下子域名：

- `admin.yourdomain.com` - Strapi 后台
- `c001.yourdomain.com` - 客户 001
- `c002.yourdomain.com` - 客户 002
- ...

## 2. 构建 OpenCode 镜像

### 2.1 准备核心资产

```bash
cd saas-platform/opencode-service

# 创建核心资产目录
mkdir -p core-assets

# 从主项目复制核心文件
# 注意：根据你的实际路径调整
cp -r ../../skill文件/01-系统层 core-assets/01-系统层
cp -r ../../skill文件/02-业务方法论 core-assets/02-业务方法论
cp -r ../../skill文件/03-执行流程 core-assets/03-执行流程
cp -r ../../skill文件/04-提示词 core-assets/04-提示词
cp -r ../../skill文件/.claude core-assets/.claude
cp -r ../../skill文件/.trae core-assets/.trae

# 验证文件已复制
ls -la core-assets/
```

### 2.2 构建镜像

```bash
# 构建镜像
docker build -t ai-media-opencode:v1.0.0 .

# 验证镜像
docker images | grep ai-media-opencode

# 测试镜像（可选）
docker run --rm ai-media-opencode:v1.0.0 ls -la /opt/core-assets
```

### 2.3 推送镜像到仓库

```bash
# 登录到你的容器仓库（Docker Hub, GitHub Container Registry 等）
docker login

# 打标签
docker tag ai-media-opencode:v1.0.0 your-registry/ai-media-opencode:v1.0.0
docker tag ai-media-opencode:v1.0.0 your-registry/ai-media-opencode:latest

# 推送
docker push your-registry/ai-media-opencode:v1.0.0
docker push your-registry/ai-media-opencode:latest
```

## 3. 部署 Strapi 后台

### 3.1 创建 Strapi 项目

```bash
# 在 Zeabur 创建项目
zeabur project create --name admin-panel

# 添加 PostgreSQL 服务
zeabur service create \
  --project admin-panel \
  --name postgres-admin \
  --type postgresql \
  --version 14
```

### 3.2 部署 Strapi

```bash
# 进入 Strapi 后台目录
cd saas-platform/strapi-backend

# 生成密钥
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # APP_KEYS
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # API_TOKEN_SALT
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # ADMIN_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # TRANSFER_TOKEN_SALT
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # JWT_SECRET

# 创建 Strapi 服务
zeabur service create \
  --project admin-panel \
  --name strapi-admin \
  --type git \
  --repo your-repo-url

# 配置环境变量（在 Zeabur 控制台或通过 CLI）
zeabur env set \
  --project admin-panel \
  --service strapi-admin \
  HOST=0.0.0.0 \
  PORT=1337 \
  APP_KEYS="key1,key2,key3,key4" \
  API_TOKEN_SALT="your_salt" \
  ADMIN_JWT_SECRET="your_secret" \
  TRANSFER_TOKEN_SALT="your_salt" \
  JWT_SECRET="your_secret" \
  DATABASE_CLIENT=postgres \
  DATABASE_URL='${POSTGRES_URL}' \
  NODE_ENV=production
```

### 3.3 绑定域名

```bash
# 绑定域名到 Strapi 服务
zeabur domain add \
  --project admin-panel \
  --service strapi-admin \
  --domain admin.yourdomain.com
```

### 3.4 初始化 Strapi

1. 访问 `https://admin.yourdomain.com`
2. 创建管理员账号
3. 配置数据模型（参考 `strapi-backend/schemas/DATA-MODELS.md`）

## 4. 部署第一个客户实例

### 4.1 使用自动化脚本

```bash
cd saas-platform/scripts

# 设置环境变量
export DEEPSEEK_API_KEY="sk-xxxxx"
export OPENCODE_IMAGE="ghcr.io/your-org/ai-media-opencode:v1.0.0"

# 执行开户脚本
./create-tenant.sh c001 "测试客户公司" yourdomain.com
```

脚本会自动完成以下操作：
1. 创建 Zeabur 项目 `tenant-c001`
2. 部署 PostgreSQL 服务
3. 创建 Volume
4. 部署 OpenCode 服务
5. 配置环境变量
6. 绑定域名
7. 生成客户凭证文件

### 4.2 手动部署（如果脚本失败）

#### 步骤 1：创建项目和数据库

```bash
# 创建项目
zeabur project create --name tenant-c001

# 添加 PostgreSQL
zeabur service create \
  --project tenant-c001 \
  --name postgres-c001 \
  --type postgresql \
  --version 14

# 配置数据库
zeabur env set \
  --project tenant-c001 \
  --service postgres-c001 \
  POSTGRES_DB=ai_media_c001 \
  POSTGRES_USER=ai_media_user \
  POSTGRES_PASSWORD="生成的密码"
```

#### 步骤 2：创建 Volume

```bash
zeabur volume create \
  --project tenant-c001 \
  --name workspace-c001 \
  --size 10GB
```

#### 步骤 3：部署 OpenCode 服务

```bash
# 创建服务
zeabur service create \
  --project tenant-c001 \
  --name opencode-c001 \
  --type docker \
  --image your-registry/ai-media-opencode:latest \
  --port 3000

# 配置环境变量
zeabur env set \
  --project tenant-c001 \
  --service opencode-c001 \
  TENANT_ID=c001 \
  TENANT_NAME="测试客户" \
  OPENCODE_SERVER_USERNAME=opencode \
  OPENCODE_SERVER_PASSWORD="生成的密码" \
  DATABASE_URL='postgresql://ai_media_user:密码@postgres-c001:5432/ai_media_c001' \
  ANTHROPIC_API_KEY="sk-ant-xxxxx" \
  MODEL_PROVIDER=anthropic \
  MODEL_NAME=claude-3-5-sonnet-20241022 \
  NODE_ENV=production

# 挂载 Volume
zeabur volume attach \
  --project tenant-c001 \
  --service opencode-c001 \
  --volume workspace-c001 \
  --mount-path /workspace

# 绑定域名
zeabur domain add \
  --project tenant-c001 \
  --service opencode-c001 \
  --domain c001.yourdomain.com
```

## 5. 验证部署

### 5.1 检查服务状态

```bash
# 检查项目状态
zeabur project list

# 检查服务状态
zeabur service list --project tenant-c001

# 查看服务日志
zeabur logs --project tenant-c001 --service opencode-c001 --tail 100
```

### 5.2 测试访问

```bash
# 测试健康检查
curl https://c001.yourdomain.com/health

# 预期输出：{"status":"ok","tenant":"c001"}
```

### 5.3 客户登录测试

1. 访问 `https://c001.yourdomain.com`
2. 使用生成的用户名和密码登录
3. 验证文件树只显示 `/workspace/` 目录
4. 验证核心资产不可见
5. 测试文件上传到 `inputs/` 目录

## 6. 配置 DNS

### 6.1 Cloudflare 设置

在 Cloudflare DNS 管理中添加记录：

```
类型    名称    内容                           代理状态
CNAME   admin   admin-panel.zeabur.app        已代理
CNAME   c001    tenant-c001.zeabur.app        已代理
CNAME   c002    tenant-c002.zeabur.app        已代理
```

### 6.2 SSL/TLS 配置

1. 进入 Cloudflare SSL/TLS 设置
2. 选择 "完全(严格)" 加密模式
3. 启用 "自动 HTTPS 重写"
4. 启用 "始终使用 HTTPS"

## 7. 监控设置

### 7.1 Zeabur 监控

在 Zeabur 控制台：
1. 进入项目设置
2. 启用监控和告警
3. 配置通知渠道（邮件/Slack）

### 7.2 健康检查

设置定时任务检查服务健康：

```bash
# 创建监控脚本
cat > monitor.sh << 'EOF'
#!/bin/bash
curl -f https://c001.yourdomain.com/health || \
  echo "Service c001 is down!" | mail -s "Alert" admin@yourdomain.com
EOF

chmod +x monitor.sh

# 添加到 crontab（每 5 分钟检查一次）
crontab -e
# 添加：*/5 * * * * /path/to/monitor.sh
```

## 8. 备份配置

### 8.1 自动备份

Zeabur PostgreSQL 提供自动备份，保留 7 天。

### 8.2 手动备份

```bash
# 使用备份脚本
cd saas-platform/scripts
./backup.sh c001

# 备份文件保存在 ./backups/c001/
```

### 8.3 备份策略

- **每日备份**：自动（Zeabur）
- **每周完整备份**：手动导出到本地
- **每月归档**：上传到 R2 或 S3

## 9. 故障排查

### 9.1 常见问题

#### 服务无法启动

```bash
# 查看日志
zeabur logs --project tenant-c001 --service opencode-c001 --tail 200

# 检查环境变量
zeabur env list --project tenant-c001 --service opencode-c001

# 检查镜像
docker pull your-registry/ai-media-opencode:latest
```

#### 域名无法访问

```bash
# 检查 DNS 解析
nslookup c001.yourdomain.com

# 检查域名绑定
zeabur domain list --project tenant-c001

# 检查 SSL 证书
curl -vI https://c001.yourdomain.com
```

#### 数据库连接失败

```bash
# 进入容器检查
zeabur exec --project tenant-c001 --service opencode-c001 -- bash
# 在容器内
psql $DATABASE_URL -c "SELECT 1"
```

### 9.2 紧急回滚

```bash
# 回滚到上一个镜像版本
zeabur service update \
  --project tenant-c001 \
  --service opencode-c001 \
  --image your-registry/ai-media-opencode:v1.0.0
```

## 10. 扩展部署

### 10.1 批量创建客户

```bash
# 准备客户列表
cat > customers.txt << EOF
c002,客户二公司
c003,客户三公司
c004,客户四公司
EOF

# 批量创建
while IFS=, read -r id name; do
  ./create-tenant.sh "$id" "$name" yourdomain.com
  sleep 10  # 避免 API 限流
done < customers.txt
```

### 10.2 更新所有客户实例

```bash
# 创建更新脚本
cat > update-all-tenants.sh << 'EOF'
#!/bin/bash
for project in $(zeabur project list | grep tenant- | awk '{print $1}'); do
  echo "Updating $project..."
  zeabur service update \
    --project "$project" \
    --service "opencode-${project#tenant-}" \
    --image your-registry/ai-media-opencode:latest
done
EOF

chmod +x update-all-tenants.sh
```

## 11. 下一步

部署完成后：

1. ✓ 登录 Strapi 后台，登记客户信息
2. ✓ 将客户凭证发送给客户
3. ✓ 设置监控和告警
4. ✓ 配置定期备份
5. ✓ 阅读[运维手册](operation.md)了解日常维护

## 12. 参考资料

- [Zeabur 文档](https://docs.zeabur.com)
- [OpenCode 文档](https://docs.opencode.ai)
- [Strapi 文档](https://docs.strapi.io)
- [架构设计文档](architecture.md)
