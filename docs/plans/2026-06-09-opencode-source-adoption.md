# OpenCode Source Adoption Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vendor a stable OpenCode source baseline into this workspace and make it locally runnable in a controlled way.

**Architecture:** Import the upstream `anomalyco/opencode` source at a locked `v1.16.2` tag into a dedicated vendor directory, keep the existing `opencode-service` image wrapper for current production validation, and add separate docs/scripts for running the vendored source directly. This keeps upstream code isolated while letting us customize the real product surface.

**Tech Stack:** Git clone, vendored upstream source, local bootstrap scripts, existing Docker wrapper for compatibility checks

---

### Task 1: Import Locked OpenCode Source

**Files:**
- Create: `saas-platform/vendor/opencode/`
- Modify: `saas-platform/README.md`

**Steps:**
1. Clone `https://github.com/anomalyco/opencode.git` at `v1.16.2`
2. Keep the upstream tree isolated under `vendor/opencode`
3. Document the locked source version in the main README

### Task 2: Inspect Source Run Requirements

**Files:**
- Read: `saas-platform/vendor/opencode/package.json`
- Read: `saas-platform/vendor/opencode/README.md`
- Read: relevant package manager and app docs inside `vendor/opencode`

**Steps:**
1. Confirm the package manager and workspace layout
2. Confirm how the web app is started in source mode
3. Confirm which env/config path we need to bridge from the existing project

### Task 3: Add Local Source-Mode Runner

**Files:**
- Create: `saas-platform/scripts/bootstrap-opencode-source.sh`
- Create: `saas-platform/docs/opencode-source-mode.md`

**Steps:**
1. Add a bootstrap script for installing dependencies in the vendored source tree
2. Add a documented local run path that does not replace the existing Docker validation path
3. Keep the instructions version-pinned and explicit

### Task 4: Verify Stable Local Startup

**Files:**
- Verify: `saas-platform/vendor/opencode/**/*`
- Verify: `saas-platform/scripts/bootstrap-opencode-source.sh`
- Verify: `saas-platform/docs/opencode-source-mode.md`

**Steps:**
1. Run the bootstrap script
2. Run the minimal source-mode startup command
3. Capture the exact command path that succeeds so later UI customization work starts from a stable baseline
