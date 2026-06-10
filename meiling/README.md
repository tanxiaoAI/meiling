# Meiling Workbench

This repository contains the fixed assets and runtime wiring for the Meiling cloud workbench.

## Git-managed assets

These files are versioned in the repository and copied into the runtime workspace on every server start:

- `meiling/assets/git/使用指南.md`
- `meiling/assets/git/01-系统层`
- `meiling/assets/git/02-业务方法论`
- `meiling/assets/git/03-执行流程`
- `meiling/assets/git/04-提示词`

## Runtime data

These directories are created under the runtime data root and linked into the visible workspace:

- `05-我方资料`
- `06-沉淀结论`
- `07-记录表`
- `08-对标账号`
- `09-对标内容`

## Runtime environment

- `MEILING_WORKSPACE_ROOT`: visible workbench root, defaults to `/workspace`
- `MEILING_DATA_ROOT`: persistent runtime data root, defaults to `/data`
- `MEILING_FIXED_ASSET_SOURCE_DIR`: optional override for Git-managed asset source
- `VITE_OPENCODE_DEFAULT_PROJECT_DIR`: frontend default workbench directory, should point to `/workspace`
- `VITE_OPENCODE_DEFAULT_WORKSPACE_ID`: frontend fixed workspace id for cloud routing
- `OPENCODE_WORKSPACE_ID`: server fixed workspace id for instance routing

When `/workspace` or `/data` is unavailable during local development, the server falls back to a temporary local directory automatically.
