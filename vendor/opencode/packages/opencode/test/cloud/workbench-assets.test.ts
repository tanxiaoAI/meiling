import { afterEach, describe, expect, test } from "bun:test"
import fs from "node:fs/promises"
import path from "node:path"
import { ensureMeilingUserWorkspace, prepareMeilingWorkbench } from "../../src/cloud/workbench-assets"
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

async function seedPackSource(root: string) {
  await fs.writeFile(path.join(root, "使用指南.md"), "# guide\n", "utf8")
  await fs.mkdir(path.join(root, "01-系统层"), { recursive: true })
  await fs.writeFile(path.join(root, "01-系统层", "系统设计方法论.md"), "system\n", "utf8")
  for (const dir of ["02-业务方法论", "03-执行流程", "04-提示词"]) {
    await fs.mkdir(path.join(root, dir), { recursive: true })
    await fs.writeFile(path.join(root, dir, `${dir}.md`), `${dir}\n`, "utf8")
  }
}

describe("prepareMeilingWorkbench", () => {
  test("prepares shared roots without exposing fixed assets in the visible workspace", async () => {
    const fixedSourceRoot = await makeTmp()
    const workspaceRoot = await makeTmp()
    const dataRoot = await makeTmp()

    await seedPackSource(fixedSourceRoot)

    const result = await prepareMeilingWorkbench({
      fixedSourceRoot,
      workspaceRoot,
      dataRoot,
    })

    expect(result.workspaceRoot).toBe(workspaceRoot)
    expect(result.dataRoot).toBe(dataRoot)
    expect(await fs.readdir(workspaceRoot)).toEqual(["users"])
    expect(await fs.readdir(dataRoot)).toEqual(["users"])
  })

  test("creates one isolated visible workspace per account and only exposes 05-09", async () => {
    const fixedSourceRoot = await makeTmp()
    const workspaceRoot = await makeTmp()
    const dataRoot = await makeTmp()

    await seedPackSource(fixedSourceRoot)

    const result = await ensureMeilingUserWorkspace("demo@aimedia.local", {
      fixedSourceRoot,
      workspaceRoot,
      dataRoot,
    })

    expect(result.workspaceDirectory).toBe(path.join(workspaceRoot, "users", "demo-at-aimedia.local"))
    expect(result.dataDirectory).toBe(path.join(dataRoot, "users", "demo-at-aimedia.local"))

    const visibleEntries = (await fs.readdir(result.workspaceDirectory)).sort()
    expect(visibleEntries).toEqual([
      "05-我方资料",
      "06-沉淀结论",
      "07-记录表",
      "08-对标账号",
      "09-对标内容",
    ])

    const dynamicTarget = path.join(result.workspaceDirectory, "05-我方资料")
    const dynamicStat = await fs.lstat(dynamicTarget)
    expect(dynamicStat.isDirectory()).toBe(true)

    const manifest = JSON.parse(await fs.readFile(path.join(result.dataDirectory, ".meiling-workbench.json"), "utf8"))
    expect(manifest.workspaceDirectory).toBe(result.workspaceDirectory)
    expect(manifest.dataDirectory).toBe(result.dataDirectory)
    expect(manifest.packDirectory).toBe(path.join(result.dataDirectory, "methodology", "active"))
    expect(manifest.methodologyPackKey).toBe("base")
    expect(manifest.assets).toHaveLength(10)

    const fixedEntries = (await fs.readdir(result.packDirectory)).sort()
    expect(fixedEntries).toEqual([
      "01-系统层",
      "02-业务方法论",
      "03-执行流程",
      "04-提示词",
      "_runtime",
      "使用指南.md",
    ])

    const context = JSON.parse(await fs.readFile(result.contextPath, "utf8"))
    expect(context).toEqual({
      account_slug: "demo-at-aimedia.local",
      workspace_root: result.workspaceDirectory,
      pack_root: result.packDirectory,
      pack_name: "基础包",
      pack_version: "v1",
    })
  })

  test("rewrites active pack metadata without changing the visible workspace folders", async () => {
    const fixedSourceRoot = await makeTmp()
    const workspaceRoot = await makeTmp()
    const dataRoot = await makeTmp()

    await seedPackSource(fixedSourceRoot)

    const first = await ensureMeilingUserWorkspace("demo@aimedia.local", {
      fixedSourceRoot,
      workspaceRoot,
      dataRoot,
      methodologyPackKey: "base",
      methodologyPackName: "基础包",
      methodologyPackVersion: "v1",
    })

    const second = await ensureMeilingUserWorkspace("demo@aimedia.local", {
      fixedSourceRoot,
      workspaceRoot,
      dataRoot,
      methodologyPackKey: "education",
      methodologyPackName: "教培行业定制包",
      methodologyPackVersion: "v2",
    })

    expect(second.workspaceDirectory).toBe(first.workspaceDirectory)
    expect((await fs.readdir(second.workspaceDirectory)).sort()).toEqual([
      "05-我方资料",
      "06-沉淀结论",
      "07-记录表",
      "08-对标账号",
      "09-对标内容",
    ])

    const context = JSON.parse(await fs.readFile(second.contextPath, "utf8"))
    expect(context.pack_name).toBe("教培行业定制包")
    expect(context.pack_version).toBe("v2")
  })
})
