// 内容 schema 校验工具：用 ajv 校验 JSON 是否符合 schemas/ 下对应 Schema。
// 后台上传一律过这道校验，非法输入直接拒收。

import Ajv from "ajv";
import fs from "node:fs";
import path from "node:path";

const SCHEMA_DIR = path.join(process.cwd(), "schemas");
const ajv = new Ajv({ allErrors: true });

const compiled: Record<string, ReturnType<typeof ajv.compile>> = {};

function compile(name: string) {
  if (!compiled[name]) {
    const file = path.join(SCHEMA_DIR, name + ".schema.json");
    if (!fs.existsSync(file)) throw new Error("schema not found: " + name);
    const schema = JSON.parse(fs.readFileSync(file, "utf8"));
    compiled[name] = ajv.compile(schema);
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
