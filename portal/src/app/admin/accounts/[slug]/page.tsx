import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin-auth";
import { getAccount } from "@/lib/admin-fs";
import { FileManager } from "./file-manager";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/login");
  }

  const { slug } = await params;
  const account = await getAccount(slug);

  if (!account) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/accounts"
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {account.displayName || account.email}
                </h1>
                <p className="text-sm text-slate-500">
                  {account.email} · 方法论文件管理
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              操作员：{admin.email}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Account info card */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">账号标识</p>
            <p className="mt-1 font-mono text-sm font-medium text-slate-800">
              {account.userSlug}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">租户</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {account.tenantName}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">方法论文档</p>
            <p className="mt-1">
              {account.hasMethodology ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  已配置
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  未配置
                </span>
              )}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">方法论版本</p>
            <p className="mt-1 font-mono text-sm text-slate-700">
              {account.methodologyPackVersion}
            </p>
          </div>
        </div>

        {/* File manager */}
        <FileManager slug={slug} />
      </main>
    </div>
  );
}
