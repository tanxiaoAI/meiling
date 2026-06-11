# OpenCode Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build two real OpenCode-callable skills for `商业模式分析` and `内容分析`, using the user's existing methodology, workflow, and prompt assets.

**Architecture:** Treat the existing `skill文件` and `opencode-service/core-assets` trees as the source material, then create concrete `SKILL.md` entrypoints that dispatch to those workflow documents. Store the skills both in the workspace `.trae/skills` directory and in the image-bundled `core-assets/.trae/skills` directory so they are available in development and inside the OpenCode container.

**Tech Stack:** Markdown skill definitions, existing OpenCode container sync logic, Docker image rebuild verification

---

### Task 1: Write Commercial Model Skill

**Files:**
- Create: `saas-platform/.trae/skills/commercial-model-analysis/SKILL.md`
- Create: `saas-platform/opencode-service/core-assets/.trae/skills/commercial-model-analysis/SKILL.md`

**Step 1: Reuse the existing business assets**

Base the skill on:
- `02-业务方法论/商业模式方法论.md`
- `03-执行流程/商业模式分析流程.md`
- `04-提示词/商业模式成稿提示词.md`
- `04-提示词/商业模式局部更新提示词.md`

**Step 2: Define the skill entrypoint**

Make the skill explain:
- when to invoke it
- what files it must read first
- how it decides whether to discuss or draft
- how it writes back to `05-我方资料/我方商业模式.md`

**Step 3: Keep the skill as dispatcher, not a reinvention**

Do not rewrite the underlying methodology. Point the skill to the existing workflow and prompt files.

### Task 2: Write Content Analysis Skill

**Files:**
- Create: `saas-platform/.trae/skills/content-analysis/SKILL.md`
- Create: `saas-platform/opencode-service/core-assets/.trae/skills/content-analysis/SKILL.md`

**Step 1: Reuse the existing content assets**

Base the skill on:
- `02-业务方法论/内容分析方法论.md`
- `03-执行流程/内容分析流程.md`
- `04-提示词/内容分析-无数据提示词.md`
- `04-提示词/内容分析-数据修正后提示词.md`
- `04-提示词/内容分析-内容特征提取提示词.md`

**Step 2: Define the skill entrypoint**

Make the skill explain:
- when to invoke it
- how it determines the analysis starting step
- what files it must locate
- which output files it must generate

**Step 3: Keep outputs aligned with the content workflow**

Make the skill produce the same internal and user-facing files already defined by the existing content pipeline.

### Task 3: Verify Container Availability

**Files:**
- Verify: `saas-platform/opencode-service/core-assets/.trae/skills/**/*`
- Verify: `saas-platform/opencode-service/scripts/entrypoint.sh`

**Step 1: Confirm the skill files exist in the bundled image path**

Ensure the new `SKILL.md` files are located under `core-assets/.trae/skills`.

**Step 2: Rebuild the OpenCode image**

Run: `docker build -t ai-media-opencode-check ./opencode-service`
Expected: build succeeds with the real skill files included

**Step 3: Check edited file diagnostics**

Run diagnostics for the new skill files if available and confirm no syntax/format issues in touched files.
