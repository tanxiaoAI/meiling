import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export type MethodologyPackKey = "base" | "furniture" | "education"

export type MethodologyPackDefinition = {
  packKey: MethodologyPackKey
  packName: string
  packVersion: string
  sourceRoot: string
}

type PackRegistryEntry = {
  packName: string
  sourceEnv: string
}

const PACK_REGISTRY: Record<MethodologyPackKey, PackRegistryEntry> = {
  base: {
    packName: "基础包",
    sourceEnv: "MEILING_PACK_BASE_SOURCE_DIR",
  },
  furniture: {
    packName: "家具行业定制包",
    sourceEnv: "MEILING_PACK_FURNITURE_SOURCE_DIR",
  },
  education: {
    packName: "教培行业定制包",
    sourceEnv: "MEILING_PACK_EDUCATION_SOURCE_DIR",
  },
}

function repoRoot() {
  return path.resolve(fileURLToPath(new URL("../../../../", import.meta.url)))
}

function envOr(defaultValue: string, value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : defaultValue
}

function normalizePackKey(value: string | undefined): MethodologyPackKey {
  const trimmed = value?.trim().toLowerCase()
  if (!trimmed) return "base"
  if (trimmed === "base" || trimmed === "furniture" || trimmed === "education") {
    return trimmed
  }
  throw new Error(`Unknown methodology pack key: ${value}`)
}

/** 判断一个路径是否为有效的 Meiling 资产根（至少包含 使用指南.md） */
function looksLikeMeilingSourceRoot(dir: string): boolean {
  try {
    return fs.existsSync(path.join(dir, "使用指南.md"))
  } catch {
    return false
  }
}

/**
 * 按优先级探测 Meiling 资产源根目录：
 * 1. process.execPath 同级目录（生产二进制部署）
 * 2. 源码树中的 meiling/assets/git（开发模式）
 * 返回第一个存在的路径；都不存在则返回二进制同级路径并交由调用方报错
 */
export function defaultMethodologyPackSourceRoot(): string {
  const execDir = path.dirname(process.execPath)
  const execName = path.basename(process.execPath, path.extname(process.execPath))
  const isDevRuntime = ["node", "bun", "tsx", "ts-node"].includes(execName)

  if (isDevRuntime) {
    const sourceTreePath = path.join(repoRoot(), "meiling", "assets", "git")
    if (looksLikeMeilingSourceRoot(sourceTreePath)) return sourceTreePath
    // 开发模式下源码树路径是首选，不存在就退到二进制同级
    const binaryAdjacent = path.join(execDir, "meiling", "assets", "git")
    if (looksLikeMeilingSourceRoot(binaryAdjacent)) return binaryAdjacent
    return sourceTreePath // 都不存在，返回源码路径让 assertFixedSource 报明确错误
  }

  // 生产模式：二进制同级优先
  const binaryAdjacent = path.join(execDir, "meiling", "assets", "git")
  if (looksLikeMeilingSourceRoot(binaryAdjacent)) return binaryAdjacent

  // 退而求其次，尝试源码路径（兼容直接跑 dist 下二进制但 repo 还在的场景）
  const sourceTreePath = path.join(repoRoot(), "meiling", "assets", "git")
  if (looksLikeMeilingSourceRoot(sourceTreePath)) return sourceTreePath

  // 都不存在，返回生产模式首选路径
  return binaryAdjacent
}

export function resolveMethodologyPack(input: {
  packKey?: string
  packName?: string
  packVersion?: string
  sourceRoot?: string
} = {}): MethodologyPackDefinition {
  const packKey = normalizePackKey(input.packKey)
  const entry = PACK_REGISTRY[packKey]

  // 环境变量覆盖优先级最高 — 但仅当目录确实存在时才使用
  const envOverride =
    input.sourceRoot?.trim() ||
    process.env.MEILING_FIXED_ASSET_SOURCE_DIR?.trim() ||
    process.env[entry.sourceEnv]?.trim()

  const sourceRoot = envOverride && looksLikeMeilingSourceRoot(envOverride)
    ? envOverride
    : defaultMethodologyPackSourceRoot()

  return {
    packKey,
    packName: envOr(entry.packName, input.packName),
    packVersion: envOr("v1", input.packVersion),
    sourceRoot,
  }
}
