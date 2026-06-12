import { getSessionUser } from "@/lib/session";
import type { SessionUser } from "@/lib/auth";

export type AdminUser = SessionUser & { role: "operator" };

/**
 * Ensures the current session belongs to an operator.
 * Returns the user if authorized, or null if not.
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "operator") {
    return null;
  }
  return user as AdminUser;
}
