import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

/**
 * POST /api/feedback —— 前台访客提交笔记反馈（无需登录）。
 * 写入 content/feedback/<slug>-<时间戳>.json，前台不展示，仅管理员后台可见。
 * 字段：slug / title / location / detail / contact（可选）。
 */
export async function POST(req: NextRequest) {
  let body: {
    slug?: unknown;
    title?: unknown;
    location?: unknown;
    detail?: unknown;
    contact?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["数据格式错误"] }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const detail = typeof body.detail === "string" ? body.detail.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const contact = typeof body.contact === "string" ? body.contact.trim() : "";

  if (!slug) return NextResponse.json({ ok: false, errors: ["缺少笔记标识"] }, { status: 400 });
  if (!detail) return NextResponse.json({ ok: false, errors: ["问题说明不能为空"] }, { status: 400 });
  if (detail.length > 2000) return NextResponse.json({ ok: false, errors: ["问题说明过长"] }, { status: 400 });

  // 防越权路径：slug 只能取安全的文件名字符
  const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");

  const payload = {
    slug,
    title,
    location,
    detail,
    contact,
    submittedAt: new Date().toISOString(),
    handled: false,
  };

  try {
    const dir = path.join(process.cwd(), "content/feedback");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, `${safeSlug}-${ts}.json`),
      JSON.stringify(payload, null, 2),
      "utf8"
    );
  } catch {
    return NextResponse.json({ ok: false, errors: ["写入失败"] }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
