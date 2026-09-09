"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = ["招新", "比赛报名", "获奖捷报", "训练通知", "公告", "其他"];

export default function AdminAnnouncementsPage() {
  const [form, setForm] = useState({
    slug: "",
    title: "",
    type: "公告",
    author: "",
    date: new Date().toISOString().slice(0, 10),
    pinned: false,
    expires: "",
    summary: "",
    body: "",
  });
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const router = useRouter();

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      setMsg({ ok: true, text: (data.detail ? data.detail + "；" : "") + "已保存并尝试自动提交 git。" });
      router.refresh();
    } else {
      setMsg({ text: "校验失败：" + (data.errors ?? ["未知错误"]).join("；") });
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>发布公告</h2>
      {msg && <div className={"notice " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label>slug</label>
          <input required value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="zhaoxin-2025" />
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
          <label>过期日期（可选，到此自动隐藏）</label>
          <input type="date" value={form.expires} onChange={(e) => set("expires", e.target.value)} />
        </div>
        <div className="field">
          <label>摘要</label>
          <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} />
        </div>
        <div className="field">
          <label>正文（Markdown）</label>
          <textarea style={{ minHeight: 160 }} value={form.body} onChange={(e) => set("body", e.target.value)} />
        </div>
        <button className="btn" type="submit">发布公告</button>
      </form>
    </div>
  );
}
