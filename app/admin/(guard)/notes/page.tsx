"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MdEditorField from "@/components/admin/MdEditorField";
import MDPreview from "@/components/admin/MDPreview";

const CATEGORIES = ["基础算法", "图论", "动态规划", "数论", "数据结构", "计算几何", "字符串", "其他"];
const DIFFICULTIES = ["入门", "进阶", "登峰"];

interface NoteMeta {
  slug: string;
  title: string;
  category: string;
  difficulty?: string;
  tags?: string[];
  author?: string;
  date?: string;
  summary?: string;
  visualizationId?: string;
  body: string;
}

const EMPTY = {
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
};

export default function AdminNotesPage() {
  const router = useRouter();
  const [list, setList] = useState<NoteMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null); // "cat|slug"
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [zipMsg, setZipMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [zipping, setZipping] = useState(false);

  function refresh() {
    fetch("/admin/api/notes")
      .then((r) => r.json())
      .then((d) => setList(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }
  useEffect(refresh, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function startEdit(n: NoteMeta) {
    setViewing(null);
    setEditing(true);
    setForm({
      slug: n.slug,
      title: n.title,
      category: n.category,
      difficulty: n.difficulty ?? "入门",
      author: n.author ?? "",
      date: n.date ?? "",
      tags: (n.tags ?? []).join(", "),
      summary: n.summary ?? "",
      visualizationId: n.visualizationId ?? "",
      body: n.body,
    });
    document.querySelector(".note-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onDelete(n: NoteMeta) {
    if (!confirm(`确定删除笔记「${n.title}」？会写入 git 历史不可撤回。`)) return;
    const res = await fetch(
      `/admin/api/notes?category=${encodeURIComponent(n.category)}&slug=${encodeURIComponent(n.slug)}`,
      { method: "DELETE" }
    );
    const d = await res.json().catch(() => ({}));
    setMsg({ ok: res.ok, text: res.ok ? "已删除并尝试提交 git。" : ((d.errors ?? ["删除失败"]) as string[]).join("；") });
    refresh();
    if (editing && form.slug === n.slug && form.category === n.category) {
      setEditing(false);
      setForm(EMPTY);
    }
  }

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
      setMsg({ ok: true, text: (data.detail ? data.detail + "；" : "") + "已保存" + (editing ? "（覆盖）" : "并发布") + "，尝试提交 git。" });
      setEditing(false);
      refresh();
      router.refresh();
    } else {
      setMsg({ text: "校验失败：" + ((data.errors ?? ["未知错误"]) as string[]).join("；") });
    }
  }

  return (
    <div style={{ maxWidth: 880 }}>
      <h2>笔记管理</h2>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}

      <section className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>已发布的笔记（{list.length}）</h3>
        {loaded && list.length === 0 && <div className="muted">暂无笔记</div>}
        {list.map((n) => {
          const key = `${n.category}|${n.slug}`;
          const open = viewing === key;
          return (
            <div key={key} className="ann-row" style={{ borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
              <div className="ann-row-head" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className="ann-title" style={{ fontWeight: 600 }}>{n.title}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {n.category}{n.difficulty ? " · " + n.difficulty : ""}{n.date ? " · " + n.date : ""}
                </span>
                <span className="ann-actions" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button className="btn-ghost" type="button" onClick={() => setViewing(open ? null : key)}>
                    {open ? "收起" : "查看"}
                  </button>
                  <button className="btn-ghost" type="button" onClick={() => startEdit(n)}>编辑</button>
                  <button className="btn-ghost danger" type="button" onClick={() => onDelete(n)}>删除</button>
                </span>
              </div>
              {open && (
                <div className="note-preview" style={{ marginTop: 10, maxHeight: 420, overflow: "auto" }}>
                  <MDPreview source={n.body} className="md-editor-preview" />
                </div>
              )}
            </div>
          );
        })}
      </section>

      <form onSubmit={onSubmit} className="card note-form">
        <h3 style={{ fontSize: 15, margin: "0 0 12px" }}>{editing ? "编辑笔记（保留 category/slug，覆盖原文件）" : "新增算法笔记"}</h3>
        <div className="field">
          <label>slug（URL 标识）</label>
          <input required disabled={editing} value={form.slug} onChange={(e) => set("slug", e.target.value)}
            placeholder="e.g. binary-search" style={{ background: editing ? "var(--bg-soft)" : undefined }} />
        </div>
        <div className="field">
          <label>标题</label>
          <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>分类</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>难度</label>
            <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
              {DIFFICULTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>作者</label>
            <input value={form.author} onChange={(e) => set("author", e.target.value)} />
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
          <input value={form.visualizationId} onChange={(e) => set("visualizationId", e.target.value)} />
        </div>
        <div className="field">
          <label>正文（内置 Markdown 编辑器，可直接插入图片）</label>
          <MdEditorField value={form.body} onChange={(v) => set("body", v)} height={340} />
        </div>
        <button className="btn" type="submit">{editing ? "保存修改" : "保存笔记"}</button>
      </form>

      <div className="card" style={{ marginTop: 28 }}>
        <h2 style={{ margin: 0 }}>成包上传笔记（zip）</h2>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          包结构：根目录一个 .md（front-matter 含 slug/category/…）+ images/ 目录放图片。正文用相对路径 images/xxx.png。
        </p>
        {zipMsg && <div className={"notice " + (zipMsg.ok ? "ok" : "err")}>{zipMsg.text}</div>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setZipMsg(null);
            setZipping(true);
            const input = e.currentTarget.elements.namedItem("zip") as HTMLInputElement;
            const file = input?.files?.[0];
            if (!file) {
              setZipMsg({ ok: false, text: "请选择 zip 文件。" });
              setZipping(false);
              return;
            }
            const fd = new FormData();
            fd.append("file", file);
            try {
              const res = await fetch("/admin/api/notes/zip", { method: "POST", body: fd });
              const data = await res.json();
              if (res.ok && data.ok) {
                setZipMsg({ ok: true, text: `已上传：${data.title ? `《${data.title}》 ` : ""}${data.slug}（图片 ${data.images} 张）→ ${data.category}。` });
                refresh();
                router.refresh();
              } else {
                setZipMsg({ ok: false, text: (data.errors ?? ["上传失败"]).join("；") });
              }
            } catch {
              setZipMsg({ ok: false, text: "上传失败，请检查网络。" });
            } finally {
              setZipping(false);
            }
          }}
        >
          <div className="field">
            <label>ZIP 文件（.md + images/）</label>
            <input type="file" name="zip" accept=".zip" required />
          </div>
          <button className="btn" type="submit" disabled={zipping}>
            {zipping ? "解析上传中…" : "上传并拆分"}
          </button>
        </form>
      </div>
    </div>
  );
}
