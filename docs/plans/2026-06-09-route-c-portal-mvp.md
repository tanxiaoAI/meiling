# Route C Portal MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first deliverable version of the Route C SaaS portal so manually issued users can sign in, see tenant/project/task data, and open their OpenCode workspace.

**Architecture:** Add a standalone portal app inside `saas-platform/portal` and keep OpenCode as the execution engine behind it. The portal owns login, session, Chinese UI, tenant-facing navigation, and operator-managed account bootstrap through environment variables or local seed data.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, signed cookie session, local JSON seed data, existing OpenCode Docker service

---

### Task 1: Create The Portal App Shell

**Files:**
- Create: `portal/package.json`
- Create: `portal/tsconfig.json`
- Create: `portal/next.config.mjs`
- Create: `portal/postcss.config.js`
- Create: `portal/tailwind.config.ts`
- Create: `portal/src/app/layout.tsx`
- Create: `portal/src/app/globals.css`
- Create: `portal/src/app/page.tsx`

**Step 1: Create package metadata and scripts**

Define `dev`, `build`, `start`, and `lint` scripts with exact runtime dependencies only.

**Step 2: Add Next.js and Tailwind base config**

Set up a minimal App Router project with TypeScript strict mode enabled.

**Step 3: Add the global Chinese shell**

Create a root layout with app title, metadata, base typography, and a neutral enterprise dashboard style.

**Step 4: Add a redirecting landing page**

Make `/` redirect authenticated users to `/workspace` and unauthenticated users to `/login`.

**Step 5: Verify the app boots**

Run: `npm install`
Run: `npm run build`
Expected: production build succeeds without type errors

### Task 2: Implement Manual Account Login

**Files:**
- Create: `portal/src/lib/env.ts`
- Create: `portal/src/lib/auth.ts`
- Create: `portal/src/lib/session.ts`
- Create: `portal/src/data/demo-users.ts`
- Create: `portal/src/app/login/page.tsx`
- Create: `portal/src/app/api/auth/login/route.ts`
- Create: `portal/src/app/api/auth/logout/route.ts`
- Create: `portal/src/middleware.ts`

**Step 1: Define the manual-account data contract**

Support operator-issued accounts with fields for `email`, `password`, `tenantId`, `tenantName`, `displayName`, `role`, and `opencodeUrl`.

**Step 2: Build cookie-based session helpers**

Use signed or tamper-resistant cookies so portal pages can read the logged-in user on the server.

**Step 3: Add the Chinese login page**

Build a simple login form with account/password only. Do not add signup, captcha, SMS, or email verification.

**Step 4: Protect private routes**

Use middleware to guard `/workspace`.

**Step 5: Verify login flow**

Run: `npm run build`
Expected: login routes compile and protected pages require a session

### Task 3: Build Tenant Portal Shell

**Files:**
- Create: `portal/src/components/app-shell.tsx`
- Create: `portal/src/components/nav-links.tsx`
- Create: `portal/src/app/workspace/page.tsx`

**Step 1: Create the authenticated shell**

Add the account-focused shell, current tenant summary, logout action, and Chinese labels.

**Step 2: Create a workspace bridge page**

Make `/workspace` act as the authenticated bridge into the OpenCode conversation page.

**Step 3: Keep portal minimal**

Do not add a separate account page. Keep account/logout controls inside the conversation product shell if needed.

**Step 4: Keep the portal surface minimal**

Avoid introducing dashboard-style product pages that compete with the conversation-first flow.

**Step 5: Verify navigation**

Run: `npm run build`
Expected: the portal only exposes account and conversation entry flows

### Task 4: Add OpenCode Bridge And Skill Visibility Rules

**Files:**
- Modify: `opencode-service/Dockerfile`
- Modify: `opencode-service/scripts/entrypoint.sh`
- Modify: `portal/src/app/workspace/page.tsx`

**Step 1: Bridge authenticated users into OpenCode**

Redirect authenticated users from the portal workspace route into the tenant's OpenCode conversation page.

**Step 2: Wire skills into OpenCode default lookup paths**

At container startup, copy bundled skill assets into `~/.config/opencode/skills/` and `.opencode/skills/` when available.

**Step 3: Preserve current production validation behavior**

Do not break the existing `opencode web` startup flow or health checks.

**Step 4: Verify container script syntax**

Run a shell syntax check or rebuild the image.
Expected: entrypoint still starts cleanly

### Task 5: Document The New Portal Workflow

**Files:**
- Modify: `README.md`
- Modify: `docs/production-readiness.md`
- Create: `portal/.env.example`
- Create: `portal/README.md`

**Step 1: Document the portal app purpose**

Explain that Route C is now the recommended customer-facing entry instead of direct OpenCode-only usage.

**Step 2: Document manual account bootstrap**

Describe how operator-issued accounts are configured and how Zeabur env vars map to them.

**Step 3: Update the launch gap list**

Move the project from “no customer portal” to “portal MVP exists, backend APIs/admin still pending”.

**Step 4: Verify docs match code**

Review all added env names and startup commands for consistency.

### Task 6: Validate The First Deliverable

**Files:**
- Verify: `portal/**/*`
- Verify: `opencode-service/Dockerfile`
- Verify: `opencode-service/scripts/entrypoint.sh`

**Step 1: Install portal dependencies**

Run: `npm install`

**Step 2: Build the portal**

Run: `npm run build`
Expected: build passes

**Step 3: Check edited file diagnostics**

Run diagnostics on the portal app and edited shell scripts.

**Step 4: Smoke test the OpenCode startup path**

Run the existing local production verification flow if time permits.
Expected: current OpenCode validation remains usable after the skill-path change

### Task 7: Keep The Customer Surface Conversation-First

**Files:**
- Modify: `portal/src/components/nav-links.tsx`
- Modify: `portal/src/proxy.ts`
- Verify: `portal/src/app/**/*`

**Step 1: Remove dashboard-style secondary pages**

Do not expose `actions`、`projects`、`tasks`、`files` as customer-facing routes in the first phase.

**Step 2: Keep the portal scoped to login, account, and conversation entry**

Ensure the portal only handles authentication, account management, and redirecting users into OpenCode.

**Step 3: Verify the portal still builds**

Run: `npm run build`
Expected: the reduced portal surface compiles cleanly
