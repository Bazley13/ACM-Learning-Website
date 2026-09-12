"use client";

/**
 * MdEditorField —— 内置 Markdown 编辑器（自包含，无第三方 CSS 依赖）。
 * 之前用 @uiw/react-md-editor，其打包 CSS 在站点上未生效导致“字看不见”；
 * 现改为本站主题直接控制的 textarea + 工具条 + 预览，文字恒为白底深字。
 * 提供：粗体/斜体/标题/链接/列表/引用/代码/分隔线/插入图片（上传 /admin/api/upload）。
 */
import { useMemo, useRef, useState } from "react";
import { marked } from "marked";
import { ImagePlus, Bold, Italic, Link, List, Quote, Code, Heading, Minus } from "lucide-react";

export default function MdEditorField({
  value,
  onChange,
  height = 260,
}: {
  value: string;
  onChange: (v: string) => void;
  height?: number;
}) {
  const [preview, setPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const htmlPreview = useMemo(() => {
    try {
      return marked.parse(value || "");
    } catch {
      return "";
    }
  }, [value, preview]);

  // 在光标处插入一段 markdown；未选中时插入包裹样式
  function wrap(before: string, after = before, placeholder = ""): void {
    const el = taRef.current;
    const v = value ?? "";
    if (!el) {
      onChange(v + before + placeholder + after);
      return;
    }
    const start = el.selectionStart ?? v.length;
    const end = el.selectionEnd ?? v.length;
    const sel = v.slice(start, end);
    const ins = sel ? before + sel + after : before + placeholder + after;
    const next = v.slice(0, start) + ins + v.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const p = start + before.length;
      el.setSelectionRange(p, p + ins.length - before.length - after.length);
    });
  }

  function prefix(line: string, withSpace = true): void {
    const el = taRef.current;
    const v = value ?? "";
    if (!el) { onChange(v + (v ? "\n" : "") + line + (withSpace ? " " : "")); return; }
    const start = el.selectionStart ?? v.length;
    // 在行首插入前缀
    const lineStart = v.lastIndexOf("\n", start - 1) + 1;
    const next = v.slice(0, lineStart) + line + (withSpace ? " " : "") + v.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(lineStart + line.length + (withSpace ? 1 : 0), lineStart + line.length + (withSpace ? 1 : 0)); });
  }

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) { alert("请选择图片文件"); return; }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/admin/api/upload", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.url) { alert((d as { error?: string }).error ?? "上传失败"); return; }
      const alt = (file.name || "img").replace(/\.[^.]+$/, "");
      wrap("", "", ""); // 对齐光标（不改变文本）
      wrap(`![${alt}](${d.url})`, "", "");
    } catch { alert("上传失败"); }
  }

  const btns = [
    { t: "标题", icon: Heading, run: () => prefix("## ") },
    { t: "粗体", icon: Bold, run: () => wrap("**", "**", "粗体文字") },
    { t: "斜体", icon: Italic, run: () => wrap("*", "*", "斜体文字") },
    { t: "链接", icon: Link, run: () => wrap("[", "](https://)", "链接文字") },
    { t: "列表", icon: List, run: () => prefix("- ") },
    { t: "引用", icon: Quote, run: () => prefix("> ") },
    { t: "代码", icon: Code, run: () => wrap("`", "`", "code") },
    { t: "分隔线", icon: Minus, run: () => onChange((value ? value + "\n" : "") + "---\n") },
  ];

  return (
    <div className="md-editor-field">
      <input ref={fileRef} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
      <div className="md-toolbar">
        {btns.map((b) => (
          <button key={b.t} type="button" title={b.t} className="md-tb-btn" onClick={() => b.run()}>
            <b.icon size={15} />
          </button>
        ))}
        <button type="button" title="插入图片" className="md-tb-btn" onClick={() => fileRef.current?.click()}>
          <ImagePlus size={15} />
        </button>
        <span style={{ flex: 1 }} />
        <label className="md-tb-toggle">
          <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />
          预览
        </label>
      </div>
      {preview ? (
        <div className="md-editor-preview"
          dangerouslySetInnerHTML={{ __html: htmlPreview }}
          style={{ minHeight: height, maxHeight: height }} />
      ) : (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="用 Markdown 书写…（支持 ## 标题、**加粗**、`代码`、![图片](url)）"
          className="md-editor-text"
          style={{ minHeight: height }}
        />
      )}
    </div>
  );
}
