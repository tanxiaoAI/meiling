# Multi-Tenant Workspace And Methodology Pack Split Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tenant runtime where each account owns one isolated file workspace, while methodology, flows, and prompts are stored in a separate hidden pack root.

**Architecture:** Keep customer-visible data under `/workspace/users/<account-slug>/05-09`, and move system-owned methodology assets to `/data/users/<account-slug>/methodology/active/01-04`. Generate one `_runtime/context.json` per account-pack pair so all business flow documents can read `${WORKSPACE_ROOT}` and `${PACK_ROOT}` without hard-coding tenant paths. Pack selection stays intentionally simple: one account points to one active pack such as `基础包`、`家具行业定制包`、`教培行业定制包`.

**Tech Stack:** Next.js portal, TypeScript, Bun, OpenCode cloud workbench runtime, local file system mounts on Zeabur (`/workspace`, `/data`)

---

### Task 1: Define The Account And Pack Contract

**Files:**
- Modify: `portal/src/lib/env.ts`
- Modify: `portal/src/data/demo-users.ts`
- Modify: `portal/src/lib/auth.ts`
- Modify: `portal/src/lib/session.ts`
- Modify: `portal/src/lib/opencode.ts`

**Step 1: Extend the manual account schema**

Add stable pack fields to each account seed:

- `methodologyPackKey`
- `methodologyPackName`
- `methodologyPackVersion`

Do not add nested `paths` objects.

**Step 2: Keep the account slug as the only tenant-specific path variable**

Continue deriving:

- `workspaceDirectory = /workspace/users/<account-slug>`

Do not store per-folder absolute paths in the session.

**Step 3: Include pack metadata in `SessionUser`**

Persist the selected pack in the signed session so the portal redirect always knows which pack the account should use.

**Step 4: Send pack metadata through the OpenCode bridge URL**

Append query parameters for the first bridge into OpenCode, for example:

- `portal_pack_key`
- `portal_pack_name`
- `portal_pack_version`

Keep `portal_workspace_directory` unchanged.

**Step 5: Verify the portal build**

Run: `npm run build`
Working directory: `saas-platform/portal`
Expected: portal builds successfully with the new account contract.

### Task 2: Add A Simple Methodology Pack Registry

**Files:**
- Create: `vendor/opencode/packages/opencode/src/cloud/methodology-pack.ts`
- Create: `vendor/opencode/packages/opencode/test/cloud/methodology-pack.test.ts`
- Modify: `vendor/opencode/packages/opencode/src/cloud/workbench-assets.ts`

**Step 1: Create the pack registry**

Implement one small registry module that maps a pack key to:

- `packKey`
- `packName`
- `packVersion`
- `sourceRoot`

Support only the first three pack names for now:

- `base` -> `基础包`
- `furniture` -> `家具行业定制包`
- `education` -> `教培行业定制包`

Do not introduce inheritance trees, capability tags, or multi-layer overrides.

**Step 2: Keep `基础包` compatible with the current Git assets**

Map `base` to the existing repository source:

- `vendor/opencode/meiling/assets/git`

This avoids a large file move in the first iteration.

**Step 3: Make unknown pack keys fail fast**

Return a clear runtime error if the configured pack key does not exist.

**Step 4: Add focused registry tests**

Cover:

- known pack key resolves to source root
- unknown pack key throws
- returned metadata includes key, name, and version

**Step 5: Verify the pack registry tests**

Run: `bun test --timeout 30000 test/cloud/methodology-pack.test.ts`
Working directory: `saas-platform/vendor/opencode/packages/opencode`
Expected: all registry tests pass.

### Task 3: Separate Visible Workspace And Hidden Pack Root

**Files:**
- Modify: `vendor/opencode/packages/opencode/src/cloud/workbench-assets.ts`
- Modify: `vendor/opencode/packages/opencode/src/server/routes/instance/httpapi/middleware/workspace-routing.ts`
- Modify: `vendor/opencode/packages/opencode/test/cloud/workbench-assets.test.ts`

**Step 1: Change the prepared per-account runtime shape**

Generate the following structure:

- `/workspace/users/<slug>/05-我方资料`
- `/workspace/users/<slug>/06-沉淀结论`
- `/workspace/users/<slug>/07-记录表`
- `/workspace/users/<slug>/08-对标账号`
- `/workspace/users/<slug>/09-对标内容`
- `/data/users/<slug>/methodology/active/01-系统层`
- `/data/users/<slug>/methodology/active/02-业务方法论`
- `/data/users/<slug>/methodology/active/03-执行流程`
- `/data/users/<slug>/methodology/active/04-提示词`
- `/data/users/<slug>/methodology/active/_runtime/context.json`

**Step 2: Copy or sync the active pack into `/data` only**

Do not expose `01-04` inside `/workspace`.

The active pack root must be:

- `/data/users/<slug>/methodology/active`

**Step 3: Generate `context.json`**

Write one runtime descriptor with only these fields:

```json
{
  "account_slug": "demo-at-aimedia.local",
  "workspace_root": "/workspace/users/demo-at-aimedia.local",
  "pack_root": "/data/users/demo-at-aimedia.local/methodology/active",
  "pack_name": "基础包",
  "pack_version": "v1"
}
```

Do not add a `paths` object.

**Step 4: Update workspace routing to request the correct pack**

When the initial OpenCode bridge provides pack metadata, route workspace creation through that pack assignment.

If no pack metadata is provided on a later request, reuse the already prepared active pack for that account instead of resetting it blindly.

**Step 5: Expand the workbench tests**

Assert all of the following:

- the visible workspace still exposes only `05-09`
- the hidden pack root contains `01-04`
- `_runtime/context.json` exists and contains the exact five fields
- switching the account to another pack updates the active pack metadata without leaking old visible folders

**Step 6: Verify the runtime tests**

Run: `bun test --timeout 30000 test/cloud/workbench-assets.test.ts test/cloud/methodology-pack.test.ts`
Working directory: `saas-platform/vendor/opencode/packages/opencode`
Expected: all runtime tests pass.

### Task 4: Persist Pack Choice Across The Portal Bridge

**Files:**
- Modify: `portal/src/lib/opencode.ts`
- Modify: `vendor/opencode/packages/app/src/utils/portal-bridge.ts`
- Modify: `vendor/opencode/packages/app/src/app.tsx`
- Modify: `vendor/opencode/packages/app/src/pages/layout.tsx`

**Step 1: Extend the browser bridge state**

Store the same pack metadata in `PortalBridgeState` that the portal sends on first redirect.

**Step 2: Preserve pack metadata after refresh**

When query params disappear on later navigations, keep using the saved local bridge state so the frontend still knows which account context it is displaying.

**Step 3: Keep the current sidebar recovery behavior**

Do not regress the existing fixes for:

- portal login redirect
- sidebar auto-open
- reopening the current project on direct `/session` refresh

**Step 4: Smoke test the bridge flow**

Manually verify that:

- login still lands in the correct account workspace
- refresh still opens the same account workspace
- logout still returns to `/login`

**Step 5: Verify edited app diagnostics**

Run diagnostics for the edited portal bridge files and fix any new type or lint errors.

### Task 5: Rewrite Flow Documents To Use `context.json`

**Files:**
- Modify: `vendor/opencode/meiling/assets/git/03-执行流程/商业模式分析流程.md`
- Modify: `skill文件/03-执行流程/商业模式分析流程.md`
- Create: `vendor/opencode/meiling/assets/git/01-系统层/系统初始化校验流程.md`

**Step 1: Replace hard-coded relative business paths**

Update the business flow so it no longer reads:

- `02-业务方法论/...`
- `04-提示词/...`
- `05-我方资料/...`

directly as bare relative paths.

**Step 2: Use the approved opening style**

The top of the business flow should follow the simplified format already agreed with the user:

- fixed read `../_runtime/context.json`
- define `${WORKSPACE_ROOT} = workspace_root`
- define `${PACK_ROOT} = pack_root`
- provide one concrete example path

Do not add extra explanation blocks beyond that format.

**Step 3: Keep business flow and system validation separate**

Move these concerns out of the business flow and into the new system initialization document:

- `context.json` field validation
- missing file fallback rules
- blank-file initialization rules

**Step 4: Update business-path references**

Use only:

- `${PACK_ROOT}/02-业务方法论/...`
- `${PACK_ROOT}/04-提示词/...`
- `${WORKSPACE_ROOT}/05-我方资料/...`

Keep all wording programmatic and stable.

**Step 5: Review the first migrated flow manually**

Check that `商业模式分析流程.md` still reads naturally in Chinese and can be copied as the template for the other flows later.

### Task 6: Document The Production Directory Model

**Files:**
- Modify: `vendor/opencode/meiling/README.md`
- Modify: `README.md`
- Modify: `docs/production-readiness.md`

**Step 1: Document the exact Zeabur runtime layout**

Show the concrete production structure for one account, including:

- visible `/workspace/users/<slug>/05-09`
- hidden `/data/users/<slug>/methodology/active/01-04`
- hidden `/data/users/<slug>/methodology/active/_runtime/context.json`

**Step 2: Document the simple pack model**

Explain that phase one supports one active pack per account and that custom packs are a commercial extension, not a dynamic inheritance system.

**Step 3: Document the account isolation rule**

State clearly that one account/password maps to one isolated visible workspace and one isolated active methodology pack.

**Step 4: Verify docs match implementation**

Check all documented paths, env names, and pack field names against the code before finishing.

### Task 7: Final Verification

**Files:**
- Verify: `portal/src/lib/auth.ts`
- Verify: `portal/src/lib/opencode.ts`
- Verify: `vendor/opencode/packages/opencode/src/cloud/workbench-assets.ts`
- Verify: `vendor/opencode/packages/opencode/src/cloud/methodology-pack.ts`
- Verify: `vendor/opencode/meiling/assets/git/03-执行流程/商业模式分析流程.md`
- Verify: `vendor/opencode/meiling/README.md`

**Step 1: Build the portal**

Run: `npm run build`
Working directory: `saas-platform/portal`
Expected: build passes.

**Step 2: Run focused OpenCode tests**

Run: `bun test --timeout 30000 test/cloud/workbench-assets.test.ts test/cloud/methodology-pack.test.ts`
Working directory: `saas-platform/vendor/opencode/packages/opencode`
Expected: focused runtime tests pass.

**Step 3: Check diagnostics**

Run diagnostics on all edited TypeScript files and fix obvious issues before handoff.

**Step 4: Manual smoke test**

Verify one `基础包` account and one non-base pack account:

- both log in successfully
- each only sees its own `05-09`
- neither sees `01-04` in the file manager
- each generated `context.json` points to its own `workspace_root` and `pack_root`

**Step 5: Commit in small slices**

Create separate commits for:

- account contract and bridge fields
- runtime workspace + pack separation
- flow document migration
- docs updates
