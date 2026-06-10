import { afterEach, describe, expect, test } from "bun:test"
import fs from "node:fs/promises"
import path from "node:path"
import { prepareMeilingWorkbench } from "../../src/cloud/workbench-assets"
import { tmpdir } from "../fixture/fixture"

const disposers: Array<() => Promise<void>> = []

afterEach(async () => {
  while (disposers.length > 0) {
    await disposers.pop()?.()
  }
})

async function makeTmp() {
  const tmp = await tmpdir()
  disposers.push(() => tmp[Symbol.asyncDispose]())
  return tmp.path
}

describe("prepareMeilingWorkbench", () => {
  test("copies fixed assets and links dynamic assets into the visible workspace", async () => {
    const fixedSourceRoot = await makeTmp()
    const workspaceRoot = await makeTmp()
    const dataRoot = await makeTmp()

    await fs.writeFile(path.join(fixedSourceRoot, "使用指南.md"), "# guide\n", "utf8")
    await fs.mkdir(path.join(fixedSourceRoot, "01-系统层"), { recursive: true })
    await fs.writeFile(path.join(fixedSourceRoot, "01-系统层", "系统设计方法论.md"), "system\n", "utf8")
    for (const dir of ["02-业务方法论", "03-执行流程", "04-提示词"]) {
      await fs.mkdir(path.join(fixedSourceRoot, dir), { recursive: true })
    }

    const result = await prepareMeilingWorkbench({
      fixedSourceRoot,
      workspaceRoot,
      dataRoot,
    })

    expect(result.workspaceRoot).toBe(workspaceRoot)
    expect(result.dataRoot).toBe(dataRoot)
    expect(await fs.readFile(path.join(workspaceRoot, "使用指南.md"), "utf8")).toBe("# guide\n")
    expect(await fs.readFile(path.join(workspaceRoot, "01-系统层", "系统设计方法论.md"), "utf8")).toBe("system\n")

    const dynamicTarget = path.join(workspaceRoot, "05-我方资料")
    const dynamicStat = await fs.lstat(dynamicTarget)
    expect(dynamicStat.isSymbolicLink()).toBe(true)
    expect(await fs.realpath(dynamicTarget)).toBe(path.join(dataRoot, "05-我方资料"))

    const manifest = JSON.parse(await fs.readFile(path.join(workspaceRoot, ".meiling-workbench.json"), "utf8"))
    expect(manifest.workspaceRoot).toBe(workspaceRoot)
    expect(manifest.dataRoot).toBe(dataRoot)
  })
})
