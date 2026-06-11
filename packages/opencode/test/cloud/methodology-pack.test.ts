import { describe, expect, test } from "bun:test"
import path from "node:path"
import { defaultMethodologyPackSourceRoot, resolveMethodologyPack } from "../../src/cloud/methodology-pack"

describe("resolveMethodologyPack", () => {
  test("resolves the built-in base pack", () => {
    const pack = resolveMethodologyPack()
    expect(pack.packKey).toBe("base")
    expect(pack.packName).toBe("基础包")
    expect(pack.packVersion).toBe("v1")
    expect(pack.sourceRoot).toBe(defaultMethodologyPackSourceRoot())
  })

  test("resolves known custom pack metadata", () => {
    const pack = resolveMethodologyPack({
      packKey: "education",
      packVersion: "v2",
    })
    expect(pack.packKey).toBe("education")
    expect(pack.packName).toBe("教培行业定制包")
    expect(pack.packVersion).toBe("v2")
    expect(pack.sourceRoot).toBe(path.join(defaultMethodologyPackSourceRoot()))
  })

  test("throws for unknown pack keys", () => {
    expect(() => resolveMethodologyPack({ packKey: "unknown" })).toThrow("Unknown methodology pack key")
  })
})
