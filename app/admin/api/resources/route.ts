import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-guard";
import { markChanged, commitContent } from "@/lib/git";
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "content/resources.json");

/** GET：读取资源推荐数据（管理员）。 */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  if (!fs.existsSync(FILE)) return NextResponse.json({ ok: false, errors: ["资源文件不存在"] }, { status: 404 });
  return NextResponse.json({ ok: true, resources: JSON.parse(fs.readFileSync(FILE, "utf8")) });
}

/** POST：整体覆盖 resources.json（校验 categories 结构）并自动 git 提交。 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  let body: { resources?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["bad json"] }, { status: 400 });
  }
  const r = body.resources ?? {};
  const categories = (r as { categories?: unknown }).categories;
  if (!Array.isArray(categories)) {
    return NextResponse.json({ ok: false, errors: ["resources.categories 必须是数组"] }, { status: 400 });
  }
  try {
    fs.writeFileSync(FILE, JSON.stringify(r, null, 2), "utf8");
  } catch {
    return NextResponse.json({ ok: false, errors: ["写入失败"] }, { status: 500 });
  }
  markChanged(["content/resources.json"]);
  const cmt = commitContent("资源推荐：后台编辑");
  return NextResponse.json({ ok: true, detail: cmt.ok ? undefined : "written but git commit failed: " + (cmt.detail ?? "") });
}
