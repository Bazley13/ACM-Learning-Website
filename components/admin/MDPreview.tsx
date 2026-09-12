"use client";

/** MDPreview —— 自包含 Markdown 预览（用项目自带 marked 渲染，样式由本站主题控制，文字恒可见）。 */
import { useMemo } from "react";
import { marked } from "marked";

export default function MDPreview({ source, className }: { source: string; className?: string }) {
  const h = useMemo(() => {
    try {
      return marked.parse(source || "");
    } catch {
      return "";
    }
  }, [source]);
  return <div className={className || "md-editor-preview"} dangerouslySetInnerHTML={{ __html: h }} />;
}
