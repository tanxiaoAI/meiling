import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { resolveRequestOrigin } from "@/lib/request-origin";
import { getSessionUser } from "@/lib/session";

async function logout(request: Request) {
  const user = await getSessionUser();
  const origin = await resolveRequestOrigin(request.url);

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  if (user?.opencodeAppUrl) {
    fetch(new URL("/api/auth/logout", user.opencodeAppUrl).toString(), {
      method: "POST",
      signal: AbortSignal.timeout(3000),
    }).catch(() => {
      // OpenCode 登出通知失败不影响门户登出流程
    });
  }

  return NextResponse.redirect(new URL("/login", origin || request.url), 303);
}

export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  return logout(request);
}
