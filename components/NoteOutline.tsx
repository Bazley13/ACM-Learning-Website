"use client";

import { useEffect, useState } from "react";
import { ListTree, ChevronLeft, ChevronRight } from "lucide-react";
import type { OutlineEntry } from "@/lib/markdown";
import LineSidebar from "@/components/LineSidebar";

/**
 * 笔记详情目录侧边栏：
 *  - 桌面：sticky 常驻，可折叠为细条；正文为忠实移植的 LineSidebar（游标线动画）。
 *  - 滚动追踪（IntersectionObserver）自动点亮当前章节。
 *  - 点击目录项平滑滚动定位到对应标题。
 */
export default function NoteOutline({
  outline,
  currentId,
}: {
  outline: OutlineEntry[];
  currentId?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState(currentId);

  useEffect(() => {
    const heads = Array.from(
      document.querySelectorAll<HTMLElement>(".note-body h2[id], .note-body h3[id]")
    );
    if (heads.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.boundingClientRect.top - a.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-22% 0px -62% 0px", threshold: 0 }
    );
    heads.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [outline]);

  if (outline.length === 0) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* 桌面侧边栏 */ }
      <aside className={"note-aside" + (collapsed ? " collapsed" : "")}>
        <button
          type="button"
          className="aside-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "展开目录" : "收起目录"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {!collapsed && (
          <div className="aside-body">
            <div className="aside-title">本页目录</div>
            <LineSidebar entries={outline} activeId={activeId} onSelect={scrollTo} showIndex />
          </div>
        )}
      </aside>

      {/* 移动端目录开关 */}
      <div className="note-aside-mobile">
        <button
          type="button"
          className="aside-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
        >
          <ListTree size={16} /> 本页目录
        </button>
        {mobileOpen && (
          <ul className="outline">
            {outline.map((entry) => (
              <li key={entry.id} className={entry.level === 3 ? "sub" : ""}>
                <a
                  href={`#${entry.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(entry.id);
                    setMobileOpen(false);
                  }}
                >
                  {entry.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
