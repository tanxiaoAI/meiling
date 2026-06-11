#!/bin/sh
set -eu

echo "==================================="
echo "AI 自媒体系统 - OpenCode 服务启动"
echo "==================================="

# 检查必需的环境变量
if [ -z "${TENANT_ID:-}" ]; then
    echo "错误: TENANT_ID 环境变量未设置"
    exit 1
fi

echo "租户 ID: $TENANT_ID"
echo "工作目录: ${WORKSPACE_DIR:-}"
echo "核心资产目录: ${CORE_ASSETS_DIR:-}"

if [ "${OPENCODE_LOCAL_BASIC_AUTH:-false}" != "true" ]; then
    unset OPENCODE_SERVER_USERNAME
    unset OPENCODE_SERVER_PASSWORD
    echo "本地正式验证模式：已禁用 Basic Auth"
else
    echo "本地正式验证模式：已启用 Basic Auth"
fi

# 初始化工作空间
echo "初始化工作空间..."
/app/init-workspace.sh

# 验证核心资产存在
if [ -z "${CORE_ASSETS_DIR:-}" ] || [ ! -d "$CORE_ASSETS_DIR/system" ]; then
    echo "错误: 核心资产目录不存在"
    exit 1
fi

echo "核心资产验证通过"

sync_skill_bundle() {
    source_dir="$1"
    target_dir="$2"

    if [ ! -d "$source_dir" ]; then
        return 0
    fi

    mkdir -p "$target_dir"

    find "$source_dir" -mindepth 1 -maxdepth 1 | while IFS= read -r item; do
        name=$(basename "$item")
        rm -rf "$target_dir/$name"
        cp -R "$item" "$target_dir/$name"
    done
}

sync_default_skill_dirs() {
    workspace_dir="${WORKSPACE_DIR:-/workspace}"
    root_config_dir="/root/.config/opencode/skills"
    workspace_config_dir="$workspace_dir/.opencode/skills"

    sync_skill_bundle "${CORE_ASSETS_DIR}/skills/claude" "$root_config_dir"
    sync_skill_bundle "${CORE_ASSETS_DIR}/skills/trae" "$root_config_dir"
    sync_skill_bundle "${CORE_ASSETS_DIR}/skills/claude" "$workspace_config_dir"
    sync_skill_bundle "${CORE_ASSETS_DIR}/skills/trae" "$workspace_config_dir"

    if id -u opencode >/dev/null 2>&1; then
        opencode_home=$(awk -F: '/^opencode:/{print $6}' /etc/passwd 2>/dev/null | head -n 1)
        if [ -n "$opencode_home" ]; then
            sync_skill_bundle "${CORE_ASSETS_DIR}/skills/claude" "$opencode_home/.config/opencode/skills"
            sync_skill_bundle "${CORE_ASSETS_DIR}/skills/trae" "$opencode_home/.config/opencode/skills"
            chown -R opencode:opencode "$opencode_home/.config" 2>/dev/null || true
        fi
    fi

    echo "默认 skills 目录同步完成"
}

sync_default_skill_dirs

# 设置工作目录权限
if id -u opencode >/dev/null 2>&1; then
    chown -R opencode:opencode "${WORKSPACE_DIR:-/workspace}" "${INTERNAL_DIR:-/workspace-internal}" 2>/dev/null || true
fi

cd "${WORKSPACE_DIR:-/workspace}"

# 启动 OpenCode 服务
echo "启动 OpenCode 服务..."
exec opencode web \
    --port="${PORT:-4096}" \
    --hostname="${HOST:-0.0.0.0}"
