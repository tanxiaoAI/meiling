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
  const protocol = headerStore.get("x-forwarded-proto") || "https";
  const portalOrigin = host ? `${protocol}://${host}` : undefined;

  if (!portalOrigin) {
    return (
      <html lang="zh-CN">
        <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
          <h1>无法确定请求来源</h1>
          <p>请通过正确的域名访问门户。</p>
        </body>
      </html>
    );
  }
  redirect(
    buildOpenCodeAppUrl({
      user,
      portalOrigin,
    }),
  );
}
