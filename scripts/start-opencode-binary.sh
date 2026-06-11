#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
DIST_DIR="$PROJECT_ROOT/vendor/opencode/packages/opencode/dist"
HOST="${OPENCODE_HOST:-0.0.0.0}"
PORT="${OPENCODE_PORT:-4096}"
DEFAULT_WORKSPACE_ROOT="$PROJECT_ROOT/workspace"
DEFAULT_DATA_ROOT="$PROJECT_ROOT/data"

if [ ! -d "$DIST_DIR" ]; then
  echo "[ERROR] 未找到构建产物目录: $DIST_DIR"
  echo "[HINT] 先执行 bash scripts/build-opencode-binary.sh"
  exit 1
fi

BINARY_PATH=$(find "$DIST_DIR" -path "*/bin/opencode" -type f | head -n 1)

if [ -z "$BINARY_PATH" ]; then
  echo "[ERROR] 未找到 opencode 二进制，请先执行 bash scripts/build-opencode-binary.sh"
  exit 1
fi

export MEILING_WORKSPACE_ROOT="${MEILING_WORKSPACE_ROOT:-$DEFAULT_WORKSPACE_ROOT}"
export MEILING_DATA_ROOT="${MEILING_DATA_ROOT:-$DEFAULT_DATA_ROOT}"

mkdir -p "$MEILING_WORKSPACE_ROOT" "$MEILING_DATA_ROOT"

echo "[INFO] 启动 OpenCode 生产二进制"
echo "[INFO] 二进制: $BINARY_PATH"
echo "[INFO] 地址: http://$HOST:$PORT"
echo "[INFO] 工作区根目录: $MEILING_WORKSPACE_ROOT"
echo "[INFO] 数据根目录: $MEILING_DATA_ROOT"

exec "$BINARY_PATH" serve --hostname "$HOST" --port "$PORT"
