import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getAccount, deleteAccount } from "@/lib/admin-fs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权访问" }, { status: 403 });
  }

  const { slug } = await params;
  const account = await getAccount(slug);

  if (!account) {
    return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  }

  return NextResponse.json({ account });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权访问" }, { status: 403 });
  }

  const { slug } = await params;

  if (!slug || slug.length < 2) {
    return NextResponse.json({ error: "无效的账号标识" }, { status: 400 });
  }

  try {
    const deleted = await deleteAccount(slug);
    if (!deleted) {
      return NextResponse.json({ error: "删除失败，账号可能不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "删除账号失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
