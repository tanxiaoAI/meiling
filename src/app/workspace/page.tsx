import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { buildOpenCodeAppUrl } from "@/lib/opencode";

export default async function WorkspacePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "http";
  const portalOrigin = host ? `${protocol}://${host}` : new URL(user.opencodeAppUrl).origin.replace(":4444", ":3000");
  redirect(
    buildOpenCodeAppUrl({
      user,
      portalOrigin,
    }),
  );
}
