# OpenCode 源码模式

## 目标

这份文档对应 `vendor/opencode` 里的真实 OpenCode 源码，作为当前主线，不再默认依赖历史 Docker 封装层。

适用场景：

- 需要修改 OpenCode 页面、入口和交互
- 需要在源码层做品牌化和技能入口改造
- 需要把 OpenCode 当成主产品界面，而不是黑盒工作台

## 当前锁定版本

- 上游仓库：`https://github.com/anomalyco/opencode`
- 当前锁定 tag：`v1.16.2`
- 本地源码目录：`vendor/opencode`

## 目录分工

- `vendor/opencode`
  OpenCode 上游源码，先保持上游原样
- `archive/docker-legacy/`
  已归档的历史 Docker 封装链路，仅供追溯旧实现时参考
- `scripts/bootstrap-opencode-source.sh`
  安装 Bun 和 OpenCode 依赖
- `scripts/run-opencode-source-backend.sh`
  启动源码后端服务
- `scripts/run-opencode-source-web.sh`
  启动源码前端页面

## 首次启动

### 1. 安装依赖

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform
AUTO_INSTALL_BUN=true bash scripts/bootstrap-opencode-source.sh
```

如果你已经手动安装了 `bun`，可以直接运行：

```bash
bash scripts/bootstrap-opencode-source.sh
```

默认会优先只安装当前源码改造需要的最小 workspace：

- `packages/opencode`
- `packages/app`

如果后面要做整仓级开发，再显式执行：

```bash
FULL_OPENCODE_INSTALL=true bash scripts/bootstrap-opencode-source.sh
```

### 2. 启动后端

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform
export DEEPSEEK_API_KEY=你的key
bash scripts/run-opencode-source-backend.sh
```

默认地址：

- `http://127.0.0.1:4300`

可覆盖变量：

- `OPENCODE_SOURCE_PORT`
- `OPENCODE_SOURCE_HOST`
- `OPENCODE_MODEL`

### 3. 启动前端

另开一个终端执行：

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform
bash scripts/run-opencode-source-web.sh
```

默认地址：

- 页面：`http://127.0.0.1:4444`
- 后端：`http://127.0.0.1:4300`
- 默认项目：`saas-platform` 根目录，可通过 `OPENCODE_DEFAULT_PROJECT_DIR` 覆盖

可覆盖变量：

- `OPENCODE_WEB_PORT`
- `OPENCODE_SOURCE_SERVER_HOST`
- `OPENCODE_SOURCE_SERVER_PORT`
- `OPENCODE_DEFAULT_PROJECT_DIR`
- `VITE_OPENCODE_CLASSIC_SHELL`

## 当前建议

- 页面和交互改造：
  用源码模式
- Zeabur 排错：
  先核对源码部署的根目录、构建命令和启动命令，不要先入为主套用旧 Docker 配置
- 历史 Docker 文件：
  只在需要追溯旧实现时查看 `archive/docker-legacy/`
- 不要直接在 `vendor/opencode` 大面积散改，先锁版本，再做小步定制

## 生产部署建议

如果部署到 Zeabur 或其他 PaaS，建议把 OpenCode 服务拆成明确的 Build / Start 两步：

### Build 阶段

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform
bash scripts/build-opencode-binary.sh
```

这一步会在 `vendor/opencode/packages/opencode/dist/.../bin/opencode` 产出当前平台的单机二进制，并把 Web UI 一起嵌入进去。

### Start 阶段

```bash
cd /Users/tanxiao/Desktop/AI自媒体系统开发/saas-platform
OPENCODE_PORT=4096 bash scripts/start-opencode-binary.sh
```

运行阶段不再执行源码编译，只 `exec` 已构建好的二进制。

## 下一步改造优先级

1. 首页和空状态页中文化
2. 固定入口按钮接入 `商业模式分析` / `内容分析`
3. 入口点击后自动创建对应对话
4. 再处理更深层的技能展示与对话初始化
