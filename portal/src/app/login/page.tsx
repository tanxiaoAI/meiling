import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/session";

const errorMap: Record<string, string> = {
  invalid: "账号或密码不正确，请检查后重试。",
  invalid_credentials: "账号或密码不正确，请检查后重试。",
  email_required: "请输入账号邮箱。",
  password_required: "请输入登录密码。",
  email_invalid: "请输入有效的邮箱地址。",
  service_unavailable: "对话工作台暂时不可用，请稍后重试或联系管理员。",
  rate_limited: "登录尝试过于频繁，请等待一分钟后重试。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  const resolvedSearchParams = await searchParams;

  if (user) {
    redirect("/workspace");
  }

  const errorMessage = resolvedSearchParams.error ? errorMap[resolvedSearchParams.error] || "登录失败，请稍后再试。" : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/50 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-10 text-white lg:px-10">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-3 py-1 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
              <p className="text-sm font-medium text-blue-300">AI 自媒体 SaaS</p>
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-tight">先从门户登录，再进入你的对话工作台</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
              这一版采用运营手动发放账号的方式交付客户，不做自助注册，不做短信验证码，不做邮箱验证码。
            </p>
            <div className="mt-8 space-y-4 text-sm text-slate-300">
              <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-emerald-500/20 p-2">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">客户能看到什么</p>
                    <p className="mt-1.5">登录后的对话工作台、固定功能入口、任务记录和可见文件资产。</p>
                  </div>
                </div>
              </div>
              <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-amber-500/20 p-2">
                    <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">客户看不到什么</p>
                    <p className="mt-1.5">方法论、提示词、skills、系统内部目录和任何核心私有资产。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative px-8 py-10 lg:px-10">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1">
              <svg className="h-3.5 w-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="text-xs font-semibold text-blue-700">账号登录</p>
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">登录客户门户</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">请输入运营发给你的账号和密码。登录成功后会直接进入对话工作台，不支持在线注册。</p>
          </div>

          <form action="/api/auth/login" method="post" className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">账号</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="demo@aimedia.local"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">密码</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="请输入密码"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {errorMessage ? (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <button
              type="submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40"
            >
              <span>登录并进入对话工作台</span>
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>

          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">演示账号</p>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>账号：<span className="font-mono font-medium text-slate-800">demo@aimedia.local</span></p>
                  <p>密码：<span className="font-mono font-medium text-slate-800">Demo123456</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
