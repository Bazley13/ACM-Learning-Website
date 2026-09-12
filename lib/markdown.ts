// 极简 Markdown -> HTML 渲染（基于 marked）。
// 课堂笔记来自管理员（受信任来源），首版不做完整 XSS 过滤；
// 如需更强防护，接入 sanitize-html（见 RUNNING.md）。

import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

/** 大纲条目（详情页侧边栏目录用） */
export interface OutlineEntry {
  id: string; // 锚点，形如 sec-1
  text: string;
  level: 2 | 3; // h2 / h3
}

/** 去掉标题文本里的行内 Markdown 标记，便于目录显示 */
function cleanTitle(s: string): string {
  return s.replace(/[*_`#]/g, "").trim();
}

/**
 * 渲染并同时生成大纲（h2/h3）。
 * 做法（对 marked 版本不敏感）：先从源码逐行提取 h2/h3 标题，
 * 再按渲染后 HTML 中 `<h2>`/`<h3>` 的出现顺序注入 `id="sec-N"`；
 * 源码顺序与渲染顺序一致，故能一一对应。
 */
export function renderMarkdownWithOutline(
  md: string,
  opts?: { imagePrefix?: string }
): {
  html: string;
  outline: OutlineEntry[];
} {
  const outline: OutlineEntry[] = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      outline.push({ id: "", text: cleanTitle(m[2]), level: m[1].length as 2 | 3 });
    }
  }

  let html = marked.parse(md) as string;
  let i = 0;
  html = html.replace(/<h([23])\b[^>]*>/g, (_tag, level) => {
    const id = `sec-${i + 1}`;
    outline[i].id = id;
    i += 1;
    return `<h${level} id="${id}">`;
  });

  // 笔记图片相对路径改写：`images/x.png` → `<imagePrefix>images/x.png`
  // （前缀形如 /notes-assets/<category>/，由详情页传入）
  if (opts?.imagePrefix) {
    html = html.replace(/src="(?:\.\/)?images\//g, `src="${opts.imagePrefix}images/`);
  }

  return { html, outline };
}
