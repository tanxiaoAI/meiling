#!/bin/bash
set -e

echo "==================================="
echo "AI 自媒体系统 - 测试服务启动"
echo "==================================="

# 检查必需的环境变量
if [ -z "$TENANT_ID" ]; then
    echo "错误: TENANT_ID 环境变量未设置"
    exit 1
fi

echo "租户 ID: $TENANT_ID"
echo "工作目录: $WORKSPACE_DIR"
echo "核心资产目录: $CORE_ASSETS_DIR"

# 初始化工作空间
echo "初始化工作空间..."
/app/init-workspace.sh

# 验证核心资产存在
if [ -d "$CORE_ASSETS_DIR" ]; then
    echo "✅ 核心资产目录存在"
    echo "核心资产内容:"
    ls -la $CORE_ASSETS_DIR/ 2>/dev/null || echo "  (空目录)"
else
    echo "⚠️  核心资产目录不存在，这可能是正常的（如果还没复制文件）"
fi

# 设置工作目录权限
echo "设置目录权限..."
chmod -R 755 $WORKSPACE_DIR 2>/dev/null || true
chmod -R 755 $INTERNAL_DIR 2>/dev/null || true

# 如果有参数，执行参数；否则什么也不做，让 CMD 执行
if [ $# -gt 0 ]; then
    echo "执行命令: $@"
    exec "$@"
fi
