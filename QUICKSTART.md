# AI 自媒体系统 SaaS - 快速开始指南

当前仓库以 `vendor/opencode` 的源码模式为主线。旧的 Docker 封装链路已归档到 `archive/docker-legacy/`，不再作为默认排查和部署依据。

## 文档导航

- [README.md](README.md) - 仓库总览
- [docs/opencode-source-mode.md](docs/opencode-source-mode.md) - OpenCode 源码模式启动方式
- [docs/architecture.md](docs/architecture.md) - 系统架构说明
- [docs/operation.md](docs/operation.md) - 运维手册
- [docs/customer-sop.md](docs/customer-sop.md) - 客户开户 SOP
- [scripts/README.md](scripts/README.md) - 自动化脚本说明
- [archive/docker-legacy/README.md](archive/docker-legacy/README.md) - 历史 Docker 链路归档说明

## 5 分钟启动源码模式

### 前置条件

```bash
node --version
~/.bun/bin/bun --version
```

### 安装最小依赖

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform
AUTO_INSTALL_BUN=true bash scripts/bootstrap-opencode-source.sh
```

### 启动后端

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform
export DEEPSEEK_API_KEY=你的key
bash scripts/run-opencode-source-backend.sh
```

### 启动前端

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform
bash scripts/run-opencode-source-web.sh
```

### 默认地址

- 后端：`http://127.0.0.1:4300`
- 前端：`http://127.0.0.1:4444`
- 默认项目目录：仓库根目录

## 当前目录重点

```text
saas-platform/
├── vendor/opencode/          # 当前主线：OpenCode 上游源码
├── portal/                   # 客户门户
├── scripts/                  # 源码模式启动与运维脚本
├── docs/                     # 当前文档
├── deployment/env-templates/ # 环境变量模板
└── archive/docker-legacy/    # 已归档的旧 Docker 配置与文档
```

## 当前判断原则

- 改 UI、交互、入口：优先看 `vendor/opencode/`
- 查本地运行问题：优先看 `scripts/run-opencode-source-*.sh`
- 查 Zeabur 源码部署问题：优先核对根目录、Install/Build/Start 命令
- 查历史 Docker 实现：只去 `archive/docker-legacy/`

## 注意

- `scripts/create-tenant.sh` 仍保留镜像部署假设，当前不应把它当作源码模式排错依据
- `docs/plans/`、`PROJECT-SUMMARY.md`、`VALIDATION.md` 中仍可能保留历史 Docker 语境，它们属于历史记录，不代表当前主线

### 访问控制

| 目录 | 读取 | 写入 | 删除 |
|------|------|------|------|
| /workspace/inputs/ | ✓ | ✓ | ✓ |
| /workspace/outputs/ | ✓ | ✗ | ✗ |
| /opt/core-assets/ | ✗ | ✗ | ✗ |

## 🔧 常用操作

### 创建新客户
```bash
cd scripts
./create-tenant.sh c002 "客户名称" yourdomain.com
```

### 备份客户数据
```bash
./backup.sh c001
```

### 查看服务状态
```bash
zeabur service list --project tenant-c001
```

### 查看服务日志
```bash
zeabur logs --project tenant-c001 --service opencode-c001 --tail 100
```

### 更新所有客户
```bash
./update-all-tenants.sh v1.1.0
```

## 📈 运维检查清单

### 每日
- [ ] 检查所有服务健康状态
- [ ] 查看错误日志
- [ ] 验证备份成功

### 每周
- [ ] 完整数据备份
- [ ] 性能指标分析
- [ ] 安全更新检查

### 每月
- [ ] 容量规划评估
- [ ] 成本分析
- [ ] 数据归档

## 🐛 故障排查

### 服务无法启动
```bash
# 1. 查看日志
zeabur logs --project tenant-c001 --service opencode-c001

# 2. 检查环境变量
zeabur env list --project tenant-c001

# 3. 重启服务
zeabur service restart --project tenant-c001 --service opencode-c001
```

### 域名无法访问
```bash
# 1. 检查 DNS
nslookup c001.yourdomain.com

# 2. 测试健康检查
curl https://c001.yourdomain.com/health

# 3. 检查 SSL
curl -vI https://c001.yourdomain.com
```

### 性能问题
```bash
# 1. 查看资源使用
zeabur metrics --project tenant-c001 --service opencode-c001

# 2. 增加资源
zeabur service update \
  --project tenant-c001 \
  --service opencode-c001 \
  --cpu 4 --memory 8G
```

## 💰 成本估算

### 单客户月成本
- OpenCode 服务（2CPU/4GB）：~$20
- PostgreSQL（基础）：~$15
- Volume（10GB）：~$2
- 域名和 CDN：~$5
- **合计**：~$42/月

### 定价建议
- 基础版：$199/月（利润率 79%）
- 专业版：$499/月（利润率 91%）
- 企业版：$999/月起

## 🔐 安全最佳实践

1. **密码管理**
   - 使用强密码生成器
   - 定期轮换密码
   - 使用密钥管理工具

2. **访问控制**
   - 最小权限原则
   - 定期审计访问日志
   - 限制管理员账号数量

3. **数据保护**
   - 每日自动备份
   - 加密传输（HTTPS）
   - 定期备份验证

4. **监控告警**
   - 设置健康检查
   - 配置错误告警
   - 监控资源使用

## 📞 获取帮助

### 文档资源
- [完整文档](docs/)
- [常见问题](docs/faq.md)（待创建）
- [最佳实践](docs/best-practices.md)（待创建）

### 社区支持
- GitHub Issues
- 技术支持邮箱：support@yourdomain.com

### 商业支持
- 紧急热线：xxx-xxxx-xxxx
- 企业客户专属支持

## 🎓 学习路径

### 新手上路
1. 阅读[产品方案](../saas产品方案.md)了解系统设计
2. 跟随[源码模式说明](docs/opencode-source-mode.md)启动第一个实例
3. 学习[客户开户 SOP](docs/customer-sop.md)

### 深入了解
1. 研究[架构设计](docs/architecture.md)理解技术细节
2. 掌握[运维手册](docs/operation.md)日常操作
3. 熟悉[自动化脚本](scripts/README.md)提升效率

### 高级主题
1. 性能优化和扩展
2. 自定义功能开发
3. 多区域部署

## ✅ 下一步

根据你的角色选择：

**技术人员**：
1. 搭建开发环境
2. 部署测试实例
3. 熟悉运维脚本

**运营人员**：
1. 学习 Strapi 后台操作
2. 掌握客户开户流程
3. 了解套餐配置

**决策者**：
1. 了解成本结构
2. 评估扩展能力
3. 规划商业策略

## 📝 更新日志

### v1.0.0 (2026-06-09)
- ✨ 初始版本发布
- ✅ OpenCode 服务配置
- ✅ Strapi 数据模型设计
- ✅ 自动化开户脚本
- ✅ 完整文档体系

---

**开始你的 SaaS 之旅吧！** 🚀

有问题？查看[文档](docs/)或联系技术支持。
