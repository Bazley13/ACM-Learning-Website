import { NextRequest, NextResponse } from "next/server";
import { writeContent, isAuthed } from "@/lib/admin-guard";
import { markChanged, commitContent } from "@/lib/git";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const NOTES_ROOT = path.join(process.cwd(), "content", "notes");

interface NoteMeta {
  slug: string;
  title: string;
  category: string;
  difficulty?: string;
  tags?: string[];
  author?: string;
  date?: string;
  summary?: string;
  body: string;
}

function walk(dir: string, cat: string, out: NoteMeta[]) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, e.name, out);
    else if (e.name.endsWith(".md")) {
      try {
        const { data, content } = matter(fs.readFileSync(full, "utf8"));
        out.push({
          slug: String(data.slug ?? e.name.replace(/\.md$/, "")),
          title: String(data.title ?? e.name),
          category: String(data.category ?? cat),
          difficulty: data.difficulty ? String(data.difficulty) : undefined,
          tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
          author: data.author ? String(data.author) : undefined,
          date: data.date ? String(data.date) : undefined,
          summary: data.summary ? String(data.summary) : undefined,
          body: content,
        });
      } catch {
        /* skip corrupt */
      }
    }
  }
}

/** POST：新建或覆盖（编辑时按 category/slug 同路径覆盖）。 */
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
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

/** GET：列出全部笔记（含正文），供后台查看/编辑。 */
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  const items: NoteMeta[] = [];
  walk(NOTES_ROOT, "", items);
  items.sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
  return NextResponse.json({ ok: true, items });
}

/** DELETE ?category=&slug= —— 删除对应笔记文件并自动 git 提交。 */
export async function DELETE(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const slug = req.nextUrl.searchParams.get("slug");
  if (!category || !slug) return NextResponse.json({ ok: false, errors: ["缺少 category/slug"] }, { status: 400 });
  if (!isAuthed(req)) return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  const rel = `content/notes/${category}/${slug}.md`;
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) return NextResponse.json({ ok: false, errors: ["笔记不存在"] }, { status: 404 });
  try {
    fs.unlinkSync(file);
  } catch {
    return NextResponse.json({ ok: false, errors: ["删除失败"] }, { status: 500 });
  }
  markChanged([rel]);
  return NextResponse.json({ ok: true, detail: (await commitContent(`删除笔记: ${slug}`)).detail });
}
