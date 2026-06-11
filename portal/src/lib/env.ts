import { randomBytes } from "node:crypto";

const DEFAULT_OPENCODE_BASE_URL = "http://localhost:4096";
const DEFAULT_OPENCODE_APP_URL = "http://localhost:4444";

let _sessionSecret: string | undefined;

export function getSessionSecret(): string {
  if (_sessionSecret) return _sessionSecret;

  const envSecret = process.env.PORTAL_SESSION_SECRET?.trim();
  if (envSecret) {
    _sessionSecret = envSecret;
    return _sessionSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "PORTAL_SESSION_SECRET is required in production. " +
        "Generate a strong random secret and set it in your environment.",
    );
  }

  const generated = randomBytes(32).toString("hex");
  console.warn(
    "[portal] WARNING: PORTAL_SESSION_SECRET not set, using randomly generated secret. " +
      "All sessions will be invalidated on next restart. " +
      "Set PORTAL_SESSION_SECRET for persistent sessions.",
  );
  _sessionSecret = generated;
  return _sessionSecret;
}

export type PortalUserSeed = {
  email: string;
  password: string;
  userSlug?: string;
  tenantId: string;
  tenantName: string;
  displayName: string;
  role: "owner" | "member" | "operator" | "client";
  methodologyPackKey?: string;
  methodologyPackName?: string;
  methodologyPackVersion?: string;
  opencodeUrl?: string;
  opencodeAppUrl?: string;
};

export function getPortalUsersFromEnv(): PortalUserSeed[] | null {
  const raw = process.env.PORTAL_USERS_JSON;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PortalUserSeed[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function getDefaultOpenCodeUrl(): string {
  return process.env.PORTAL_OPENCODE_URL || DEFAULT_OPENCODE_BASE_URL;
}

export function getDefaultOpenCodeAppUrl(): string {
  return process.env.PORTAL_OPENCODE_APP_URL || DEFAULT_OPENCODE_APP_URL;
}
