import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-guard";
import { validateObject } from "@/lib/validate";
import { markChanged, commitContent } from "@/lib/git";
import fs from "node:fs";
import path from "node:path";

/** POST /admin/api/visualization { visualization: {...json} } —— 简易档可视化上传 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  }
  let body: { visualization?: object };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["bad json"] }, { status: 400 });
  }
  const viz = body.visualization ?? {};
  const id = (viz as { id?: string }).id;
  if (!id) return NextResponse.json({ ok: false, errors: ["缺少 id"] }, { status: 400 });

  const errs = validateObject("visualization", viz);
  if (errs.length > 0) {
    return NextResponse.json({ ok: false, errors: errs }, { status: 400 });
  }

  const relPath = `content/visualization-format/visualizations/${id}.json`;
  const abs = path.join(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(viz, null, 2), "utf8");
  markChanged([relPath]);
  const cmt = commitContent(`可视化: ${(viz as { title?: string }).title ?? id}`);
  return NextResponse.json({
    ok: true,
    detail: cmt.ok ? undefined : "written but git commit failed: " + (cmt.detail ?? ""),
  });
}

/** GET：列出全部简易可视化（content/visualization-format/visualizations/*.json）。 */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  const dir = path.join(process.cwd(), "content", "visualization-format", "visualizations");
  const items: Record<string, unknown>[] = [];
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        items.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
      } catch {
        /* skip */
      }
    }
  }
  return NextResponse.json({ ok: true, items });
}

/** DELETE ?id= —— 删除简易可视化文件并自动 git 提交。 */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, errors: ["缺少 id"] }, { status: 400 });
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  const rel = `content/visualization-format/visualizations/${id}.json`;
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) return NextResponse.json({ ok: false, errors: ["可视化不存在"] }, { status: 404 });
  try {
    fs.unlinkSync(file);
  } catch {
    return NextResponse.json({ ok: false, errors: ["删除失败"] }, { status: 500 });
  }
  markChanged([rel]);
  return NextResponse.json({ ok: true, detail: (await commitContent(`删除可视化: ${id}`)).detail });
}
