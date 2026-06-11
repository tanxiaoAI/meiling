import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { authenticateUser } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { buildOpenCodeAppUrl } from "@/lib/opencode";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSessionCookieValue } from "@/lib/session";

const LOGIN_RATE_LIMIT_MAX = 10;
const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateLimit = checkRateLimit(
    `login:${clientIp}`,
    LOGIN_RATE_LIMIT_MAX,
    LOGIN_RATE_LIMIT_WINDOW_MS,
  );

  if (!rateLimit.allowed) {
    return NextResponse.redirect(
      new URL("/login?error=rate_limited", request.url),
      303,
    );
  }
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

  return NextResponse.redirect(redirectUrl, 303);
}
