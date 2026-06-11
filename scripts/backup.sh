#!/bin/bash
# 备份客户数据脚本
# 用法: ./backup.sh <tenant_id>

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

if [ $# -lt 1 ]; then
    log_error "用法: $0 <tenant_id>"
    exit 1
fi

command -v zeabur >/dev/null 2>&1 || {
    log_error "需要安装 Zeabur CLI"
    exit 1
}

TENANT_ID=$1
BACKUP_DIR="./backups/${TENANT_ID}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
PROJECT_NAME="tenant-${TENANT_ID}"

mkdir -p "$BACKUP_DIR"

log_info "开始备份租户: $TENANT_ID"

# 备份数据库
log_info "备份数据库..."
DB_BACKUP_FILE="${BACKUP_DIR}/db_${TIMESTAMP}.sql"
zeabur database backup \
    --project "$PROJECT_NAME" \
    --service "postgres-${TENANT_ID}" \
    --output "$DB_BACKUP_FILE" || {
    log_error "数据库备份失败"
    exit 1
}
log_info "✓ 数据库备份完成: $DB_BACKUP_FILE"

# 备份 Volume
log_info "备份工作空间..."
VOLUME_BACKUP_FILE="${BACKUP_DIR}/workspace_${TIMESTAMP}.tar.gz"
zeabur volume download \
    --project "$PROJECT_NAME" \
    --volume "workspace-${TENANT_ID}" \
    --output "$VOLUME_BACKUP_FILE" || {
    log_error "工作空间备份失败"
    exit 1
}
log_info "✓ 工作空间备份完成: $VOLUME_BACKUP_FILE"

# 创建备份清单
MANIFEST_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}_manifest.txt"
cat > "$MANIFEST_FILE" << EOF
备份清单
========================================
租户 ID: $TENANT_ID
备份时间: $(date '+%Y-%m-%d %H:%M:%S')

文件列表:
- 数据库: $(basename $DB_BACKUP_FILE) ($(du -h $DB_BACKUP_FILE | cut -f1))
- 工作空间: $(basename $VOLUME_BACKUP_FILE) ($(du -h $VOLUME_BACKUP_FILE | cut -f1))

总大小: $(du -sh $BACKUP_DIR | cut -f1)
========================================
EOF

log_info "✓ 备份清单已生成: $MANIFEST_FILE"
log_info "备份完成！位置: $BACKUP_DIR"
