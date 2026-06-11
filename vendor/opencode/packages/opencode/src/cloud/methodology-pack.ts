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

export function defaultMethodologyPackSourceRoot() {
  // 生产部署：优先使用二进制文件同级的 meiling/assets/git
  // Bun compile 会把二进制输出到 dist/{name}/bin/opencode，
  // 资产文件需要被构建脚本复制到同级目录
  const execDir = path.dirname(process.execPath)
  const binaryAdjacent = path.join(execDir, "meiling", "assets", "git")
  // 开发模式：源码树中的 meiling/assets/git
  const sourceRelative = path.join(repoRoot(), "meiling", "assets", "git")

  // 如果可执行文件路径不像是开发工具（node/bun/tsx），优先使用二进制同级路径
  const execName = path.basename(process.execPath, path.extname(process.execPath))
  const isDevRuntime = ["node", "bun", "tsx", "ts-node"].includes(execName)
  return isDevRuntime ? sourceRelative : binaryAdjacent
}

export function resolveMethodologyPack(input: {
  packKey?: string
  packName?: string
  packVersion?: string
  sourceRoot?: string
} = {}): MethodologyPackDefinition {
  const packKey = normalizePackKey(input.packKey)
  const entry = PACK_REGISTRY[packKey]
  const fallbackSourceRoot = defaultMethodologyPackSourceRoot()
  return {
    packKey,
    packName: envOr(entry.packName, input.packName),
    packVersion: envOr("v1", input.packVersion),
    sourceRoot: envOr(
      fallbackSourceRoot,
      input.sourceRoot ?? process.env[entry.sourceEnv] ?? (packKey === "base" ? fallbackSourceRoot : undefined),
    ),
  }
}
