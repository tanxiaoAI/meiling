import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { getSessionSecret } from "@/lib/env";
import type { SessionUser } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

function buildUserSlug(email: string, explicitSlug?: string): string {
  const explicit = explicitSlug?.trim().toLowerCase();
  if (explicit) {
    return explicit.replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "user";
  }

  const emailSlug = email
    .trim()
    .toLowerCase()
    .replace(/@/g, "-at-")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return emailSlug || "user";
}

function normalizeSessionUser(input: unknown): SessionUser | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as Partial<SessionUser> & { email?: unknown; userSlug?: unknown };
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  if (!email) {
    return null;
  }

  const userSlug = buildUserSlug(email, typeof raw.userSlug === "string" ? raw.userSlug : undefined);
  const workspaceDirectory =
    typeof raw.workspaceDirectory === "string" && raw.workspaceDirectory.trim()
      ? raw.workspaceDirectory
      : `/workspace/users/${userSlug}`;

  return {
    email,
    userSlug,
    tenantId: typeof raw.tenantId === "string" ? raw.tenantId : "default",
    tenantName: typeof raw.tenantName === "string" ? raw.tenantName : "默认租户",
    displayName: typeof raw.displayName === "string" && raw.displayName.trim() ? raw.displayName : email,
    role: typeof raw.role === "string" ? raw.role : "client",
    methodologyPackKey:
      typeof raw.methodologyPackKey === "string" && raw.methodologyPackKey.trim() ? raw.methodologyPackKey : "base",
    methodologyPackName:
      typeof raw.methodologyPackName === "string" && raw.methodologyPackName.trim() ? raw.methodologyPackName : "基础包",
    methodologyPackVersion:
      typeof raw.methodologyPackVersion === "string" && raw.methodologyPackVersion.trim()
        ? raw.methodologyPackVersion
        : "v1",
    opencodeUrl:
      typeof raw.opencodeUrl === "string" && raw.opencodeUrl.trim() ? raw.opencodeUrl : "http://localhost:4096",
    opencodeAppUrl:
      typeof raw.opencodeAppUrl === "string" && raw.opencodeAppUrl.trim() ? raw.opencodeAppUrl : "http://localhost:4444",
    workspaceDirectory,
  };
}

function encodePayload(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64url");
}

function decodePayload(payload: string): SessionUser | null {
  try {
    return normalizeSessionUser(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
  } catch {
    return null;
  }
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionCookieValue(user: SessionUser): string {
  const payload = encodePayload(user);
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function parseSessionCookieValue(value: string | undefined): SessionUser | null {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload);

  if (!constantTimeEqual(signature, expectedSignature)) {
    return null;
  }

  return decodePayload(payload);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  return parseSessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
