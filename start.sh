#!/bin/sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ============================================================
# 1. 定位 OpenCode 二进制（必须已预编译并提交到 git）
# ============================================================
BIN=$(find "$SCRIPT_DIR/vendor/opencode/packages/opencode/dist" \
  -path '*/bin/opencode' -type f 2>/dev/null | head -1)

if [ -z "$BIN" ]; then
  echo "[FATAL] 未找到预编译的 OpenCode 二进制" >&2
  echo "[FATAL] 请在本地执行构建后提交到 git: cd vendor/opencode && bun run --cwd packages/opencode build --single" >&2
  exit 1
fi

echo "[INFO] 二进制: $BIN"

# ============================================================
# 2. 定位 Meiling 资产（按优先级查找）
# ============================================================
find_assets() {
  # 1) 构建产物中（build 脚本的 cp -r meiling/assets packages/opencode/dist/）
  local dist_assets="$(dirname "$BIN")/meiling/assets/git"
  if [ -f "$dist_assets/使用指南.md" ]; then
    echo "$dist_assets"
    return 0
  fi

  # 2) 源码树中（未执行过 build 时）
  local src="$SCRIPT_DIR/vendor/opencode"
  local src_assets="$src/meiling/assets/git"
  if [ -f "$src_assets/使用指南.md" ]; then
    echo "$src_assets"
    return 0
  fi

  return 1
}

MEILING_SOURCE=$(find_assets) || true

if [ -n "$MEILING_SOURCE" ]; then
  export MEILING_FIXED_ASSET_SOURCE_DIR="$MEILING_SOURCE"
  echo "[INFO] Meiling 资产: $MEILING_FIXED_ASSET_SOURCE_DIR"
else
  echo "[FATAL] 未找到 Meiling 资产" >&2
  exit 1
fi

# ============================================================
# 3. 启动
# ============================================================
echo "[INFO] 启动服务 (0.0.0.0:${PORT:-4096})"
exec "$BIN" serve --hostname 0.0.0.0 --port "${PORT:-4096}"
