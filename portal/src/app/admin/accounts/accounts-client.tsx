"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AccountInfo } from "@/lib/admin-fs";

export function AccountsClient({
  initialAccounts,
}: {
  initialAccounts: AccountInfo[];
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountInfo[]>(initialAccounts);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    tenantName: "",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("邮箱和密码为必填项");
      return;
    }

    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as {
        account?: AccountInfo;
        error?: string;
      };

      if (!res.ok || data.error) {
        setError(data.error || "创建失败");
        return;
      }

      if (data.account) {
        setAccounts((prev) =>
          [...prev, data.account!].sort((a, b) =>
            a.userSlug.localeCompare(b.userSlug),
          ),
        );
      }

      setShowCreateForm(false);
      setForm({ email: "", password: "", displayName: "", tenantName: "" });
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`确定要删除账号 "${slug}" 吗？此操作不可恢复。`)) return;

    setDeleting(slug);
    setError(null);

    try {
      const res = await fetch(`/api/admin/accounts/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "删除失败");
        return;
      }

      setAccounts((prev) => prev.filter((a) => a.userSlug !== slug));
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">账号列表</h2>
          <p className="text-sm text-slate-500">
            共 {accounts.length} 个账号
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-xl hover:shadow-blue-500/40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {showCreateForm ? "取消" : "添加账号"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">创建新账号</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  邮箱 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  密码 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="至少6位"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  显示名称
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="可选"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  租户名称
                </label>
                <input
                  type="text"
                  value={form.tenantName}
                  onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                  placeholder="可选，默认「默认租户」"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              创建账号
            </button>
          </form>
        </div>
      )}

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">暂无账号</p>
          <p className="mt-1 text-sm text-slate-400">
            点击「添加账号」创建第一个账号
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    账号标识
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    邮箱
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    显示名称
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    租户
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    方法论文档
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {accounts.map((account) => (
                  <tr
                    key={account.userSlug}
                    className="transition hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-medium text-slate-700">
                        {account.userSlug}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {account.email}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {account.displayName}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {account.tenantName}
                    </td>
                    <td className="px-5 py-3">
                      {account.hasMethodology ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          已配置
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          未配置
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/admin/accounts/${encodeURIComponent(account.userSlug)}`}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          管理文件
                        </a>
                        <button
                          onClick={() => handleDelete(account.userSlug)}
                          disabled={deleting === account.userSlug}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deleting === account.userSlug ? "删除中..." : "删除"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
