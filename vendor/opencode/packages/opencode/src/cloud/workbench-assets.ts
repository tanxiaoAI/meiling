import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveMethodologyPack, type MethodologyPackKey } from "./methodology-pack"

const FIXED_FILES = ["使用指南.md"] as const
const FIXED_DIRS = ["01-系统层", "02-业务方法论", "03-执行流程", "04-提示词"] as const
const DYNAMIC_DIRS = ["05-我方资料", "06-沉淀结论", "07-记录表", "08-对标账号", "09-对标内容"] as const
const USER_WORKSPACE_SEGMENT = "users"

type WorkbenchAssetKind = "fixed" | "dynamic"
type WorkbenchAssetType = "file" | "dir"

type WorkbenchAsset = {
  name: string
  kind: WorkbenchAssetKind
  type: WorkbenchAssetType
  source: string
  target: string
}

type WorkbenchManifest = {
  fixedSourceRoot: string
  workspaceRoot: string
  dataRoot: string
  methodologyPackKey: MethodologyPackKey
  methodologyPackName: string
  methodologyPackVersion: string
  assets: WorkbenchAsset[]
  userID?: string
  userSlug?: string
  workspaceDirectory?: string
  dataDirectory?: string
  packDirectory?: string
  contextPath?: string
}

export type MeilingWorkbenchConfig = {
  fixedSourceRoot: string
  workspaceRoot: string
  dataRoot: string
  methodologyPackKey: MethodologyPackKey
  methodologyPackName: string
  methodologyPackVersion: string
}

export type PreparedMeilingWorkbench = {
  enabled: boolean
  fixedSourceRoot: string
  workspaceRoot: string
  dataRoot: string
  methodologyPackKey: MethodologyPackKey
  methodologyPackName: string
  methodologyPackVersion: string
  assets: WorkbenchAsset[]
}

export type PreparedMeilingUserWorkspace = PreparedMeilingWorkbench & {
  userID: string
  userSlug: string
  workspaceDirectory: string
  dataDirectory: string
  packDirectory: string
  contextPath: string
}

const inFlightWorkspacePrep = new Map<string, Promise<PreparedMeilingUserWorkspace>>()

function repoRoot() {
  return path.resolve(fileURLToPath(new URL("../../../../", import.meta.url)))
}

function envOr(defaultValue: string, value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : defaultValue
}

export function resolveMeilingWorkbenchConfig(
  overrides: Partial<MeilingWorkbenchConfig> = {},
): MeilingWorkbenchConfig {
  const workspaceRoot = envOr("/workspace", overrides.workspaceRoot ?? process.env.MEILING_WORKSPACE_ROOT)
  const methodologyPack = resolveMethodologyPack({
    packKey: overrides.methodologyPackKey ?? process.env.MEILING_METHODOLOGY_PACK_KEY,
    packName: overrides.methodologyPackName ?? process.env.MEILING_METHODOLOGY_PACK_NAME,
    packVersion: overrides.methodologyPackVersion ?? process.env.MEILING_METHODOLOGY_PACK_VERSION,
    sourceRoot: overrides.fixedSourceRoot ?? process.env.MEILING_FIXED_ASSET_SOURCE_DIR,
  })
  return {
    fixedSourceRoot: methodologyPack.sourceRoot,
    workspaceRoot,
    dataRoot: envOr("/data", overrides.dataRoot ?? process.env.MEILING_DATA_ROOT),
    methodologyPackKey: methodologyPack.packKey,
    methodologyPackName: methodologyPack.packName,
    methodologyPackVersion: methodologyPack.packVersion,
  }
}

async function exists(target: string) {
  try {
    await fs.lstat(target)
    return true
  } catch {
    return false
  }
}

async function ensureDir(target: string) {
  await fs.mkdir(target, { recursive: true })
}

async function ensureWritableDir(target: string, fallback: string) {
  try {
    await ensureDir(target)
    return target
  } catch {
    await ensureDir(fallback)
    return fallback
  }
}

function normalizeUserSlug(input: string) {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/@/g, "-at-")
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "user"
  )
}

function userWorkspaceDirectory(config: MeilingWorkbenchConfig, userSlug: string) {
  return path.join(config.workspaceRoot, USER_WORKSPACE_SEGMENT, userSlug)
}

function userDataDirectory(config: MeilingWorkbenchConfig, userSlug: string) {
  return path.join(config.dataRoot, USER_WORKSPACE_SEGMENT, userSlug)
}

function userPackDirectory(config: MeilingWorkbenchConfig, userSlug: string) {
  return path.join(userDataDirectory(config, userSlug), "methodology", "active")
}

function userContextPath(packDirectory: string) {
  return path.join(packDirectory, "_runtime", "context.json")
}

async function replaceWithCopy(source: string, target: string) {
  // #region debug-point E:replace-with-copy-start
  void fetch("http://127.0.0.1:7780/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "login-freeze-crash",
      runId: "pre-fix",
      hypothesisId: "E",
      location: "vendor/opencode/packages/opencode/src/cloud/workbench-assets.ts",
      msg: "[DEBUG] replaceWithCopy start",
      data: { source, target },
      ts: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
  await fs.rm(target, { recursive: true, force: true })
  let stat
  try {
    stat = await fs.stat(source)
  } catch {
    return
  }
  if (stat.isDirectory()) {
    await fs.cp(source, target, { recursive: true })
    // #region debug-point E:replace-with-copy-dir-done
    void fetch("http://127.0.0.1:7780/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "login-freeze-crash",
        runId: "pre-fix",
        hypothesisId: "E",
        location: "vendor/opencode/packages/opencode/src/cloud/workbench-assets.ts",
        msg: "[DEBUG] replaceWithCopy dir done",
        data: { source, target },
        ts: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    return
  }
  await ensureDir(path.dirname(target))
  await fs.copyFile(source, target)
  // #region debug-point E:replace-with-copy-file-done
  void fetch("http://127.0.0.1:7780/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "login-freeze-crash",
      runId: "pre-fix",
      hypothesisId: "E",
      location: "vendor/opencode/packages/opencode/src/cloud/workbench-assets.ts",
      msg: "[DEBUG] replaceWithCopy file done",
      data: { source, target },
      ts: Date.now(),
    }),
  }).catch(() => {})
  // #endregion
}

async function isExpectedSymlink(target: string, source: string) {
  try {
    const stat = await fs.lstat(target)
    if (!stat.isSymbolicLink()) return false
    const linked = await fs.readlink(target)
    return path.resolve(path.dirname(target), linked) === path.resolve(source)
  } catch {
    return false
  }
}

async function replaceWithSymlink(source: string, target: string) {
  if (await isExpectedSymlink(target, source)) return
  await fs.rm(target, { recursive: true, force: true })
  await ensureDir(path.dirname(target))
  await fs.symlink(source, target, "dir")
}

async function assertFixedSource(root: string) {
  if (!(await exists(root))) {
    console.warn(`Missing Meiling fixed asset source: ${root}`)
    return
  }

  for (const name of [...FIXED_FILES, ...FIXED_DIRS]) {
    const target = path.join(root, name)
    if (!(await exists(target))) {
      console.warn(`Missing Meiling asset: ${target}`)
    }
  }
}

async function writeManifest(
  manifestPath: string,
  payload: WorkbenchManifest,
) {
  await fs.writeFile(manifestPath, JSON.stringify(payload, null, 2) + "\n", "utf8")
}

async function readManifest(manifestPath: string): Promise<WorkbenchManifest | undefined> {
  try {
    return JSON.parse(await fs.readFile(manifestPath, "utf8")) as WorkbenchManifest
  } catch {
    return undefined
  }
}

async function writeContext(
  contextPath: string,
  payload: {
    account_slug: string
    workspace_root: string
    pack_root: string
    pack_name: string
    pack_version: string
  },
) {
  await ensureDir(path.dirname(contextPath))
  await fs.writeFile(contextPath, JSON.stringify(payload, null, 2) + "\n", "utf8")
}

export async function prepareMeilingWorkbench(
  overrides: Partial<MeilingWorkbenchConfig> = {},
): Promise<PreparedMeilingWorkbench> {
  const config = resolveMeilingWorkbenchConfig(overrides)
  await assertFixedSource(config.fixedSourceRoot)

  const workspaceRoot = await ensureWritableDir(
    config.workspaceRoot,
    path.join(os.tmpdir(), "opencode-meiling-workspace"),
  )
  const dataRoot = await ensureWritableDir(config.dataRoot, path.join(workspaceRoot, ".meiling-data"))
  await ensureDir(path.join(workspaceRoot, USER_WORKSPACE_SEGMENT))
  await ensureDir(path.join(dataRoot, USER_WORKSPACE_SEGMENT))

  return {
    enabled: true,
    fixedSourceRoot: config.fixedSourceRoot,
    workspaceRoot,
    dataRoot,
    methodologyPackKey: config.methodologyPackKey,
    methodologyPackName: config.methodologyPackName,
    methodologyPackVersion: config.methodologyPackVersion,
    assets: [],
  }
}

export function resolveMeilingUserWorkspace(
  userID: string,
  overrides: Partial<MeilingWorkbenchConfig> = {},
): PreparedMeilingUserWorkspace {
  const config = resolveMeilingWorkbenchConfig(overrides)
  const userSlug = normalizeUserSlug(userID)
  const workspaceDirectory = userWorkspaceDirectory(config, userSlug)
  const dataDirectory = userDataDirectory(config, userSlug)
  const packDirectory = userPackDirectory(config, userSlug)
  const contextPath = userContextPath(packDirectory)

  return {
    enabled: true,
    userID,
    userSlug,
    fixedSourceRoot: config.fixedSourceRoot,
    workspaceRoot: config.workspaceRoot,
    dataRoot: config.dataRoot,
    workspaceDirectory,
    dataDirectory,
    packDirectory,
    contextPath,
    methodologyPackKey: config.methodologyPackKey,
    methodologyPackName: config.methodologyPackName,
    methodologyPackVersion: config.methodologyPackVersion,
    assets: [],
  }
}

function preparedUserWorkspace(
  resolved: PreparedMeilingUserWorkspace,
  assets: WorkbenchAsset[],
): PreparedMeilingUserWorkspace {
  return {
    enabled: true,
    userID: resolved.userID,
    userSlug: resolved.userSlug,
    fixedSourceRoot: resolved.fixedSourceRoot,
    workspaceRoot: resolved.workspaceRoot,
    dataRoot: resolved.dataRoot,
    workspaceDirectory: resolved.workspaceDirectory,
    dataDirectory: resolved.dataDirectory,
    packDirectory: resolved.packDirectory,
    contextPath: resolved.contextPath,
    methodologyPackKey: resolved.methodologyPackKey,
    methodologyPackName: resolved.methodologyPackName,
    methodologyPackVersion: resolved.methodologyPackVersion,
    assets,
  }
}

function workspacePrepKey(resolved: PreparedMeilingUserWorkspace) {
  return [
    resolved.workspaceDirectory,
    resolved.packDirectory,
    resolved.methodologyPackKey,
    resolved.methodologyPackVersion,
  ].join("::")
}

async function canReusePreparedWorkspace(
  resolved: PreparedMeilingUserWorkspace,
  manifestPath: string,
): Promise<WorkbenchManifest | undefined> {
  const manifest = await readManifest(manifestPath)
  if (!manifest) return
  if (manifest.userSlug !== resolved.userSlug) return
  if (manifest.workspaceDirectory !== resolved.workspaceDirectory) return
  if (manifest.dataDirectory !== resolved.dataDirectory) return
  if (manifest.packDirectory !== resolved.packDirectory) return
  if (manifest.contextPath !== resolved.contextPath) return
  if (manifest.fixedSourceRoot !== resolved.fixedSourceRoot) return
  if (manifest.methodologyPackKey !== resolved.methodologyPackKey) return
  if (manifest.methodologyPackVersion !== resolved.methodologyPackVersion) return
  if (!(await exists(resolved.contextPath))) return
  for (const name of FIXED_FILES) {
    if (!(await exists(path.join(resolved.packDirectory, name)))) return
  }
  for (const name of FIXED_DIRS) {
    if (!(await exists(path.join(resolved.packDirectory, name)))) return
  }
  return manifest
}

export async function ensureMeilingUserWorkspace(
  userID: string,
  overrides: Partial<MeilingWorkbenchConfig> = {},
): Promise<PreparedMeilingUserWorkspace> {
  const preparedRoot = await prepareMeilingWorkbench(overrides)
  const resolved = resolveMeilingUserWorkspace(userID, {
    ...overrides,
    fixedSourceRoot: preparedRoot.fixedSourceRoot,
    workspaceRoot: preparedRoot.workspaceRoot,
    dataRoot: preparedRoot.dataRoot,
  })
  const manifestPath = path.join(resolved.dataDirectory, ".meiling-workbench.json")
  const key = workspacePrepKey(resolved)
  const existing = inFlightWorkspacePrep.get(key)
  if (existing) return existing

  const prepare = (async () => {
    await ensureDir(resolved.workspaceDirectory)
    await ensureDir(resolved.dataDirectory)
    await ensureDir(resolved.packDirectory)

    const manifest = await canReusePreparedWorkspace(resolved, manifestPath)
    if (manifest) {
      return preparedUserWorkspace(resolved, manifest.assets ?? [])
    }

    const assets: WorkbenchAsset[] = []
    for (const name of DYNAMIC_DIRS) {
      const target = path.join(resolved.workspaceDirectory, name)
      await ensureDir(target)
      assets.push({ name, kind: "dynamic", type: "dir", source: target, target })
    }

    for (const name of FIXED_FILES) {
      const source = path.join(resolved.fixedSourceRoot, name)
      const target = path.join(resolved.packDirectory, name)
      await replaceWithCopy(source, target)
      assets.push({ name, kind: "fixed", type: "file", source, target })
    }

    for (const name of FIXED_DIRS) {
      const source = path.join(resolved.fixedSourceRoot, name)
      const target = path.join(resolved.packDirectory, name)
      await replaceWithCopy(source, target)
      assets.push({ name, kind: "fixed", type: "dir", source, target })
    }

    await writeContext(resolved.contextPath, {
      account_slug: resolved.userSlug,
      workspace_root: resolved.workspaceDirectory,
      pack_root: resolved.packDirectory,
      pack_name: resolved.methodologyPackName,
      pack_version: resolved.methodologyPackVersion,
    })

    await writeManifest(manifestPath, {
      fixedSourceRoot: resolved.fixedSourceRoot,
      workspaceRoot: resolved.workspaceRoot,
      dataRoot: resolved.dataRoot,
      methodologyPackKey: resolved.methodologyPackKey,
      methodologyPackName: resolved.methodologyPackName,
      methodologyPackVersion: resolved.methodologyPackVersion,
      userID: resolved.userID,
      userSlug: resolved.userSlug,
      workspaceDirectory: resolved.workspaceDirectory,
      dataDirectory: resolved.dataDirectory,
      packDirectory: resolved.packDirectory,
      contextPath: resolved.contextPath,
      assets,
    })

    return preparedUserWorkspace(resolved, assets)
  })()

  inFlightWorkspacePrep.set(key, prepare)
  try {
    return await prepare
  } finally {
    if (inFlightWorkspacePrep.get(key) === prepare) {
      inFlightWorkspacePrep.delete(key)
    }
  }
}
