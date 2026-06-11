# Meiling Workbench

This repository contains the fixed assets and runtime wiring for the Meiling cloud workbench.

## Git-managed assets

These files remain versioned in the repository and stay private to the system layer. They are no longer copied into the customer-visible workspace:

- `meiling/assets/git/使用指南.md`
- `meiling/assets/git/01-系统层`
- `meiling/assets/git/02-业务方法论`
- `meiling/assets/git/03-执行流程`
- `meiling/assets/git/04-提示词`

## Runtime data

Each account now uses two separate runtime roots:

- visible workspace root: `/workspace/users/<account-slug>`
- hidden methodology pack root: `/data/users/<account-slug>/methodology/active`

Only the visible workspace is exposed in the file manager.

These customer-visible directories are created under the visible workspace root:

- `05-我方资料`
- `06-沉淀结论`
- `07-记录表`
- `08-对标账号`
- `09-对标内容`

## Runtime environment

- `MEILING_WORKSPACE_ROOT`: visible workbench base root, defaults to `/workspace`
- `MEILING_DATA_ROOT`: persistent runtime data base root, defaults to `/data`
- `MEILING_FIXED_ASSET_SOURCE_DIR`: optional override for Git-managed asset source
- `VITE_OPENCODE_DEFAULT_PROJECT_DIR`: optional fallback default directory for local development
- `VITE_OPENCODE_DEFAULT_WORKSPACE_ID`: frontend fixed workspace id for cloud routing
- `OPENCODE_WORKSPACE_ID`: server fixed workspace id for instance routing

## Visible workspace shape

At runtime each account is locked to its own directory:

- `/workspace/users/<account-slug>/05-我方资料`
- `/workspace/users/<account-slug>/06-沉淀结论`
- `/workspace/users/<account-slug>/07-记录表`
- `/workspace/users/<account-slug>/08-对标账号`
- `/workspace/users/<account-slug>/09-对标内容`

No `01-04` assets are exposed in the file manager.

## Hidden methodology pack shape

The active methodology pack stays under the hidden data root:

- `/data/users/<account-slug>/methodology/active/01-系统层`
- `/data/users/<account-slug>/methodology/active/02-业务方法论`
- `/data/users/<account-slug>/methodology/active/03-执行流程`
- `/data/users/<account-slug>/methodology/active/04-提示词`
- `/data/users/<account-slug>/methodology/active/_runtime/context.json`

The generated `context.json` contains only:

- `account_slug`
- `workspace_root`
- `pack_root`
- `pack_name`
- `pack_version`

## Local development

The local scripts now default to the same two-root model inside the project:

- `saas-platform/workspace`
- `saas-platform/data`

When `MEILING_WORKSPACE_ROOT` or `MEILING_DATA_ROOT` is explicitly provided, the runtime uses the supplied paths instead.
