#!/bin/sh
set -eu

echo "初始化客户工作空间: ${TENANT_ID:-}"

# 确保客户可见目录存在
mkdir -p "${WORKSPACE_DIR:-/workspace}/inputs"
mkdir -p "${WORKSPACE_DIR:-/workspace}/benchmark-accounts"
mkdir -p "${WORKSPACE_DIR:-/workspace}/benchmark-contents"
mkdir -p "${WORKSPACE_DIR:-/workspace}/outputs"
mkdir -p "${WORKSPACE_DIR:-/workspace}/results"

# 确保内部目录存在
mkdir -p "${INTERNAL_DIR:-/workspace-internal}/temp"
mkdir -p "${INTERNAL_DIR:-/workspace-internal}/cache"
mkdir -p "${INTERNAL_DIR:-/workspace-internal}/logs"

# 创建 README 文件指导客户使用
cat > "${WORKSPACE_DIR:-/workspace}/README.md" << 'EOF'
# 欢迎使用 AI 自媒体系统

## 目录说明

- **inputs/** - 上传您的品牌资料和历史内容
- **benchmark-accounts/** - 对标账号分析结果
- **benchmark-contents/** - 对标内容分析结果
- **outputs/** - 系统生成的内容和分析结果
- **results/** - 汇总结论和报告

## 使用流程

1. 上传品牌资料到 `inputs/` 目录
2. 系统会自动分析并生成结果
3. 在 `outputs/` 和 `results/` 查看生成的内容

## 注意事项

- 请勿删除系统生成的文件
- 如有问题请联系技术支持

祝您使用愉快！
EOF

# 创建初始化标记
echo "$(date)" > "${WORKSPACE_DIR:-/workspace}/.initialized"

echo "工作空间初始化完成"
