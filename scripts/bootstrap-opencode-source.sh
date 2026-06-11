#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
VENDOR_DIR="$PROJECT_ROOT/vendor/opencode"
BUN_INSTALL_DIR="${BUN_INSTALL:-$HOME/.bun}"
BUN_BIN="$BUN_INSTALL_DIR/bin/bun"
AUTO_INSTALL_BUN="${AUTO_INSTALL_BUN:-false}"
FULL_OPENCODE_INSTALL="${FULL_OPENCODE_INSTALL:-false}"

if [ ! -d "$VENDOR_DIR" ]; then
  echo "[ERROR] 未找到 OpenCode 源码目录: $VENDOR_DIR"
  echo "请先确认 vendor/opencode 已存在。"
  exit 1
fi

ensure_bun() {
  if command -v bun >/dev/null 2>&1; then
    command -v bun
    return 0
  fi

  if [ -x "$BUN_BIN" ]; then
    echo "$BUN_BIN"
    return 0
  fi

  if [ "$AUTO_INSTALL_BUN" != "true" ]; then
    echo "[ERROR] 未检测到 bun。"
    echo "可执行以下任一方式后重试："
    echo "  1. 手动安装 bun: https://bun.sh"
    echo "  2. 使用 AUTO_INSTALL_BUN=true bash scripts/bootstrap-opencode-source.sh"
    exit 1
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "[ERROR] 自动安装 bun 需要 curl。"
    exit 1
  fi

  echo "[INFO] 未检测到 bun，开始安装到 $BUN_INSTALL_DIR"
  curl -fsSL https://bun.sh/install | bash

  if [ ! -x "$BUN_BIN" ]; then
    echo "[ERROR] bun 安装完成后仍未找到 $BUN_BIN"
    exit 1
  fi

  echo "$BUN_BIN"
}

BUN_CMD=$(ensure_bun)
export PATH="$(dirname "$BUN_CMD"):$PATH"

echo "[INFO] 使用 bun: $BUN_CMD"
echo "[INFO] 进入源码目录: $VENDOR_DIR"
cd "$VENDOR_DIR"

echo "[STEP] 安装 OpenCode 源码依赖"
if [ "$FULL_OPENCODE_INSTALL" = "true" ]; then
  "$BUN_CMD" install --frozen-lockfile
else
  echo "[INFO] 默认只安装源码改造当前需要的 workspace：packages/opencode + packages/app"
  "$BUN_CMD" install --frozen-lockfile --filter "./packages/opencode" --filter "./packages/app"
fi

echo "[DONE] OpenCode 源码依赖安装完成"
echo "[NEXT] 后端服务: bash scripts/run-opencode-source-backend.sh"
echo "[NEXT] Web 前端:  bash scripts/run-opencode-source-web.sh"
