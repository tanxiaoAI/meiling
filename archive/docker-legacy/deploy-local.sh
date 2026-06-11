#!/bin/bash
# 本地测试部署脚本

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
DEPLOY_DIR="$PROJECT_ROOT/deployment/zeabur"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.test.yml"
CORE_ASSETS_DIR="$PROJECT_ROOT/opencode-service/core-assets"
SKILL_DIR="$PROJECT_ROOT/../skill文件"

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
        printf '%s\n' "占位目录：测试构建时可为空，正式素材由部署脚本或手动复制覆盖。" > "$target_dir/README.md"
        log_warn "$(basename "$source_dir") 不存在，已创建占位目录"
    fi
}

wait_for_http_health() {
    local retries=60
    local url="http://localhost:3000/health"

    log_info "等待 HTTP 健康检查通过（最多 ${retries} 秒）..."
    for ((i=1; i<=retries; i++)); do
        if curl -fsS "$url" >/dev/null 2>&1; then
            log_info "✓ HTTP 健康检查已通过"
            return 0
        fi
        sleep 1
    done

    log_error "HTTP 健康检查未通过"
    run_compose logs opencode
    exit 1
}

wait_for_container_health() {
    local retries=60

    log_info "等待容器健康状态变为 healthy（最多 ${retries} 秒）..."
    for ((i=1; i<=retries; i++)); do
        local status
        status="$(docker inspect opencode-test --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' 2>/dev/null || true)"

        if [ "$status" = "healthy" ]; then
            log_info "✓ 容器健康检查已通过"
            return 0
        fi

        if [ "$status" = "unhealthy" ]; then
            log_warn "容器当前状态为 unhealthy，继续等待..."
        fi

        sleep 1
    done

    log_error "容器未在预期时间内变为 healthy"
    docker inspect opencode-test --format '{{json .State.Health}}' || true
    run_compose logs opencode
    exit 1
}

echo "======================================="
echo "  AI 自媒体系统 - 本地测试部署"
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

detect_compose_cmd

log_info "✓ Docker 已安装并运行"
log_info "✓ 使用 Compose 命令: ${COMPOSE_CMD[*]}"
echo ""

log_step "步骤 1/5: 准备核心资产"
mkdir -p "$CORE_ASSETS_DIR"
sync_asset_dir "$SKILL_DIR/01-系统层" "$CORE_ASSETS_DIR/01-系统层"
sync_asset_dir "$SKILL_DIR/02-业务方法论" "$CORE_ASSETS_DIR/02-业务方法论"
sync_asset_dir "$SKILL_DIR/03-执行流程" "$CORE_ASSETS_DIR/03-执行流程"
sync_asset_dir "$SKILL_DIR/04-提示词" "$CORE_ASSETS_DIR/04-提示词"
echo ""

log_step "步骤 2/5: 清理现有容器"
run_compose down >/dev/null 2>&1 || true
log_info "✓ 已清理现有容器"
echo ""

log_step "步骤 3/5: 构建镜像"
log_info "开始构建测试镜像..."
run_compose build
log_info "✓ 镜像构建完成"
echo ""

log_step "步骤 4/5: 启动服务"
log_info "启动 PostgreSQL 和测试版 OpenCode 服务..."
run_compose up -d --force-recreate
run_compose ps
echo ""

log_step "步骤 5/5: 验证部署"
wait_for_http_health
wait_for_container_health

log_info "测试健康检查端点..."
HEALTH="$(curl -fsS http://localhost:3000/health)"
echo "响应: $HEALTH"

log_info "测试数据库连接..."
run_compose exec -T postgres psql -U testuser -d testdb -c "SELECT version();" >/dev/null
log_info "✓ 数据库连接正常"

log_info "运行访问控制测试..."
ACCESS_CONTROL_OUTPUT="$(run_compose exec -T opencode node /app/config/test-access-control.js)"
printf '%s\n' "$ACCESS_CONTROL_OUTPUT"
if printf '%s\n' "$ACCESS_CONTROL_OUTPUT" | grep -q '✗'; then
    log_error "访问控制测试存在未通过项"
    exit 1
fi
log_info "✓ 访问控制测试全部通过"

log_info "检查容器内目录结构..."
run_compose exec -T opencode ls -la /workspace
run_compose exec -T opencode ls -la /opt/core-assets

echo ""
echo "======================================="
echo "  🎉 本地部署成功！"
echo "======================================="
echo ""
echo "访问地址："
echo "  Web 界面: http://localhost:3000"
echo "  健康检查: http://localhost:3000/health"
echo "  系统信息: http://localhost:3000/info"
echo ""
echo "管理命令："
echo "  查看日志: ${COMPOSE_CMD[*]} -f $COMPOSE_FILE logs -f"
echo "  停止服务: ${COMPOSE_CMD[*]} -f $COMPOSE_FILE down"
echo "  重启服务: ${COMPOSE_CMD[*]} -f $COMPOSE_FILE restart"
echo "  查看状态: ${COMPOSE_CMD[*]} -f $COMPOSE_FILE ps"
echo ""
echo "测试访问控制："
echo "  ${COMPOSE_CMD[*]} -f $COMPOSE_FILE exec opencode node /app/config/test-access-control.js"
echo ""
