#!/bin/bash
# 正式链路本地验证脚本

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
DEPLOY_DIR="$PROJECT_ROOT/deployment/zeabur"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yml"
CORE_ASSETS_DIR="$PROJECT_ROOT/opencode-service/core-assets"
SKILL_DIR="$PROJECT_ROOT/../skill文件"
DEFAULT_OPENCODE_BASE_IMAGE="ghcr.io/anomalyco/opencode:1.16.2"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

detect_compose_cmd() {
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD=(docker compose)
        return
    fi

    if command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_CMD=(docker-compose)
        return
    fi

    log_error "未找到可用的 Compose 命令，请安装 Docker Desktop 或 docker-compose"
    exit 1
}

run_compose() {
    "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" "$@"
}

curl_http_code() {
    local url="$1"
    if [ "${OPENCODE_LOCAL_BASIC_AUTH:-false}" = "true" ]; then
        curl -u "${OPENCODE_SERVER_USERNAME}:${OPENCODE_SERVER_PASSWORD}" -sS -o /dev/null -w "%{http_code}" --max-time 2 "$url" 2>/dev/null || echo 000
    else
        curl -sS -o /dev/null -w "%{http_code}" --max-time 2 "$url" 2>/dev/null || echo 000
    fi
}

curl_fetch() {
    local url="$1"
    if [ "${OPENCODE_LOCAL_BASIC_AUTH:-false}" = "true" ]; then
        curl -u "${OPENCODE_SERVER_USERNAME}:${OPENCODE_SERVER_PASSWORD}" -fsS "$url" 2>/dev/null
    else
        curl -fsS "$url" 2>/dev/null
    fi
}

sync_asset_dir() {
    local source_dir="$1"
    local target_dir="$2"

    rm -rf "$target_dir"
    mkdir -p "$(dirname "$target_dir")"

    if [ -d "$source_dir" ]; then
        cp -R "$source_dir" "$target_dir"
        log_info "✓ 已复制 $(basename "$source_dir")"
    else
        mkdir -p "$target_dir"
        printf '%s\n' "占位目录：正式验证时可为空，生产上线前请替换为真实内容。" > "$target_dir/README.txt"
        log_warn "$(basename "$source_dir") 不存在，已创建占位目录"
    fi
}

wait_for_http_health() {
    local retries=90
    local root_url="http://localhost:4096/"
    local health_urls=("http://localhost:4096/global/health" "http://localhost:4096/health")

    log_info "等待正式链路 HTTP 健康检查通过（最多 ${retries} 秒）..."
    for ((i=1; i<=retries; i++)); do
        local code
        code="$(curl_http_code "$root_url")"
        if [ "$code" != "000" ]; then
            log_info "✓ 正式链路 HTTP 已可访问（/ => ${code}）"
            return 0
        fi
        for url in "${health_urls[@]}"; do
            code="$(curl_http_code "$url")"
            if [ "$code" != "000" ]; then
                log_info "✓ 正式链路 HTTP 已可访问（${url} => ${code}）"
                return 0
            fi
        done
        sleep 1
    done

    log_error "正式链路 HTTP 健康检查未通过"
    run_compose logs opencode
    exit 1
}

wait_for_container_health() {
    local retries=90

    log_info "等待正式链路容器健康状态变为 healthy（最多 ${retries} 秒）..."
    for ((i=1; i<=retries; i++)); do
        local status
        status="$(docker inspect opencode-prod-local --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>/dev/null || true)"

        if [ "$status" = "healthy" ]; then
            log_info "✓ 正式链路容器健康检查已通过"
            return 0
        fi

        sleep 1
    done

    log_error "正式链路容器未在预期时间内变为 healthy"
    docker inspect opencode-prod-local --format '{{json .State.Health}}' || true
    run_compose logs opencode
    exit 1
}

echo "======================================="
echo "  AI 自媒体系统 - 正式链路本地验证"
echo "======================================="
echo ""

if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker 未安装，请先安装 Docker Desktop"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    log_error "Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

if [ -z "${DEEPSEEK_API_KEY:-}" ]; then
    log_warn "DEEPSEEK_API_KEY 未设置，正式链路可能无法完成模型调用"
fi

export OPENCODE_BASE_IMAGE="${OPENCODE_BASE_IMAGE:-$DEFAULT_OPENCODE_BASE_IMAGE}"
export OPENCODE_LOCAL_BASIC_AUTH="${OPENCODE_LOCAL_BASIC_AUTH:-false}"
export OPENCODE_SERVER_USERNAME="${OPENCODE_SERVER_USERNAME:-opencode}"
export OPENCODE_SERVER_PASSWORD="${OPENCODE_SERVER_PASSWORD:-test_password}"

detect_compose_cmd

log_info "✓ Docker 已安装并运行"
log_info "✓ 使用 Compose 命令: ${COMPOSE_CMD[*]}"
log_info "✓ OpenCode 基础镜像: ${OPENCODE_BASE_IMAGE}"
log_info "✓ 本地认证模式: ${OPENCODE_LOCAL_BASIC_AUTH}"
echo ""

log_step "步骤 1/5: 准备核心资产"
mkdir -p "$CORE_ASSETS_DIR"
sync_asset_dir "$SKILL_DIR/01-系统层" "$CORE_ASSETS_DIR/01-系统层"
sync_asset_dir "$SKILL_DIR/02-业务方法论" "$CORE_ASSETS_DIR/02-业务方法论"
sync_asset_dir "$SKILL_DIR/03-执行流程" "$CORE_ASSETS_DIR/03-执行流程"
sync_asset_dir "$SKILL_DIR/04-提示词" "$CORE_ASSETS_DIR/04-提示词"
sync_asset_dir "$SKILL_DIR/.claude/skills" "$CORE_ASSETS_DIR/.claude/skills"
sync_asset_dir "$SKILL_DIR/.trae/skills" "$CORE_ASSETS_DIR/.trae/skills"
echo ""

log_step "步骤 2/5: 清理现有正式验证容器"
run_compose down >/dev/null 2>&1 || true
log_info "✓ 已清理现有正式验证容器"
echo ""

log_step "步骤 3/5: 构建正式镜像"
log_info "开始构建正式 OpenCode 镜像..."
run_compose build
log_info "✓ 正式镜像构建完成"
echo ""

log_step "步骤 4/5: 启动服务"
log_info "启动 PostgreSQL 和正式 OpenCode Web 服务..."
run_compose up -d --force-recreate
run_compose ps
echo ""

log_step "步骤 5/5: 验证部署"
wait_for_http_health
wait_for_container_health

log_info "读取正式链路状态..."
STATUS="$(curl_fetch http://localhost:4096/global/health || curl_fetch http://localhost:4096/health || echo 'ok')"
echo "响应: $STATUS"

log_info "测试数据库连接..."
run_compose exec -T postgres psql -U testuser -d testdb -c "SELECT version();" >/dev/null
log_info "✓ 数据库连接正常"

echo ""
echo "======================================="
echo "  🎉 正式链路本地验证完成"
echo "======================================="
echo ""
echo "访问地址："
echo "  OpenCode Web: http://localhost:4096"
echo "  健康检查: http://localhost:4096/global/health"
echo ""
if [ "${OPENCODE_LOCAL_BASIC_AUTH}" = "true" ]; then
    echo "认证信息："
    echo "  用户名: ${OPENCODE_SERVER_USERNAME}"
    echo "  密码: ${OPENCODE_SERVER_PASSWORD}"
    echo "  说明: 浏览器首次访问会触发 Basic Auth 认证"
    echo ""
else
    echo "认证信息："
    echo "  当前本地正式验证默认关闭 Basic Auth，避免触发 OpenCode Web 已知认证路径问题"
    echo ""
fi
echo "语言说明："
echo "  OpenCode Web 默认跟随浏览器语言；如浏览器首选语言为中文，界面会尽量显示中文"
echo "  当前上游版本仍可能出现中英混合文案"
echo ""
echo "管理命令："
echo "  查看日志: ${COMPOSE_CMD[*]} -f $COMPOSE_FILE logs -f"
echo "  停止服务: ${COMPOSE_CMD[*]} -f $COMPOSE_FILE down"
echo "  查看状态: ${COMPOSE_CMD[*]} -f $COMPOSE_FILE ps"
echo ""
