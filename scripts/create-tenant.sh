#!/bin/bash
# AI 自媒体系统 - 客户开户脚本
# 用法: ./create-tenant.sh <tenant_id> <tenant_name> [domain]

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ $# -lt 2 ]; then
    log_error "用法: $0 <tenant_id> <tenant_name> [domain]"
    echo "示例: $0 c001 \"客户公司\" yourdomain.com"
    exit 1
fi

TENANT_ID=$1
TENANT_NAME=$2
BASE_DOMAIN=${3:-"yourdomain.com"}
TENANT_DOMAIN="${TENANT_ID}.${BASE_DOMAIN}"
PROJECT_NAME="tenant-${TENANT_ID}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! [[ "$TENANT_ID" =~ ^[a-z0-9-]+$ ]]; then
    log_error "tenant_id 只能包含小写字母、数字和连字符"
    exit 1
fi

log_info "开始为客户创建租户"
log_info "租户 ID: $TENANT_ID"
log_info "租户名称: $TENANT_NAME"
log_info "域名: $TENANT_DOMAIN"
log_info "项目名称: $PROJECT_NAME"
echo ""

# 检查是否安装了必需工具
command -v zeabur >/dev/null 2>&1 || {
    log_error "需要安装 Zeabur CLI"
    log_info "安装方法: npm install -g @zeabur/cli"
    exit 1
}

command -v openssl >/dev/null 2>&1 || {
    log_error "需要安装 openssl"
    exit 1
}

MODEL_PROVIDER="${MODEL_PROVIDER:-}"
MODEL_NAME="${MODEL_NAME:-}"

if [ -z "$MODEL_PROVIDER" ]; then
    if [ -n "${DEEPSEEK_API_KEY:-}" ]; then
        MODEL_PROVIDER="deepseek"
    elif [ -n "${ANTHROPIC_API_KEY:-}" ]; then
        MODEL_PROVIDER="anthropic"
    fi
fi

if [ -z "$MODEL_PROVIDER" ]; then
    log_error "未检测到可用的模型密钥（DEEPSEEK_API_KEY / ANTHROPIC_API_KEY）"
    exit 1
fi

if [ "$MODEL_PROVIDER" = "deepseek" ] && [ -z "${DEEPSEEK_API_KEY:-}" ]; then
    log_error "环境变量 DEEPSEEK_API_KEY 未设置"
    exit 1
fi

if [ "$MODEL_PROVIDER" = "anthropic" ] && [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    log_error "环境变量 ANTHROPIC_API_KEY 未设置"
    exit 1
fi

if [ -z "$MODEL_NAME" ]; then
    if [ "$MODEL_PROVIDER" = "deepseek" ]; then
        MODEL_NAME="deepseek/deepseek-chat"
    else
        MODEL_NAME="anthropic/claude-3-5-sonnet-20241022"
    fi
fi

if [ "$MODEL_PROVIDER" = "deepseek" ] && [ -z "${DEEPSEEK_API_KEY:-}" ]; then
    log_warn "DEEPSEEK_API_KEY 未设置，模型调用将不可用"
fi

if [ "$MODEL_PROVIDER" = "anthropic" ] && [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    log_warn "ANTHROPIC_API_KEY 未设置，模型调用将不可用"
fi

# 生成安全密码
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

SERVER_PASSWORD=$(generate_password)
DB_PASSWORD=$(generate_password)
DB_NAME="ai_media_${TENANT_ID}"
DB_USER="ai_media_user"

log_info "步骤 1/8: 创建 Zeabur 项目"
zeabur project create --name "$PROJECT_NAME" || {
    log_error "创建项目失败"
    exit 1
}
log_info "✓ 项目创建成功"
echo ""

log_info "步骤 2/8: 添加 PostgreSQL 服务"
zeabur service create \
    --project "$PROJECT_NAME" \
    --name "postgres-${TENANT_ID}" \
    --type "postgresql" \
    --version "14" \
    --env "POSTGRES_DB=${DB_NAME}" \
    --env "POSTGRES_USER=${DB_USER}" \
    --env "POSTGRES_PASSWORD=${DB_PASSWORD}" || {
    log_error "创建数据库服务失败"
    exit 1
}
log_info "✓ 数据库服务创建成功"
log_info "  数据库名: $DB_NAME"
log_info "  用户名: $DB_USER"
echo ""

log_info "步骤 3/8: 创建 Volume"
zeabur volume create \
    --project "$PROJECT_NAME" \
    --name "workspace-${TENANT_ID}" \
    --size "10GB" || {
    log_error "创建 Volume 失败"
    exit 1
}
log_info "✓ Volume 创建成功"
echo ""

log_info "步骤 4/8: 部署 OpenCode 源码服务"
log_info "  请在 Zeabur 控制台中手动操作："
log_info "  1. 将 GitHub 仓库连接到项目"
log_info "  2. 设置 Root Directory 为 saas-platform"
log_info "  3. Zeabur 将自动检测 Bun 项目并构建/启动"
echo ""
echo ""

log_info "步骤 5/8: 配置环境变量"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@postgres-${TENANT_ID}:5432/${DB_NAME}"

zeabur env set \
    --project "$PROJECT_NAME" \
    --service "opencode-${TENANT_ID}" \
    TENANT_ID="$TENANT_ID" \
    TENANT_NAME="$TENANT_NAME" \
    OPENCODE_SERVER_USERNAME="opencode" \
    OPENCODE_SERVER_PASSWORD="$SERVER_PASSWORD" \
    DATABASE_URL="$DATABASE_URL" \
    MODEL_PROVIDER="$MODEL_PROVIDER" \
    MODEL_NAME="$MODEL_NAME" \
    DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-}" \
    ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
    NODE_ENV="production" || {
    log_error "配置环境变量失败"
    exit 1
}
log_info "✓ 环境变量配置成功"
echo ""

log_info "步骤 6/8: 挂载 Volume"
zeabur volume attach \
    --project "$PROJECT_NAME" \
    --service "opencode-${TENANT_ID}" \
    --volume "workspace-${TENANT_ID}" \
    --mount-path "/workspace" || {
    log_error "挂载 Volume 失败"
    exit 1
}
log_info "✓ Volume 挂载成功"
echo ""

log_info "步骤 7/8: 绑定域名"
zeabur domain add \
    --project "$PROJECT_NAME" \
    --service "opencode-${TENANT_ID}" \
    --domain "$TENANT_DOMAIN" || {
    log_warn "域名绑定失败，请手动在 Zeabur 控制台绑定"
}
log_info "✓ 域名配置完成"
echo ""

log_info "步骤 8/8: 生成客户凭证文件"
CREDENTIALS_FILE="${SCRIPT_DIR}/credentials_${TENANT_ID}.txt"
cat > "$CREDENTIALS_FILE" << EOF
===================================
AI 自媒体系统 - 客户凭证
===================================

租户 ID: $TENANT_ID
客户名称: $TENANT_NAME

访问地址: https://${TENANT_DOMAIN}
用户名: opencode
密码: $SERVER_PASSWORD

数据库信息（内部使用）:
  数据库: $DB_NAME
  用户名: $DB_USER
  密码: $DB_PASSWORD
  连接串: $DATABASE_URL

Zeabur 项目: $PROJECT_NAME

创建时间: $(date '+%Y-%m-%d %H:%M:%S')

===================================
重要提示
===================================
1. 请妥善保管此凭证文件
2. 首次登录后请修改密码
3. 如有问题请联系技术支持

EOF

chmod 600 "$CREDENTIALS_FILE"

log_info "✓ 凭证文件已生成: $CREDENTIALS_FILE"
log_info "✓ 凭证文件权限已设置为 600"
echo ""

# 显示摘要
echo "======================================="
echo "客户开户完成！"
echo "======================================="
echo ""
echo "访问信息："
echo "  地址: https://${TENANT_DOMAIN}"
echo "  用户名: opencode"
echo "  密码: $SERVER_PASSWORD"
echo ""
echo "凭证文件: $CREDENTIALS_FILE"
echo ""
log_warn "请将凭证文件发送给客户，并提醒客户修改密码"
log_info "同时请在 Strapi 后台登记该客户信息"
echo ""

# 保存到日志
LOG_FILE="${SCRIPT_DIR}/tenant_creation_log.txt"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Created tenant: $TENANT_ID ($TENANT_NAME) - Domain: $TENANT_DOMAIN" >> "$LOG_FILE"

log_info "开户流程完成！"
