# AI 自媒体系统 SaaS - 运维手册

> 版本：v1.0  
> 更新日期：2026-06-09

## 1. 日常运维任务

### 1.1 每日检查清单

**服务健康检查**：
```bash
# 检查所有租户项目状态
zeabur project list

# 检查特定租户服务
zeabur service list --project tenant-c001

# 查看最近的日志
zeabur logs --project tenant-c001 --service opencode-c001 --tail 50
```

**监控指标检查**：
- CPU 使用率 < 80%
- 内存使用率 < 85%
- 磁盘使用率 < 80%
- API 响应时间 < 2秒
- 错误率 < 1%

**备份验证**：
```bash
# 检查最近的备份
ls -lh backups/*/

# 验证备份文件完整性
for tenant in c001 c002 c003; do
  echo "Checking $tenant..."
  ls -lh backups/$tenant/ | tail -3
done
```

### 1.2 每周任务

**完整备份**：
```bash
# 备份所有活跃租户
cd saas-platform/scripts
for tenant in $(zeabur project list | grep tenant- | sed 's/tenant-//'); do
  ./backup.sh $tenant
done
```

**性能分析**：
- 查看数据库慢查询日志
- 分析 API 调用统计
- 检查存储空间增长趋势

**安全更新**：
- 检查依赖包更新
- 应用安全补丁
- 更新 SSL 证书（如需要）

### 1.3 每月任务

**容量规划**：
- 评估资源使用趋势
- 预测未来 3 个月需求
- 规划扩容计划

**成本分析**：
- 计算每客户成本
- 分析不同套餐的利润率
- 优化资源配置

**数据归档**：
```bash
# 归档 90 天前的数据到 R2
cd saas-platform/scripts
./archive-old-data.sh --days 90
```

## 2. 客户管理

### 2.1 新客户开户

使用自动化脚本：

```bash
cd saas-platform/scripts

# 开户
./create-tenant.sh c005 "新客户公司" yourdomain.com

# 验证部署
curl https://c005.yourdomain.com/health

# 在 Strapi 后台登记信息
# 访问 https://admin.yourdomain.com
# 添加客户记录：
#   - tenantId: c005
#   - name: 新客户公司
#   - domain: c005.yourdomain.com
#   - status: active
#   - plan: basic
#   - quotaLimit: 1000
#   - expiresAt: (设置到期日)
```

### 2.2 客户续费

```bash
# 在 Strapi 后台更新到期时间
# 如果客户升级套餐，同时更新配额和资源
zeabur service update \
  --project tenant-c005 \
  --service opencode-c005 \
  --cpu 4 \
  --memory 8G
```

### 2.3 暂停客户

```bash
# 方式 1：停止服务
zeabur service stop \
  --project tenant-c005 \
  --service opencode-c005

# 方式 2：修改密码（客户无法登录）
zeabur env set \
  --project tenant-c005 \
  --service opencode-c005 \
  OPENCODE_SERVER_PASSWORD="suspended"

# 在 Strapi 更新状态为 suspended
```

### 2.4 恢复客户

```bash
# 方式 1：启动服务
zeabur service start \
  --project tenant-c005 \
  --service opencode-c005

# 方式 2：恢复密码
zeabur env set \
  --project tenant-c005 \
  --service opencode-c005 \
  OPENCODE_SERVER_PASSWORD="原密码"

# 在 Strapi 更新状态为 active
```

### 2.5 删除客户

**谨慎操作！数据不可恢复！**

```bash
# 1. 先备份数据
./backup.sh c005

# 2. 在 Strapi 标记为已删除（不要直接删除记录）
# status: deleted
# deletedAt: 当前时间

# 3. 等待 30 天后，如客户未要求恢复，删除项目
zeabur project delete --name tenant-c005 --confirm
```

## 3. 监控和告警

### 3.1 服务监控

**健康检查脚本**：

```bash
#!/bin/bash
# /opt/monitoring/health-check.sh

TENANTS="c001 c002 c003"
DOMAIN="yourdomain.com"
ALERT_EMAIL="admin@yourdomain.com"

for tenant in $TENANTS; do
  url="https://${tenant}.${DOMAIN}/health"
  
  if ! curl -f -s --max-time 10 "$url" > /dev/null; then
    echo "ALERT: $tenant is down!" | \
      mail -s "[CRITICAL] Tenant $tenant Down" "$ALERT_EMAIL"
  fi
done
```

**设置 Cron**：
```bash
# 每 5 分钟检查一次
*/5 * * * * /opt/monitoring/health-check.sh
```

### 3.2 资源监控

**CPU 和内存监控**：

```bash
# 查看服务资源使用
zeabur metrics --project tenant-c001 --service opencode-c001

# 设置告警阈值
zeabur alert create \
  --project tenant-c001 \
  --service opencode-c001 \
  --metric cpu \
  --threshold 80 \
  --notification-email admin@yourdomain.com
```

### 3.3 日志监控

**错误日志告警**：

```bash
#!/bin/bash
# /opt/monitoring/error-monitor.sh

for project in $(zeabur project list | grep tenant- | awk '{print $1}'); do
  service="opencode-${project#tenant-}"
  
  # 检查最近 5 分钟的错误日志
  errors=$(zeabur logs \
    --project "$project" \
    --service "$service" \
    --since "5m" | grep -i "error" | wc -l)
  
  if [ "$errors" -gt 10 ]; then
    echo "High error rate detected in $project: $errors errors" | \
      mail -s "[WARNING] High Error Rate" admin@yourdomain.com
  fi
done
```

### 3.4 配额监控

**API 使用量监控**：

```bash
# 查询数据库获取使用量
psql $STRAPI_DATABASE_URL << EOF
SELECT 
  tenant_id,
  SUM(amount) as total_usage,
  quota_limit
FROM usage_logs 
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY tenant_id, quota_limit
HAVING SUM(amount) > quota_limit * 0.8;
EOF
```

## 4. 性能优化

### 4.1 数据库优化

**定期维护**：

```bash
# 连接到租户数据库
psql $DATABASE_URL << EOF

-- 更新统计信息
ANALYZE;

-- 清理死元组
VACUUM;

-- 重建索引
REINDEX DATABASE ai_media_c001;

-- 查看表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

EOF
```

**慢查询分析**：

```bash
# 启用慢查询日志
psql $DATABASE_URL << EOF
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1秒
SELECT pg_reload_conf();
EOF

# 查看慢查询
tail -f /var/log/postgresql/postgresql-*.log | grep "duration"
```

### 4.2 存储优化

**清理临时文件**：

```bash
# 进入容器
zeabur exec --project tenant-c001 --service opencode-c001 -- bash

# 清理 30 天前的临时文件
find /workspace-internal/temp -type f -mtime +30 -delete
find /workspace-internal/cache -type f -mtime +7 -delete

# 清理日志
find /workspace-internal/logs -type f -mtime +90 -delete
```

**归档旧数据**：

```bash
#!/bin/bash
# 归档 90 天前的输出文件到 R2

TENANT_ID=$1
R2_BUCKET="ai-media-archive"
ARCHIVE_DIR="/workspace/outputs"

# 查找旧文件
find $ARCHIVE_DIR -type f -mtime +90 | while read file; do
  # 上传到 R2
  aws s3 cp "$file" "s3://$R2_BUCKET/$TENANT_ID/" \
    --endpoint-url https://your-r2-endpoint
  
  # 删除本地文件
  rm "$file"
done
```

### 4.3 缓存优化

**配置 Redis 缓存**（可选）：

```bash
# 添加 Redis 服务
zeabur service create \
  --project tenant-c001 \
  --name redis-c001 \
  --type redis

# 更新 OpenCode 环境变量
zeabur env set \
  --project tenant-c001 \
  --service opencode-c001 \
  REDIS_URL='redis://redis-c001:6379'
```

## 5. 安全管理

### 5.1 访问控制

**定期轮换密码**：

```bash
# 生成新密码
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# 更新服务密码
zeabur env set \
  --project tenant-c001 \
  --service opencode-c001 \
  OPENCODE_SERVER_PASSWORD="$NEW_PASSWORD"

# 通知客户更新
echo "新密码: $NEW_PASSWORD" | mail -s "密码已更新" customer@example.com
```

**审计日志**：

```bash
# 查看登录日志
zeabur logs \
  --project tenant-c001 \
  --service opencode-c001 \
  --filter "login" \
  --since "24h"

# 导出审计日志
zeabur logs \
  --project tenant-c001 \
  --service opencode-c001 \
  --since "7d" > audit_c001_$(date +%Y%m%d).log
```

### 5.2 安全更新

**更新依赖包**：

```bash
# 当前主线优先更新源码模式对应的仓库内容和 Zeabur 自定义命令
# 历史 Docker 封装链路已归档到 archive/docker-legacy/
# 如果确实要回看旧镜像更新流程，请查看：
# archive/docker-legacy/docs/deployment.md
```

### 5.3 备份和恢复

**自动备份脚本**：

```bash
#!/bin/bash
# /opt/backup/daily-backup.sh

BACKUP_ROOT="/backup"
DATE=$(date +%Y%m%d)

for project in $(zeabur project list | grep tenant- | awk '{print $1}'); do
  tenant_id=${project#tenant-}
  backup_dir="$BACKUP_ROOT/$tenant_id/$DATE"
  
  mkdir -p "$backup_dir"
  
  # 备份数据库
  zeabur database backup \
    --project "$project" \
    --service "postgres-$tenant_id" \
    --output "$backup_dir/db.sql"
  
  # 备份 Volume
  zeabur volume download \
    --project "$project" \
    --volume "workspace-$tenant_id" \
    --output "$backup_dir/workspace.tar.gz"
  
  # 生成校验和
  cd "$backup_dir"
  sha256sum * > checksums.txt
done

# 上传到远程存储
rclone sync /backup remote:ai-media-backup/
```

**恢复流程**：

```bash
#!/bin/bash
# 恢复租户数据

TENANT_ID=$1
BACKUP_DATE=$2

if [ $# -lt 2 ]; then
  echo "用法: $0 <tenant_id> <backup_date>"
  echo "示例: $0 c001 20260609"
  exit 1
fi

BACKUP_DIR="/backup/$TENANT_ID/$BACKUP_DATE"

# 1. 停止服务
zeabur service stop --project "tenant-$TENANT_ID" --service "opencode-$TENANT_ID"

# 2. 恢复数据库
zeabur database restore \
  --project "tenant-$TENANT_ID" \
  --service "postgres-$TENANT_ID" \
  --file "$BACKUP_DIR/db.sql"

# 3. 恢复 Volume
zeabur volume upload \
  --project "tenant-$TENANT_ID" \
  --volume "workspace-$TENANT_ID" \
  --file "$BACKUP_DIR/workspace.tar.gz"

# 4. 启动服务
zeabur service start --project "tenant-$TENANT_ID" --service "opencode-$TENANT_ID"

# 5. 验证
sleep 10
curl -f "https://$TENANT_ID.yourdomain.com/health"
```

## 6. 故障处理

### 6.1 服务不可用

**诊断步骤**：

```bash
# 1. 检查服务状态
zeabur service status --project tenant-c001 --service opencode-c001

# 2. 查看最近日志
zeabur logs --project tenant-c001 --service opencode-c001 --tail 200

# 3. 检查资源使用
zeabur metrics --project tenant-c001 --service opencode-c001

# 4. 测试网络连接
curl -v https://c001.yourdomain.com

# 5. 检查DNS解析
nslookup c001.yourdomain.com
```

**常见问题修复**：

```bash
# 内存不足 - 重启服务
zeabur service restart --project tenant-c001 --service opencode-c001

# 端口冲突 - 检查配置
zeabur env get --project tenant-c001 --service opencode-c001 PORT

# 数据库连接失败 - 检查连接串
zeabur exec --project tenant-c001 --service opencode-c001 -- \
  psql $DATABASE_URL -c "SELECT 1"
```

### 6.2 性能下降

**性能分析**：

```bash
# 1. CPU 使用率分析
zeabur metrics --project tenant-c001 --metric cpu --duration 1h

# 2. 慢查询分析
psql $DATABASE_URL << EOF
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
EOF

# 3. API 响应时间
zeabur logs --project tenant-c001 --service opencode-c001 \
  --filter "response_time" --since 1h | \
  awk '{print $NF}' | sort -n | tail -20
```

**优化措施**：

```bash
# 增加资源
zeabur service update \
  --project tenant-c001 \
  --service opencode-c001 \
  --cpu 4 \
  --memory 8G

# 清理缓存
zeabur exec --project tenant-c001 --service opencode-c001 -- \
  rm -rf /workspace-internal/cache/*

# 优化数据库
psql $DATABASE_URL -c "VACUUM ANALYZE"
```

### 6.3 数据丢失

**紧急恢复**：

```bash
# 1. 立即停止服务，防止进一步损坏
zeabur service stop --project tenant-c001 --service opencode-c001

# 2. 找到最近的备份
ls -lt /backup/c001/ | head -5

# 3. 执行恢复
./restore-tenant.sh c001 20260609

# 4. 验证数据完整性
# 登录系统检查文件和数据

# 5. 通知客户
```

## 7. 升级和维护

### 7.1 系统升级

**准备阶段**：

```bash
# 1. 通知客户维护窗口
# 2. 完整备份所有数据
for tenant in c001 c002 c003; do
  ./backup.sh $tenant
done

# 3. 在测试环境验证新版本
docker run --rm ai-media-opencode:v2.0.0 /app/test.sh
```

**执行升级**：

```bash
# 4. 灰度发布
zeabur service update \
  --project tenant-c001 \
  --service opencode-c001 \
  --image ai-media-opencode:v2.0.0

# 5. 验证测试租户
curl https://c001.yourdomain.com/health
# 人工测试功能

# 6. 批量升级其他租户
for project in $(zeabur project list | grep tenant- | grep -v c001); do
  tenant_id=${project#tenant-}
  zeabur service update \
    --project "$project" \
    --service "opencode-$tenant_id" \
    --image ai-media-opencode:v2.0.0
  sleep 30  # 逐个升级，避免同时重启
done
```

**回滚计划**：

```bash
# 如果升级失败，回滚到旧版本
zeabur service update \
  --project tenant-c001 \
  --service opencode-c001 \
  --image ai-media-opencode:v1.0.0
```

### 7.2 配置变更

**环境变量更新**：

```bash
# 更新单个租户
zeabur env set \
  --project tenant-c001 \
  --service opencode-c001 \
  MODEL_NAME=claude-3-7-sonnet-20270320

# 批量更新
for project in $(zeabur project list | grep tenant-); do
  zeabur env set \
    --project "$project" \
    --service "opencode-${project#tenant-}" \
    MODEL_NAME=claude-3-7-sonnet-20270320
done
```

## 8. 应急响应

### 8.1 重大事故响应流程

1. **发现问题** → 立即记录时间和现象
2. **评估影响** → 确定影响范围和严重程度
3. **紧急通知** → 通知相关人员和受影响客户
4. **快速修复** → 实施临时修复或回滚
5. **根因分析** → 深入分析问题原因
6. **永久修复** → 实施长期解决方案
7. **复盘总结** → 编写事故报告

### 8.2 联系方式

**紧急联系人**：
- 技术负责人：xxx
- 运维值班：xxx
- Zeabur 支持：support@zeabur.com

**升级路径**：
- P0（严重）：立即通知所有人
- P1（高）：15 分钟内通知技术负责人
- P2（中）：1 小时内通知
- P3（低）：记录到工单系统

## 9. 运维工具

### 9.1 自动化脚本

所有运维脚本位于 `saas-platform/scripts/`：

- `create-tenant.sh` - 创建新租户
- `backup.sh` - 备份租户数据
- `restore-tenant.sh` - 恢复租户数据
- `update-all-tenants.sh` - 批量更新
- `health-check.sh` - 健康检查
- `cleanup-temp.sh` - 清理临时文件

### 9.2 监控面板

**推荐工具**：
- Grafana - 可视化监控
- Prometheus - 指标收集
- Sentry - 错误追踪
- Uptime Robot - 外部监控

## 10. 参考资料

- [架构设计文档](architecture.md)
- [部署指南](deployment.md)
- [客户开户 SOP](customer-sop.md)
- [Zeabur 文档](https://docs.zeabur.com)
