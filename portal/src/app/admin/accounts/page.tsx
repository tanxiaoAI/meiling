import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin-auth";
import { listAccounts } from "@/lib/admin-fs";
import { AccountsClient } from "./accounts-client";

export default async function AccountsPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/login");
  }

  const accounts = await listAccounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">管理后台</h1>
            <p className="text-sm text-slate-500">账号分发与管理</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              当前操作员：{admin.email}
            </span>
            <a
              href="/api/auth/logout"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              退出登录
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <AccountsClient initialAccounts={accounts} />
      </main>
    </div>
  );
}
