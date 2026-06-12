import { createHmac, timingSafeEqual } from "node:crypto";

import type { SessionUser } from "@/lib/auth";
import { getDefaultOpenCodeAppUrl, getSessionSecret } from "@/lib/env";

function signStartupToken(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function createStartupToken(email: string) {
  const payload = Buffer.from(
    JSON.stringify({ email, iat: Math.floor(Date.now() / 1000) }),
    "utf8",
  ).toString("base64url");
  const signature = signStartupToken(payload);
  return `${payload}.${signature}`;
}

export function verifyStartupToken(token: string): { email: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!constantTimeEqual(signature, signStartupToken(payload))) return null;
  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (typeof decoded.email !== "string" || !decoded.email) return null;
    const age = Math.floor(Date.now() / 1000) - (decoded.iat || 0);
    if (age < 0 || age > 300) return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
}

function encodeDirectory(directory: string) {
  return Buffer.from(directory, "utf8").toString("base64url");
}

export function buildOpenCodeAppUrl(input: {
  user: SessionUser;
  portalOrigin: string;
}) {
  const target = new URL(getDefaultOpenCodeAppUrl());
  const workspaceDirectory = input.user.workspaceDirectory?.trim() || `/workspace/users/${input.user.userSlug || "user"}`;
  target.pathname = `/${encodeDirectory(workspaceDirectory)}/session`;
  target.searchParams.set("auth_token", createStartupToken(input.user.email));
  target.searchParams.set("portal_display_name", input.user.displayName);
  target.searchParams.set("portal_email", input.user.email);
  target.searchParams.set("portal_base_url", input.portalOrigin);
  target.searchParams.set("portal_logout_url", new URL("/api/auth/logout", input.portalOrigin).toString());
  target.searchParams.set("portal_workspace_directory", workspaceDirectory);
  target.searchParams.set("portal_pack_key", input.user.methodologyPackKey || "base");
  target.searchParams.set("portal_pack_name", input.user.methodologyPackName || "基础包");
  target.searchParams.set("portal_pack_version", input.user.methodologyPackVersion || "v1");
  return target.toString();
}
