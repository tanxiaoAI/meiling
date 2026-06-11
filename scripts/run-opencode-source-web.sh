#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
VENDOR_DIR="$PROJECT_ROOT/vendor/opencode"
BUN_INSTALL_DIR="${BUN_INSTALL:-$HOME/.bun}"
BUN_BIN="$BUN_INSTALL_DIR/bin/bun"
APP_PORT="${OPENCODE_WEB_PORT:-4444}"
SERVER_HOST="${OPENCODE_SOURCE_SERVER_HOST:-127.0.0.1}"
SERVER_PORT="${OPENCODE_SOURCE_SERVER_PORT:-4300}"
WORKSPACE_ROOT="${MEILING_WORKSPACE_ROOT:-$PROJECT_ROOT/workspace}"
DEFAULT_PROJECT_DIR="${OPENCODE_DEFAULT_PROJECT_DIR:-$WORKSPACE_ROOT}"

if command -v bun >/dev/null 2>&1; then
  BUN_CMD=$(command -v bun)
elif [ -x "$BUN_BIN" ]; then
  BUN_CMD="$BUN_BIN"
else
  echo "[ERROR] 未检测到 bun，请先运行 bash scripts/bootstrap-opencode-source.sh"
  exit 1
fi

export PATH="$(dirname "$BUN_CMD"):$PATH"
export VITE_OPENCODE_SERVER_HOST="$SERVER_HOST"
export VITE_OPENCODE_SERVER_PORT="$SERVER_PORT"
export VITE_OPENCODE_DEFAULT_PROJECT_DIR="$DEFAULT_PROJECT_DIR"
export VITE_OPENCODE_CLASSIC_SHELL="${VITE_OPENCODE_CLASSIC_SHELL:-true}"

mkdir -p "$WORKSPACE_ROOT"

cd "$VENDOR_DIR/packages/app"

echo "[INFO] 启动 OpenCode 源码 Web 前端"
echo "[INFO] 页面地址: http://127.0.0.1:$APP_PORT"
echo "[INFO] 后端指向: http://$SERVER_HOST:$SERVER_PORT"
echo "[INFO] 默认项目目录: $DEFAULT_PROJECT_DIR"
echo "[INFO] 管理外壳模式: ${VITE_OPENCODE_CLASSIC_SHELL}"

exec "$BUN_CMD" dev -- --host 0.0.0.0 --port "$APP_PORT"
