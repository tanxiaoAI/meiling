#!/bin/sh
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

detect_os() {
  case "$(uname -s)" in
    Linux) echo "linux" ;;
    Darwin) echo "darwin" ;;
    *)
      echo ""
      ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo "x64" ;;
    arm64|aarch64) echo "arm64" ;;
    *)
      echo ""
      ;;
  esac
}

is_musl() {
  if [ "${TARGET_OS:-}" != "linux" ]; then
    return 1
  fi

  if [ -f /etc/alpine-release ]; then
    return 0
  fi

  if command -v ldd >/dev/null 2>&1 && ldd --version 2>&1 | grep -qi "musl"; then
    return 0
  fi

  return 1
}

candidate_targets() {
  case "${TARGET_OS}:${TARGET_ARCH}" in
    linux:x64)
      if is_musl; then
        printf '%s\n' \
          "opencode-linux-x64-musl" \
          "opencode-linux-x64-baseline-musl" \
          "opencode-linux-x64" \
          "opencode-linux-x64-baseline"
        return 0
      fi
      printf '%s\n' \
        "opencode-linux-x64" \
        "opencode-linux-x64-baseline" \
        "opencode-linux-x64-musl" \
        "opencode-linux-x64-baseline-musl"
      return 0
      ;;
    linux:arm64)
      if is_musl; then
        printf '%s\n' \
          "opencode-linux-arm64-musl" \
          "opencode-linux-arm64"
        return 0
      fi
      printf '%s\n' \
        "opencode-linux-arm64" \
        "opencode-linux-arm64-musl"
      return 0
      ;;
    darwin:x64)
      printf '%s\n' \
        "opencode-darwin-x64" \
        "opencode-darwin-x64-baseline"
      return 0
      ;;
    darwin:arm64)
      printf '%s\n' "opencode-darwin-arm64"
      return 0
      ;;
  esac

  return 1
}

find_binary() {
  for dist_root in \
    "$SCRIPT_DIR/vendor/opencode/packages/opencode/dist" \
    "$SCRIPT_DIR/packages/opencode/dist"
  do
    if [ ! -d "$dist_root" ]; then
      continue
    fi

    for target in $(candidate_targets); do
      candidate="$dist_root/$target/bin/opencode"
      if [ -f "$candidate" ]; then
        echo "$candidate"
        return 0
      fi
    done
  done

  return 1
}

extract_bundled_binary() {
  if ! command -v tar >/dev/null 2>&1; then
    echo "[FATAL] 当前环境缺少 tar，无法解压预置 OpenCode 二进制归档" >&2
    return 1
  fi

  for package_root in \
    "$SCRIPT_DIR/vendor/opencode/packages/opencode" \
    "$SCRIPT_DIR/packages/opencode"
  do
    if [ ! -d "$package_root" ]; then
      continue
    fi

    for target in $(candidate_targets); do
      archive="$package_root/prebuilt/$target.tar.gz"
      candidate="$package_root/dist/$target/bin/opencode"

      if [ ! -f "$archive" ]; then
        continue
      fi

      echo "[INFO] 解压预置二进制归档: $archive"
      mkdir -p "$(dirname "$candidate")"
      tar -xzf "$archive" -C "$(dirname "$candidate")"

      if [ -f "$candidate" ]; then
        chmod +x "$candidate" 2>/dev/null || true
        echo "$candidate"
        return 0
      fi

      echo "[FATAL] 已找到归档但解压后未生成二进制: $archive" >&2
      return 1
    done
  done

  return 1
}

list_available_targets() {
  for dist_root in \
    "$SCRIPT_DIR/vendor/opencode/packages/opencode/dist" \
    "$SCRIPT_DIR/packages/opencode/dist"
  do
    if [ ! -d "$dist_root" ]; then
      continue
    fi

    find "$dist_root" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null
  done | sort -u
}

find_assets() {
  dist_assets="$(dirname "$BIN")/meiling/assets/git"
  if [ -f "$dist_assets/使用指南.md" ]; then
    echo "$dist_assets"
    return 0
  fi

  for src in \
    "$SCRIPT_DIR/vendor/opencode" \
    "$SCRIPT_DIR"
  do
    src_assets="$src/meiling/assets/git"
    if [ -f "$src_assets/使用指南.md" ]; then
      echo "$src_assets"
      return 0
    fi
  done

  return 1
}

TARGET_OS="$(detect_os)"
TARGET_ARCH="$(detect_arch)"

if [ -z "$TARGET_OS" ] || [ -z "$TARGET_ARCH" ]; then
  echo "[FATAL] 不支持的运行平台: os=$(uname -s) arch=$(uname -m)" >&2
  exit 1
fi

# ============================================================
# 1. 定位 OpenCode 二进制（按当前运行平台精确匹配）
# ============================================================
BIN="$(find_binary || true)"

if [ -z "$BIN" ]; then
  BIN="$(extract_bundled_binary || true)"
fi

if [ -z "$BIN" ]; then
  echo "[FATAL] 未找到匹配当前平台的 OpenCode 二进制" >&2
  echo "[FATAL] 当前平台: ${TARGET_OS}/${TARGET_ARCH} libc=$(is_musl && echo musl || echo glibc)" >&2
  echo "[FATAL] 期望目标之一:" >&2
  candidate_targets | sed 's/^/[FATAL]   - /' >&2 || true
  echo "[FATAL] 当前 dist 中可见目标:" >&2
  list_available_targets | sed 's/^/[FATAL]   - /' >&2 || echo "[FATAL]   - (无)" >&2
  echo "[FATAL] 请在与部署环境一致的 Linux 环境中构建对应产物，或将对应平台二进制放入 dist 目录。" >&2
  exit 1
fi

echo "[INFO] 目标平台: ${TARGET_OS}/${TARGET_ARCH}"
echo "[INFO] 二进制: $BIN"

# ============================================================
# 2. 定位 Meiling 资产（按优先级查找）
# ============================================================
MEILING_SOURCE="$(find_assets || true)"

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
