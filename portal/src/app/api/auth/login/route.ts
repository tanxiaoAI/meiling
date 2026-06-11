import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { authenticateUser } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { buildOpenCodeAppUrl } from "@/lib/opencode";
import { createSessionCookieValue } from "@/lib/session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=email_required", request.url), 303);
  }

  if (!password) {
    return NextResponse.redirect(new URL("/login?error=password_required", request.url), 303);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(new URL("/login?error=email_invalid", request.url), 303);
  }

  const user = authenticateUser(email, password);

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid_credentials", request.url), 303);
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: createSessionCookieValue(user),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const redirectUrl = buildOpenCodeAppUrl({
    user,
    portalOrigin: new URL(request.url).origin,
  });

  try {
    const appOrigin = new URL(redirectUrl).origin;
    const response = await fetch(appOrigin, {
      signal: AbortSignal.timeout(5000),
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok && response.status >= 500) {
      throw new Error(`OpenCode app unavailable: ${response.status}`);
    }
  } catch {
    return NextResponse.redirect(new URL("/login?error=service_unavailable", request.url), 303);
  }

  // #region debug-point A:login-redirect
  fetch("http://127.0.0.1:7780/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "login-freeze-crash",
      runId: "pre-fix",
      hypothesisId: "A",
      location: "portal/src/app/api/auth/login/route.ts",
      msg: "[DEBUG] login redirect built",
      data: {
        email,
        hasUser: !!user,
        opencodeAppUrl: user.opencodeAppUrl,
        workspaceDirectory: user.workspaceDirectory,
        redirectUrl,
      },
      ts: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return NextResponse.redirect(
    redirectUrl,
    303,
  );
}
