import fs from "node:fs"
import path from "node:path"

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

/** 通过 使用指南.md 判断目录是否为有效的 Meiling 资产根 */
function isValidSourceRoot(dir: string): boolean {
  try {
    return fs.statSync(path.join(dir, "使用指南.md")).isFile()
  } catch {
    return false
  }
}

/**
 * 从目标目录向上遍历，查找包含 meiling 资产的仓库根。
 *
 * 仓库结构有两种可能：
 *   {root}/vendor/opencode/meiling/assets/git/          (本项目结构)
 *   {root}/meiling/assets/git/                           (简化的 OpenCode 结构)
 *
 * 遍历策略：从 startDir 开始，逐级向上一路到 /，每级检查：
 *   <dir>/vendor/opencode/meiling/assets/git/使用指南.md
 *   <dir>/meiling/assets/git/使用指南.md
 *   二进制同级 <execDir>/meiling/assets/git/使用指南.md
 *
 * 返回找到第一个有效路径，或 null。
 */
function findSourceRoot(): string | null {
  const execDir = path.dirname(process.execPath)

  // 0. 二进制同级（build.ts 会将资产复制到这里）
  const binaryAdjacent = path.join(execDir, "meiling", "assets", "git")
  if (isValidSourceRoot(binaryAdjacent)) return binaryAdjacent

  // 1. 从二进制目录开始向上遍历
  let dir = execDir
  const root = path.parse(dir).root
  while (dir !== root) {
    const vendorPath = path.join(dir, "vendor", "opencode", "meiling", "assets", "git")
    if (isValidSourceRoot(vendorPath)) return vendorPath

    const directPath = path.join(dir, "meiling", "assets", "git")
    if (isValidSourceRoot(directPath)) return directPath

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  // 2. 从 cwd 开始向上遍历（cwd 和 execPath 可能不同）
  try {
    let cwd = process.cwd()
    while (cwd !== root) {
      const vendorPath = path.join(cwd, "vendor", "opencode", "meiling", "assets", "git")
      if (isValidSourceRoot(vendorPath)) return vendorPath

      const directPath = path.join(cwd, "meiling", "assets", "git")
      if (isValidSourceRoot(directPath)) return directPath

      const parent = path.dirname(cwd)
      if (parent === cwd) break
      cwd = parent
    }
  } catch {
    // cwd 不可访问
  }

  return null
}

export function defaultMethodologyPackSourceRoot(): string {
  return findSourceRoot() ?? ""
}

export function resolveMethodologyPack(input: {
  packKey?: string
  packName?: string
  packVersion?: string
  sourceRoot?: string
} = {}): MethodologyPackDefinition {
  const packKey = normalizePackKey(input.packKey)
  const entry = PACK_REGISTRY[packKey]

  // 环境变量显式指定 > 自动探测
  const envOverride =
    input.sourceRoot?.trim() ||
    process.env.MEILING_FIXED_ASSET_SOURCE_DIR?.trim() ||
    process.env[entry.sourceEnv]?.trim()

  const sourceRoot = envOverride && isValidSourceRoot(envOverride)
    ? envOverride
    : defaultMethodologyPackSourceRoot()

  return {
    packKey,
    packName: envOr(entry.packName, input.packName),
    packVersion: envOr("v1", input.packVersion),
    sourceRoot,
  }
}
