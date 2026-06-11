import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/constants";

async function logout(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.redirect(new URL("/login", request.url), 303);
}

export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  return logout(request);
}
