import { timingSafeEqual } from "node:crypto";

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

export function authenticateUser(email: string, password: string): SessionUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  const matched = getPortalUsers().find((user) => user.email.toLowerCase() === normalizedEmail);

  if (!matched) {
    return null;
  }

  if (!safeEqual(matched.password, password)) {
    return null;
  }

  return toSessionUser(matched);
}

export function getPortalUserSeedByEmail(email: string): PortalUserSeed | null {
  const normalizedEmail = email.trim().toLowerCase();
  return getPortalUsers().find((user) => user.email.toLowerCase() === normalizedEmail) || null;
}
