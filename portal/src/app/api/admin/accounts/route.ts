import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { listAccounts, createAccount, type AccountCreateInput } from "@/lib/admin-fs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权访问" }, { status: 403 });
  }

  try {
    const accounts = await listAccounts();
    return NextResponse.json({ accounts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "获取账号列表失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权访问" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as AccountCreateInput;

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "邮箱和密码为必填项" },
        { status: 400 },
      );
    }

    const account = await createAccount(body);
    return NextResponse.json({ account }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "创建账号失败";
    const status = msg.includes("已存在") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
