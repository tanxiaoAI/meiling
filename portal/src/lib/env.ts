const DEFAULT_SESSION_SECRET = "dev-session-secret-change-me";
const DEFAULT_OPENCODE_BASE_URL = "http://localhost:4096";
const DEFAULT_OPENCODE_APP_URL = "http://localhost:4444";

export type PortalUserSeed = {
  email: string;
  password: string;
  userSlug?: string;
  tenantId: string;
  tenantName: string;
  displayName: string;
  role: "owner" | "member" | "operator";
  methodologyPackKey?: string;
  methodologyPackName?: string;
  methodologyPackVersion?: string;
  opencodeUrl?: string;
  opencodeAppUrl?: string;
};

export function getSessionSecret(): string {
  return process.env.PORTAL_SESSION_SECRET || DEFAULT_SESSION_SECRET;
}

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
