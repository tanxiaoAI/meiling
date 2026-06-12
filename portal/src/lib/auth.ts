import { timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { getPortalUsers } from "@/data/demo-users";
import type { PortalUserSeed } from "@/lib/env";
import { buildUserSlug, buildWorkspaceDirectory } from "@/lib/slug";

export type SessionUser = Omit<PortalUserSeed, "password"> & {
  opencodeUrl: string;
  opencodeAppUrl: string;
  workspaceDirectory: string;
};

function toSessionUser(user: PortalUserSeed): SessionUser {
  const userSlug = buildUserSlug(user.email, user.userSlug);
  return {
    email: user.email,
    userSlug,
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    displayName: user.displayName,
    role: user.role,
    methodologyPackKey: user.methodologyPackKey || "base",
    methodologyPackName: user.methodologyPackName || "基础包",
    methodologyPackVersion: user.methodologyPackVersion || "v1",
    opencodeUrl: user.opencodeUrl || "http://localhost:4096",
    opencodeAppUrl: user.opencodeAppUrl || "http://localhost:4444",
    workspaceDirectory: buildWorkspaceDirectory(userSlug),
  };
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * Tries to authenticate against admin-created filesystem accounts.
 * These accounts are stored in data/users/{slug}/.meiling-workbench.json
 */
function authenticateFilesystemUser(
  email: string,
  password: string,
): PortalUserSeed | null {
  try {
    const userSlug = buildUserSlug(email);
    const platformRoot =
      process.env.PLATFORM_ROOT || path.resolve(process.cwd(), "..");
    const workbenchPath = path.join(
      platformRoot,
      "data",
      "users",
      userSlug,
      ".meiling-workbench.json",
    );

    const raw = fs.readFileSync(workbenchPath, "utf-8");
    const config = JSON.parse(raw) as Record<string, unknown>;

    if (
      typeof config.userID === "string" &&
      config.userID.toLowerCase() === email &&
      typeof config.password === "string" &&
      safeEqual(config.password, password)
    ) {
      return {
        email,
        password: config.password as string,
        userSlug,
        tenantId: "default",
        tenantName: (config.tenantName as string) || "默认租户",
        displayName: (config.userID as string),
        role: "owner",
        methodologyPackKey: (config.methodologyPackKey as string) || "base",
        methodologyPackName:
          (config.methodologyPackName as string) || "基础包",
        methodologyPackVersion:
          (config.methodologyPackVersion as string) || "v1",
      };
    }
  } catch {
    // File doesn't exist or can't be parsed — user not found
  }

  return null;
}

export function authenticateUser(
  email: string,
  password: string,
): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();

  // First, try in-memory portal users (env vars or hardcoded demo users)
  const matched = getPortalUsers().find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );

  if (matched) {
    if (!safeEqual(matched.password, password)) {
      return null;
    }
    return toSessionUser(matched);
  }

  // Fallback: try filesystem accounts (admin-created)
  const fsUser = authenticateFilesystemUser(normalizedEmail, password);
  if (fsUser) {
    return toSessionUser(fsUser);
  }

  return null;
}

export function getPortalUserSeedByEmail(
  email: string,
): PortalUserSeed | null {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    getPortalUsers().find(
      (user) => user.email.toLowerCase() === normalizedEmail,
    ) || null
  );
}
