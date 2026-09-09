// 极简 Markdown -> HTML 渲染（基于 marked）。
// 课堂笔记来自管理员（受信任来源），首版不做完整 XSS 过滤；
// 如需更强防护，接入 sanitize-html（见 RUNNING.md）。

import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}
