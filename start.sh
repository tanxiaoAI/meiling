#!/bin/sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

BIN=$(find "$SCRIPT_DIR/vendor/opencode/packages/opencode/dist" -path '*/bin/opencode' -type f 2>/dev/null | head -1)

if [ -z "$BIN" ]; then
  echo "[FATAL] 未找到 OpenCode 二进制文件" >&2
  exit 1
fi

echo "[INFO] 二进制: $BIN"

# 不设置 MEILING_FIXED_ASSET_SOURCE_DIR
# 让 methodology-pack.ts 自己探测资产路径
unset MEILING_FIXED_ASSET_SOURCE_DIR

exec "$BIN" serve --hostname 0.0.0.0 --port "${PORT:-4096}"
