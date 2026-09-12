// content/ 目录的读取器。把「内容即文件」转成 TS 类型。
// server-only：本模块使用 fs，只能被服务端页面/接口 import。

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  Announcement, Award, Intro, Note,
  Visualization, LabManifest,
  ResourceCategory, ResourceData,
} from "./types";
// 纯 URL 工具（无 node 依赖）re-export，供服务端页面使用；客户端组件请直接 import "./urls"。
export { labEntryUrl, awardImagePublicPath } from "./urls";

const CONTENT_ROOT = path.join(process.cwd(), "content");

/** 递归列出某目录下的全部文件（相对内容根） */
function listFiles(relDir: string): string[] {
  const root = path.join(CONTENT_ROOT, relDir);
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else out.push(path.relative(CONTENT_ROOT, full).replace(/\\/g, "/"));
    }
  };
  walk(root);
  return out;
}

function readUtf8(abs: string): string {
  return fs.readFileSync(abs, "utf8");
}

/** 把 YAML 解析出的值里的 JS Date 强制转回 ISO 字符串（YAML 会把 2024-03-01 解析成 Date）。
 *  这样内容作者照常写 `date: 2024-03-01` 即可，不必加引号，且渲染不会拿到 Date 对象。 */
function normalizeDates<T>(data: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Date) out[k] = v.toISOString();
    else out[k] = v;
  }
  return out as T;
}

/** 解析 YAML front-matter + 正文，支持 @types 泛型 */
function parseFrontMatter<T>(relPath: string): T & { body: string } {
  const abs = path.join(CONTENT_ROOT, relPath);
  const raw = readUtf8(abs);
  const { data, content } = matter(raw);
  return { ...normalizeDates<T>(data), body: content };
}

// ---------- 公告 ----------
export function getAllAnnouncements(): Announcement[] {
  return listFiles("announcements")
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseFrontMatter<Announcement>(f))
    .filter((a) => !isExpired(a))
    .sort((a, b) => (a.pinned ? 0 : 1) - (b.pinned ? 0 : 1) || b.date.localeCompare(a.date));
}

function isExpired(a: Announcement): boolean {
  if (!a.expires) return false;
  return a.expires < new Date().toISOString().slice(0, 10);
}

export function getPinnedAnnouncements(): Announcement[] {
  return getAllAnnouncements().filter((a) => a.pinned);
}

// ---------- 笔记 ----------
export function getAllNotes(): Note[] {
  return listFiles("notes")
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseFrontMatter<Note>(f))
    .filter((n) => !n.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getNoteCategories(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const n of getAllNotes()) {
    counts.set(n.category, (counts.get(n.category) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

export function getNoteBySlug(slug: string): Note | undefined {
  const files = listFiles("notes").filter((f) => f.endsWith(".md"));
  // 优先按 front-matter 里的 slug 精确匹配（文件名可与 slug 不同，如中文文件名）
  for (const f of files) {
    const n = parseFrontMatter<Note>(f);
    if (n.slug === slug) return n;
  }
  // 回退：按文件名（去掉 .md）匹配
  const byName = files.find((f) => path.basename(f, ".md") === slug);
  return byName ? parseFrontMatter<Note>(byName) : undefined;
}

// ---------- 荣誉墙 ----------
export function getAllAwards(): Award[] {
  return listFiles("awards")
    .filter((f) => f.endsWith(".json") && !f.includes("images/"))
    .map((f) => JSON.parse(readUtf8(path.join(CONTENT_ROOT, f))) as Award)
    .sort((a, b) => b.awardDate.localeCompare(a.awardDate));
}

export function getAwardCompetitions(): string[] {
  return [...new Set(getAllAwards().map((a) => a.competition))];
}

// ---------- 简介 ----------
export function getIntro(): Intro {
  const raw = readUtf8(path.join(CONTENT_ROOT, "intro.json"));
  return JSON.parse(raw) as Intro;
}

// ---------- 首屏照片轮播 ----------
export interface Photo {
  id: string;
  title: string;
  caption?: string;
  image?: string;
  emoji?: string;
  accent?: string;
}
export function getAllPhotos(): Photo[] {
  const raw = readUtf8(path.join(CONTENT_ROOT, "photos.json"));
  const data = JSON.parse(raw) as { photos?: Photo[] };
  return data.photos ?? [];
}

// ---------- 资源推荐 ----------
export function getAllResources(): ResourceCategory[] {
  const raw = readUtf8(path.join(CONTENT_ROOT, "resources.json"));
  const data = JSON.parse(raw) as ResourceData;
  return data.categories ?? [];
}

// ---------- 简易档可视化 ----------
export function getAllVisualizations(): Visualization[] {
  return listFiles("visualization-format/visualizations")
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readUtf8(path.join(CONTENT_ROOT, f))) as Visualization);
}

export function getVisualizationById(id: string): Visualization | undefined {
  return getAllVisualizations().find((v) => v.id === id);
}

// ---------- 实验台档 ----------
export function getAllLabs(): { id: string; manifest: LabManifest }[] {
  const labsDir = path.join(CONTENT_ROOT, "visualization-format/labs");
  if (!fs.existsSync(labsDir)) return [];
  return fs
    .readdirSync(labsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((id) => fs.existsSync(path.join(labsDir, id, "manifest.json")))
    .map((id) => ({
      id,
      manifest: JSON.parse(
        readUtf8(path.join(labsDir, id, "manifest.json"))
      ) as LabManifest,
    }))
    .sort((a, b) => a.manifest.title.localeCompare(b.manifest.title, "zh"));
}

export function getLabById(id: string): { id: string; manifest: LabManifest } | undefined {
  return getAllLabs().find((l) => l.id === id);
}
