import { NextRequest, NextResponse } from "next/server";
import { writeContent, isAuthed } from "@/lib/admin-guard";
import { markChanged, commitContent } from "@/lib/git";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const DIR = path.join(process.cwd(), "content", "announcements");

interface AnnMeta {
  slug: string;
  date: string;
  title: string;
  type?: string;
  author?: string;
  pinned?: boolean;
  expires?: string;
  summary?: string;
  body: string;
}

function listAnnouncements(): AnnMeta[] {
  if (!fs.existsSync(DIR)) return [];
  const out: AnnMeta[] = [];
  for (const f of fs.readdirSync(DIR)) {
    if (!f.endsWith(".md")) continue;
    try {
      const { data, content } = matter(fs.readFileSync(path.join(DIR, f), "utf8"));
      out.push({
        slug: String(data.slug ?? ""),
        date: String(data.date ?? ""),
        title: String(data.title ?? f),
        type: data.type ? String(data.type) : undefined,
        author: data.author ? String(data.author) : undefined,
        pinned: !!data.pinned,
        expires: data.expires ? String(data.expires) : undefined,
        summary: data.summary ? String(data.summary) : undefined,
        body: content,
      });
    } catch {
      /* ignore corrupt file */
    }
  }
  return out.sort((a, b) => (b.date < a.date ? -1 : 1));
}

/** POST：新建或覆盖（编辑时前端取旧数据回填后再 POST，同路径即覆盖）。 */
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
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

/** GET：仅登录管理员可查看全部已发布公告（含正文），供后台查看/编辑。 */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  return NextResponse.json({ ok: true, items: listAnnouncements() });
}

/** DELETE ?date=&slug= —— 删除对应公告文件并自动 git 提交。 */
export async function DELETE(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const slug = req.nextUrl.searchParams.get("slug");
  if (!date || !slug) return NextResponse.json({ ok: false, errors: ["缺少 date/slug"] }, { status: 400 });
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  const rel = `content/announcements/${date}-${slug}.md`;
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) return NextResponse.json({ ok: false, errors: ["公告不存在"] }, { status: 404 });
  try {
    fs.unlinkSync(file);
  } catch {
    return NextResponse.json({ ok: false, errors: ["删除失败"] }, { status: 500 });
  }
  markChanged([rel]);
  return NextResponse.json({ ok: true, detail: (await commitContent(`删除公告: ${slug}`)).detail });
}
