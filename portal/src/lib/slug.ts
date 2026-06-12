/**
 * 用户 slug 和 workspace 目录的集中计算逻辑。
 * auth.ts 和 session.ts 共用此模块，避免分散重复。
 */

const SLUG_REPLACE_RE = /[^a-z0-9._-]+/g;
const SLUG_TRIM_RE = /^-+|-+$/g;

export function buildUserSlug(email: string, explicitSlug?: string): string {
  const explicit = explicitSlug?.trim().toLowerCase();
  if (explicit) {
    return explicit.replace(SLUG_REPLACE_RE, "-").replace(SLUG_TRIM_RE, "") || "user";
  }

  const emailSlug = email
    .trim()
    .toLowerCase()
    .replace(/@/g, "-at-")
    .replace(SLUG_REPLACE_RE, "-")
    .replace(SLUG_TRIM_RE, "");

  return emailSlug || "user";
}

export function buildWorkspaceDirectory(userSlug: string): string {
  return `/workspace/users/${userSlug}`;
}
