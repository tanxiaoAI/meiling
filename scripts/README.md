# AI 自媒体系统 - 自动化脚本说明

本目录包含用于部署、管理和维护 AI 自媒体系统 SaaS 的自动化脚本。

注意：当前主线以 `vendor/opencode` 源码模式为准，无 Docker 依赖。
注意：已经落地的 OpenCode 主线脚本包括源码模式脚本和生产二进制脚本；create-tenant.sh 已适配源码模式；标记为"规划中"的脚本尚未实现。

## 脚本列表

### 1. create-tenant.sh

**用途**：自动创建新客户租户

**用法**：
```bash
./create-tenant.sh <tenant_id> <tenant_name> [domain]
```

**示例**：
```bash
./create-tenant.sh c001 "客户公司名称" yourdomain.com
```

**功能**：
- 创建 Zeabur 项目
- 部署 PostgreSQL 数据库
- 创建 Volume 存储
- 部署 OpenCode 服务
- 配置环境变量
- 绑定域名
- 生成客户凭证

**输出**：
- 凭证文件：`credentials_<tenant_id>.txt`
- 日志记录：`tenant_creation_log.txt`

**环境变量**：
- `DEEPSEEK_API_KEY` 或 `ANTHROPIC_API_KEY` - 用于模型调用（可选，不设置也能部署但无法对话）

---

### 2. backup.sh

**用途**：备份客户数据

**用法**：
```bash
./backup.sh <tenant_id>
```

**示例**：
```bash
./backup.sh c001
```

**功能**：
- 备份 PostgreSQL 数据库
- 备份 Volume 工作空间
- 生成备份清单

**输出**：
- 备份目录：`./backups/<tenant_id>/`
- 数据库备份：`db_<timestamp>.sql`
- 工作空间备份：`workspace_<timestamp>.tar.gz`
- 备份清单：`backup_<timestamp>_manifest.txt`

---

### 3. build-opencode-binary.sh

**用途**：在部署阶段构建 OpenCode 生产二进制

**用法**：
```bash
bash scripts/build-opencode-binary.sh
```

**功能**：
- 安装 `packages/opencode` 与 `packages/app` 构建依赖
- 执行 `bun run --cwd packages/opencode build --single`
- 在 `vendor/opencode/packages/opencode/dist/.../bin/opencode` 产出二进制

---

### 4. start-opencode-binary.sh

**用途**：在运行阶段只启动已构建的 OpenCode 二进制

**用法**：
```bash
OPENCODE_PORT=4096 bash scripts/start-opencode-binary.sh
```

**功能**：
- 自动定位最近一次构建的 `opencode` 二进制
- 设置 `MEILING_WORKSPACE_ROOT` / `MEILING_DATA_ROOT`
- 直接执行 `opencode serve`

---

### 5. restore-tenant.sh

**用途**：恢复客户数据

**用法**：
```bash
./restore-tenant.sh <tenant_id> <backup_date>
```

**示例**：
```bash
./restore-tenant.sh c001 20260609
```

**功能**：
- 停止服务
- 恢复数据库
- 恢复工作空间
- 重启服务
- 验证健康状态

**注意**：
- 操作前会确认，避免误操作
- 自动备份当前数据

---

### 6. update-all-tenants.sh（规划中）

**用途**：批量更新所有租户到新版本

通过 Zeabur 重新部署或 Git push 触发，无需镜像版本号。

---

### 7. health-check.sh（规划中）

**用途**：检查所有租户服务健康状态


---

### 8. cleanup-temp.sh

**用途**：清理临时文件和缓存

**用法**：
```bash
./cleanup-temp.sh <tenant_id> [days]
```

**示例**：
```bash
# 清理 30 天前的临时文件
./cleanup-temp.sh c001 30
```

**功能**：
- 清理临时文件（temp/）
- 清理缓存（cache/）
- 清理旧日志（logs/）

---

### 9. archive-old-data.sh

**用途**：归档旧数据到 R2

**用法**：
```bash
./archive-old-data.sh --tenant <tenant_id> --days <days>
```

**示例**：
```bash
./archive-old-data.sh --tenant c001 --days 90
```

**功能**：
- 查找指定天数前的文件
- 上传到 Cloudflare R2
- 删除本地文件
- 更新文件索引

---

### 10. generate-report.sh

**用途**：生成使用报告

**用法**：
```bash
./generate-report.sh [month]
```

**示例**：
```bash
# 生成本月报告
./generate-report.sh

# 生成指定月份报告
./generate-report.sh 2026-05
```

**功能**：
- 统计 API 使用量
- 统计存储使用量
- 生成成本报告
- 导出为 CSV

---

## 使用前准备

### 安装依赖

```bash
# Zeabur CLI
npm install -g @zeabur/cli

# 验证安装
zeabur --version
```

### 配置认证

```bash
# 登录 Zeabur
zeabur login

# 设置 API 密钥（可选，仅 create-tenant.sh 需要）
export DEEPSEEK_API_KEY="sk-xxxxx"

# （可选）添加到 ~/.bashrc 或 ~/.zshrc
echo 'export DEEPSEEK_API_KEY="sk-xxxxx"' >> ~/.bashrc
```

### 设置权限

```bash
# 给所有脚本添加执行权限
chmod +x *.sh
```

## 最佳实践

### 1. 定时任务设置

```bash
# 编辑 crontab
crontab -e

# 添加以下任务
# 每 5 分钟健康检查
*/5 * * * * /path/to/scripts/health-check.sh

# 每天凌晨 2 点备份
0 2 * * * /path/to/scripts/backup-all.sh

# 每周日清理临时文件
0 3 * * 0 /path/to/scripts/cleanup-all.sh

# 每月 1 日生成报告
0 9 1 * * /path/to/scripts/generate-report.sh
```

### 2. 日志管理

所有脚本的日志都输出到标准输出和文件：

```bash
# 运行脚本并保存日志
./create-tenant.sh c001 "客户名称" 2>&1 | tee logs/create_c001_$(date +%Y%m%d).log
```

### 3. 错误处理

脚本使用 `set -e` 遇到错误自动退出。查看退出代码：

```bash
./create-tenant.sh c001 "客户名称"
echo $?  # 0 表示成功，非 0 表示失败
```

### 4. 批量操作

```bash
# 批量创建客户
cat customers.txt | while IFS=, read -r id name; do
  ./create-tenant.sh "$id" "$name"
  sleep 10  # 避免 API 限流
done

# 批量备份
for tenant in c001 c002 c003; do
  ./backup.sh "$tenant"
done
```

## 故障排查

### 脚本执行失败

1. **检查权限**：
   ```bash
   ls -la *.sh
   # 应该显示 -rwxr-xr-x
   ```

2. **检查依赖**：
   ```bash
   which zeabur
   echo $DEEPSEEK_API_KEY
   ```

3. **查看详细日志**：
   ```bash
   bash -x ./script.sh  # 调试模式
   ```

### Zeabur API 错误

常见错误码：
- `401` - 认证失败，重新登录 `zeabur login`
- `429` - 请求过快，添加延迟
- `500` - 服务器错误，稍后重试

### 网络问题

```bash
# 测试 Zeabur 连接
curl -I https://zeabur.com

# 测试域名解析
nslookup c001.yourdomain.com

# 测试服务健康
curl https://c001.yourdomain.com/health
```

## 安全建议

1. **保护敏感信息**：
   - 不要将 API 密钥硬编码在脚本中
   - 使用环境变量或密钥管理工具
   - 及时删除包含密码的凭证文件

2. **访问控制**：
   ```bash
   # 限制脚本目录权限
   chmod 700 scripts/
   
   # 限制凭证文件权限
   chmod 600 credentials_*.txt
   ```

3. **审计日志**：
   ```bash
   # 记录所有脚本执行
   ./script.sh 2>&1 | tee -a audit.log
   ```

## 扩展脚本

### 创建自定义脚本模板

```bash
#!/bin/bash
# 脚本名称和用途
set -e  # 遇到错误退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 参数检查
if [ $# -lt 1 ]; then
    log_error "用法: $0 <参数>"
    exit 1
fi

# 主逻辑
log_info "开始执行..."

# ... 你的代码 ...

log_info "执行完成"
```

## 贡献指南

如果你创建了新的有用脚本：

1. 遵循现有脚本的风格
2. 添加详细的注释
3. 更新本 README
4. 添加使用示例

## 相关文档

- [源码模式说明](../docs/opencode-source-mode.md)
- [生产就绪清单](../docs/production-readiness.md)
- [运维手册](../docs/operation.md)
- [客户开户 SOP](../docs/customer-sop.md)
