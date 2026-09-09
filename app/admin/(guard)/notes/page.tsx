"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["基础算法", "图论", "动态规划", "数论", "数据结构", "计算几何", "字符串", "其他"];

export default function AdminNotesPage() {
  const [form, setForm] = useState({
    slug: "",
    title: "",
    category: "基础算法",
    difficulty: "入门",
    author: "",
    date: new Date().toISOString().slice(0, 10),
    tags: "",
    summary: "",
    visualizationId: "",
    body: "",
  });
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const router = useRouter();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const note = {
      slug: form.slug,
      title: form.title,
      category: form.category,
      difficulty: form.difficulty,
      author: form.author || "工作室",
      date: form.date,
      tags: form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      summary: form.summary || undefined,
      visualizationId: form.visualizationId || undefined,
    };
    const res = await fetch("/admin/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, body: form.body }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ ok: true, text: (data.detail ? data.detail + "；" : "") + "已保存并尝试自动提交 git。" });
      router.refresh();
    } else {
      setMsg({ text: "校验失败：" + (data.errors ?? ["未知错误"]).join("；") });
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>新增算法笔记</h2>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label>slug（URL 标识，英文小写 + 连字符，与标题对应）</label>
          <input required value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="e.g. binary-search" />
        </div>
        <div className="field">
          <label>标题</label>
          <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>分类</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>难度</label>
            <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
              <option value="入门">入门</option>
              <option value="进阶">进阶</option>
              <option value="竞赛">竞赛</option>
            </select>
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>作者</label>
            <input value={form.author} onChange={(e) => set("author", e.target.value)} placeholder="某届 成员" />
          </div>
          <div className="field">
            <label>日期</label>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>标签（逗号分隔）</label>
          <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="排序, 入门" />
        </div>
        <div className="field">
          <label>摘要</label>
          <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} />
        </div>
        <div className="field">
          <label>关联可视化/实验台 id（可选）</label>
          <input value={form.visualizationId} onChange={(e) => set("visualizationId", e.target.value)} placeholder="bubble-sort 或 lab-xxx" />
        </div>
        <div className="field">
          <label>正文（Markdown）</label>
          <textarea style={{ minHeight: 260 }} value={form.body} onChange={(e) => set("body", e.target.value)} />
        </div>
        <button className="btn" type="submit">保存笔记</button>
      </form>
    </div>
  );
}
