import { headers } from "next/headers";

export async function resolveRequestOrigin(fallbackUrl?: string): Promise<string | undefined> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  if (!fallbackUrl) {
    return undefined;
  }

  try {
    return new URL(fallbackUrl).origin;
  } catch {
    return undefined;
  }
}
