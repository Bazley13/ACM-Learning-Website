"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MDPreview from "@/components/admin/MDPreview";
import MdEditorField from "@/components/admin/MdEditorField";

const TYPES = ["招新", "比赛报名", "获奖捷报", "训练通知", "公告", "其他"];

interface AnnMeta {
  slug: string;
  date: string;
  title: string;
  type?: string;
  author?: string;
  pinned?: boolean;
  expires?: string;
  summary?: string;
  body: string;
}

const EMPTY = {
  slug: "",
  title: "",
  type: "公告",
  author: "",
  date: new Date().toISOString().slice(0, 10),
  pinned: false,
  expires: "",
  summary: "",
  body: "",
};

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [list, setList] = useState<AnnMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null); // "date|slug"
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  function refresh() {
    fetch("/admin/api/announcements")
      .then((r) => r.json())
      .then((d) => setList(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }

  useEffect(refresh, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function startEdit(a: AnnMeta) {
    setViewing(null);
    setEditing(true);
    setForm({
      slug: a.slug,
      title: a.title,
      type: a.type ?? "公告",
      author: a.author ?? "",
      date: a.date,
      pinned: !!a.pinned,
      expires: a.expires ?? "",
      summary: a.summary ?? "",
      body: a.body,
    });
    document.querySelector(".ann-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onDelete(a: AnnMeta) {
    if (!confirm(`确定删除公告「${a.title}」？此操作会写入 git 历史不可撤回。`)) return;
    const res = await fetch(
      `/admin/api/announcements?date=${encodeURIComponent(a.date)}&slug=${encodeURIComponent(a.slug)}`,
      { method: "DELETE" }
    );
    const d = await res.json().catch(() => ({}));
    setMsg({ ok: res.ok, text: res.ok ? "已删除并尝试提交 git。" : ((d.errors ?? ["删除失败"]) as string[]).join("；") });
    refresh();
    if (editing && form.slug === a.slug && form.date === a.date) {
      setEditing(false);
      setForm(EMPTY);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const announcement = {
      slug: form.slug,
      title: form.title,
      type: form.type,
      author: form.author || undefined,
      date: form.date,
      pinned: form.pinned || undefined,
      expires: form.expires || undefined,
      summary: form.summary || undefined,
    };
    const res = await fetch("/admin/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcement, body: form.body }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ ok: true, text: (data.detail ? data.detail + "；" : "") + "已保存" + (editing ? "（覆盖更新）" : "并发布") + "，尝试自动提交 git。" });
      setEditing(false);
      refresh();
      router.refresh();
    } else {
      setMsg({ text: "校验失败：" + ((data.errors ?? ["未知错误"]) as string[]).join("；") });
    }
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <h2>公告管理</h2>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}

      {/* 已发布列表 */}
      <section className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>已发布的公告（{list.length}）</h3>
        {loaded && list.length === 0 && <div className="muted">暂无已发布公告</div>}
        {list.map((a) => {
          const key = `${a.date}|${a.slug}`;
          const open = viewing === key;
          return (
            <div key={key} className="ann-row">
              <div className="ann-row-head">
                <span className="ann-title">{a.title}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {a.date}{a.pinned ? " · 置顶" : ""}{a.type ? " · " + a.type : ""}
                </span>
                <span className="ann-actions">
                  <button className="btn-ghost" type="button" onClick={() => setViewing(open ? null : key)}>
                    {open ? "收起" : "查看"}
                  </button>
                  <button className="btn-ghost" type="button" onClick={() => startEdit(a)}>
                    编辑
                  </button>
                  <button className="btn-ghost danger" type="button" onClick={() => onDelete(a)}>
                    删除
                  </button>
                </span>
              </div>
              {open && (
                <MDPreview source={a.body} className="ann-preview md-editor-preview" />
              )}
            </div>
          );
        })}
      </section>

      {/* 发布 / 编辑表单 */}
      <form onSubmit={onSubmit} className="card ann-form">
        <h3 style={{ fontSize: 15, margin: "0 0 12px" }}>{editing ? "编辑公告（保留 date/slug，覆盖原文件）" : "发布新公告"}</h3>
        <div className="field">
          <label>slug</label>
          <input
            required
            disabled={editing}
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="zhaoxin-2025"
            style={{ background: editing ? "var(--bg-soft)" : undefined }}
          />
        </div>
        <div className="field">
          <label>标题</label>
          <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>类型</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>日期</label>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>作者</label>
            <input value={form.author} onChange={(e) => set("author", e.target.value)} />
          </div>
          <div className="field" style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8 }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.pinned} onChange={(e) => set("pinned", e.target.checked)} />
              置顶
            </label>
          </div>
        </div>
        <div className="field">
          <label>过期日期（可选）</label>
          <input type="date" value={form.expires} onChange={(e) => set("expires", e.target.value)} />
        </div>
        <div className="field">
          <label>摘要（列表页简介）</label>
          <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} />
        </div>
        <div className="field">
          <label>正文（内置 Markdown 编辑器，可直接插入图片）</label>
          <MdEditorField value={form.body} onChange={(v) => set("body", v)} height={300} />
        </div>
        <button className="btn" type="submit">{editing ? "保存修改" : "发布公告"}</button>
      </form>
    </div>
  );
}
