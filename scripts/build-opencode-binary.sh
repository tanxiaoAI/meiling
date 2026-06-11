#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
VENDOR_DIR="$PROJECT_ROOT/vendor/opencode"
BUN_INSTALL_DIR="${BUN_INSTALL:-$HOME/.bun}"
BUN_BIN="$BUN_INSTALL_DIR/bin/bun"
SKIP_INSTALL="${SKIP_INSTALL:-false}"

if [ ! -d "$VENDOR_DIR" ]; then
  echo "[ERROR] 未找到 OpenCode 源码目录: $VENDOR_DIR"
  exit 1
fi

if command -v bun >/dev/null 2>&1; then
  BUN_CMD=$(command -v bun)
elif [ -x "$BUN_BIN" ]; then
  BUN_CMD="$BUN_BIN"
else
  echo "[ERROR] 未检测到 bun，请先安装 bun 或执行 bash scripts/bootstrap-opencode-source.sh"
  exit 1
fi

export PATH="$(dirname "$BUN_CMD"):$PATH"

cd "$VENDOR_DIR"

if [ "$SKIP_INSTALL" != "true" ]; then
  echo "[STEP] 安装 OpenCode 构建依赖"
  "$BUN_CMD" install --frozen-lockfile --filter "./packages/opencode" --filter "./packages/app"
fi

echo "[STEP] 构建 OpenCode 生产二进制"
"$BUN_CMD" run --cwd packages/opencode build --single

echo "[DONE] OpenCode 二进制构建完成"
echo "[NEXT] 运行阶段请执行：bash scripts/start-opencode-binary.sh"
