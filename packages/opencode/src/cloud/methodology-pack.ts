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
  return path.join(repoRoot(), "meiling", "assets", "git")
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
