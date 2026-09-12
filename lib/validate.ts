// 内容 schema 校验工具：用 ajv 校验 JSON 是否符合 schemas/ 下对应 Schema。
// 后台上传一律过这道校验，非法输入直接拒收。

import Ajv from "ajv";
import fs from "node:fs";
import path from "node:path";

const SCHEMA_DIR = path.join(process.cwd(), "schemas");
// validateFormats:false —— 我们的日期等字段就是普通字符串，不校验 format，
// 也避免 ajv 对未注册 format（如 "date"）在编译期抛 "unknown format" 错误。
const ajv = new Ajv({ allErrors: true, validateFormats: false });

const compiled: Record<string, ReturnType<typeof ajv.compile>> = {};

function compile(name: string) {
  if (!compiled[name]) {
    const file = path.join(SCHEMA_DIR, name + ".schema.json");
    if (!fs.existsSync(file)) throw new Error("schema not found: " + name);
    const schema = JSON.parse(fs.readFileSync(file, "utf8"));
    try {
      compiled[name] = ajv.compile(schema);
    } catch (e) {
      // 同一 $id 已在 ajv 中注册（如跨 chunk 重复加载）→ 复用已注册的 instance
      const existing = schema.$id ? (ajv.getSchema(schema.$id) as ReturnType<typeof ajv.compile>) : undefined;
      if (existing) compiled[name] = existing;
      else throw e;
    }
  }
  return compiled[name];
}

export type SchemaName =
  | "note" | "announcement" | "award" | "intro" | "visualization" | "app-manifest";

/** 校验一个对象是否通过指定 Schema。返回错误字符串数组（空 = 通过）。 */
export function validateObject(name: SchemaName, data: unknown): string[] {
  const fn = compile(name);
  const ok = fn(data);
  if (ok) return [];
  return (fn.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
}

/** 校验 front-matter（YAML 顶层）对象。 */
export function validateFrontMatter(name: "note" | "announcement", data: unknown): string[] {
  return validateObject(name, data);
}
