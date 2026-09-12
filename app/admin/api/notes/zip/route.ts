import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-guard";
import { validateObject } from "@/lib/validate";
import { markChanged, commitContent } from "@/lib/git";
import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const MAX_ZIP_BYTES = 20 * 1024 * 1024; // 20MB
const TMP_ROOT = path.join(os.tmpdir(), "dlmu-acm-note-upload");
const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

/**
 * POST /admin/api/notes/zip —— 笔记成包上传（multipart: file=<zip>）。
 * 约定包结构（与设计方案一致）：
 *   note.md (或根目录下任一 .md，front-matter 含 slug/category/…)
 *   images/xxx.png （图片全部放在 images/ 下，相对路径在正文里写 `images/xxx`）
 * 流程：鉴权 -> 存 zip -> 解压（防穿越）-> 解析 md front-matter ->
 *       schema 校验 -> 写 content/notes/<cat>/<slug>.md + 拆分 images/ 到同级
 *       -> git 提交。
 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let zipPath: string;
  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, errors: ["缺少文件"] }, { status: 400 });
    }
    if (file.size > MAX_ZIP_BYTES) {
      return NextResponse.json({ ok: false, errors: ["ZIP 超过 20MB"] }, { status: 400 });
    }
    zipPath = await saveTmpZip(Buffer.from(await file.arrayBuffer()));
  } else {
    let body: { fileData?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, errors: ["bad json"] }, { status: 400 });
    }
    if (!body.fileData) return NextResponse.json({ ok: false, errors: ["缺少文件数据"] }, { status: 400 });
    const buf = Buffer.from(body.fileData, "base64");
    if (buf.length > MAX_ZIP_BYTES) {
      return NextResponse.json({ ok: false, errors: ["ZIP 超过 20MB"] }, { status: 400 });
    }
    zipPath = await saveTmpZip(buf);
  }

  const workDir = path.join(TMP_ROOT, `note-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });
  try {
    const entries = listZipEntries(zipPath);
    const unsafe = entries.filter((e) => e.includes("..") || path.isAbsolute(e));
    if (unsafe.length > 0) {
      return NextResponse.json({ ok: false, errors: ["ZIP 内含非法路径条目"] }, { status: 400 });
    }
    // 只允许 md + 图片
    const bad = entries
      .map((e) => path.extname(e).toLowerCase())
      .filter((ext) => ext && ext !== ".md" && !IMG_EXT.has(ext));
    if (bad.length > 0) {
      return NextResponse.json({ ok: false, errors: ["ZIP 只能包含 .md 与图片文件"] }, { status: 400 });
    }
    extractZip(zipPath, workDir);

    // 找到主 md：优先根目录下无斜杠的 .md
    const mdRel = entries.find((e) => /\.md$/i.test(e) && !e.includes("/")) ??
      entries.filter((e) => /\.md$/i.test(e)).sort((a, b) => a.split("/").length - b.split("/").length)[0];
    if (!mdRel) {
      return NextResponse.json({ ok: false, errors: ["ZIP 内未找到 .md 笔记文件"] }, { status: 400 });
    }
    const mdAbs = path.join(workDir, mdRel);
    const { data, content } = matter(fs.readFileSync(mdAbs, "utf8"));
    // YAML 会把 2024-03-01 解成 Date 对象，统一转回 ISO 字符串（与 loader 一致）
    const fm: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      fm[k] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
    }
    const slug = typeof fm.slug === "string" && fm.slug ? fm.slug : path.basename(mdRel, ".md");
    const category = (typeof fm.category === "string" && fm.category ? fm.category : "未分类")
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "");

    const errs = validateObject("note", { ...fm, slug });
    if (errs.length > 0) {
      return NextResponse.json({ ok: false, errors: ["front-matter 校验失败", ...errs] }, { status: 400 });
    }
    // 写主 md（front-matter 序列化格式与后台一致）
    const noteDir = path.join(process.cwd(), "content", "notes", category);
    fs.mkdirSync(path.join(noteDir, "images"), { recursive: true });
    const fmLines = Object.entries(fm)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("\n");
    fs.writeFileSync(path.join(noteDir, `${slug}.md`), `---\n${fmLines}\n---\n\n${content}`, "utf8");

    // 拆分 images/ 下图片（去掉顶层 images/ 前缀）
    const imgCount = copyImages(workDir, path.join(noteDir, "images"));

    markChanged([`content/notes/${category}`]);
    const cmt = commitContent(`笔记成包: ${(fm.title as string) ?? slug}`);
    return NextResponse.json({
      ok: true,
      slug,
      category,
      noteUrl: `/notes/${slug}`,
      images: imgCount,
      detail: cmt.ok ? undefined : "written but git commit failed: " + (cmt.detail ?? ""),
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, errors: ["上传失败: " + err] }, { status: 400 });
  } finally {
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch { /* ignore */ }
    try { fs.rmSync(zipPath, { force: true }); } catch { /* ignore */ }
  }
}

/** 拷贝 images/ 下的图片（保持子路径），返回拷贝张数 */
function copyImages(from: string, to: string): number {
  if (!fs.existsSync(from)) return 0;
  let count = 0;
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (IMG_EXT.has(path.extname(e.name).toLowerCase())) {
        const rel = path.relative(from, full).replace(/\\/g, "/");
        const relImg = rel.replace(/^images\//, "");
        const target = path.join(to, relImg);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(full, target);
        count += 1;
      }
    }
  };
  if (fs.existsSync(path.join(from, "images"))) walk(path.join(from, "images"));
  // 根目录散图（未放在 images/ 下）也一并收进图片目录，正文请用 images/… 引用
  else if (fs.existsSync(from)) {
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      if (!e.isDirectory() && IMG_EXT.has(path.extname(e.name).toLowerCase())) {
        fs.copyFileSync(path.join(from, e.name), path.join(to, e.name));
        count += 1;
      }
    }
  }
  return count;
}

function saveTmpZip(buf: Buffer): string {
  fs.mkdirSync(TMP_ROOT, { recursive: true });
  const p = path.join(TMP_ROOT, `upload-${Date.now()}.zip`);
  fs.writeFileSync(p, buf);
  return p;
}

function listZipEntries(zipPath: string): string[] {
  const out = execFileSync("tar", ["-tf", zipPath], { encoding: "utf8" });
  return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function extractZip(zipPath: string, dest: string) {
  execFileSync("tar", ["-xf", zipPath, "-C", dest], { stdio: "pipe" });
}
