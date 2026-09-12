"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Note } from "@/lib/content/types";
import { difficultySemantic, type SemanticKey } from "@/lib/theme";

/** 列表页数据的轻量形态（不含正文 body，避免传给客户端） */
export type NoteCardItem = Pick<
  Note,
  "slug" | "title" | "category" | "tags" | "date" | "author" | "summary" | "difficulty"
>;

const SEM_CLASS: Record<SemanticKey, string> = {
  ac: "badge green",
  wa: "badge red",
  highlight: "badge amber",
  primary: "badge accent",
  tle: "badge purple",
  secondary: "badge",
};

type SortKey = "latest" | "earliest" | "title";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "latest", label: "最新" },
  { key: "earliest", label: "最早" },
  { key: "title", label: "标题" },
];

export default function NoteBrowser({
  notes,
  categories,
}: {
  notes: NoteCardItem[];
  categories: string[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("全部");
  const [diff, setDiff] = useState("全部");
  const [sort, setSort] = useState<SortKey>("latest");

  const diffs = ["全部", "入门", "进阶", "竞赛"];

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    let list = notes.filter((n) => {
      if (cat !== "全部" && n.category !== cat) return false;
      if (diff !== "全部" && n.difficulty !== diff) return false;
      if (kw) {
        const hay = [
          n.title,
          n.category,
          n.author,
          n.summary ?? "",
          ...(n.tags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    if (sort === "latest") list = [...list].sort((a, b) => b.date.localeCompare(a.date));
    else if (sort === "earliest") list = [...list].sort((a, b) => a.date.localeCompare(b.date));
    else list = [...list].sort((a, b) => a.title.localeCompare(b.title, "zh"));
    return list;
  }, [notes, q, cat, diff, sort]);

  return (
    <div>
      {/* 搜索 + 筛选 + 排序 */}
      <div className="note-toolbar">
        <div className="note-search">
          <Search size={16} aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索标题、算法名、标签、作者…"
            aria-label="搜索笔记"
          />
        </div>

        <div className="note-filters">
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="按分类筛选">
            <option value="全部">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="按难度筛选">
            {diffs.map((d) => (
              <option key={d} value={d}>
                难度：{d}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="排序方式">
            {SORT_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                排序：{s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="muted note-count">共 {filtered.length} 篇笔记</p>

      {filtered.length === 0 ? (
        <div className="card muted" style={{ textAlign: "center", padding: 40 }}>
          没有匹配的笔记，试试换个关键词或筛选条件。
        </div>
      ) : (
        <div className="note-rows">
          {filtered.map((n) => {
            const diffClass = n.difficulty
              ? SEM_CLASS[difficultySemantic[n.difficulty] ?? "secondary"]
              : "";
            return (
              <Link key={n.slug} href={`/notes/${n.slug}`} className="card glass note-row">
                <div>
                  <div className="badges">
                    <span className="badge accent">{n.category}</span>
                    {n.difficulty && <span className={diffClass}>{n.difficulty}</span>}
                  </div>
                  <h3>{n.title}</h3>
                  <p>
                    {n.summary || ""} · {n.date} · {n.author}
                  </p>
                  {n.tags && n.tags.length > 0 && (
                    <div className="note-row-tags">
                      {n.tags.map((t) => (
                        <span key={t} className="badge">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="go">阅读 →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
