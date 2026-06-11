#!/bin/sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 方法论文档放在 meiling/assets/git/ 下，不是 dist/assets/git/
FIXED_ASSETS="$SCRIPT_DIR/vendor/opencode/meiling/assets/git"
if [ -d "$FIXED_ASSETS" ]; then
  export MEILING_FIXED_ASSET_SOURCE_DIR="$FIXED_ASSETS"
else
  echo "[WARN] 未找到 Meiling 资产目录: $FIXED_ASSETS" >&2
  echo "[WARN] OpenCode 将尝试从二进制同级目录查找资产" >&2
fi

BIN=$(find "$SCRIPT_DIR/vendor/opencode/packages/opencode/dist" -path '*/bin/opencode' -type f | head -1)
exec "$BIN" serve --hostname 0.0.0.0 --port "${PORT:-4096}"
