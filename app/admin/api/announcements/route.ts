import { NextRequest, NextResponse } from "next/server";
import { writeContent } from "@/lib/admin-guard";

/** POST /admin/api/announcements { announcement: {...frontmatter}, body: markdown } */
export async function POST(req: NextRequest) {
  let body: { announcement?: object; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["bad json"] }, { status: 400 });
  }
  const ann = body.announcement ?? {};
  const slug = (ann as { slug?: string }).slug;
  if (!slug) return NextResponse.json({ ok: false, errors: ["缺少 slug"] }, { status: 400 });
  const date = (ann as { date?: string }).date || new Date().toISOString().slice(0, 10);

  const res = writeContent(req, {
    relFilePath: `content/announcements/${date}-${slug}.md`,
    data: ann,
    schema: "announcement",
    body: body.body ?? "",
    commitMsg: `公告: ${(ann as { title?: string }).title ?? slug}`,
  });
  const status = res.ok ? 200 : 400;
  return NextResponse.json(res, { status });
}
