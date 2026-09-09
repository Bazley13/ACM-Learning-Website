import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-guard";
import { validateObject } from "@/lib/validate";
import { markChanged, commitContent } from "@/lib/git";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";

const MAX_ZIP_BYTES = 20 * 1024 * 1024; // 20MB
const TMP_ROOT = path.join(os.tmpdir(), "dlmu-acm-lab-upload");

/**
 * POST /admin/api/visualization/lab
 * multipart/form-data: file=<zip>, (fallback: json { fileName, fileData: base64 })
 * 流程：鉴权 -> 保存 zip 到临时目录 -> 解压（防路径穿越）-> 找 manifest.json
 *       -> schema 校验 -> 限制文件类型/大小 -> 拷贝到 content/visualization-format/labs/<id>/
 *       -> git 提交。
 *
 * 解压使用系统自带 tar（Windows10+ / Linux / macOS 均含），tar 能解 zip 且可列出条目做穿越检查。
 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ ok: false, errors: ["未登录"] }, { status: 401 });
  }

  let zipPath: string;
  let desiredName: string | undefined;

  // 尝试 multipart
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, errors: ["缺少文件"] }, { status: 400 });
    }
    if (file.size > MAX_ZIP_BYTES) {
      return NextResponse.json({ ok: false, errors: ["ZIP 超过 20MB"] }, { status: 400 });
    }
    desiredName = file.name;
    const buf = Buffer.from(await file.arrayBuffer());
    zipPath = await saveTmpZip(buf);
  } else {
    // JSON: { fileName, fileData: base64 }
    let body: { fileName?: string; fileData?: string };
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
    desiredName = body.fileName;
    zipPath = await saveTmpZip(buf);
  }

  // 解压到独立临时目录
  const workDir = path.join(TMP_ROOT, `lab-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });
  try {
    // 列出条目，做路径穿越检查
    const entries = listZipEntries(zipPath);
    const unsafe = entries.filter((e) => e.includes("..") || path.isAbsolute(e));
    if (unsafe.length > 0) {
      return NextResponse.json({ ok: false, errors: ["ZIP 内含非法路径条目"] }, { status: 400 });
    }
    extractZip(zipPath, workDir);

    // 找 manifest.json
    const manifestPath = path.join(workDir, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json({ ok: false, errors: ["ZIP 顶层需包含 manifest.json"] }, { status: 400 });
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const id = manifest.id as string | undefined;
    if (!id) return NextResponse.json({ ok: false, errors: ["manifest 缺少 id"] }, { status: 400 });

    const errs = validateObject("app-manifest", manifest);
    if (errs.length > 0) {
      return NextResponse.json({ ok: false, errors: ["manifest 校验失败", ...errs] }, { status: 400 });
    }

    // 校验 entry 与 files 必须实际存在
    const required = [manifest.entry, ...(manifest.files ?? [])];
    for (const rel of required) {
      if (!fs.existsSync(path.join(workDir, rel))) {
        return NextResponse.json({ ok: false, errors: [`ZIP 缺少清单声明文件: ${rel}`] }, { status: 400 });
      }
    }

    // 限制允许的文件类型
    const allowedExt = new Set([
      ".html", ".htm", ".js", ".mjs", ".cjs", ".css", ".json",
      ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
      ".woff", ".woff2", ".ttf", ".txt", ".md",
    ]);
    const badFiles = entries
      .map((e) => path.extname(e).toLowerCase())
      .filter((ext) => ext && !allowedExt.has(ext));
    if (badFiles.length > 0) {
      return NextResponse.json({ ok: false, errors: ["ZIP 含不允许的文件类型"] }, { status: 400 });
    }

    // 拷贝进 content/labs/<id>/
    const dest = path.join(process.cwd(), "content", "visualization-format", "labs", id);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(workDir, dest, { recursive: true });

    const relDir = `content/visualization-format/labs/${id}`;
    markChanged([relDir]);
    const cmt = commitContent(`实验台: ${manifest.title ?? id}`);
    return NextResponse.json({
      ok: true,
      id,
      labUrl: `/lab/${id}`,
      detail: cmt.ok ? undefined : "written but git commit failed: " + (cmt.detail ?? ""),
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, errors: ["上传失败: " + err] }, { status: 400 });
  } finally {
    // 清理临时文件
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch { /* ignore */ }
    try { fs.rmSync(zipPath, { force: true }); } catch { /* ignore */ }
  }
}

function saveTmpZip(buf: Buffer): string {
  fs.mkdirSync(TMP_ROOT, { recursive: true });
  const p = path.join(TMP_ROOT, `upload-${Date.now()}.zip`);
  fs.writeFileSync(p, buf);
  return p;
}

function listZipEntries(zipPath: string): string[] {
  // Windows10+ 内置 tar 可 -tf 列 zip；Linux/macOS tar 亦可。失败则退回手动遍历（不做，直接报错拒绝更安全）。
  const out = execFileSync("tar", ["-tf", zipPath], { encoding: "utf8" });
  return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function extractZip(zipPath: string, dest: string) {
  // 解包到解压目录；系统 tar 支持 zip。设置工作目录，避免绝对路径写出。
  execFileSync("tar", ["-xf", zipPath, "-C", dest], { stdio: "pipe" });
}
