#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
VENDOR_DIR="$PROJECT_ROOT/vendor/opencode"
BUN_INSTALL_DIR="${BUN_INSTALL:-$HOME/.bun}"
BUN_BIN="$BUN_INSTALL_DIR/bin/bun"
PORT="${OPENCODE_SOURCE_PORT:-4300}"
HOST="${OPENCODE_SOURCE_HOST:-0.0.0.0}"
WORKSPACE_ROOT="${MEILING_WORKSPACE_ROOT:-$PROJECT_ROOT/workspace}"
DATA_ROOT="${MEILING_DATA_ROOT:-$PROJECT_ROOT/data}"

if command -v bun >/dev/null 2>&1; then
  BUN_CMD=$(command -v bun)
elif [ -x "$BUN_BIN" ]; then
  BUN_CMD="$BUN_BIN"
else
  echo "[ERROR] 未检测到 bun，请先运行 bash scripts/bootstrap-opencode-source.sh"
  exit 1
fi

export PATH="$(dirname "$BUN_CMD"):$PATH"
export MEILING_WORKSPACE_ROOT="$WORKSPACE_ROOT"
export MEILING_DATA_ROOT="$DATA_ROOT"

mkdir -p "$MEILING_WORKSPACE_ROOT" "$MEILING_DATA_ROOT"

if [ -n "${DEEPSEEK_API_KEY:-}" ] && [ -z "${OPENCODE_MODEL:-}" ]; then
  export OPENCODE_MODEL="deepseek/deepseek-chat"
fi

cd "$VENDOR_DIR/packages/opencode"

echo "[INFO] 启动 OpenCode 源码后端"
echo "[INFO] 地址: http://$HOST:$PORT"
echo "[INFO] 模型: ${OPENCODE_MODEL:-未显式设置}"
echo "[INFO] 工作区根目录: $MEILING_WORKSPACE_ROOT"
echo "[INFO] 数据根目录: $MEILING_DATA_ROOT"

exec "$BUN_CMD" run --conditions=browser ./src/index.ts serve --hostname "$HOST" --port "$PORT"
