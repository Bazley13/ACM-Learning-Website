// Git 自动提交工具 —— “内容即文件 + 后台自动 commit”的核心实现。
// 后台把内容写进 content/ 后，调用本模块做一次本地 git 提交。
// 若仓库当前没有远程或未初始化，则只做本地提交并跳过报错（不阻断保存）。

import { execFileSync } from "node:child_process";

let lastCommitted: Record<string, string> = {}; // 记录最近提交的路径，防止重复提交

/**
 * 记录被修改的路径（相对仓库根），稍后一次性提交。
 * 调用方传入新增/修改的文件路径列表。
 */
export function markChanged(paths: string[]) {
  for (const p of paths) {
    const norm = p.replace(/\\/g, "/");
    lastCommitted[norm] = new Date().toISOString();
  }
}

/** 真正执行 git 提交：add 指定路径 -> commit。*/
export function commitContent(message: string): { ok: boolean; detail?: string } {
  const changed = Object.keys(lastCommitted);
  if (changed.length === 0) return { ok: true, detail: "nothing to commit" };

  try {
    // 与用户同名同邮箱做提交人署名，便于识别是哪一届/谁
    let user = { name: "ACMWEB Bot", email: "acm@dlmu.local" };
    try {
      const name = execFileSync("git", ["config", "user.name"], { encoding: "utf8" }).trim();
      const email = execFileSync("git", ["config", "user.email"], { encoding: "utf8" }).trim();
      if (name) user.name = name;
      if (email) user.email = email;
    } catch {
      /* 没有全局 git 用户配置时用 Bot 署名 */
    }

    execFileSync("git", ["add", ...changed], { stdio: "pipe" });
    execFileSync(
      "git",
      ["-c", `user.name=${user.name}`, "-c", `user.email=${user.email}`, "commit", "-m", message],
      { stdio: "pipe" }
    );
    lastCommitted = {};
    return { ok: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, detail: err };
  }
}
