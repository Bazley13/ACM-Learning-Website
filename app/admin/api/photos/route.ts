import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-guard";
import { markChanged, commitContent } from "@/lib/git";
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "content/photos.json");
const DEFAULT_DESC =
  "首页第三屏“比赛 / 日常”照片轮播。image 留空时卡片显示渐变 + emoji 占位；放入照片后填写对应的公开资产路径即可（如 /awards-assets/xxx.jpg 或 /uploads/...）。";

/** GET：读取 首页照片轮播 数据（管理员）。 */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  if (!fs.existsSync(FILE)) return NextResponse.json({ ok: false, errors: ["照片文件不存在"] }, { status: 404 });
  try {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8")) as { description?: string; photos?: unknown };
    return NextResponse.json({ ok: true, photos: data.photos ?? [], description: data.description ?? DEFAULT_DESC });
  } catch {
    return NextResponse.json({ ok: false, errors: ["读取失败"] }, { status: 500 });
  }
}

/** POST：整体覆盖 photos.json（校验 photos 数组）并自动 git 提交。 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  let body: { photos?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["bad json"] }, { status: 400 });
  }
  const photos = body.photos;
  if (!Array.isArray(photos)) {
    return NextResponse.json({ ok: false, errors: ["photos 必须是数组"] }, { status: 400 });
  }
  const description = typeof body.description === "string" && body.description ? body.description : DEFAULT_DESC;
  try {
    fs.writeFileSync(FILE, JSON.stringify({ description, photos }, null, 2), "utf8");
  } catch {
    return NextResponse.json({ ok: false, errors: ["写入失败"] }, { status: 500 });
  }
  markChanged(["content/photos.json"]);
  const cmt = commitContent("首页照片轮播：后台编辑");
  return NextResponse.json({ ok: true, detail: cmt.ok ? undefined : "written but git commit failed: " + (cmt.detail ?? "") });
}
