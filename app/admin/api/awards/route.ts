import { NextRequest, NextResponse } from "next/server";
import { writeContent, isAuthed } from "@/lib/admin-guard";
import { markChanged, commitContent } from "@/lib/git";
import fs from "node:fs";
import path from "node:path";

/**
 * POST /admin/api/awards
 * body: { award: {id, competition, level, title, awardDate, season?, members?, note?},
 *         image?: { dataUrl, filename }  // 证书图片（base64 data URL）}
 * 图片写入 content/awards/images/<filename>，award.image 填相对路径。
 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  }
  let body: { award?: Record<string, unknown>; image?: { dataUrl?: string; filename?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["bad json"] }, { status: 400 });
  }
  const award = body.award ?? {};
  const id = award.id as string | undefined;
  if (!id) return NextResponse.json({ ok: false, errors: ["缺少 id"] }, { status: 400 });

  // 处理证书图片：把 data URL 写进文件
  let imageRel: string | undefined;
  const img = body.image;
  if (img?.dataUrl && img.filename) {
    const match = img.dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    const safeName = path.basename(img.filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!match) return NextResponse.json({ ok: false, errors: ["图片格式非法"] }, { status: 400 });
    const buf = Buffer.from(match[2], "base64");
    const imgDir = path.join(process.cwd(), "content", "awards", "images");
    fs.mkdirSync(imgDir, { recursive: true });
    fs.writeFileSync(path.join(imgDir, safeName), buf);
    imageRel = `images/${safeName}`;
  }

  const finalAward = { ...award, image: imageRel ?? award.image };
  const res = writeContent(req, {
    relFilePath: `content/awards/${id}.json`,
    data: finalAward,
    schema: "award",
    commitMsg: `荣誉墙: ${award.competition ?? "比赛"} ${award.title ?? ""}`,
    jsonFile: true,
  });
  if (imageRel) markChanged([`content/awards/${id}.json`, `content/awards/images/${path.basename(imageRel)}`]);
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

/** GET：列出全部已提交荣誉（content/awards/*.json），供后台查看/编辑/删除。 */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  const dir = path.join(process.cwd(), "content", "awards");
  const items: Record<string, unknown>[] = [];
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        items.push(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
      } catch {
        /* skip corrupt */
      }
    }
  }
  items.sort((a, b) =>
    String((b as { awardDate?: string }).awardDate ?? "").localeCompare(String((a as { awardDate?: string }).awardDate ?? ""))
  );
  return NextResponse.json({ ok: true, items });
}

/** DELETE ?id= —— 删除对应荣誉文件并自动 git 提交。 */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, errors: ["缺少 id"] }, { status: 400 });
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  const rel = `content/awards/${id}.json`;
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) return NextResponse.json({ ok: false, errors: ["荣誉不存在"] }, { status: 404 });
  try {
    fs.unlinkSync(file);
  } catch {
    return NextResponse.json({ ok: false, errors: ["删除失败"] }, { status: 500 });
  }
  markChanged([rel]);
  return NextResponse.json({ ok: true, detail: (await commitContent(`删除荣誉: ${id}`)).detail });
}
