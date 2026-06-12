/**
 * Admin filesystem operations for account and methodology file management.
 *
 * Data directory:  saas-platform/data/users/{slug}/
 * Workspace directory: saas-platform/workspace/users/{slug}/
 * Methodology files live under data/users/{slug}/methodology/active/
 */

import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/** Resolves the absolute path to the saas-platform root (parent of portal). */
function getPlatformRoot(): string {
  if (process.env.PLATFORM_ROOT) {
    return process.env.PLATFORM_ROOT;
  }
  return path.resolve(process.cwd(), "..");
}

function getDataUsersRoot(): string {
  return path.join(getPlatformRoot(), "data", "users");
}

function getWorkspaceUsersRoot(): string {
  return path.join(getPlatformRoot(), "workspace", "users");
}

function getUserDataDir(slug: string): string {
  return path.join(getDataUsersRoot(), slug);
}

function getUserWorkspaceDir(slug: string): string {
  return path.join(getWorkspaceUsersRoot(), slug);
}

function getMethodologyDir(slug: string): string {
  return path.join(getUserDataDir(slug), "methodology", "active");
}

// ---------------------------------------------------------------------------
// Account types
// ---------------------------------------------------------------------------

export interface AccountInfo {
  userSlug: string;
  email: string;
  displayName: string;
  tenantId: string;
  tenantName: string;
  role: string;
  methodologyPackKey: string;
  methodologyPackName: string;
  methodologyPackVersion: string;
  dataDirectory: string;
  workspaceDirectory: string;
  hasMethodology: boolean;
  /** Only populated when listing for auth purposes. */
  password?: string;
}

export interface FileEntry {
  name: string;
  relativePath: string;
  /** "data" or "workspace" */
  location: "data" | "workspace";
  isDirectory: boolean;
  /** File size in bytes, 0 for directories. */
  size: number;
}

export interface AccountCreateInput {
  email: string;
  password: string;
  displayName?: string;
  tenantId?: string;
  tenantName?: string;
  methodologyPackKey?: string;
  methodologyPackName?: string;
  methodologyPackVersion?: string;
}

// ---------------------------------------------------------------------------
// Account operations
// ---------------------------------------------------------------------------

export async function listAccounts(): Promise<AccountInfo[]> {
  const usersDir = getDataUsersRoot();

  let entries: fs.Dirent[];
  try {
    entries = await fsPromises.readdir(usersDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const accounts: AccountInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;

    const slug = entry.name;
    const workbenchPath = path.join(usersDir, slug, ".meiling-workbench.json");

    let account: AccountInfo;

    try {
      const raw = await fsPromises.readFile(workbenchPath, "utf-8");
      const config = JSON.parse(raw);
      account = {
        userSlug: slug,
        email: config.userID || slug,
        displayName: config.userID || slug,
        tenantId: "default",
        tenantName: "默认租户",
        role: "owner",
        methodologyPackKey: config.methodologyPackKey || "base",
        methodologyPackName: config.methodologyPackName || "基础包",
        methodologyPackVersion: config.methodologyPackVersion || "v1",
        dataDirectory: config.dataDirectory || getUserDataDir(slug),
        workspaceDirectory:
          config.workspaceDirectory || getUserWorkspaceDir(slug),
        hasMethodology: true,
        password: config.password || "",
      };
    } catch {
      account = {
        userSlug: slug,
        email: slug,
        displayName: slug,
        tenantId: "default",
        tenantName: "默认租户",
        role: "owner",
        methodologyPackKey: "base",
        methodologyPackName: "基础包",
        methodologyPackVersion: "v1",
        dataDirectory: getUserDataDir(slug),
        workspaceDirectory: getUserWorkspaceDir(slug),
        hasMethodology: false,
      };
    }

    // Check if methodology directory has content
    try {
      const mDir = getMethodologyDir(slug);
      const mEntries = await fsPromises.readdir(mDir);
      account.hasMethodology = mEntries.length > 0;
    } catch {
      account.hasMethodology = false;
    }

    accounts.push(account);
  }

  accounts.sort((a, b) => a.userSlug.localeCompare(b.userSlug));
  return accounts;
}

export async function getAccount(slug: string): Promise<AccountInfo | null> {
  const usersDir = getDataUsersRoot();
  const userDir = path.join(usersDir, slug);

  try {
    await fsPromises.access(userDir);
  } catch {
    return null;
  }

  const workbenchPath = path.join(userDir, ".meiling-workbench.json");
  let account: AccountInfo;

  try {
    const raw = await fsPromises.readFile(workbenchPath, "utf-8");
    const config = JSON.parse(raw);
    account = {
      userSlug: slug,
      email: config.userID || slug,
      displayName: config.userID || slug,
      tenantId: "default",
      tenantName: "默认租户",
      role: "owner",
      methodologyPackKey: config.methodologyPackKey || "base",
      methodologyPackName: config.methodologyPackName || "基础包",
      methodologyPackVersion: config.methodologyPackVersion || "v1",
      dataDirectory: config.dataDirectory || getUserDataDir(slug),
      workspaceDirectory:
        config.workspaceDirectory || getUserWorkspaceDir(slug),
      hasMethodology: true,
    };
  } catch {
    return null;
  }

  try {
    const mDir = getMethodologyDir(slug);
    const mEntries = await fsPromises.readdir(mDir);
    account.hasMethodology = mEntries.length > 0;
  } catch {
    account.hasMethodology = false;
  }

  return account;
}

export async function createAccount(
  input: AccountCreateInput,
): Promise<AccountInfo> {
  const email = input.email.trim().toLowerCase();
  const userSlug = email
    .replace(/@/g, "-at-")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const dataDir = getUserDataDir(userSlug);
  const workspaceDir = getUserWorkspaceDir(userSlug);
  const methodologyDir = getMethodologyDir(userSlug);

  // Check if account already exists
  try {
    await fsPromises.access(dataDir);
    throw new Error(`账号 "${userSlug}" 已存在`);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("账号")) throw err;
    // Directory doesn't exist, proceed
  }

  // Create directories
  await fsPromises.mkdir(dataDir, { recursive: true });
  await fsPromises.mkdir(workspaceDir, { recursive: true });
  await fsPromises.mkdir(methodologyDir, { recursive: true });

  // Create workspace subdirectories
  const workspaceSubdirs = [
    "05-我方资料",
    "06-沉淀结论",
    "07-记录表",
    "08-对标账号",
    "09-对标内容",
  ];
  for (const subdir of workspaceSubdirs) {
    await fsPromises.mkdir(path.join(workspaceDir, subdir), { recursive: true });
  }

  // Create methodology subdirectories
  const methodologySubdirs = [
    "01-系统层",
    "02-业务方法论",
    "03-执行流程",
    "04-提示词",
    "_runtime",
  ];
  for (const subdir of methodologySubdirs) {
    await fsPromises.mkdir(path.join(methodologyDir, subdir), { recursive: true });
  }

  // Try to copy template files from vendor
  const packDir = path.join(
    getPlatformRoot(),
    "vendor",
    "opencode",
    "meiling",
    "assets",
    "git",
  );
  try {
    await fsPromises.access(packDir);
    const templateDirs = ["01-系统层", "02-业务方法论", "03-执行流程", "04-提示词"];
    for (const tplDir of templateDirs) {
      const src = path.join(packDir, tplDir);
      try {
        await fsPromises.access(src);
        const files = await fsPromises.readdir(src);
        for (const file of files) {
          if (file.startsWith(".")) continue;
          const srcFile = path.join(src, file);
          const dstFile = path.join(methodologyDir, tplDir, file);
          await fsPromises.copyFile(srcFile, dstFile);
        }
      } catch {
        // Template directory missing, skip
      }
    }
  } catch {
    // Vendor pack not available, skip template copy
  }

  // Create .meiling-workbench.json
  const workbenchConfig = {
    fixedSourceRoot: path.join(packDir),
    workspaceRoot: path.join(getPlatformRoot(), "workspace"),
    dataRoot: path.join(getPlatformRoot(), "data"),
    methodologyPackKey: input.methodologyPackKey || "base",
    methodologyPackName: input.methodologyPackName || "基础包",
    methodologyPackVersion: input.methodologyPackVersion || "v1",
    userID: email,
    userSlug,
    password: input.password,
    workspaceDirectory: workspaceDir,
    dataDirectory: dataDir,
    packDirectory: methodologyDir,
    contextPath: path.join(methodologyDir, "_runtime", "context.json"),
    assets: [],
  };
  await fsPromises.writeFile(
    path.join(dataDir, ".meiling-workbench.json"),
    JSON.stringify(workbenchConfig, null, 2),
    "utf-8",
  );

  return {
    userSlug,
    email,
    displayName: input.displayName || email,
    tenantId: input.tenantId || "default",
    tenantName: input.tenantName || "默认租户",
    role: "owner",
    methodologyPackKey: input.methodologyPackKey || "base",
    methodologyPackName: input.methodologyPackName || "基础包",
    methodologyPackVersion: input.methodologyPackVersion || "v1",
    dataDirectory: dataDir,
    workspaceDirectory: workspaceDir,
    hasMethodology: true,
  };
}

export async function deleteAccount(slug: string): Promise<boolean> {
  const dataDir = getUserDataDir(slug);
  const workspaceDir = getUserWorkspaceDir(slug);

  let deleted = false;

  try {
    await fsPromises.rm(dataDir, { recursive: true, force: true });
    deleted = true;
  } catch {
    // Data dir might not exist
  }

  try {
    await fsPromises.rm(workspaceDir, { recursive: true, force: true });
    deleted = true;
  } catch {
    // Workspace dir might not exist
  }

  return deleted;
}

// ---------------------------------------------------------------------------
// File operations
// ---------------------------------------------------------------------------

/**
 * Lists files in an account's methodology or workspace directory.
 * `root` is "data" or "workspace".
 * `subPath` is an optional relative path within the methodology/workspace dir.
 */
export async function listFiles(
  slug: string,
  root: "data" | "workspace",
  subPath?: string,
): Promise<FileEntry[]> {
  let baseDir: string;
  if (root === "data") {
    baseDir = getMethodologyDir(slug);
  } else {
    baseDir = getUserWorkspaceDir(slug);
  }

  const targetDir = subPath ? path.join(baseDir, subPath) : baseDir;

  // Validate target is within baseDir
  const resolved = path.resolve(targetDir);
  const resolvedBase = path.resolve(baseDir);
  if (!resolved.startsWith(resolvedBase)) {
    throw new Error("不允许访问该路径");
  }

  let entries: fs.Dirent[];
  try {
    entries = await fsPromises.readdir(targetDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: FileEntry[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".meiling-workbench.json") {
      continue;
    }

    const relPath = subPath
      ? `${subPath}/${entry.name}`
      : entry.name;

    let size = 0;
    if (entry.isFile()) {
      try {
        const stat = await fsPromises.stat(path.join(targetDir, entry.name));
        size = stat.size;
      } catch {
        size = 0;
      }
    }

    files.push({
      name: entry.name,
      relativePath: relPath,
      location: root,
      isDirectory: entry.isDirectory(),
      size,
    });
  }

  files.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return files;
}

/**
 * Reads the content of a file.
 */
export async function readFileContent(
  slug: string,
  root: "data" | "workspace",
  filePath: string,
): Promise<string> {
  const baseDir =
    root === "data" ? getMethodologyDir(slug) : getUserWorkspaceDir(slug);

  const fullPath = path.resolve(baseDir, filePath);
  const resolvedBase = path.resolve(baseDir);

  if (!fullPath.startsWith(resolvedBase)) {
    throw new Error("不允许访问该路径");
  }

  return fsPromises.readFile(fullPath, "utf-8");
}

/**
 * Writes content to a file. Creates parent directories if needed.
 * `isNew` controls whether to allow overwriting existing files.
 */
export async function writeFileContent(
  slug: string,
  root: "data" | "workspace",
  filePath: string,
  content: string,
): Promise<void> {
  const baseDir =
    root === "data" ? getMethodologyDir(slug) : getUserWorkspaceDir(slug);

  const fullPath = path.resolve(baseDir, filePath);
  const resolvedBase = path.resolve(baseDir);

  if (!fullPath.startsWith(resolvedBase)) {
    throw new Error("不允许访问该路径");
  }

  // Prevent writing to hidden config files
  const fileName = path.basename(fullPath);
  if (fileName.startsWith(".") && fileName !== ".gitkeep") {
    throw new Error("不允许修改隐藏配置文件");
  }

  await fsPromises.mkdir(path.dirname(fullPath), { recursive: true });
  await fsPromises.writeFile(fullPath, content, "utf-8");
}

/**
 * Deletes a file or empty directory.
 */
export async function deleteFile(
  slug: string,
  root: "data" | "workspace",
  filePath: string,
): Promise<void> {
  const baseDir =
    root === "data" ? getMethodologyDir(slug) : getUserWorkspaceDir(slug);

  const fullPath = path.resolve(baseDir, filePath);
  const resolvedBase = path.resolve(baseDir);

  if (!fullPath.startsWith(resolvedBase)) {
    throw new Error("不允许访问该路径");
  }

  if (fullPath === resolvedBase) {
    throw new Error("不允许删除根目录");
  }

  const fileName = path.basename(fullPath);
  if (fileName === ".meiling-workbench.json" || fileName === "_runtime") {
    throw new Error("不允许删除系统配置文件");
  }

  await fsPromises.rm(fullPath, { recursive: true, force: true });
}

/**
 * Creates a new directory in the methodology or workspace area.
 */
export async function createDirectory(
  slug: string,
  root: "data" | "workspace",
  dirPath: string,
): Promise<void> {
  const baseDir =
    root === "data" ? getMethodologyDir(slug) : getUserWorkspaceDir(slug);

  const fullPath = path.resolve(baseDir, dirPath);
  const resolvedBase = path.resolve(baseDir);

  if (!fullPath.startsWith(resolvedBase)) {
    throw new Error("不允许访问该路径");
  }

  await fsPromises.mkdir(fullPath, { recursive: true });
}

// ---------------------------------------------------------------------------
// Auth integration: export filesystem accounts for portal login
// ---------------------------------------------------------------------------

import type { PortalUserSeed } from "@/lib/env";

/**
 * Reads all filesystem accounts and returns them as PortalUserSeed objects
 * so the auth system can authenticate against admin-created accounts.
 */
export function getFilesystemPortalUsersSync(): PortalUserSeed[] {
  const usersDir = getDataUsersRoot();

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(usersDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const users: PortalUserSeed[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || typeof entry.isDirectory !== "function") continue;
    if (entry.name.startsWith(".")) continue;

    const workbenchPath = path.join(usersDir, entry.name, ".meiling-workbench.json");
    try {
      const raw = fs.readFileSync(workbenchPath, "utf-8");
      const config = JSON.parse(raw) as Record<string, unknown>;
      if (config.userID && config.password) {
        users.push({
          email: config.userID as string,
          password: config.password as string,
          userSlug: entry.name,
          tenantId: "default",
          tenantName: (config.tenantName as string) || "默认租户",
          displayName: config.userID as string,
          role: "owner",
          methodologyPackKey: (config.methodologyPackKey as string) || "base",
          methodologyPackName: (config.methodologyPackName as string) || "基础包",
          methodologyPackVersion: (config.methodologyPackVersion as string) || "v1",
        });
      }
    } catch {
      // Skip invalid workbench configs
    }
  }

  return users;
}
