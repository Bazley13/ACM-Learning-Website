// 内容校验脚本：检查 content/ 下所有内容是否符合对应 Schema。
// 运行：npm run validate:content
// 这是"格式即规范"的命令行落地 —— 下一届新增内容后跑一下，出错即改。

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { validateObject, type SchemaName } from "../lib/validate";

const ROOT = path.join(process.cwd(), "content");

let failed = 0;

function check(name: SchemaName, rel: string, data: unknown) {
  const errs = validateObject(name, data);
  if (errs.length) {
    failed++;
    console.error(`  ✗ ${rel}`);
    for (const e of errs) console.error(`      ${e}`);
  } else {
    console.log(`  ✓ ${rel}`);
  }
}

function jsonFiles(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (d: string, rel: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(d, e.name), path.join(rel, e.name));
      else if (e.name.endsWith(".json")) out.push(path.join(rel, e.name).replace(/\\/g, "/"));
    }
  };
  walk(abs, dir);
  return out.filter((f) => !f.includes("images/"));
}

function mdFiles(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const walk = (d: string, rel: string): string[] =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(d, e.name), path.join(rel, e.name))
      : e.name.endsWith(".md") ? [`${rel}/${e.name}`]
      : []
    );
  return walk(abs, dir).map((s) => s.replace(/\\/g, "/"));
}

console.log("校验 content/ 目录内容格式:");
console.log("\n—— 笔记 front-matter ——");
for (const f of mdFiles("notes")) {
  const raw = fs.readFileSync(path.join(ROOT, f), "utf8");
  const { data } = matter(raw);
  check("note", f, data);
}
console.log("\n—— 公告 front-matter ——");
for (const f of mdFiles("announcements")) {
  const raw = fs.readFileSync(path.join(ROOT, f), "utf8");
  const { data } = matter(raw);
  check("announcement", f, data);
}
console.log("\n—— 荣誉墙 ——");
for (const f of jsonFiles("awards")) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
  check("award", f, data);
}
console.log("\n—— 简介 ——");
const intro = JSON.parse(fs.readFileSync(path.join(ROOT, "intro.json"), "utf8"));
check("intro", "intro.json", intro);

console.log("\n—— 简易演示 ——");
for (const f of jsonFiles("visualization-format/visualizations")) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
  check("visualization", f, data);
}
console.log("\n—— 实验台 manifest ——");
const labsDir = path.join(ROOT, "visualization-format/labs");
if (fs.existsSync(labsDir)) {
  for (const id of fs.readdirSync(labsDir)) {
    const mf = path.join(labsDir, id, "manifest.json");
    if (fs.existsSync(mf)) {
      const data = JSON.parse(fs.readFileSync(mf, "utf8"));
      check("app-manifest", `labs/${id}/manifest.json`, data);
    }
  }
}

console.log(failed === 0 ? "\n✅ 全部内容通过校验" : `\n❌ ${failed} 处内容未通过校验`);
process.exit(failed === 0 ? 0 : 1);
