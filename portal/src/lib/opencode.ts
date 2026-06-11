import type { SessionUser } from "@/lib/auth";
import { getDefaultOpenCodeAppUrl } from "@/lib/env";

function createStartupToken(email: string) {
  return Buffer.from(`${email}:`, "utf8").toString("base64");
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
