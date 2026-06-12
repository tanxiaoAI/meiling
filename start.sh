#!/bin/sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ============================================================
# 1. 定位 OpenCode 二进制
# ============================================================
DIST_DIR="$SCRIPT_DIR/vendor/opencode/packages/opencode/dist"
BIN=$(find "$DIST_DIR" -path '*/bin/opencode' -type f 2>/dev/null | head -1)

if [ -z "$BIN" ]; then
  echo "[FATAL] 未找到 OpenCode 二进制" >&2
  exit 1
fi

echo "[INFO] 二进制: $BIN"

# ============================================================
# 2. 定位 Meiling 资产
# build 脚本执行过: cp -r meiling/assets packages/opencode/dist/
# 所以资产在 dist/meiling/assets/git/
# ============================================================
MEILING_ASSETS="$DIST_DIR/meiling/assets/git"

if [ -f "$MEILING_ASSETS/使用指南.md" ]; then
  export MEILING_FIXED_ASSET_SOURCE_DIR="$MEILING_ASSETS"
  echo "[INFO] Meiling 资产: $MEILING_FIXED_ASSET_SOURCE_DIR"
else
  echo "[FATAL] 未找到 Meiling 资产: $MEILING_ASSETS" >&2
  echo "[FATAL] 构建脚本应该已执行: cp -r meiling/assets packages/opencode/dist/" >&2
  exit 1
fi

# ============================================================
# 3. 启动
# ============================================================
echo "[INFO] 启动 OpenCode ($PORT)"
exec "$BIN" serve --hostname 0.0.0.0 --port "${PORT:-4096}"
