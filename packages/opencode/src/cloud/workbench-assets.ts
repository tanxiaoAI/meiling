import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const FIXED_FILES = ["使用指南.md"] as const
const FIXED_DIRS = ["01-系统层", "02-业务方法论", "03-执行流程", "04-提示词"] as const
const DYNAMIC_DIRS = ["05-我方资料", "06-沉淀结论", "07-记录表", "08-对标账号", "09-对标内容"] as const

type WorkbenchAssetKind = "fixed" | "dynamic"
type WorkbenchAssetType = "file" | "dir"

type WorkbenchAsset = {
  name: string
  kind: WorkbenchAssetKind
  type: WorkbenchAssetType
  source: string
  target: string
}

export type MeilingWorkbenchConfig = {
  fixedSourceRoot: string
  workspaceRoot: string
  dataRoot: string
}

export type PreparedMeilingWorkbench = {
  enabled: boolean
  fixedSourceRoot: string
  workspaceRoot: string
  dataRoot: string
  assets: WorkbenchAsset[]
}

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
  return {
    fixedSourceRoot: envOr(
      path.join(repoRoot(), "meiling", "assets", "git"),
      overrides.fixedSourceRoot ?? process.env.MEILING_FIXED_ASSET_SOURCE_DIR,
    ),
    workspaceRoot,
    dataRoot: envOr("/data", overrides.dataRoot ?? process.env.MEILING_DATA_ROOT),
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

async function replaceWithCopy(source: string, target: string) {
  await fs.rm(target, { recursive: true, force: true })
  const stat = await fs.stat(source)
  if (stat.isDirectory()) {
    await fs.cp(source, target, { recursive: true })
    return
  }
  await ensureDir(path.dirname(target))
  await fs.copyFile(source, target)
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
    throw new Error(`Missing Meiling fixed asset source: ${root}`)
  }

  for (const name of [...FIXED_FILES, ...FIXED_DIRS]) {
    const target = path.join(root, name)
    if (!(await exists(target))) {
      throw new Error(`Missing Meiling asset: ${target}`)
    }
  }
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

  const assets: WorkbenchAsset[] = []

  for (const name of FIXED_FILES) {
    const source = path.join(config.fixedSourceRoot, name)
    const target = path.join(workspaceRoot, name)
    await replaceWithCopy(source, target)
    assets.push({ name, kind: "fixed", type: "file", source, target })
  }

  for (const name of FIXED_DIRS) {
    const source = path.join(config.fixedSourceRoot, name)
    const target = path.join(workspaceRoot, name)
    await replaceWithCopy(source, target)
    assets.push({ name, kind: "fixed", type: "dir", source, target })
  }

  for (const name of DYNAMIC_DIRS) {
    const source = path.join(dataRoot, name)
    const target = path.join(workspaceRoot, name)
    await ensureDir(source)
    await replaceWithSymlink(source, target)
    assets.push({ name, kind: "dynamic", type: "dir", source, target })
  }

  const manifestPath = path.join(workspaceRoot, ".meiling-workbench.json")
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        fixedSourceRoot: config.fixedSourceRoot,
        workspaceRoot,
        dataRoot,
        assets,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  )

  return {
    enabled: true,
    fixedSourceRoot: config.fixedSourceRoot,
    workspaceRoot,
    dataRoot,
    assets,
  }
}
