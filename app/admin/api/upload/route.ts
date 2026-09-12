import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-guard";
import fs from "node:fs";
import path from "node:path";

/** POST /admin/api/upload（仅登录管理员）—— 保存图片到 public/uploads/ 并返回公开 URL。 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "缺少文件" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "仅支持图片" }, { status: 400 });
  }
  const safeName = file.name.replace(/[^\w.\u4e00-\u9fa5-]/g, "_");
  const name = `${Date.now()}-${safeName}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, name), buf);
  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}
