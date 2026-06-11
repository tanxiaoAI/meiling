# AI 自媒体系统 SaaS - 客户开户 SOP

> 标准操作流程（Standard Operating Procedure）  
> 版本：v1.0  
> 更新日期：2026-06-09

## 1. 开户前准备

### 1.1 客户信息收集

**必需信息**：
- [ ] 公司名称（中文全称）
- [ ] 联系人姓名
- [ ] 联系人邮箱
- [ ] 联系人电话
- [ ] 选择套餐（基础版/专业版/企业版）

**可选信息**：
- [ ] 公司网址
- [ ] 公司简介
- [ ] 行业类型
- [ ] 预计使用场景

### 1.2 商务确认

- [ ] 确认付款已到账
- [ ] 确认服务期限（月付/年付）
- [ ] 确认套餐配置和配额
- [ ] 签署服务协议

### 1.3 技术准备

- [ ] 分配租户 ID（格式：c001, c002, ...）
- [ ] 准备子域名（c001.yourdomain.com）
- [ ] 生成登录凭证（用户名/密码）

## 2. 开户执行流程

### 2.1 步骤概览

```
收集信息 → 商务确认 → 技术开户 → 测试验证 → 客户交付 → 信息登记
```

**预计时间**：30-45 分钟

### 2.2 详细步骤

#### 步骤 1：分配租户 ID

```bash
# 查看已有租户列表
zeabur project list | grep tenant-

# 确定下一个可用 ID
# 例如：已有 c001, c002, c003，则分配 c004
TENANT_ID="c004"
```

#### 步骤 2：执行开户脚本

```bash
cd saas-platform/scripts

# 设置 API 密钥（如果未设置）
export ANTHROPIC_API_KEY="sk-ant-xxxxxx"

# 执行开户
./create-tenant.sh c004 "客户公司名称" yourdomain.com
```

**脚本会自动完成**：
- ✓ 创建 Zeabur 项目
- ✓ 部署 PostgreSQL 数据库
- ✓ 创建 Volume 存储
- ✓ 部署 OpenCode 服务
- ✓ 配置环境变量
- ✓ 绑定域名
- ✓ 生成客户凭证文件

**预计耗时**：5-10 分钟

#### 步骤 3：验证部署

```bash
# 检查服务状态
zeabur service list --project tenant-c004

# 测试健康检查
curl https://c004.yourdomain.com/health

# 预期输出：
# {"status":"ok","tenant":"c004"}
```

#### 步骤 4：登录测试

1. 打开浏览器访问 `https://c004.yourdomain.com`
2. 使用生成的凭证登录
3. 验证以下功能：
   - [ ] 能够成功登录
   - [ ] 文件树只显示 `/workspace/` 目录
   - [ ] 可以上传文件到 `/workspace/inputs/`
   - [ ] 核心资产目录不可见
   - [ ] 界面显示正常

#### 步骤 5：在 Strapi 登记客户信息

登录 Strapi 后台：`https://admin.yourdomain.com`

**添加 Customer 记录**：
```
租户 ID: c004
客户名称: 客户公司名称
域名: c004.yourdomain.com
状态: active
套餐: basic / pro / enterprise
配额限制: 1000 / 5000 / unlimited
已用配额: 0
到期时间: (根据付款期限设置)
联系邮箱: customer@example.com
联系电话: 13800138000
备注: (记录特殊要求)
```

**添加 TenantProject 记录**：
```
租户 ID: c004
Zeabur 项目名: tenant-c004
OpenCode 服务名: opencode-c004
PostgreSQL 服务名: postgres-c004
Volume 名称: workspace-c004
域名: c004.yourdomain.com
版本: v1.0.0
部署状态: running
部署时间: (当前时间)
```

#### 步骤 6：准备交付材料

**凭证文件**：
- 位置：`./credentials_c004.txt`
- 包含：访问地址、用户名、密码

**欢迎邮件模板**：

```
主题：欢迎使用 AI 自媒体系统

尊敬的 [客户名称]：

您好！感谢您选择 AI 自媒体系统。您的账号已开通，以下是登录信息：

访问地址：https://c004.yourdomain.com
用户名：opencode
初始密码：[从凭证文件复制]

首次使用指南：
1. 访问上述地址并使用提供的凭证登录
2. 登录后，请立即修改您的密码
3. 在 /workspace/inputs/ 目录上传您的品牌资料
4. 系统将自动分析并生成结果

注意事项：
- 请妥善保管您的登录凭证
- 如需技术支持，请联系：support@yourdomain.com
- 使用过程中如有问题，请参考帮助文档

服务期限：[开始日期] 至 [结束日期]
套餐类型：[基础版/专业版/企业版]

祝您使用愉快！

AI 自媒体系统团队
```

#### 步骤 7：发送给客户

- [ ] 发送欢迎邮件（包含登录凭证）
- [ ] 发送快速入门指南（可选）
- [ ] 添加客户到技术支持群（可选）
- [ ] 安全删除本地凭证文件

```bash
# 加密保存凭证后删除明文
gpg --encrypt --recipient admin@yourdomain.com credentials_c004.txt
rm credentials_c004.txt
```

#### 步骤 8：后续跟进

**第 1 天**：
- [ ] 确认客户收到邮件
- [ ] 确认客户能够登录
- [ ] 解答初始问题

**第 3 天**：
- [ ] 检查客户使用情况
- [ ] 询问是否需要帮助
- [ ] 收集初步反馈

**第 7 天**：
- [ ] 检查配额使用情况
- [ ] 评估客户满意度
- [ ] 记录使用情况

## 3. 套餐配置

### 3.1 基础版配置

```bash
# CPU: 2 核
# 内存: 4GB
# 存储: 10GB
# 配额: 1000 次/月
# 价格: $199/月

zeabur service update \
  --project tenant-c004 \
  --service opencode-c004 \
  --cpu 2 \
  --memory 4G

zeabur volume resize \
  --project tenant-c004 \
  --volume workspace-c004 \
  --size 10GB
```

在 Strapi 设置：
- `plan: basic`
- `quotaLimit: 1000`

### 3.2 专业版配置

```bash
# CPU: 4 核
# 内存: 8GB
# 存储: 50GB
# 配额: 5000 次/月
# 价格: $499/月

zeabur service update \
  --project tenant-c004 \
  --service opencode-c004 \
  --cpu 4 \
  --memory 8G

zeabur volume resize \
  --project tenant-c004 \
  --volume workspace-c004 \
  --size 50GB
```

在 Strapi 设置：
- `plan: pro`
- `quotaLimit: 5000`

### 3.3 企业版配置

```bash
# CPU: 8 核
# 内存: 16GB
# 存储: 200GB
# 配额: 无限制
# 价格: $999/月起（根据需求定制）

zeabur service update \
  --project tenant-c004 \
  --service opencode-c004 \
  --cpu 8 \
  --memory 16G

zeabur volume resize \
  --project tenant-c004 \
  --volume workspace-c004 \
  --size 200GB
```

在 Strapi 设置：
- `plan: enterprise`
- `quotaLimit: -1`（表示无限制）

## 4. 特殊场景处理

### 4.1 客户要求自定义域名

如果客户希望使用自己的域名（如 `ai.customer.com`）：

1. 要求客户添加 CNAME 记录：
   ```
   ai.customer.com  →  c004.yourdomain.com
   ```

2. 在 Zeabur 添加自定义域名：
   ```bash
   zeabur domain add \
     --project tenant-c004 \
     --service opencode-c004 \
     --domain ai.customer.com
   ```

3. 更新 Strapi 记录中的域名字段

### 4.2 客户需要数据迁移

如果客户有现有数据需要导入：

1. 接收客户数据（通过安全渠道）
2. 登录客户实例
3. 上传到对应目录：
   ```bash
   zeabur exec --project tenant-c004 --service opencode-c004 -- bash
   # 在容器内上传数据到 /workspace/inputs/
   ```

### 4.3 客户试用转正式

试用期结束，客户决定购买：

1. 确认付款
2. 在 Strapi 更新：
   - 状态保持 `active`
   - 更新 `expiresAt` 到新的到期日期
   - 更新 `plan` 为正式套餐
   - 更新 `quotaLimit`
3. 如需升级资源，执行资源调整
4. 发送确认邮件

### 4.4 企业批量开户

如果企业客户需要多个子账号：

**方案 A**：多个独立租户（推荐）
- 为每个部门/团队创建独立租户
- 数据完全隔离
- 独立计费

**方案 B**：单租户多用户
- 在同一租户内创建多个用户
- 共享配额
- 统一计费

## 5. 开户检查清单

### 5.1 开户前

- [ ] 客户信息完整
- [ ] 商务流程完成
- [ ] 租户 ID 已分配
- [ ] 域名准备就绪
- [ ] API 密钥已配置

### 5.2 开户中

- [ ] 脚本执行成功
- [ ] 所有服务已启动
- [ ] 域名绑定成功
- [ ] SSL 证书已签发
- [ ] 健康检查通过

### 5.3 开户后

- [ ] 登录测试通过
- [ ] 文件上传测试通过
- [ ] 核心功能测试通过
- [ ] Strapi 信息已登记
- [ ] 凭证已发送客户
- [ ] 本地凭证已安全删除

## 6. 常见问题

### Q1：开户脚本失败怎么办？

**A**：查看错误信息，常见原因：
- Zeabur API 限流 → 等待几分钟后重试
- 镜像拉取失败 → 检查镜像仓库配置
- 域名已被占用 → 使用不同的租户 ID

### Q2：客户无法登录怎么办？

**A**：检查步骤：
1. 确认服务正在运行
2. 测试健康检查端点
3. 验证凭证是否正确
4. 检查密码是否包含特殊字符需要转义

### Q3：开户后多久客户可以使用？

**A**：通常情况：
- 脚本执行：5-10 分钟
- DNS 传播：1-5 分钟
- SSL 签发：1-3 分钟
- 总计：10-20 分钟

### Q4：如何处理紧急开户？

**A**：
1. 优先执行商务确认
2. 使用自动化脚本快速开户
3. 基本验证后立即交付
4. 详细测试可以并行进行
5. 安排专人跟进首次使用

## 7. 附录

### 7.1 租户 ID 命名规范

- 格式：`c` + 3位数字
- 范围：c001 - c999
- 示例：c001, c002, c099, c100

### 7.2 密码生成规范

- 长度：24-32 字符
- 包含：大小写字母、数字
- 避免：特殊符号（防止转义问题）
- 方法：`openssl rand -base64 32 | tr -d "=+/" | cut -c1-25`

### 7.3 联系方式

**技术支持**：
- 邮箱：support@yourdomain.com
- 电话：xxx-xxxx-xxxx

**紧急联系**：
- 运维值班：xxx-xxxx-xxxx

### 7.4 相关文档

- [架构设计文档](architecture.md)
- [部署指南](deployment.md)
- [运维手册](operation.md)
- [客户使用手册](../docs/user-guide.md)（待创建）

---

**版本历史**：
- v1.0 (2026-06-09) - 初始版本
