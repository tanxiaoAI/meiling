# AI 自媒体系统 - OpenCode 服务镜像
# 基础镜像：OpenCode 官方镜像
ARG OPENCODE_BASE_IMAGE=ghcr.io/anomalyco/opencode:1.16.2
FROM ${OPENCODE_BASE_IMAGE}

# 设置工作目录
WORKDIR /app

# 安装 curl（用于健康检查）
RUN if command -v apk >/dev/null 2>&1; then \
        apk add --no-cache curl; \
    elif command -v apt-get >/dev/null 2>&1; then \
        apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*; \
    elif command -v yum >/dev/null 2>&1; then \
        yum install -y curl; \
    else \
        exit 1; \
    fi

# 创建核心资产目录（客户不可见）
RUN mkdir -p /opt/core-assets/system \
    && mkdir -p /opt/core-assets/methodology \
    && mkdir -p /opt/core-assets/workflows \
    && mkdir -p /opt/core-assets/prompts \
    && mkdir -p /opt/core-assets/skills

# 创建客户可见工作目录
RUN mkdir -p /workspace/inputs \
    && mkdir -p /workspace/benchmark-accounts \
    && mkdir -p /workspace/benchmark-contents \
    && mkdir -p /workspace/outputs \
    && mkdir -p /workspace/results

# 创建系统内部目录（客户不可见）
RUN mkdir -p /workspace-internal/temp \
    && mkdir -p /workspace-internal/cache \
    && mkdir -p /workspace-internal/logs \
    && mkdir -p /root/.config/opencode/skills \
    && mkdir -p /workspace/.opencode/skills \
    && if id -u opencode >/dev/null 2>&1; then \
        mkdir -p /home/opencode/.config/opencode/skills \
        && chown -R opencode:opencode /home/opencode /workspace/.opencode; \
    fi

# 复制核心资产到镜像（这些内容客户不可见）
# 注意：构建时需要将这些目录复制进来
COPY core-assets/01-系统层/ /opt/core-assets/system/
COPY core-assets/02-业务方法论/ /opt/core-assets/methodology/
COPY core-assets/03-执行流程/ /opt/core-assets/workflows/
COPY core-assets/04-提示词/ /opt/core-assets/prompts/
COPY core-assets/.claude/skills/ /opt/core-assets/skills/claude/
COPY core-assets/.trae/skills/ /opt/core-assets/skills/trae/

# 设置核心资产为只读
RUN chmod -R 444 /opt/core-assets/ \
    && chmod -R 555 $(find /opt/core-assets/ -type d)

# 复制配置文件和启动脚本
COPY config/ /app/config/
COPY scripts/entrypoint.sh /app/entrypoint.sh
COPY scripts/init-workspace.sh /app/init-workspace.sh

# 设置脚本可执行权限
RUN chmod +x /app/entrypoint.sh /app/init-workspace.sh

# 设置环境变量
ENV WORKSPACE_DIR=/workspace \
    CORE_ASSETS_DIR=/opt/core-assets \
    INTERNAL_DIR=/workspace-internal \
    PORT=4096 \
    HOST=0.0.0.0 \
    NODE_ENV=production

# 暴露端口（OpenCode 默认端口）
EXPOSE 4096

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD sh -lc 'for p in /global/health /health /; do code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 2 "http://localhost:4096${p}" 2>/dev/null || echo 000); if [ "$code" = "200" ] || [ "$code" = "401" ] || [ "$code" = "302" ] || [ "$code" = "301" ]; then exit 0; fi; done; exit 1'

# 启动脚本
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
