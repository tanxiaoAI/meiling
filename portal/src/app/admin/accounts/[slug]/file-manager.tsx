"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FileEntry } from "@/lib/admin-fs";

type FileRoot = "data" | "workspace";

export function FileManager({ slug }: { slug: string }) {
  const [activeRoot, setActiveRoot] = useState<FileRoot>("data");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File viewer/editor state
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<"file" | "dir">("file");
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/files?slug=${encodeURIComponent(slug)}&root=${activeRoot}`,
      );
      const data = (await res.json()) as { files?: FileEntry[]; error?: string };
      if (!res.ok || data.error) {
        setError(data.error || "加载文件列表失败");
        setFiles([]);
      } else {
        setFiles(data.files || []);
      }
    } catch {
      setError("网络错误");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [slug, activeRoot]);

  // Initialize file list
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      void fetchFiles();
    }
  }, [fetchFiles]);

  // Reload when activeRoot changes
  const prevRootRef = useRef(activeRoot);
  useEffect(() => {
    if (prevRootRef.current !== activeRoot) {
      prevRootRef.current = activeRoot;
      void fetchFiles();
    }
  }, [activeRoot, fetchFiles]);

  async function viewFile(file: FileEntry) {
    if (file.isDirectory) return;
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/files?slug=${encodeURIComponent(slug)}&root=${activeRoot}&path=${encodeURIComponent(file.relativePath)}&action=read`,
      );
      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error || "读取文件失败");
        return;
      }
      setSelectedFile(file);
      setFileContent(data.content || "");
      setEditing(false);
    } catch {
      setError("读取文件失败");
    }
  }

  async function saveFile() {
    if (!selectedFile) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          root: activeRoot,
          path: selectedFile.relativePath,
          content: editContent,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setError(data.error || "保存失败");
        return;
      }
      setFileContent(editContent);
      setEditing(false);
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFileEntry(file: FileEntry) {
    if (!confirm(`确定要删除 "${file.name}" 吗？`)) return;
    setError(null);

    try {
      const res = await fetch(
        `/api/admin/files?slug=${encodeURIComponent(slug)}&root=${activeRoot}&path=${encodeURIComponent(file.relativePath)}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setError(data.error || "删除失败");
        return;
      }
      if (selectedFile?.relativePath === file.relativePath) {
        setSelectedFile(null);
        setFileContent("");
        setEditing(false);
      }
      await fetchFiles();
    } catch {
      setError("删除失败");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setError(null);

    try {
      const fullPath = createName.trim();
      const res = await fetch("/api/admin/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          root: activeRoot,
          path: fullPath,
          content: createType === "file" ? "" : undefined,
          isDirectory: createType === "dir",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setError(data.error || "创建失败");
        return;
      }
      setShowCreateDialog(false);
      setCreateName("");
      await fetchFiles();
    } catch {
      setError("创建失败");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      const content = await file.text();
      const res = await fetch("/api/admin/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          root: activeRoot,
          path: file.name,
          content,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setError(data.error || "上传失败");
        return;
      }
      e.target.value = "";
      await fetchFiles();
    } catch {
      setError("上传失败，请确认文件编码为 UTF-8");
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const rootLabel = activeRoot === "data" ? "方法论文档 (data)" : "工作区文件 (workspace)";

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => {
              setActiveRoot("data");
              setSelectedFile(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeRoot === "data"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            方法论文档
          </button>
          <button
            onClick={() => {
              setActiveRoot("workspace");
              setSelectedFile(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeRoot === "workspace"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            工作区文件
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Upload button */}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            上传文件
            <input type="file" className="hidden" onChange={handleUpload} accept=".md,.txt,.json,.csv,.yaml,.yml" />
          </label>

          {/* Create button */}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新建
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchFiles()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </button>
        </div>
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

      {/* Create dialog */}
      {showCreateDialog && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            在 {rootLabel} 中创建
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCreateType("file")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  createType === "file"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                文件
              </button>
              <button
                type="button"
                onClick={() => setCreateType("dir")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  createType === "dir"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                目录
              </button>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={
                  createType === "file" ? "文件名，如 example.md" : "目录名，如 05-新目录"
                }
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "创建中..." : "创建"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        {/* File list */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-700">
              {rootLabel}
            </h3>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="h-5 w-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : files.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-400">暂无文件</p>
              <p className="mt-1 text-xs text-slate-400">
                点击「新建」或「上传」添加文件
              </p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.relativePath}
                  className={`flex items-center justify-between border-b border-slate-50 px-5 py-2.5 transition last:border-b-0 hover:bg-slate-50 ${
                    selectedFile?.relativePath === file.relativePath
                      ? "bg-blue-50/50"
                      : ""
                  }`}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => viewFile(file)}
                  >
                    {file.isDirectory ? (
                      <svg className="h-4 w-4 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 flex-shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <span className="truncate text-sm text-slate-700">
                      {file.name}
                    </span>
                    {!file.isDirectory && (
                      <span className="flex-shrink-0 text-xs text-slate-400">
                        {formatSize(file.size)}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => deleteFileEntry(file)}
                    className="ml-2 flex-shrink-0 rounded p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
                    title="删除"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File viewer/editor */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-700">
              {selectedFile
                ? editing
                  ? "编辑文件"
                  : "查看文件"
                : "文件预览"}
            </h3>
            {selectedFile && !editing && (
              <button
                onClick={() => {
                  setEditContent(fileContent);
                  setEditing(true);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                编辑
              </button>
            )}
          </div>
          <div className="p-5">
            {!selectedFile ? (
              <div className="flex items-center justify-center py-20 text-sm text-slate-400">
                选择左侧文件查看内容
              </div>
            ) : editing ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  正在编辑：{selectedFile.relativePath}
                </p>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="h-[400px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  spellCheck={false}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveFile()}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-xs text-slate-400">
                  {selectedFile.relativePath}
                </p>
                <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-mono text-sm leading-relaxed text-slate-800">
                  {fileContent || "(空文件)"}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
