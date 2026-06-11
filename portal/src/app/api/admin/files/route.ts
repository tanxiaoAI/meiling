import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import {
  listFiles,
  readFileContent,
  writeFileContent,
  deleteFile,
  createDirectory,
} from "@/lib/admin-fs";

// GET: list files or read file content
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权访问" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const root = searchParams.get("root") as "data" | "workspace" | null;
  const filePath = searchParams.get("path");
  const action = searchParams.get("action"); // "read" to read content, otherwise list

  if (!slug || !root) {
    return NextResponse.json(
      { error: "缺少必要参数: slug, root" },
      { status: 400 },
    );
  }

  if (root !== "data" && root !== "workspace") {
    return NextResponse.json(
      { error: "root 参数必须是 data 或 workspace" },
      { status: 400 },
    );
  }

  try {
    if (action === "read" && filePath) {
      const content = await readFileContent(slug, root, filePath);
      return NextResponse.json({ content, path: filePath });
    }

    const files = await listFiles(slug, root, filePath || undefined);
    return NextResponse.json({ files, slug, root, path: filePath || "" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "操作失败";
    const status = msg.includes("不允许") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// POST: create a new file or directory
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权访问" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      slug: string;
      root: "data" | "workspace";
      path: string;
      content?: string;
      isDirectory?: boolean;
    };

    if (!body.slug || !body.root || !body.path) {
      return NextResponse.json(
        { error: "缺少必要参数: slug, root, path" },
        { status: 400 },
      );
    }

    if (body.isDirectory) {
      await createDirectory(body.slug, body.root, body.path);
    } else {
      await writeFileContent(
        body.slug,
        body.root,
        body.path,
        body.content || "",
      );
    }

    return NextResponse.json({ success: true, path: body.path }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "创建失败";
    const status = msg.includes("不允许") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// PUT: update file content
export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权访问" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      slug: string;
      root: "data" | "workspace";
      path: string;
      content: string;
    };

    if (!body.slug || !body.root || !body.path) {
      return NextResponse.json(
        { error: "缺少必要参数: slug, root, path" },
        { status: 400 },
      );
    }

    await writeFileContent(body.slug, body.root, body.path, body.content);

    return NextResponse.json({ success: true, path: body.path });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "更新失败";
    const status = msg.includes("不允许") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// DELETE: remove a file or directory
export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "未授权访问" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const root = searchParams.get("root") as "data" | "workspace" | null;
  const filePath = searchParams.get("path");

  if (!slug || !root || !filePath) {
    return NextResponse.json(
      { error: "缺少必要参数: slug, root, path" },
      { status: 400 },
    );
  }

  try {
    await deleteFile(slug, root, filePath);
    return NextResponse.json({ success: true, path: filePath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "删除失败";
    const status = msg.includes("不允许") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
