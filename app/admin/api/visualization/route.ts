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
