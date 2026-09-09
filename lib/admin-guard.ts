// 后台路由守卫：检查 session cookie 是否有效。供各上传/写入 route handler 调用。
import { NextRequest } from "next/server";
import { validateSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { validateObject, type SchemaName } from "@/lib/validate";
import { markChanged, commitContent } from "@/lib/git";
import fs from "node:fs";
import path from "node:path";

/** 验证请求是否来自已登录管理员；未登录返回 false。 */
export function isAuthed(req: NextRequest): boolean {
  const raw = req.cookies.get(SESSION_COOKIE)?.value;
  return raw ? validateSessionToken(raw) : false;
}

/**
 * 通用内容写入流程：鉴权 -> schema 校验 -> 写文件 -> git 提交。
 * @returns {ok, errors, detail}
 */
export function writeContent<T = unknown>(
  req: NextRequest,
  opts: {
    relFilePath: string; // 相对仓库根的 content 下路径，如 notes/xx.md
    data: T; // 待写入的数据（note 为 front-matter 对象；award 等为整对象）
    schema: SchemaName;
    commitMsg: string;
    /** 追加正文内容（note/announcement 用 front-matter + body 拼成 Markdown） */
    body?: string;
    jsonFile?: boolean; // true 时整个 data 作为 JSON 写入；false 时按 front-matter+body 拼 .md
  }
): { ok: boolean; errors?: string[]; detail?: string } {
  if (!isAuthed(req)) return { ok: false, errors: ["未登录"], detail: "unauthorized" };

  const errs = validateObject(opts.schema, opts.data);
  if (errs.length > 0) return { ok: false, errors: errs };

  const abs = path.join(process.cwd(), opts.relFilePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  if (opts.jsonFile) {
    fs.writeFileSync(abs, JSON.stringify(opts.data, null, 2), "utf8");
  } else {
    const fm = Object.entries(opts.data as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("\n");
    fs.writeFileSync(abs, `---\n${fm}\n---\n\n${opts.body ?? ""}`, "utf8");
  }

  markChanged([opts.relFilePath]);
  const res = commitContent(opts.commitMsg);
  return res.ok ? { ok: true } : { ok: true, detail: "written but git commit failed: " + (res.detail ?? "") };
}
