import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-guard";
import { listFeedback, feedbackAbsPath } from "@/lib/feedback";
import fs from "node:fs";

/** GET /admin/api/feedback —— 反馈列表；POST —— 标记 handled{file,handled}；DELETE —— ?file= 删除 */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  return NextResponse.json({
    ok: true,
    items: listFeedback().map(({ file, item }) => ({ file, ...item })),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  let body: { file?: string; handled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["bad json"] }, { status: 400 });
  }
  const abs = feedbackAbsPath(body.file ?? "");
  if (!abs) return NextResponse.json({ ok: false, errors: ["文件不存在"] }, { status: 404 });
  const item = JSON.parse(fs.readFileSync(abs, "utf8"));
  item.handled = body.handled === true;
  fs.writeFileSync(abs, JSON.stringify(item, null, 2), "utf8");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  const abs = feedbackAbsPath(req.nextUrl.searchParams.get("file") ?? "");
  if (!abs) return NextResponse.json({ ok: false, errors: ["文件不存在"] }, { status: 404 });
  fs.rmSync(abs, { force: true });
  return NextResponse.json({ ok: true });
}
