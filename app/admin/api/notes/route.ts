import { NextRequest, NextResponse } from "next/server";
import { writeContent } from "@/lib/admin-guard";

/** POST /admin/api/notes { note: {...frontmatter}, body: markdown } */
export async function POST(req: NextRequest) {
  let body: { note?: object; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["bad json"] }, { status: 400 });
  }
  const note = body.note ?? {};
  const slug = (note as { slug?: string }).slug;
  if (!slug) return NextResponse.json({ ok: false, errors: ["缺少 slug"] }, { status: 400 });

  const category = (note as { category?: string }).category ?? "未分类";
  const res = writeContent(req, {
    relFilePath: `content/notes/${category}/${slug}.md`,
    data: note,
    schema: "note",
    body: body.body ?? "",
    commitMsg: `笔记: ${(note as { title?: string }).title ?? slug}`,
  });
  const status = res.ok ? 200 : 400;
  return NextResponse.json(res, { status });
}
